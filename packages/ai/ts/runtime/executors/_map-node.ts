// MapNode executor — iterates the subflow once per item in
// `input[iterateOver]`, sequentially. Results are reduced via
// `reduceMapResults`. Sequential by design — concurrent variant is
// `parallel-map-node.ts`.

import type { MapNode, ReducerSpec } from "../../topology/nodes/map.ts";
import type { Topology } from "../../topology/topology.ts";
import { InputValidationError } from "../errors.ts";
import { type RunContext, withSubflow } from "../run-context.ts";

import { reduceMapResults } from "./_map-reduce.ts";
import { executeTopology } from "./walker.ts";

export async function executeMapNode(
  node: MapNode,
  input: Record<string, unknown>,
  ctx: RunContext,
): Promise<Record<string, unknown>> {
  const items = input[node.iterateOver];
  if (!Array.isArray(items)) {
    throw new InputValidationError({
      message:
        `MapNode '${node.name}' expects input '${node.iterateOver}' to be an array; got ${typeof items}.`,
    });
  }
  const subflow = node.subflow as Topology;
  const innerCtx = withSubflow(ctx, node.name);
  const perItem: Record<string, unknown>[] = [];
  for (const item of items) {
    const subInput: Record<string, unknown> = { [node.iterateOver]: item };
    const subOut = await executeTopology(subflow, subInput, innerCtx);
    perItem.push(subOut as Record<string, unknown>);
  }
  return reduceMapResults(
    perItem,
    node.reducers as Record<string, ReducerSpec> | undefined,
    node.outputs as { title: string }[] | undefined,
  );
}
