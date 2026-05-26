// ParallelFlowNode — executes multiple independent subflows concurrently,
// merging their outputs (later flows win on key collision).
//
// Source: docs/reference/agent-spec/repo/tsagentspec/src/flows/nodes/parallel-flow-node.ts

import { z } from "zod";
import { DEFAULT_NEXT_BRANCH, NodeBaseSchema } from "../component.ts";
import type { Property } from "../property.ts";
import type { Topology } from "../topology.ts";

export const ParallelFlowNodeSchema = NodeBaseSchema.extend({
  componentType: z.literal("ParallelFlowNode"),
  subflows: z.array(z.unknown()).default([]),
  /** Maximum concurrent subflow runs. Defaults to subflows.length. */
  concurrency: z.number().int().positive().optional(),
});

export type ParallelFlowNode = z.infer<typeof ParallelFlowNodeSchema> & {
  // deno-lint-ignore no-explicit-any
  subflows: Topology<any, any>[];
};

export function createParallelFlowNode({
  name,
  subflows,
  concurrency,
  inputs,
  outputs,
  id,
  description,
  metadata,
}: {
  name: string;
  // deno-lint-ignore no-explicit-any
  subflows: Topology<any, any>[];
  concurrency?: number;
  inputs?: Property[];
  outputs?: Property[];
  id?: string;
  description?: string;
  metadata?: Record<string, unknown>;
}): ParallelFlowNode {
  const parsed = ParallelFlowNodeSchema.parse({
    name,
    subflows,
    concurrency,
    inputs: inputs ?? [],
    outputs: outputs ?? [],
    id,
    description,
    metadata,
    branches: [DEFAULT_NEXT_BRANCH],
    componentType: "ParallelFlowNode" as const,
  });
  return Object.freeze({ ...parsed, subflows }) as ParallelFlowNode;
}
