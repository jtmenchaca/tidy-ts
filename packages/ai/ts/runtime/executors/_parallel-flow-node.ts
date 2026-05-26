// ParallelFlowNode executor — runs multiple independent subflows
// concurrently on the same input and merges their outputs into one
// object (later subflows win on key collision). Concurrency defaults to
// subflows.length and is clamped by the rate limiter's maxConcurrent.

import { parallel } from "@tidy-ts/shims";

import type { ParallelFlowNode } from "../../topology/nodes/parallel-flow.ts";
import type { Topology } from "../../topology/topology.ts";
import { effectiveInnerConcurrency } from "../param-resolution.ts";
import { type RunContext, withSubflow } from "../run-context.ts";

import { executeTopology } from "./walker.ts";

export async function executeParallelFlowNode(
  node: ParallelFlowNode,
  input: Record<string, unknown>,
  ctx: RunContext,
): Promise<Record<string, unknown>> {
  const tasks = (node.subflows as Topology[]).map((sf, i) => async () => {
    // Subflow's `name` may collide across siblings; suffix with the
    // index to keep `cachedNodes` paths unambiguous.
    const innerCtx = withSubflow(ctx, `${node.name}[${i}:${sf.name}]`);
    const out = await executeTopology(sf, input, innerCtx);
    return out as Record<string, unknown>;
  });
  const authorCap = node.concurrency ?? Math.max(tasks.length, 1);
  const concurrency = effectiveInnerConcurrency(authorCap);
  const results = await parallel(tasks, { concurrency });
  const merged: Record<string, unknown> = {};
  for (const r of results) Object.assign(merged, r);
  return merged;
}
