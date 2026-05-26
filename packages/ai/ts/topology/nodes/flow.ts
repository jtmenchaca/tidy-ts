// FlowNode — embed a Topology as a single node inside another Topology.
// Unlike MapNode (iterate) or ParallelFlowNode (concurrent fan-out), this
// is a plain 1:1 composition: the outer node's inputs become the subflow's
// input, and the subflow's output becomes the outer node's output.
//
// Source: docs/reference/agent-spec/repo/tsagentspec/src/flows/nodes/flow-node.ts

import { z } from "zod";
import { DEFAULT_NEXT_BRANCH, NodeBaseSchema } from "../component.ts";
import type { Property } from "../property.ts";
import type { Topology } from "../topology.ts";

export const FlowNodeSchema = NodeBaseSchema.extend({
  componentType: z.literal("FlowNode"),
  subflow: z.unknown(),
});

declare const __fnI: unique symbol;
declare const __fnO: unique symbol;

export type FlowNode<SubI = unknown, SubO = unknown> =
  & z.infer<typeof FlowNodeSchema>
  & {
    readonly [__fnI]?: SubI;
    readonly [__fnO]?: SubO;
    subflow: Topology<SubI, SubO>;
  };

export function createFlowNode<SubI, SubO>({
  name,
  subflow,
  inputs,
  outputs,
  id,
  description,
  metadata,
}: {
  name: string;
  subflow: Topology<SubI, SubO>;
  inputs?: Property[];
  outputs?: Property[];
  id?: string;
  description?: string;
  metadata?: Record<string, unknown>;
}): FlowNode<SubI, SubO> {
  const resolvedInputs = inputs ?? (subflow.inputs ?? []) as Property[];
  const resolvedOutputs = outputs ?? (subflow.outputs ?? []) as Property[];

  const parsed = FlowNodeSchema.parse({
    name,
    subflow,
    inputs: resolvedInputs,
    outputs: resolvedOutputs,
    branches: [DEFAULT_NEXT_BRANCH],
    id,
    description,
    metadata,
    componentType: "FlowNode" as const,
  });
  return Object.freeze({ ...parsed, subflow }) as FlowNode<SubI, SubO>;
}
