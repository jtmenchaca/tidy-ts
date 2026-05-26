// ParallelMapNode executor — same as MapNode but iterations run
// concurrently under a `concurrency` cap. Cap is clamped to the rate
// limiter's `maxConcurrent` so that an outer `mutateAsync` budget of N
// combined with an inner cap of M can't spawn N×M in-flight tasks that
// all immediately block.

import { batch } from "@tidy-ts/shims";

import type { ParallelMapNode } from "../../topology/nodes/parallel-map.ts";
import type { ReductionMethod } from "../../topology/nodes/map.ts";
import type { Topology } from "../../topology/topology.ts";
import { InputValidationError } from "../errors.ts";
import { effectiveInnerConcurrency } from "../param-resolution.ts";
import { type RunContext, withSubflow } from "../run-context.ts";

import { reduceMapResults } from "./_map-reduce.ts";
import { executeTopology } from "./walker.ts";

export async function executeParallelMapNode(
  node: ParallelMapNode,
  input: Record<string, unknown>,
  ctx: RunContext,
): Promise<Record<string, unknown>> {
  const items = input[node.iterateOver];
  if (!Array.isArray(items)) {
    throw new InputValidationError({
      message:
        `ParallelMapNode '${node.name}' expects input '${node.iterateOver}' to be an array; got ${typeof items}.`,
    });
  }
  const subflow = node.subflow as Topology;
  const innerCtx = withSubflow(ctx, node.name);
  const concurrency = effectiveInnerConcurrency(node.concurrency);
  const perItem = await batch(
    items,
    async (item) => {
      const subInput: Record<string, unknown> = { [node.iterateOver]: item };
      const subOut = await executeTopology(subflow, subInput, innerCtx);
      return subOut as Record<string, unknown>;
    },
    { concurrency },
  );
  return reduceMapResults(
    perItem,
    node.reducers as Record<string, ReductionMethod> | undefined,
    node.outputs as { title: string }[] | undefined,
  );
}
