// FlowNode executor — 1:1 composition of a published Topology as a
// single node in the outer topology. The subflow's `name` is added to
// the run context's `nodePathPrefix` so child nodes in the subflow show
// up as `parentFlowName.childNodeName` in `cachedNodes` / `usage`.

import type { FlowNode } from "../../topology/nodes/flow.ts";
import type { Topology } from "../../topology/topology.ts";
import { type RunContext, withSubflow } from "../run-context.ts";

import { executeTopology } from "./walker.ts";

export async function executeFlowNode(
  node: FlowNode,
  input: Record<string, unknown>,
  ctx: RunContext,
): Promise<Record<string, unknown>> {
  const subflow = node.subflow as Topology;
  const out = await executeTopology(subflow, input, withSubflow(ctx, node.name));
  return out as Record<string, unknown>;
}
