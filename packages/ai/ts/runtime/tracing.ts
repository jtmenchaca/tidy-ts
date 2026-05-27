// OpenTelemetry-native tracing for `ai.evaluate`.
//
// Every `ai.evaluate` call produces an OTel Trace (`out.trace`) — a tree
// of `ReadableSpan`s following the GenAI Semantic Conventions:
//
//   invoke_workflow {topology.name}              (gen_ai.workflow.name)
//   ├── invoke_agent {agent.name}                (gen_ai.agent.name)
//   │   ├── chat {model}                         (gen_ai.request.model, …)   ← translated from SDK GenerationSpan
//   │   └── execute_tool {tool.name}             (gen_ai.tool.name, …)       ← translated from SDK FunctionSpan
//   ├── map {node.name}                          (tidy_ts.ai.operation.name = "map")
//   ├── branch {node.name}                       (tidy_ts.ai.operation.name = "branch")
//   └── …
//
// The SDK has its own tracing system (`AgentSpan` / `GenerationSpan` /
// `FunctionSpan` / `HandoffSpan` / `GuardrailSpan`) we don't want to
// reinvent — it's already instrumented at the right boundaries inside
// `Runner.run`. So at the start of each `ai.evaluate` we register an
// SDK-tracing processor that translates each SDK span as it ends into a
// real OTel `Span` on our private per-evaluate provider. The OTel span
// carries `gen_ai.*` attributes the GenAI dashboard ecosystem expects;
// the SDK's snake_case shape never reaches our users.
//
// What this module owns:
//   - `createTraceContext()` — per-evaluate OTel tracer + in-memory
//     exporter + SDK→OTel bridge processor. Returns the value our
//     instrumentation reads from + the `Trace` value we hand to the user.
//   - `Trace` — the shape exposed on `out.trace`. Three fields:
//     `traceId`, `spans` (`ReadableSpan[]`), `root` (the
//     `invoke_workflow` span).
//   - Attribute name constants — `gen_ai.*` for spec-covered concepts,
//     `tidy_ts.ai.*` for our own control-flow constructs.

import { context, type Context, SpanKind, SpanStatusCode, trace as otelTrace, type Tracer } from "@opentelemetry/api";
import {
  BasicTracerProvider,
  InMemorySpanExporter,
  type ReadableSpan,
  SimpleSpanProcessor,
} from "@opentelemetry/sdk-trace-base";
import {
  addTraceProcessor,
  type Span as SdkSpan,
  type SpanData as SdkSpanData,
  type Trace as SdkTrace,
  type TracingProcessor,
} from "@openai/agents";
import { createDataFrame, type DataFrame } from "@tidy-ts/dataframe";

// ── Attribute namespaces ────────────────────────────────────────────────

/** OTel GenAI semantic conventions — used verbatim. */
export const ATTR = {
  // Operation discriminator (the controlled vocabulary in the spec).
  OPERATION_NAME: "gen_ai.operation.name",
  // Workflow (`invoke_workflow`).
  WORKFLOW_NAME: "gen_ai.workflow.name",
  // Agent (`invoke_agent`).
  AGENT_NAME: "gen_ai.agent.name",
  AGENT_DESCRIPTION: "gen_ai.agent.description",
  // Chat (`chat`).
  PROVIDER_NAME: "gen_ai.provider.name",
  REQUEST_MODEL: "gen_ai.request.model",
  RESPONSE_MODEL: "gen_ai.response.model",
  USAGE_INPUT_TOKENS: "gen_ai.usage.input_tokens",
  USAGE_OUTPUT_TOKENS: "gen_ai.usage.output_tokens",
  RESPONSE_FINISH_REASONS: "gen_ai.response.finish_reasons",
  INPUT_MESSAGES: "gen_ai.input.messages",
  OUTPUT_MESSAGES: "gen_ai.output.messages",
  // Tool (`execute_tool`).
  TOOL_NAME: "gen_ai.tool.name",
  TOOL_TYPE: "gen_ai.tool.type",
  TOOL_CALL_ARGUMENTS: "gen_ai.tool.call.arguments",
  TOOL_CALL_RESULT: "gen_ai.tool.call.result",
} as const;

/** Our own extension namespace — for OAS concepts the GenAI spec
 *  doesn't cover (control-flow nodes, the topology root wrapper). */
export const TIDY_ATTR = {
  /** Discriminator value parallel to `gen_ai.operation.name` but for our
   *  non-GenAI spans. One of `"map" | "parallel_map" | "parallel_flow" |
   *  "branch" | "catch_exception" | "subflow"`. */
  OPERATION_NAME: "tidy_ts.ai.operation.name",
  /** Author-supplied name of the OAS node (`node.name`). */
  NODE_NAME: "tidy_ts.ai.node.name",
  /** Map / ParallelMap: number of iterations the subflow ran over. */
  MAP_ITERATIONS: "tidy_ts.ai.map.iterations",
  /** ParallelMap / ParallelFlow: effective concurrency cap for the fan-out. */
  PARALLEL_CONCURRENCY: "tidy_ts.ai.parallel.concurrency",
  /** Branching: the branch label the node chose. */
  BRANCH_TAKEN: "tidy_ts.ai.branch.taken",
  /** CatchException: whether the wrapped subflow threw. */
  CAUGHT: "tidy_ts.ai.caught",
  /** Subflow / Flow: the inner topology's name. */
  SUBFLOW_NAME: "tidy_ts.ai.subflow.name",
  /** Span's structured input value (JSON-encoded). Populated on
   *  `invoke_workflow` (the topology's start input) and `invoke_agent`
   *  (the agent's resolved input). The GenAI spec covers chat-style
   *  message bodies via `gen_ai.input.messages`; this is the structured
   *  runtime-value equivalent for spans that aren't chat completions. */
  INPUT: "tidy_ts.ai.input",
  /** Span's structured output value (JSON-encoded). Populated on
   *  `invoke_workflow` (the topology's final output) and `invoke_agent`
   *  (the agent's final output). */
  OUTPUT: "tidy_ts.ai.output",
  /** True on `invoke_agent` rows whose output came from the per-node
   *  datastore cache (no SDK call fired this turn). Lets users filter
   *  cached-vs-fresh rows without having to cross-reference
   *  `usage.cachedNodes`. */
  CACHED: "tidy_ts.ai.cached",
  /** Rendered system prompt sent to the model on an `invoke_agent`
   *  span. The SDK's tracing payload doesn't expose `instructions`, so
   *  we attach it here at the wrapper-span level. */
  SYSTEM_PROMPT: "tidy_ts.ai.system_prompt",
} as const;

// ── Conversation capture ────────────────────────────────────────────────

/** Per-agent capture buffer the SDK→OTel bridge writes into when it
 *  translates the SDK's `response` / `function` spans. The executor
 *  reads this after `Runner.run` returns and stuffs it into the cache
 *  envelope so a future cache hit can replay the same chat / tool
 *  spans without firing the model. */
export interface ConversationCapture {
  /** Each LLM round-trip captured during the run. One entry per
   *  SDK `response` span. Span timing is preserved so a replayed
   *  span can show roughly when the call originally happened. */
  chats: CapturedChat[];
  /** Each tool call captured during the run. */
  tools: CapturedTool[];
}

export interface CapturedChat {
  model: string;
  inputTokens: number | null;
  outputTokens: number | null;
  /** SDK's `_input` — the messages array sent to the model. */
  inputMessages: unknown;
  /** SDK's `_response.output` — the messages array the model returned. */
  outputMessages: unknown;
  /** Original wall-clock start time (epoch ms). */
  startTimeMs: number;
  /** Original wall-clock end time (epoch ms). */
  endTimeMs: number;
}

export interface CapturedTool {
  name: string;
  /** Parsed arguments JSON the model invoked the tool with. */
  arguments: unknown;
  /** Tool's result as the SDK saw it. */
  result: unknown;
  startTimeMs: number;
  endTimeMs: number;
}

// ── Public Trace shape ──────────────────────────────────────────────────

/** One row in the tabular projection of a trace — one row per OTel
 *  span. Hoists the GenAI semantic-convention attributes the trace
 *  carries into typed columns.
 *
 *  `input` and `output` carry the data flowing through the span:
 *  - on `invoke_workflow` rows: the topology's start input + end output (typed as `I` / `O`).
 *  - on `invoke_agent` rows: the agent's resolved input + final output.
 *  - on `chat` rows: the model's input messages + output messages.
 *  - on `execute_tool` rows: the tool's arguments + result.
 *  - on control-flow rows (`map` / `branch` / etc.): the node's input + output.
 *
 *  Default-shaped as `unknown` here; narrowed via the `Trace<I, O>`
 *  generics at the workflow row.
 *
 *  Defined as a type alias (not an interface) and the `& {}` tail
 *  forces TypeScript to render hovers as a flat object literal rather
 *  than `TraceRow<I, O>` with the generic still visible. */
export type TraceRow<TInput = unknown, TOutput = unknown> = {
  // Identity / structure
  spanId: string;
  parentSpanId: string | null;
  traceId: string;
  name: string;
  // Timing (epoch ms)
  startTime: number;
  endTime: number;
  durationMs: number;
  // Status — `UNSET` is OTel's default for spans that completed without
  // explicit status (the common case for our success path). `ERROR`
  // is set when the run threw and we propagated it to the span.
  status: "ERROR" | "UNSET";
  errorMessage: string | null;
  // Operation discriminator — closed enum hoisting `gen_ai.operation.name`
  // for spec-covered spans + `tidy_ts.ai.operation.name` for our
  // control-flow extension. `null` only when neither attribute is set
  // (defensive — every span we emit carries one).
  operationName:
    | "invoke_workflow"
    | "invoke_agent"
    | "chat"
    | "execute_tool"
    | "map"
    | "parallel_map"
    | "parallel_flow"
    | "branch"
    | "catch_exception"
    | "subflow"
    | null;
  // GenAI attribute projections — hoisted for the common queries.
  // `null` when the span doesn't carry the attribute (e.g. `agentName`
  // is null on `chat` spans, `model` is null on `invoke_agent` spans).
  workflowName: string | null;
  agentName: string | null;
  toolName: string | null;
  model: string | null;
  inputTokens: number | null;
  outputTokens: number | null;
  // Our extension namespace.
  nodeName: string | null;
  /** True on `invoke_agent` rows whose output came from cache (no
   *  model call this turn). Null on every other span kind. */
  cached: boolean | null;
  /** Rendered system prompt sent to the model. Populated on
   *  `invoke_agent` rows; null on every other span kind. */
  systemPrompt: string | null;
  // Input + output carried through this span (see above).
  input: TInput | null;
  output: TOutput | null;
} & {};

/** The trace surface attached to every `ai.evaluate` result.
 *
 *  `spans` is the real OTel `ReadableSpan[]` — same type the broader
 *  OTel ecosystem consumes. Users who already know OTel know how to
 *  read it. Users who don't can iterate it as a discriminated array
 *  keyed on `span.attributes[ATTR.OPERATION_NAME]` (or
 *  `TIDY_ATTR.OPERATION_NAME` for control-flow spans).
 *
 *  `toDataFrame()` projects spans into a queryable tidy-ts DataFrame
 *  for `.filter` / `.groupBy` / `.summarize` chains over the trace.
 *  Generics carry the topology's start input + end output types so the
 *  `input` / `output` columns are typed when read from a typed topology. */
export interface Trace<TInput = unknown, TOutput = unknown> {
  /** W3C trace ID (32-hex). Same id on every span; correlate across
   *  external systems with this. */
  traceId: string;
  /** Finished spans in finish order. The first span is always the
   *  `invoke_workflow` root. */
  spans: ReadableSpan[];
  /** Convenience accessor to the root `invoke_workflow` span. */
  root: ReadableSpan | undefined;
  /** Project `spans` into a tidy-ts DataFrame. One row per span;
   *  canonical columns are hoisted from the OTel GenAI attributes (see
   *  `TraceRow`). Lazy — built on call, not on every evaluate. */
  toDataFrame(): DataFrame<TraceRow<TInput, TOutput>>;
  /** Render the trace as a single human-readable conversation
   *  transcript: workflow / agent / chat / tool events in finish
   *  order, with the actual messages and results inlined. Useful for
   *  reviewing what the agent did without writing per-row formatters
   *  every time. */
  toConversation(): string;
}

// ── Per-evaluate context ────────────────────────────────────────────────

/** What `evaluate` and the walker need from the tracing layer for one
 *  call. The provider is private to the call; spans drained from its
 *  exporter become `Trace.spans`. The SDK bridge processor is
 *  registered globally with `@openai/agents-core` for the duration of
 *  the call. */
export interface TraceContext {
  tracer: Tracer;
  /** The active OTel context that subsequent spans should be created
   *  under. Updated as we enter wrapper spans. */
  activeContext: Context;
  /** Generated up front so we can pass it to the SDK as the SDK's own
   *  `traceId` — that unifies the two trace systems' IDs. */
  traceId: string;
  /** Drain + clean up at end of evaluate. Returns the finished `Trace`
   *  + tears down the per-call provider and unregisters the bridge.
   *  Generic so callers (evaluate.ts) can thread the topology's
   *  start input + end output types into `Trace<TInput, TOutput>`. */
  finalize<TInput = unknown, TOutput = unknown>(
    rootSpanId: string | undefined,
  ): Promise<Trace<TInput, TOutput>>;
  /** Push an OTel context onto the parent stack. The SDK→OTel bridge
   *  reads the top of this stack when translating SDK spans (chat /
   *  execute_tool / etc.) so they become children of *our* wrapper
   *  spans (invoke_workflow / invoke_agent) rather than orphans.
   *
   *  Why a stack and not `context.active()`: the SDK calls our bridge's
   *  `onSpanEnd` asynchronously from inside the runner, and the OTel
   *  context active at that callsite is not guaranteed to match what
   *  was active where we opened our wrapper span. The stack survives
   *  that boundary explicitly. */
  pushParent(ctx: Context): void;
  /** Pop the parent context off the stack. Pair with `pushParent`
   *  in a try/finally. */
  popParent(): void;
  /** Allocate a fresh conversation buffer the SDK bridge will append
   *  chat / tool entries into during the next `Runner.run`. The
   *  buffer is returned so the executor can read it after the SDK
   *  call returns, then call `endCapture()` to clear the active slot.
   *  Pairs in a try/finally with `endCapture()`. */
  beginCapture(): ConversationCapture;
  /** Stop appending to the current capture buffer. Idempotent. */
  endCapture(): void;
}

/** Spin up a fresh OTel tracing provider for one `evaluate` call, plus
 *  the SDK→OTel bridge that translates `@openai/agents` spans into OTel
 *  spans on this provider.
 *
 *  Per-call provider, not process-global. Two reasons:
 *    1. Concurrent `evaluate` calls (e.g. `ai.evaluateColumn`) must not
 *       cross-pollinate spans. Each call's `out.trace` is exactly the
 *       spans from that call.
 *    2. The user is free to register THEIR own global provider for
 *       external observability (Honeycomb / Datadog / etc.) without us
 *       hijacking it. Our spans show up in their pipeline only if they
 *       wire it up explicitly. */
export function createTraceContext(): TraceContext {
  const exporter = new InMemorySpanExporter();
  const processor = new SimpleSpanProcessor(exporter);
  const provider = new BasicTracerProvider({
    spanProcessors: [processor],
  });
  const tracer = provider.getTracer("@tidy-ts/ai");

  // Generate a trace ID up front so we can pass it to the SDK. Both
  // worlds use the same 32-hex token — we'll prefix it as `trace_…`
  // for the SDK and leave it bare for OTel. That keeps both correlatable
  // by the user via grep-by-id.
  const traceId = generateOtelTraceId();

  // Stack of OTel parent contexts. evaluate.ts pushes the workflow
  // span's context on first; agent-node executors push their
  // wrapper-span contexts on next. The SDK→OTel bridge reads the top
  // when translating SDK spans, so they parent into our wrapper span
  // tree instead of orphaning onto a new trace.
  const parentStack: Context[] = [];
  const peekParent = (): Context | undefined =>
    parentStack[parentStack.length - 1];

  // Active conversation capture buffer. The agent executors begin a
  // capture around their `Runner.run` call; the SDK→OTel bridge writes
  // each translated chat / tool span into the active buffer so the
  // executor can stuff it into the cache envelope. Null when no
  // executor is currently inside a capture scope.
  let activeCapture: ConversationCapture | null = null;
  const peekCapture = (): ConversationCapture | null => activeCapture;

  // Register the SDK→OTel bridge. addTraceProcessor is a process-global
  // hook in @openai/agents-core; we filter inside the processor on the
  // SDK trace id so we only pick up spans belonging to THIS evaluate.
  //
  // Note: @openai/agents-core has no public "remove processor" API, so
  // a long-lived process running many evaluates accumulates one stub
  // processor per call. After `finalize()` we call `disable()` which
  // clears the heavy internal Maps and short-circuits every callback
  // immediately, so the cost per SDK span stays O(stubs × constant) —
  // negligible per span but worth knowing about.
  const sdkProcessor = makeSdkOtelBridge({
    tracer,
    expectedSdkTraceId: `trace_${traceId}`,
    peekParent,
    peekCapture,
  });
  addTraceProcessor(sdkProcessor);

  let active: Context = otelTrace.setSpanContext(context.active(), {
    traceId,
    spanId: "0".repeat(16), // updated when invoke_workflow span starts
    traceFlags: 1,
  });

  const ctx: TraceContext = {
    tracer,
    get activeContext() {
      return active;
    },
    set activeContext(c: Context) {
      active = c;
    },
    traceId,
    pushParent(c: Context) {
      parentStack.push(c);
    },
    popParent() {
      parentStack.pop();
    },
    beginCapture() {
      const buffer: ConversationCapture = { chats: [], tools: [] };
      activeCapture = buffer;
      return buffer;
    },
    endCapture() {
      activeCapture = null;
    },
    async finalize<TInput = unknown, TOutput = unknown>(
      rootSpanId: string | undefined,
    ): Promise<Trace<TInput, TOutput>> {
      // Force everything pending through the in-memory exporter, then
      // shut the provider down so its resources are released.
      sdkProcessor.disable();
      await provider.forceFlush();
      const spans = exporter.getFinishedSpans();
      await provider.shutdown();
      // Find the root: caller usually knows its spanId. Fallback: the
      // span with no parent.
      const root = rootSpanId
        ? spans.find((s) => s.spanContext().spanId === rootSpanId)
        : spans.find((s) => !s.parentSpanContext);
      return {
        traceId,
        spans,
        root,
        toDataFrame: () => spansToDataFrame<TInput, TOutput>(spans),
        toConversation: () => spansToConversation(spans),
      };
    },
  };

  return ctx;
}

// ── OTel id generation ─────────────────────────────────────────────────

/** 32-hex W3C trace id, OTel-style (no prefix). */
function generateOtelTraceId(): string {
  // 16 random bytes → 32 hex chars. Matches the OTel spec.
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

// ── SDK → OTel bridge ──────────────────────────────────────────────────

interface SdkOtelBridgeOptions {
  tracer: Tracer;
  /** SDK trace id (e.g. `trace_<32hex>`) — we ignore SDK spans whose
   *  `traceId` doesn't match this. Lets the per-evaluate provider stay
   *  isolated even though `addTraceProcessor` is process-global. */
  expectedSdkTraceId: string;
  /** Peek at the topmost OTel parent context the walker / agent-node
   *  executor has pushed. Used as the parent when an SDK span has no
   *  prior translated SDK sibling to link to. */
  peekParent: () => Context | undefined;
  /** Peek at the active conversation capture buffer. The bridge
   *  appends one entry per translated `response` / `function` span so
   *  the agent executor can persist the full conversation alongside
   *  the cached output. Null when no executor is capturing. */
  peekCapture: () => ConversationCapture | null;
}

interface SdkBridgeProcessor extends TracingProcessor {
  /** Stop forwarding SDK spans. Idempotent. */
  disable(): void;
}

/** SDK `TracingProcessor` that converts each completing SDK span into a
 *  real OTel span on our private tracer.
 *
 *  The SDK's span model is: every span has a `traceId`, `spanId`,
 *  `parentId` (nullable), `startedAt` / `endedAt` ISO timestamps, and
 *  typed `spanData`. We mint a fresh OTel span for each, sized by
 *  start/end time and attributed per the GenAI semantic conventions.
 *
 *  Parent linking: SDK spans carry `parentId` (sibling SDK span id).
 *  We remember each translated SDK span id → OTel span context so when
 *  a child SDK span finishes we can attach it under the right parent
 *  OTel context. If the SDK span's parent is OUR `invoke_agent` wrapper
 *  span (no SDK span id maps to it), we look that up by walking the
 *  wrapper-span registry the walker populates. */
function makeSdkOtelBridge(options: SdkOtelBridgeOptions): SdkBridgeProcessor {
  const { tracer, expectedSdkTraceId, peekParent, peekCapture } = options;

  /** SDK span id → OTel SpanContext, for parent linking between two
   *  consecutive SDK spans on the same trace. */
  const sdkToOtel = new Map<string, { traceId: string; spanId: string }>();
  /** SDK span id → the OTel Context the span was created in. We hold a
   *  reference so the next SDK child can be parented onto it. */
  const sdkToContext = new Map<string, Context>();

  let disabled = false;

  const processor: SdkBridgeProcessor = {
    disable() {
      disabled = true;
      sdkToOtel.clear();
      sdkToContext.clear();
    },
    onTraceStart: (_t: SdkTrace) => Promise.resolve(),
    onTraceEnd: (_t: SdkTrace) => Promise.resolve(),
    onSpanStart: (_s: SdkSpan<SdkSpanData>) => Promise.resolve(),
    onSpanEnd: async (sdkSpan: SdkSpan<SdkSpanData>): Promise<void> => {
      if (disabled) return;
      if (sdkSpan.traceId !== expectedSdkTraceId) return;

      const startedAt = parseIso(sdkSpan.startedAt);
      const endedAt = parseIso(sdkSpan.endedAt);
      if (startedAt === undefined || endedAt === undefined) return;

      // Choose the OTel parent context:
      //   1. If we already translated this SDK span's parent, link to
      //      that OTel context — preserves the SDK's internal sibling
      //      hierarchy (e.g. chat span under SDK agent span).
      //   2. Otherwise consult our explicit parent stack — the
      //      `invoke_agent` wrapper span the agent-node executor pushed
      //      before calling `Runner.run`. The SDK calls `onSpanEnd`
      //      from async contexts where `context.active()` no longer
      //      points to our wrapper; the stack survives that.
      //   3. Fallback to `context.active()` if neither's available
      //      (defensive — shouldn't happen in normal flow).
      const parentCtx = sdkSpan.parentId && sdkToContext.has(sdkSpan.parentId)
        ? sdkToContext.get(sdkSpan.parentId)!
        : peekParent() ?? context.active();

      const translated = translateSdkSpan(sdkSpan);
      if (!translated) return;

      const otelSpan = tracer.startSpan(
        translated.name,
        {
          kind: translated.kind,
          attributes: translated.attributes,
          startTime: startedAt,
        },
        parentCtx,
      );

      if (sdkSpan.error) {
        otelSpan.recordException({
          name: "SdkSpanError",
          message: sdkSpan.error.message,
        });
        otelSpan.setStatus({
          code: SpanStatusCode.ERROR,
          message: sdkSpan.error.message,
        });
      }
      otelSpan.end(endedAt);

      // Append to the active conversation capture buffer (if any) so a
      // future cache hit can replay this chat / tool span without
      // firing the model. We capture from the SDK data verbatim — same
      // shape we'd read off the OTel span's attributes, but typed.
      const capture = peekCapture();
      if (capture) appendCapture(capture, sdkSpan, startedAt, endedAt);

      // Stash the otel span context + the context the child will use
      // (which sits with this span active).
      const otelCtx = otelSpan.spanContext();
      sdkToOtel.set(sdkSpan.spanId, otelCtx);
      sdkToContext.set(sdkSpan.spanId, otelTrace.setSpan(parentCtx, otelSpan));
    },
    shutdown: () => Promise.resolve(),
    forceFlush: () => Promise.resolve(),
  };
  return processor;
}

interface TranslatedSpan {
  name: string;
  kind: SpanKind;
  attributes: Record<string, string | number | boolean | string[]>;
}

/** Convert one SDK span into an OTel span name + kind + attribute bag.
 *  Returns `undefined` for span variants we don't translate (e.g.,
 *  `transcription` / `speech` — not used in our topologies). */
function translateSdkSpan(
  sdkSpan: SdkSpan<SdkSpanData>,
): TranslatedSpan | undefined {
  const data = sdkSpan.spanData;

  switch (data.type) {
    case "agent":
      // Our `_agent-node.ts` / `_sandbox-agent-node.ts` wrappers
      // already emit an `invoke_agent` span with the typed input /
      // output we want surfaced. The SDK's own `AgentSpan` carries the
      // same logical event but without our I/O attribution, so we
      // skip it rather than emit a duplicate row.
      return undefined;
    case "generation": {
      const model = data.model ?? "unknown";
      const attrs: Record<string, string | number | boolean | string[]> = {
        [ATTR.OPERATION_NAME]: "chat",
        [ATTR.PROVIDER_NAME]: "openai",
        [ATTR.REQUEST_MODEL]: model,
      };
      const usage = data.usage as
        | { input_tokens?: number; output_tokens?: number }
        | undefined;
      if (usage?.input_tokens !== undefined) {
        attrs[ATTR.USAGE_INPUT_TOKENS] = usage.input_tokens;
      }
      if (usage?.output_tokens !== undefined) {
        attrs[ATTR.USAGE_OUTPUT_TOKENS] = usage.output_tokens;
      }
      if (data.input) attrs[ATTR.INPUT_MESSAGES] = JSON.stringify(data.input);
      if (data.output) attrs[ATTR.OUTPUT_MESSAGES] = JSON.stringify(data.output);
      return { name: `chat ${model}`, kind: SpanKind.CLIENT, attributes: attrs };
    }
    case "function": {
      const name = data.name ?? "tool";
      const attrs: Record<string, string | number | boolean | string[]> = {
        [ATTR.OPERATION_NAME]: "execute_tool",
        [ATTR.TOOL_NAME]: name,
        [ATTR.TOOL_TYPE]: "function",
      };
      if (data.input) attrs[ATTR.TOOL_CALL_ARGUMENTS] = String(data.input);
      if (data.output) attrs[ATTR.TOOL_CALL_RESULT] = String(data.output);
      return { name: `execute_tool ${name}`, kind: SpanKind.INTERNAL, attributes: attrs };
    }
    case "handoff": {
      const to = data.to_agent ?? "unknown";
      return {
        name: `invoke_agent ${to}`,
        kind: SpanKind.INTERNAL,
        attributes: {
          [ATTR.OPERATION_NAME]: "invoke_agent",
          [ATTR.AGENT_NAME]: to,
        },
      };
    }
    case "guardrail": {
      return {
        name: `guardrail ${data.name}`,
        kind: SpanKind.INTERNAL,
        attributes: {
          [TIDY_ATTR.OPERATION_NAME]: "guardrail",
          [TIDY_ATTR.NODE_NAME]: data.name,
          "tidy_ts.ai.guardrail.triggered": data.triggered,
        },
      };
    }
    case "custom": {
      return {
        name: data.name,
        kind: SpanKind.INTERNAL,
        attributes: {
          [TIDY_ATTR.OPERATION_NAME]: "custom",
          [TIDY_ATTR.NODE_NAME]: data.name,
        },
      };
    }
    case "mcp_tools": {
      // Not a per-tool-call span; this is the listTools result. Skip.
      return undefined;
    }
    case "response": {
      // SDK 0.11+ uses the Responses API by default; this is the
      // model-invocation span. Project as OTel `chat` per the GenAI
      // spec (which covers all chat-style model interactions including
      // Responses + Chat Completions).
      const resp = data._response as
        | {
          model?: string;
          usage?: {
            input_tokens?: number;
            output_tokens?: number;
            prompt_tokens?: number;
            completion_tokens?: number;
          };
          output?: unknown;
        }
        | undefined;
      const model = resp?.model ?? "unknown";
      const usage = resp?.usage;
      const attrs: Record<string, string | number | boolean | string[]> = {
        [ATTR.OPERATION_NAME]: "chat",
        [ATTR.PROVIDER_NAME]: "openai",
        [ATTR.REQUEST_MODEL]: model,
      };
      const inputTokens = usage?.input_tokens ?? usage?.prompt_tokens;
      const outputTokens = usage?.output_tokens ?? usage?.completion_tokens;
      if (inputTokens !== undefined) attrs[ATTR.USAGE_INPUT_TOKENS] = inputTokens;
      if (outputTokens !== undefined) attrs[ATTR.USAGE_OUTPUT_TOKENS] = outputTokens;
      if (data._input) attrs[ATTR.INPUT_MESSAGES] = JSON.stringify(data._input);
      if (resp?.output) {
        attrs[ATTR.OUTPUT_MESSAGES] = JSON.stringify(scrubResponsesOutput(resp.output));
      }
      return { name: `chat ${model}`, kind: SpanKind.CLIENT, attributes: attrs };
    }
    case "transcription":
    case "speech":
    case "speech_group":
      return undefined;
  }
}

/** Strip empty `annotations` and `logprobs` from any `output_text`
 *  content items in a Responses API `output` payload.
 *
 *  Why: the OpenAI Responses API always emits these fields on
 *  `output_text` content. `annotations` is non-optional in the SDK
 *  types; `logprobs` is optional but the server serializes `[]` when
 *  not requested. Both come back empty for the typical
 *  no-hosted-tools / no-logprobs call, polluting traces and cache
 *  envelopes with empty arrays. We only keep them when they actually
 *  carry data (a citation, a logprob entry) — when populated, the
 *  fields are structurally meaningful and trace consumers should see
 *  them as-is.
 *
 *  Pure: returns a copy, leaves the input untouched. */
function scrubResponsesOutput(output: unknown): unknown {
  if (!Array.isArray(output)) return output;
  return output.map((item) => {
    if (
      !item || typeof item !== "object" ||
      (item as { type?: unknown }).type !== "message"
    ) return item;
    const msg = item as { content?: unknown; [k: string]: unknown };
    if (!Array.isArray(msg.content)) return item;
    const scrubbedContent = msg.content.map((c) => {
      if (
        !c || typeof c !== "object" ||
        (c as { type?: unknown }).type !== "output_text"
      ) return c;
      const out: Record<string, unknown> = { ...(c as Record<string, unknown>) };
      if (Array.isArray(out.annotations) && out.annotations.length === 0) {
        delete out.annotations;
      }
      if (Array.isArray(out.logprobs) && out.logprobs.length === 0) {
        delete out.logprobs;
      }
      return out;
    });
    return { ...msg, content: scrubbedContent };
  });
}

/** Push one entry into the active conversation capture buffer for an
 *  SDK span the bridge is translating. Generation / response spans
 *  become `chats`; function spans become `tools`. Everything else is
 *  ignored (the SDK's agent / guardrail / handoff spans aren't part of
 *  the conversation transcript). */
function appendCapture(
  capture: ConversationCapture,
  sdkSpan: SdkSpan<SdkSpanData>,
  startedAt: number,
  endedAt: number,
): void {
  const data = sdkSpan.spanData;
  switch (data.type) {
    case "generation": {
      const usage = data.usage as
        | { input_tokens?: number; output_tokens?: number }
        | undefined;
      capture.chats.push({
        model: data.model ?? "unknown",
        inputTokens: usage?.input_tokens ?? null,
        outputTokens: usage?.output_tokens ?? null,
        inputMessages: data.input ?? null,
        outputMessages: data.output ?? null,
        startTimeMs: startedAt,
        endTimeMs: endedAt,
      });
      return;
    }
    case "response": {
      const resp = data._response as
        | {
          model?: string;
          usage?: {
            input_tokens?: number;
            output_tokens?: number;
            prompt_tokens?: number;
            completion_tokens?: number;
          };
          output?: unknown;
        }
        | undefined;
      const inputTokens = resp?.usage?.input_tokens ?? resp?.usage?.prompt_tokens ?? null;
      const outputTokens = resp?.usage?.output_tokens ?? resp?.usage?.completion_tokens ?? null;
      capture.chats.push({
        model: resp?.model ?? "unknown",
        inputTokens,
        outputTokens,
        inputMessages: data._input ?? null,
        outputMessages: resp?.output ? scrubResponsesOutput(resp.output) : null,
        startTimeMs: startedAt,
        endTimeMs: endedAt,
      });
      return;
    }
    case "function": {
      capture.tools.push({
        name: data.name ?? "tool",
        arguments: data.input ?? null,
        result: data.output ?? null,
        startTimeMs: startedAt,
        endTimeMs: endedAt,
      });
      return;
    }
    default:
      return;
  }
}

// ── Cache-replay (synthetic spans from a `ConversationCapture`) ─────────

interface ReplayOptions {
  tracer: Tracer;
  parent: Context;
  conversation: ConversationCapture;
  /** Wall-clock anchor (epoch ms) the synthetic spans should be offset
   *  to. Each chat / tool span is rebased to `anchorTimeMs +
   *  (originalStart - earliestOriginalStart)` so the cache-hit trace
   *  shows the spans nested inside the wrapper at the current time
   *  while still preserving the original *relative* timing across
   *  spans. */
  anchorTimeMs: number;
}

/** Re-create the `chat` / `execute_tool` spans a fresh agent run would
 *  have emitted, using a buffer captured during the original
 *  invocation. Used by `_agent-node.ts` / `_sandbox-agent-node.ts` on a
 *  cache hit so the user-visible trace tree has the same shape as a
 *  fresh run — same chat span per LLM round-trip, same execute_tool
 *  span per tool call, same model + token attributes, and faithful
 *  relative durations.
 *
 *  Span timestamps are rebased to `anchorTimeMs` so the synthetic
 *  spans nest inside the current cache-hit wrapper instead of
 *  appearing at the original-call timestamp (which would render as
 *  pre-workflow events in the transcript). The age of the cached
 *  entry is recoverable from the datastore's `createdAt` /
 *  `lastUsedAt` metadata, not from span timestamps. */
export function replayCapturedConversation({
  tracer,
  parent,
  conversation,
  anchorTimeMs,
}: ReplayOptions): void {
  const allStarts = [
    ...conversation.chats.map((c) => c.startTimeMs),
    ...conversation.tools.map((t) => t.startTimeMs),
  ];
  const earliest = allStarts.length > 0
    ? Math.min(...allStarts)
    : anchorTimeMs;
  const rebase = (ms: number) => anchorTimeMs + (ms - earliest);
  for (const chat of conversation.chats) {
    const attrs: Record<string, string | number | boolean | string[]> = {
      [ATTR.OPERATION_NAME]: "chat",
      [ATTR.PROVIDER_NAME]: "openai",
      [ATTR.REQUEST_MODEL]: chat.model,
    };
    if (chat.inputTokens !== null) attrs[ATTR.USAGE_INPUT_TOKENS] = chat.inputTokens;
    if (chat.outputTokens !== null) attrs[ATTR.USAGE_OUTPUT_TOKENS] = chat.outputTokens;
    if (chat.inputMessages != null) {
      attrs[ATTR.INPUT_MESSAGES] = JSON.stringify(chat.inputMessages);
    }
    if (chat.outputMessages != null) {
      attrs[ATTR.OUTPUT_MESSAGES] = JSON.stringify(chat.outputMessages);
    }
    const span = tracer.startSpan(
      `chat ${chat.model}`,
      {
        kind: SpanKind.CLIENT,
        attributes: attrs,
        startTime: rebase(chat.startTimeMs),
      },
      parent,
    );
    span.end(rebase(chat.endTimeMs));
  }
  for (const tool of conversation.tools) {
    const attrs: Record<string, string | number | boolean | string[]> = {
      [ATTR.OPERATION_NAME]: "execute_tool",
      [ATTR.TOOL_NAME]: tool.name,
      [ATTR.TOOL_TYPE]: "function",
    };
    if (tool.arguments != null) {
      attrs[ATTR.TOOL_CALL_ARGUMENTS] = typeof tool.arguments === "string"
        ? tool.arguments
        : JSON.stringify(tool.arguments);
    }
    if (tool.result != null) {
      attrs[ATTR.TOOL_CALL_RESULT] = typeof tool.result === "string"
        ? tool.result
        : JSON.stringify(tool.result);
    }
    const span = tracer.startSpan(
      `execute_tool ${tool.name}`,
      {
        kind: SpanKind.INTERNAL,
        attributes: attrs,
        startTime: rebase(tool.startTimeMs),
      },
      parent,
    );
    span.end(rebase(tool.endTimeMs));
  }
}

/** ISO 8601 → OTel HrTime ([seconds, nanos]). Returns undefined if the
 *  SDK didn't fill in a timestamp (defensive — shouldn't happen for
 *  finished spans, but the SDK types it nullable). */
function parseIso(iso: string | null): number | undefined {
  if (!iso) return undefined;
  const ms = Date.parse(iso);
  if (Number.isNaN(ms)) return undefined;
  return ms;
}

// ── Spans → DataFrame projection ────────────────────────────────────────

/** Project `ReadableSpan[]` into a tidy-ts DataFrame. One row per span;
 *  GenAI semantic-convention + tidy_ts.ai.* extension attributes hoist
 *  into typed columns; the span's load-bearing `input` / `output`
 *  payload land on the eponymous columns.
 *
 *  Generics carry the topology's start input + end output types so the
 *  `invoke_workflow` row's `input` / `output` are typed when fed by a
 *  typed topology. Per-agent / per-tool I/O is not narrowed today
 *  (every row uses the same `TInput`/`TOutput` slot; the workflow row
 *  is the one we can statically narrow). */
/** Render the trace as a single human-readable conversation
 *  transcript. Walks `spans` in start-time order so workflow / agent /
 *  chat / tool events appear in causal sequence, with each event's
 *  input + output inlined (pretty-printed JSON for messages).
 *
 *  Indentation reflects nesting: workflow at column 0, agent at 2,
 *  chat / tool at 4. Cached agent rows are tagged inline. */
function spansToConversation(spans: ReadableSpan[]): string {
  // Walk the span tree by parent relationships rather than sorting by
  // wall-clock start time. Synthetic cache-replay spans are rebased to
  // a fresh anchor that may not align perfectly with the live spans'
  // clock, so a time sort can put a child before its parent. Tree
  // traversal is unaffected. Within a parent's children, sort by
  // start time for causal ordering.
  const byParent = new Map<string | undefined, ReadableSpan[]>();
  for (const span of spans) {
    const parentId = span.parentSpanContext?.spanId;
    const bucket = byParent.get(parentId) ?? [];
    bucket.push(span);
    byParent.set(parentId, bucket);
  }
  for (const bucket of byParent.values()) {
    bucket.sort((a, b) => hrTimeToMs(a.startTime) - hrTimeToMs(b.startTime));
  }
  const lines: string[] = [];
  const visit = (span: ReadableSpan, depth: number): void => {
    const row = spanToRow<unknown, unknown>(span);
    const pad2 = "  ".repeat(depth);
    const pad4 = "  ".repeat(depth) + "  ";
    switch (row.operationName) {
      case "invoke_workflow":
        lines.push("");
        lines.push(`${pad2}▼ workflow ${row.workflowName ?? "(unnamed)"}`);
        lines.push(`${pad4}input  ${stringifyPayload(row.input)}`);
        lines.push(`${pad4}output ${stringifyPayload(row.output)}`);
        break;
      case "invoke_agent":
        lines.push("");
        lines.push(
          `${pad2}▼ agent ${row.agentName ?? "(unnamed)"}${row.cached ? "  (cached)" : ""}`,
        );
        if (row.systemPrompt) {
          lines.push(`${pad4}system_prompt:`);
          lines.push(indent(row.systemPrompt, pad4.length + 2));
        }
        lines.push(`${pad4}input  ${stringifyPayload(row.input)}`);
        lines.push(`${pad4}output ${stringifyPayload(row.output)}`);
        break;
      case "chat":
        lines.push("");
        lines.push(
          `${pad2}▼ chat ${row.model ?? "(unknown model)"}  (in=${row.inputTokens ?? "?"} out=${row.outputTokens ?? "?"})`,
        );
        lines.push(`${pad4}messages_in:`);
        lines.push(indent(stringifyPayload(row.input, true), pad4.length + 2));
        lines.push(`${pad4}messages_out:`);
        lines.push(indent(stringifyPayload(row.output, true), pad4.length + 2));
        break;
      case "execute_tool":
        lines.push("");
        lines.push(`${pad2}▼ tool ${row.toolName ?? "(unnamed)"}`);
        lines.push(`${pad4}args   ${stringifyPayload(row.input)}`);
        lines.push(`${pad4}result ${stringifyPayload(row.output)}`);
        break;
      case "map":
      case "parallel_map":
      case "parallel_flow":
      case "branch":
      case "catch_exception":
      case "subflow":
        lines.push("");
        lines.push(
          `${pad2}▼ ${row.operationName} ${row.nodeName ?? "(unnamed)"}`,
        );
        break;
      case null:
        break;
    }
    const children = byParent.get(span.spanContext().spanId) ?? [];
    for (const child of children) visit(child, depth + 1);
  };
  const roots = byParent.get(undefined) ?? [];
  for (const root of roots) visit(root, 0);
  return lines.join("\n").trimStart();
}

function stringifyPayload(value: unknown, pretty = false): string {
  if (value === null || value === undefined) return "(none)";
  try {
    return pretty ? JSON.stringify(value, null, 2) : JSON.stringify(value);
  } catch {
    return String(value);
  }
}

function indent(text: string, spaces: number): string {
  const pad = " ".repeat(spaces);
  return text
    .split("\n")
    .map((line) => pad + line)
    .join("\n");
}

function spansToDataFrame<TInput, TOutput>(
  spans: ReadableSpan[],
): DataFrame<TraceRow<TInput, TOutput>> {
  const rows: TraceRow<TInput, TOutput>[] = spans.map((span) =>
    spanToRow<TInput, TOutput>(span)
  );
  return createDataFrame(rows);
}

function spanToRow<TInput, TOutput>(
  span: ReadableSpan,
): TraceRow<TInput, TOutput> {
  const ctx = span.spanContext();
  const startMs = hrTimeToMs(span.startTime);
  const endMs = hrTimeToMs(span.endTime);

  const a = span.attributes;
  const op = narrowOperationName(
    readString(a, ATTR.OPERATION_NAME) ??
      readString(a, TIDY_ATTR.OPERATION_NAME),
  );

  // OTel SpanStatusCode: UNSET=0, OK=1, ERROR=2. Our package emits
  // only ERROR (on the failure path); successes complete with UNSET
  // (OTel's "we don't know — parent infers"). We don't surface the
  // `OK` literal because we never produce it.
  const status: TraceRow["status"] = span.status.code === 2
    ? "ERROR"
    : "UNSET";

  const { input, output } = extractIO<TInput, TOutput>(a, op);

  return {
    spanId: ctx.spanId,
    parentSpanId: span.parentSpanContext?.spanId ?? null,
    traceId: ctx.traceId,
    name: span.name,
    startTime: startMs,
    endTime: endMs,
    durationMs: endMs - startMs,
    status,
    errorMessage: span.status.message ?? null,
    operationName: op,
    workflowName: readString(a, ATTR.WORKFLOW_NAME),
    agentName: readString(a, ATTR.AGENT_NAME),
    toolName: readString(a, ATTR.TOOL_NAME),
    model: readString(a, ATTR.REQUEST_MODEL),
    inputTokens: readNumber(a, ATTR.USAGE_INPUT_TOKENS),
    outputTokens: readNumber(a, ATTR.USAGE_OUTPUT_TOKENS),
    nodeName: readString(a, TIDY_ATTR.NODE_NAME),
    cached: readBool(a, TIDY_ATTR.CACHED),
    systemPrompt: readString(a, TIDY_ATTR.SYSTEM_PROMPT),
    input,
    output,
  };
}

/** Convert OTel HrTime `[seconds, nanos]` to milliseconds. */
function hrTimeToMs(hr: readonly [number, number]): number {
  return hr[0] * 1000 + hr[1] / 1_000_000;
}

function readString(
  attrs: ReadableSpan["attributes"],
  key: string,
): string | null {
  const v = attrs[key];
  return typeof v === "string" ? v : null;
}

function readNumber(
  attrs: ReadableSpan["attributes"],
  key: string,
): number | null {
  const v = attrs[key];
  return typeof v === "number" ? v : null;
}

function readBool(
  attrs: ReadableSpan["attributes"],
  key: string,
): boolean | null {
  const v = attrs[key];
  return typeof v === "boolean" ? v : null;
}

/** The closed set of operation names our package emits. Any other
 *  string falls through to `null` — defensive against the SDK
 *  introducing new span kinds we haven't taught ourselves about. */
const KNOWN_OPS: ReadonlySet<NonNullable<TraceRow["operationName"]>> = new Set([
  "invoke_workflow",
  "invoke_agent",
  "chat",
  "execute_tool",
  "map",
  "parallel_map",
  "parallel_flow",
  "branch",
  "catch_exception",
  "subflow",
]);

function narrowOperationName(
  raw: string | null,
): TraceRow["operationName"] {
  if (raw === null) return null;
  return KNOWN_OPS.has(raw as NonNullable<TraceRow["operationName"]>)
    ? (raw as NonNullable<TraceRow["operationName"]>)
    : null;
}

/** Pull the `input` / `output` payload off a span.
 *
 *  Three sources, depending on span kind:
 *    - `chat` spans carry GenAI-spec message bodies on
 *      `gen_ai.input.messages` / `gen_ai.output.messages` (JSON strings).
 *    - `execute_tool` spans carry call args/result on
 *      `gen_ai.tool.call.arguments` / `gen_ai.tool.call.result`.
 *    - `invoke_workflow` / `invoke_agent` carry structured runtime
 *      values via our extension `tidy_ts.ai.input` / `tidy_ts.ai.output`.
 *
 *  All three are JSON-encoded; we eagerly parse so consumers see
 *  structured values, not strings. */
function extractIO<TInput, TOutput>(
  attrs: ReadableSpan["attributes"],
  op: TraceRow["operationName"],
): { input: TInput | null; output: TOutput | null } {
  if (op === "chat") {
    return {
      input: parseJsonAttr<TInput>(attrs, ATTR.INPUT_MESSAGES),
      output: parseJsonAttr<TOutput>(attrs, ATTR.OUTPUT_MESSAGES),
    };
  }
  if (op === "execute_tool") {
    return {
      input: parseJsonAttr<TInput>(attrs, ATTR.TOOL_CALL_ARGUMENTS),
      output: parseJsonAttr<TOutput>(attrs, ATTR.TOOL_CALL_RESULT),
    };
  }
  if (op === "invoke_workflow" || op === "invoke_agent") {
    return {
      input: parseJsonAttr<TInput>(attrs, TIDY_ATTR.INPUT),
      output: parseJsonAttr<TOutput>(attrs, TIDY_ATTR.OUTPUT),
    };
  }
  // tidy_ts.ai.* control-flow spans don't have a meaningful runtime
  // payload tied to "input" / "output" today. Returning `null` is
  // honest: the column exists, this row's value is null.
  return { input: null, output: null };
}

function parseJsonAttr<T>(
  attrs: ReadableSpan["attributes"],
  key: string,
): T | null {
  const v = attrs[key];
  if (typeof v !== "string") return null;
  try {
    return JSON.parse(v) as T;
  } catch {
    return null;
  }
}
