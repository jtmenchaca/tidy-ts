// ai.evaluate — row-wise verb that runs a Topology against one row's input.
//
// v3 scope: multi-node DAGs with data-flow edges, AgentNode (LLM with tool
// use), BranchingNode (conditional routing), MapNode (per-element subflow
// with reduction), and retry-on-transport-failure via @tidy-ts/shims.
//
// Execution model:
//   1. Validate input against startNode.inputSchema (if provided).
//   2. Walk control edges from StartNode forward. For BranchingNodes, the
//      chosen branch determines which outgoing edge to follow.
//   3. For each node, resolve inputs from incoming DataFlowEdges (every
//      required input must be wired with an explicit edge — there is no
//      implicit pass-through), execute, store outputs.
//   4. EndNode's resolved inputs are the topology output, validated
//      against endNode.outputSchema if provided.
//
// Failure model:
//   - Default: throw on any failure.
//   - Opt-in: `onError: "result"` returns Result<T, AiEvalError>.
//   - Retries: pass `retry: RetryConfig` to retry transport-level failures.

// Side-effect import: loads .env once per process so OPENAI_API_KEY is
// available without callers having to shell-export it. Embed and any
// other runtime entry point should import this module before any code
// that depends on the env.
import "./_env.ts";

import {
  batch,
  err,
  ok,
  type Result,
  type RetryConfig,
  tryAsync,
} from "@tidy-ts/shims";

import type { Topology } from "../topology/topology.ts";
import { executeTopology } from "./executors/walker.ts";
import {
  type AiEvalError,
  toAiEvalError,
} from "./errors.ts";
import {
  buildUsageReport,
  cachedNodesFrom,
  modelsFrom,
  type NodeUsage,
  type Provenance,
  topologyProvenanceFrom,
  type UsageReport,
  type WithUsage,
} from "./usage.ts";
import { effectiveInnerConcurrency } from "./param-resolution.ts";
import {
  type ClientToolHandler,
  type GenerationOverride,
  type RunContext,
  type SandboxClient,
} from "./run-context.ts";
import { ATTR, createTraceContext, TIDY_ATTR } from "./tracing.ts";
import { context as otelContext, SpanStatusCode, trace as otelTrace } from "@opentelemetry/api";

// Errors, usage types, and GenerationOverride live in their own modules
// (./errors.ts, ./usage.ts, ./run-context.ts) and are re-exported from
// runtime/index.ts. Don't re-export them from here too — single source
// of truth for the public surface.

// ── Retry config (narrowed shouldRetry) ──────────────────────────────────
// `@tidy-ts/shims` `RetryConfig` types `shouldRetry` as
// `(error: unknown, attempt: number) => boolean` because shims can't know
// what errors callers will throw. `ai.evaluate` always throws one of the
// AiEvalError variants, so we narrow the signature here. Callers get a
// properly-typed `error` parameter — no `(error as { name?: string })` casts.
type AiEvalRetryConfigBase = {
  /** Maximum retry attempts (default: 3). */
  maxRetries?: number;
  /** Decides whether to retry; default policy in this module retries
   *  LlmTransportError only. Override to opt into retrying ToolError, etc. */
  shouldRetry?: (error: AiEvalError, attempt: number) => boolean;
  /** Called before each retry. */
  onRetry?: (error: AiEvalError, attempt: number, taskIndex: number) => void;
};

export type AiEvalRetryConfig =
  | (AiEvalRetryConfigBase & {
    backoff: "exponential";
    baseDelay?: number;
    backoffMultiplier?: number;
    maxDelay?: number;
  })
  | (AiEvalRetryConfigBase & {
    backoff: "linear";
    baseDelay?: number;
    maxDelay?: number;
  })
  | (AiEvalRetryConfigBase & {
    backoff: "custom";
    backoffFn: (error: AiEvalError, attempt: number, taskIndex: number) => number;
  });

function toShimsRetryConfig(c: AiEvalRetryConfig): RetryConfig {
  // Variance: our callbacks are typed against the narrow `AiEvalError` and
  // shims expects callbacks typed against `unknown`. Function parameters
  // are contravariant, so the narrow-param function is NOT assignable to
  // the wide-param function — but at runtime every error we throw IS an
  // AiEvalError, so the call is safe. The cast is a single localized
  // bridge from "what the caller types" to "what shims types".
  const shouldRetry = c.shouldRetry as unknown as RetryConfig["shouldRetry"];
  const onRetry = c.onRetry as unknown as RetryConfig["onRetry"];

  switch (c.backoff) {
    case "exponential":
      return {
        backoff: "exponential",
        maxRetries: c.maxRetries,
        baseDelay: c.baseDelay,
        backoffMultiplier: c.backoffMultiplier,
        maxDelay: c.maxDelay,
        shouldRetry,
        onRetry,
      };
    case "linear":
      return {
        backoff: "linear",
        maxRetries: c.maxRetries,
        baseDelay: c.baseDelay,
        maxDelay: c.maxDelay,
        shouldRetry,
        onRetry,
      };
    case "custom":
      return {
        backoff: "custom",
        maxRetries: c.maxRetries,
        backoffFn: c.backoffFn as unknown as (e: unknown, a: number, i: number) => number,
        shouldRetry,
        onRetry,
      };
  }
}

// ── Public API ───────────────────────────────────────────────────────────

// `EvaluateOptions*` has four variants because two orthogonal flags
// each drive the return type:
//   onError: "throw" | "result"  — `O` vs `Result<O, AiEvalError>`
//   includeUsage: true | false   — `WithUsage<I, O>` vs bare `O`
// Each variant is one (onError, includeUsage) combination; the
// overloaded `evaluate` and `evaluateColumn` signatures dispatch on
// them. Default for both flags is the wider/safer choice (throw,
// include usage) — the `false`/`"result"` arms exist for callers that
// either don't want the wrapper or want recoverable failures.
//
// The shapes look duplicative but the required-vs-optional pattern is
// what drives overload selection: `EvaluateOptionsThrowWithUsage` is
// the "no flags set" default arm; `EvaluateOptionsThrow` requires
// `includeUsage: false`; the `Result` arms require `onError: "result"`.
// A single generic `EvaluateOptions<I, O, OnError, IncludeUsage>` was
// tried and broke overload dispatch — both flags collapse to optional,
// and the most-general overload always wins. Keep them split.

/** Common options shared by every `EvaluateOptions*` variant. */
interface EvaluateOptionsCommon {
  retry?: AiEvalRetryConfig;
  /** Per-node generation parameter overrides, keyed by `node.name`. Use
   *  for A/B testing temperatures, raising `maxTokens` on a specific call,
   *  etc. Overrides are folded into the per-node cache key so different
   *  override values produce different cache entries (no stale-result
   *  poisoning). Names not present in the topology are silently ignored. */
  overrides?: Record<string, GenerationOverride>;
  /** When `false`, every AgentNode in this run skips the cache
   *  lookup AND skips the post-success write — so the call leaves no
   *  trace in the datastore and reads no stale entries. Default `true`.
   *  Use for "always fresh" iterations (changed input semantics, prompt
   *  drift the fingerprint can't see, debugging) — at the cost of one
   *  full API call per AgentNode per row, even on re-runs. */
  cache?: boolean;
  /** Resolver for ClientTool calls. When an Agent in the topology emits
   *  a tool_call for a `ClientTool`, the runner does not execute it
   *  locally — it hands the call (`{ name, arguments }`) to this
   *  handler and uses the return value as the tool result. Without a
   *  handler, an emitted ClientTool call throws `ToolError`. */
  clientToolHandler?: ClientToolHandler;
  /** SDK sandbox-client instance used to execute `SandboxAgentNode`s.
   *  When unset, the SDK falls back to its built-in
   *  `UnixLocalSandboxClient`. Build via the SDK's sandbox subpaths,
   *  e.g.:
   *
   *      import { UnixLocalSandboxClient } from "@openai/agents/sandbox/local";
   *      const client = new UnixLocalSandboxClient();
   *      await ai.evaluate({ topology, input, sandboxClient: client });
   */
  sandboxClient?: SandboxClient;
}

export interface EvaluateOptionsThrow<I, O> extends EvaluateOptionsCommon {
  topology: Topology<I, O>;
  input: I;
  onError?: "throw";
  /** Strip the `{ result, usage }` wrapper and return the bare topology output. */
  includeUsage: false;
}

export interface EvaluateOptionsThrowWithUsage<I, O> extends EvaluateOptionsCommon {
  topology: Topology<I, O>;
  input: I;
  onError?: "throw";
  includeUsage?: true;
}

export interface EvaluateOptionsResult<I, O> extends EvaluateOptionsCommon {
  topology: Topology<I, O>;
  input: I;
  onError: "result";
  /** Strip the `{ result, usage }` wrapper and return the bare topology output. */
  includeUsage: false;
}

export interface EvaluateOptionsResultWithUsage<I, O> extends EvaluateOptionsCommon {
  topology: Topology<I, O>;
  input: I;
  onError: "result";
  includeUsage?: true;
}

// Overloads (most-specific → least):
export async function evaluate<I, O>(
  opts: EvaluateOptionsResultWithUsage<I, O>,
): Promise<Result<WithUsage<I, O>, AiEvalError>>;
export async function evaluate<I, O>(
  opts: EvaluateOptionsThrowWithUsage<I, O>,
): Promise<WithUsage<I, O>>;
export async function evaluate<I, O>(
  opts: EvaluateOptionsResult<I, O>,
): Promise<Result<O, AiEvalError>>;
export async function evaluate<I, O>(
  opts: EvaluateOptionsThrow<I, O>,
): Promise<O>;
export async function evaluate<I, O>(
  opts:
    | EvaluateOptionsThrow<I, O>
    | EvaluateOptionsThrowWithUsage<I, O>
    | EvaluateOptionsResult<I, O>
    | EvaluateOptionsResultWithUsage<I, O>,
): Promise<O | Result<O, AiEvalError> | WithUsage<I, O> | Result<WithUsage<I, O>, AiEvalError>> {
  const onError = opts.onError ?? "throw";
  const wantUsage = opts.includeUsage !== false;
  const shimsRetry = opts.retry ? toShimsRetryConfig(opts.retry) : undefined;
  const usageSink: NodeUsage[] | undefined = wantUsage ? [] : undefined;
  const runAt = new Date().toISOString();

  // Per-call OTel tracing context. Owns a fresh BasicTracerProvider +
  // in-memory exporter; registers the SDK→OTel bridge for the duration
  // of this evaluate (filtered to spans on our generated trace id so
  // sibling evaluates running concurrently don't cross-pollinate).
  // Message content is always captured: the trace lives in-process,
  // the caller already has the input + output, and the captured
  // conversation is what makes `Trace.toConversation()` and the cache
  // envelope work.
  const traceCtx = createTraceContext();

  // Root `invoke_workflow` span. Everything node-level happens under
  // its context — agent-node wrapper spans, SDK-emitted chat/tool spans,
  // control-flow spans.
  const rootSpan = traceCtx.tracer.startSpan(
    `invoke_workflow ${opts.topology.name}`,
    {
      attributes: {
        [ATTR.OPERATION_NAME]: "invoke_workflow",
        [ATTR.WORKFLOW_NAME]: opts.topology.name,
        // Topology start input — known up front, set at span-start time.
        [TIDY_ATTR.INPUT]: JSON.stringify(opts.input ?? null),
      },
    },
    traceCtx.activeContext,
  );
  traceCtx.activeContext = otelTrace.setSpan(traceCtx.activeContext, rootSpan);
  const rootSpanId = rootSpan.spanContext().spanId;
  // Tell the SDK→OTel bridge to parent any unattached SDK span (chat /
  // execute_tool / etc.) under the workflow span until an agent node
  // pushes its own wrapper on top.
  traceCtx.pushParent(traceCtx.activeContext);

  const ctx: RunContext = {
    retryConfig: shimsRetry,
    usageSink,
    overrides: opts.overrides,
    nodePathPrefix: "",
    cache: opts.cache ?? true,
    clientToolHandler: opts.clientToolHandler,
    sandboxClient: opts.sandboxClient,
    trace: traceCtx,
  };

  // Run the topology inside the OTel root span's context so any code
  // path that consults `context.active()` (notably the SDK bridge
  // processor) sees the workflow span as its parent.
  const runResult = await otelContext.with(traceCtx.activeContext, () =>
    tryAsync({
      fn: () =>
        executeTopology<O>(
          opts.topology,
          opts.input as Record<string, unknown>,
          ctx,
        ),
      mapError: (e): AiEvalError => toAiEvalError(e),
    }),
  );

  if (!runResult.ok) {
    rootSpan.recordException({
      name: runResult.error.name,
      message: runResult.error.message,
    });
    rootSpan.setStatus({
      code: SpanStatusCode.ERROR,
      message: runResult.error.message,
    });
    traceCtx.popParent();
    rootSpan.end();
    // Drain spans so the error path also has a complete trace —
    // attached directly to the error so both throw and result-mode
    // callers can inspect `error.trace.spans` for what the model did
    // before the failure.
    const trace = await traceCtx.finalize<I, O>(rootSpanId);
    // The error object's `extra` bag is the source of truth for our
    // `AppError` shape; mutate it in place to attach the trace, then
    // also set the top-level `trace` property so consumers can read
    // `error.trace` directly without going through `error.extra`.
    (runResult.error as { trace?: typeof trace }).trace = trace;
    const extra = (runResult.error as { extra?: { trace?: typeof trace } }).extra;
    if (extra) extra.trace = trace;
    if (onError === "result") return err(runResult.error);
    throw runResult.error;
  }

  const out = runResult.value;
  // Topology final output — set right before closing the root span so
  // the workflow row's `output` column reflects what `ai.evaluate`
  // actually returned.
  rootSpan.setAttribute(TIDY_ATTR.OUTPUT, JSON.stringify(out ?? null));
  traceCtx.popParent();
  rootSpan.end();
  const trace = await traceCtx.finalize<I, O>(rootSpanId);
  if (wantUsage) {
    const perNode = usageSink!;
    const wrapped: WithUsage<I, O> = {
      result: out,
      usage: buildUsageReport(perNode),
      provenance: {
        topology: topologyProvenanceFrom(opts.topology),
        models: modelsFrom(perNode),
        runAt,
        cachedNodes: cachedNodesFrom(perNode),
      },
      trace,
    };
    return onError === "result" ? ok(wrapped) : wrapped;
  }
  return onError === "result" ? ok(out) : out;
}

// ── evaluateColumn ──────────────────────────────────────────────────────
//
// Row-wise convenience for running `ai.evaluate` over an array of inputs
// (typically a DataFrame column) while surfacing each row's failure
// without poisoning the whole batch. Returns one `Result` per input in
// the original order, so callers can split into success/failure columns
// or feed straight into `mutateAsync`.

export interface EvaluateColumnOptions<I, O> {
  topology: Topology<I, O>;
  inputs: readonly I[];
  retry?: AiEvalRetryConfig;
  overrides?: Record<string, GenerationOverride>;
  /** Max simultaneous rows in flight. Capped by the rate limiter's
   *  `maxConcurrent` when one is installed (mirrors the inner-concurrency
   *  clamp on `ParallelMapNode`). Default: `inputs.length` (no limit). */
  concurrency?: number;
  /** Per-row return shape. Default `"with-usage"` matches `ai.evaluate`. */
  includeUsage?: boolean;
  /** When `false`, every row skips both the cache lookup and the
   *  post-success write — including reads from entries another row in
   *  this same batch just wrote. A 10k-row batch will fire 10k API calls
   *  per AgentNode. Default `true`. */
  cache?: boolean;
  /** Resolver for ClientTool calls. Shared across all rows in the
   *  batch — concurrency-safe handlers are the caller's responsibility. */
  clientToolHandler?: ClientToolHandler;
  /** SDK sandbox-client instance. Shared across all rows in the
   *  batch — the underlying SDK client needs to be safe for concurrent
   *  use (the built-in `UnixLocalSandboxClient` is). */
  sandboxClient?: SandboxClient;
}

/** Run a topology over many inputs, returning one Result per input in order. */
export async function evaluateColumn<I, O>(
  opts: EvaluateColumnOptions<I, O> & { includeUsage: false },
): Promise<Result<O, AiEvalError>[]>;
export async function evaluateColumn<I, O>(
  opts: EvaluateColumnOptions<I, O>,
): Promise<Result<WithUsage<I, O>, AiEvalError>[]>;
export async function evaluateColumn<I, O>(
  opts: EvaluateColumnOptions<I, O>,
): Promise<Result<O, AiEvalError>[] | Result<WithUsage<I, O>, AiEvalError>[]> {
  const authorCap = opts.concurrency ?? opts.inputs.length;
  const concurrency = Math.max(effectiveInnerConcurrency(authorCap), 1);
  // The EvaluateOptions overloads force a runtime branch on
  // includeUsage so `evaluate` picks the right one. Branching at the
  // `batch` call keeps `R` narrow on each side; the alternative is one
  // shared `runRow` typed as the union, which requires an `as`-cast on
  // the way back out.
  if (opts.includeUsage === false) {
    return await batch(
      [...opts.inputs],
      (input: I): Promise<Result<O, AiEvalError>> =>
        evaluate({
          topology: opts.topology,
          input,
          onError: "result",
          includeUsage: false,
          retry: opts.retry,
          overrides: opts.overrides,
          cache: opts.cache,
          clientToolHandler: opts.clientToolHandler,
          sandboxClient: opts.sandboxClient,
        }),
      { concurrency },
    );
  }
  return await batch(
    [...opts.inputs],
    (input: I): Promise<Result<WithUsage<I, O>, AiEvalError>> =>
      evaluate({
        topology: opts.topology,
        input,
        onError: "result",
        retry: opts.retry,
        overrides: opts.overrides,
        cache: opts.cache,
        clientToolHandler: opts.clientToolHandler,
        sandboxClient: opts.sandboxClient,
      }),
    { concurrency },
  );
}
