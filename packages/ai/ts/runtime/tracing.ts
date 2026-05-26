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
} as const;

// ── Public Trace shape ──────────────────────────────────────────────────

/** One row in the tabular projection of a trace — one row per OTel span,
 *  canonical columns hoisted from the GenAI semantic-convention
 *  attributes for direct querying. Anything outside this canonical set
 *  stays accessible via the underlying `ReadableSpan` (`spans[i]`); we
 *  hoist the high-traffic fields and stop. */
export interface TraceRow {
  // Identity / structure
  spanId: string;
  parentSpanId: string | null;
  traceId: string;
  name: string;
  // Timing
  startTime: number;
  endTime: number;
  durationMs: number;
  // Status
  status: "OK" | "ERROR" | "UNSET";
  errorMessage: string | null;
  // Operation discriminator — `gen_ai.operation.name` for spec-covered
  // spans (`invoke_workflow` / `invoke_agent` / `chat` / `execute_tool`)
  // or `tidy_ts.ai.operation.name` for our control-flow spans
  // (`map` / `branch` / `parallel_map` / `parallel_flow` / `catch_exception` /
  // `subflow`). `null` for spans without a recognized operation.
  operationName: string | null;
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
}

/** The trace surface attached to every `ai.evaluate` result.
 *
 *  `spans` is the real OTel `ReadableSpan[]` — same type the broader
 *  OTel ecosystem consumes. Users who already know OTel know how to
 *  read it. Users who don't can iterate it as a discriminated array
 *  keyed on `span.attributes[ATTR.OPERATION_NAME]` (or
 *  `TIDY_ATTR.OPERATION_NAME` for control-flow spans).
 *
 *  `toDataFrame()` projects spans into a queryable tidy-ts DataFrame
 *  for `.filter` / `.groupBy` / `.summarize` chains over the trace. */
export interface Trace {
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
  toDataFrame(): DataFrame<TraceRow>;
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
   *  + tears down the per-call provider and unregisters the bridge. */
  finalize(rootSpanId: string | undefined): Promise<Trace>;
  /** Flag plumbed from `EvaluateOptionsCommon.captureMessageContent`.
   *  When true, the SDK→OTel translator copies message bodies and tool
   *  call arguments/results onto the OTel span attributes. Default off
   *  (matches the OTel GenAI spec's `CAPTURE_MESSAGE_CONTENT` flag). */
  captureMessageContent: boolean;
}

interface CreateContextOptions {
  captureMessageContent?: boolean;
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
export function createTraceContext(
  options: CreateContextOptions = {},
): TraceContext {
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
  const captureMessageContent = options.captureMessageContent ?? false;

  // Register the SDK→OTel bridge. addTraceProcessor is a process-global
  // hook in @openai/agents-core; we filter inside the processor on the
  // SDK trace id so we only pick up spans belonging to THIS evaluate.
  const sdkProcessor = makeSdkOtelBridge({
    tracer,
    expectedSdkTraceId: `trace_${traceId}`,
    captureMessageContent,
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
    captureMessageContent,
    async finalize(rootSpanId): Promise<Trace> {
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
        toDataFrame: () => spansToDataFrame(spans),
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
  captureMessageContent: boolean;
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
  const { tracer, expectedSdkTraceId, captureMessageContent } = options;

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

      // Choose the OTel parent context: if the SDK parent translated to
      // an OTel context, use that; otherwise the call is happening
      // inside our walker's currently-active context (which is what
      // `context.active()` returns *at this moment in the bridge
      // callback*, because the SDK calls `onSpanEnd` synchronously
      // inside `Runner.run`, which is inside our `startActiveSpan` cb).
      const parentCtx = sdkSpan.parentId && sdkToContext.has(sdkSpan.parentId)
        ? sdkToContext.get(sdkSpan.parentId)!
        : context.active();

      const translated = translateSdkSpan(sdkSpan, captureMessageContent);
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
  captureMessageContent: boolean,
): TranslatedSpan | undefined {
  const data = sdkSpan.spanData;

  switch (data.type) {
    case "agent": {
      const name = data.name ?? "agent";
      return {
        name: `invoke_agent ${name}`,
        kind: SpanKind.INTERNAL,
        attributes: {
          [ATTR.OPERATION_NAME]: "invoke_agent",
          [ATTR.AGENT_NAME]: name,
        },
      };
    }
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
      if (captureMessageContent) {
        if (data.input) attrs[ATTR.INPUT_MESSAGES] = JSON.stringify(data.input);
        if (data.output) attrs[ATTR.OUTPUT_MESSAGES] = JSON.stringify(data.output);
      }
      return { name: `chat ${model}`, kind: SpanKind.CLIENT, attributes: attrs };
    }
    case "function": {
      const name = data.name ?? "tool";
      const attrs: Record<string, string | number | boolean | string[]> = {
        [ATTR.OPERATION_NAME]: "execute_tool",
        [ATTR.TOOL_NAME]: name,
        [ATTR.TOOL_TYPE]: "function",
      };
      if (captureMessageContent) {
        if (data.input) attrs[ATTR.TOOL_CALL_ARGUMENTS] = String(data.input);
        if (data.output) attrs[ATTR.TOOL_CALL_RESULT] = String(data.output);
      }
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
    case "response":
    case "transcription":
    case "speech":
    case "speech_group":
      return undefined;
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
