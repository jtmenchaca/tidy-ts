// ParallelMapNode — like MapNode, but iterates the subflow concurrently
// (bounded by a concurrency cap). Same input/output contract as MapNode.
//
// Source: docs/reference/agent-spec/repo/tsagentspec/src/flows/nodes/parallel-map-node.ts

import { z } from "zod";
import { DEFAULT_NEXT_BRANCH, NodeBaseSchema } from "../component.ts";
import type { Property } from "../property.ts";
import type { Topology } from "../topology.ts";
import type { ReductionMethod } from "./map.ts";

export const ParallelMapNodeSchema = NodeBaseSchema.extend({
  componentType: z.literal("ParallelMapNode"),
  subflow: z.unknown(),
  reducers: z.record(
    z.string(),
    z.enum(["append", "sum", "average", "max", "min"]),
  ).optional(),
  iterateOver: z.string(),
  /** Maximum concurrent subflow invocations. Defaults to 8. */
  concurrency: z.number().int().positive().default(8),
});

declare const __pmI: unique symbol;
declare const __pmO: unique symbol;

export type ParallelMapNode<SubI = unknown, SubO = unknown> =
  & z.infer<typeof ParallelMapNodeSchema>
  & {
    readonly [__pmI]?: SubI;
    readonly [__pmO]?: SubO;
    subflow: Topology<SubI, SubO>;
  };

export function createParallelMapNode<SubI, SubO>({
  name,
  subflow,
  iterateOver,
  reducers,
  concurrency,
  inputs,
  outputs,
  id,
  description,
  metadata,
}: {
  name: string;
  subflow: Topology<SubI, SubO>;
  iterateOver: string;
  reducers?: Record<string, ReductionMethod>;
  concurrency?: number;
  inputs?: Property[];
  outputs?: Property[];
  id?: string;
  description?: string;
  metadata?: Record<string, unknown>;
}): ParallelMapNode<SubI, SubO> {
  const parsed = ParallelMapNodeSchema.parse({
    name,
    subflow,
    iterateOver,
    reducers,
    concurrency,
    inputs: inputs ?? [],
    outputs: outputs ?? [],
    id,
    description,
    metadata,
    branches: [DEFAULT_NEXT_BRANCH],
    componentType: "ParallelMapNode" as const,
  });
  return Object.freeze({ ...parsed, subflow }) as ParallelMapNode<SubI, SubO>;
}
