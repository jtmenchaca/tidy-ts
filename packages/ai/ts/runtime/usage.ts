// Usage telemetry + provenance — the per-node and per-run accounting
// surfaced on every `WithUsage<T>` returned from `ai.evaluate`.
//
// Pulled out of evaluate.ts so the public usage shapes live next to the
// helpers that derive them, and so the runner's executors don't need to
// pull in the whole evaluate.ts public-API file just to push a NodeUsage.

import type { Topology } from "../topology/topology.ts";
import type { Trace } from "./tracing.ts";

/** Per-node usage record. Tokens are optional because not every node
 *  calls the LLM in a way that returns token counts (cached nodes report
 *  zero, free-text nodes may omit them).
 *
 *  Per-turn detail (the model's tool calls, file edits, etc.) is no
 *  longer surfaced here — `WithUsage.trace.spans` carries it as proper
 *  OTel spans following the GenAI semantic conventions. */
export interface NodeUsage {
  nodeName: string;
  /** AgentNode and SandboxAgentNode produce usage entries; other node
   *  types don't call an LLM. Narrowing this from `string` lets
   *  downstream consumers filter without casting. */
  componentType: "AgentNode" | "SandboxAgentNode";
  model?: string;
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
  latencyMs: number;
  /** AgentNode only: how many tool calls fired during this node's execution. */
  toolCalls?: number;
  /** True when the node's output came from the datastore. Cached entries
   *  report `latencyMs: 0` and undefined token counts (the original run's
   *  tokens belong to the original execution, not this one). */
  cached: boolean;
}

export interface UsageReport {
  totalLatencyMs: number;
  totalPromptTokens: number;
  totalCompletionTokens: number;
  totalTokens: number;
  perNode: NodeUsage[];
}

/**
 * Provenance — citation-quality identity of the run. Carried on every
 * `WithUsage<T>` result so a downstream consumer (a metric run, a notebook
 * export, a paper's methods section) can record exactly which topology +
 * which models were used, at what time, and which sub-calls came from the
 * datastore.
 */
export interface Provenance {
  /** The topology's citable identity. `name` is always present; the rest
   *  are present if the topology author set them via createTopology. */
  topology: {
    id?: string;
    name: string;
    version?: string;
    citation?: string;
  };
  /** Distinct models invoked during the run, in first-seen order. Nodes
   *  served from cache don't contribute to this list (the model only
   *  matters if it actually ran). */
  models: string[];
  /** ISO timestamp when ai.evaluate began this call. */
  runAt: string;
  /** Names of LLM/Agent nodes whose outputs came from the datastore. A
   *  run can be partly cached: e.g., nodes 1-3 cached, node 4 fresh
   *  after a prompt tweak.
   *
   *  Subflow-embedded nodes are qualified with their parent's path:
   *    - `FlowNode`, `CatchExceptionNode`, `MapNode`, `ParallelMapNode`:
   *      `parentName.childName` (the subflow's `Topology.name` is not
   *      part of the path; the parent's `node.name` is enough)
   *    - `ParallelFlowNode`: `parentName[i:subflowName].childName`
   *      (the `[i:subflowName]` segment disambiguates sibling subflows
   *       whose `Topology.name` might collide)
   *  Note: under `MapNode` / `ParallelMapNode` the same prefix is used
   *  on every iteration, so a child that hits cache on each of N items
   *  will appear up to N times in `cachedNodes`. */
  cachedNodes: string[];
}

export interface WithUsage<TInput, TOutput> {
  result: TOutput;
  usage: UsageReport;
  provenance: Provenance;
  /** OTel trace of the run — a tree of `ReadableSpan`s following the
   *  GenAI semantic conventions. Root span is `invoke_workflow`; agent
   *  nodes contribute `invoke_agent` spans with `chat` / `execute_tool`
   *  children; control-flow nodes contribute spans under the
   *  `tidy_ts.ai.*` attribute namespace.
   *
   *  Generics flow the topology's start input + end output types
   *  through so `trace.toDataFrame()` returns a DataFrame whose
   *  `input` / `output` columns are typed. */
  trace: Trace<TInput, TOutput>;
}

/** Normalizes Responses API (input_tokens/output_tokens) and Chat
 *  Completions API (prompt_tokens/completion_tokens) usage shapes into
 *  one common form, so executors push the same fields regardless of
 *  which OpenAI endpoint they hit. */
export function normalizeUsage(
  raw: unknown,
): { prompt?: number; completion?: number; total?: number } {
  if (!raw || typeof raw !== "object") return {};
  const u = raw as Record<string, unknown>;
  const prompt = (u.prompt_tokens ?? u.input_tokens) as number | undefined;
  const completion = (u.completion_tokens ?? u.output_tokens) as number | undefined;
  const total = u.total_tokens as number | undefined;
  return { prompt, completion, total };
}

export function buildUsageReport(perNode: NodeUsage[]): UsageReport {
  let totalLatencyMs = 0;
  let totalPromptTokens = 0;
  let totalCompletionTokens = 0;
  let totalTokens = 0;
  for (const n of perNode) {
    totalLatencyMs += n.latencyMs;
    if (n.promptTokens) totalPromptTokens += n.promptTokens;
    if (n.completionTokens) totalCompletionTokens += n.completionTokens;
    if (n.totalTokens) totalTokens += n.totalTokens;
  }
  return { totalLatencyMs, totalPromptTokens, totalCompletionTokens, totalTokens, perNode };
}

/** Pull citable identity off a Topology value. */
export function topologyProvenanceFrom(topology: Topology): Provenance["topology"] {
  return {
    id: topology.id,
    name: topology.name,
    version: topology.version,
    citation: topology.citation,
  };
}

/** Distinct models that actually ran (cached entries are skipped — the
 *  model only matters when it was invoked), in first-seen order. */
export function modelsFrom(perNode: NodeUsage[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const n of perNode) {
    if (n.cached) continue;
    if (n.model && !seen.has(n.model)) {
      seen.add(n.model);
      out.push(n.model);
    }
  }
  return out;
}

/** Names of nodes whose outputs came from the datastore, in execution order. */
export function cachedNodesFrom(perNode: NodeUsage[]): string[] {
  const out: string[] = [];
  for (const n of perNode) if (n.cached) out.push(n.nodeName);
  return out;
}

/** Append `entry` to the run's usage sink if one is installed. Pure
 *  null-check sugar — the alternative is `if (sink) sink.push(entry)`
 *  at every per-node push site, which gets tedious when both executor
 *  files have two push sites each (cache-hit and fresh). */
export function recordNodeUsage(
  sink: NodeUsage[] | undefined,
  entry: NodeUsage,
): void {
  if (sink) sink.push(entry);
}
