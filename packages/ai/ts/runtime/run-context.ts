// Per-call execution state threaded through every executor.
//
// Holds the things every node executor needs but that don't belong to
// any individual node: the retry policy, the usage sink, per-node
// generation overrides, and the current subflow path. Pure value — the
// runner constructs one at the top of `evaluate` and never mutates it
// (descents into subflows allocate a new RunContext via `withSubflow`).
//
// Resolution helpers that *consume* a RunContext (or its individual
// fields) live in `./param-resolution.ts` — they're about how to
// interpret context fields, not about the context itself.

import type { RetryConfig } from "@tidy-ts/shims";
import type { GenerationOverride } from "./param-resolution.ts";
import type { TraceContext } from "./tracing.ts";
import type { NodeUsage } from "./usage.ts";

// Re-export so existing imports from this module keep working. The
// canonical declaration is in param-resolution.ts (next to its
// resolution function), and aliases over `GenerationParameters` so the
// author-input shape and the runtime-resolved shape stay in lockstep.
export type { GenerationOverride };

/** Callback invoked when an Agent emits a tool_call for a ClientTool.
 *  The runner does not execute ClientTools locally — the caller is
 *  responsible for fulfilling the request and returning a result
 *  (typically a string or JSON-serializable object). The handler can be
 *  async; promises are awaited before the next agent turn. */
export type ClientToolHandler = (call: {
  name: string;
  arguments: Record<string, unknown>;
}) => unknown | Promise<unknown>;

/** Author-supplied SDK sandbox-client selection for `SandboxAgentNode`
 *  invocations. Typed as `unknown` because the SDK's `SandboxClient`
 *  type lives on the subpath import — `@openai/agents/sandbox` —
 *  which we don't want to pull into the runtime's typed surface for
 *  every consumer. The bridge passes it through verbatim. Typical
 *  values: `new UnixLocalSandboxClient()`, `new E2BSandboxClient(...)`,
 *  etc. When unset the SDK uses its own default
 *  (`UnixLocalSandboxClient`). */
export type SandboxClient = unknown;

export interface RunContext {
  retryConfig: RetryConfig | undefined;
  usageSink: NodeUsage[] | undefined;
  /** Per-node generation overrides keyed by `node.name`. The override is
   *  merged on top of the node's `llmConfig.defaultGenerationParameters`
   *  at call time AND folded into the node fingerprint so cache entries
   *  for different (temperature, topP, maxTokens) live in separate keys. */
  overrides: Record<string, GenerationOverride> | undefined;
  /** Dot-separated path of enclosing subflow node names (FlowNode,
   *  MapNode, etc.). Empty at the top level. Prepended to `node.name`
   *  when writing per-node usage entries so two FlowNodes embedding a
   *  concept with the same internal node name produce distinguishable
   *  `cachedNodes` / `usage.perNode` entries. */
  nodePathPrefix: string;
  /** When `false`, every AgentNode in this run skips the cache
   *  lookup *and* skips the post-success write — so the run leaves no
   *  trace in the datastore and reads no stale entries. Default `true`
   *  (the structural read-write behavior). Use sparingly: a 10k-row
   *  `evaluateColumn` with `cache: false` will fire 10k API calls even
   *  on re-runs. */
  cache: boolean;
  /** Resolver for ClientTool calls. Undefined when the caller did not
   *  pass one — if an agent then emits a ClientTool tool_call, the
   *  runner throws `ToolError` with a clear "no handler" message. */
  clientToolHandler: ClientToolHandler | undefined;
  /** SDK sandbox-client instance used to run `SandboxAgentNode`s.
   *  Undefined defers to the SDK's default (`UnixLocalSandboxClient`).
   *  Authors needing E2B / Daytona / Modal etc. construct the client
   *  via the SDK's `@openai/agents/sandbox/*` subpaths and pass it in. */
  sandboxClient: SandboxClient | undefined;
  /** OTel tracing context for this evaluate call. The walker creates
   *  wrapper spans on `tracer` inside `activeContext`; the SDK bridge
   *  attaches `Runner.run`'s spans as children of the currently-active
   *  OTel span. Single source of truth for the per-call OTel state —
   *  the alternative (passing tracer + activeContext + traceId as
   *  separate fields) creates places to forget one. */
  trace: TraceContext;
}

/** Compose a per-call node identifier from the current run-context path
 *  and the executing node's name. Top-level nodes get just their name;
 *  nodes inside a subflow get `parentSubflowName.childNodeName`. */
export function qualifiedNodeName(ctx: RunContext, nodeName: string): string {
  return ctx.nodePathPrefix === ""
    ? nodeName
    : `${ctx.nodePathPrefix}.${nodeName}`;
}

/** Extend the path prefix when descending into a subflow. `parentNodeName`
 *  is the outer `FlowNode`/`MapNode`/etc. whose body the descent enters
 *  — the subflow itself doesn't have a name, the node containing it does. */
export function withSubflow(ctx: RunContext, parentNodeName: string): RunContext {
  return {
    ...ctx,
    nodePathPrefix: qualifiedNodeName(ctx, parentNodeName),
  };
}
