// ParallelMapNode — like MapNode, but iterates the subflow concurrently
// (bounded by a concurrency cap). Same input/output contract as MapNode.
//
// Source: docs/reference/agent-spec/repo/tsagentspec/src/flows/nodes/parallel-map-node.ts

import { z } from "zod";
import { DEFAULT_NEXT_BRANCH, NodeBaseSchema } from "../component.ts";
import type { Property } from "../property.ts";
import type { Topology } from "../topology.ts";
import { ReducerSpecSchema, type ReducerSpec } from "./map.ts";

export const ParallelMapNodeSchema = NodeBaseSchema.extend({
  componentType: z.literal("ParallelMapNode"),
  subflow: z.unknown(),
  reducers: z.record(z.string(), ReducerSpecSchema).optional(),
  iterateOver: z.string(),
  /** Maximum concurrent subflow invocations. Defaults to 8. */
  concurrency: z.number().int().positive().default(8),
});

declare const __pmI: unique symbol;
declare const __pmO: unique symbol;

export type ParallelMapNode<
  SubI = unknown,
  SubO = unknown,
  Reducers extends Record<string, ReducerSpec> | undefined = Record<
    string,
    ReducerSpec
  > | undefined,
> =
  & z.infer<typeof ParallelMapNodeSchema>
  & {
    readonly [__pmI]?: SubI;
    readonly [__pmO]?: SubO;
    subflow: Topology<SubI, SubO>;
    reducers?: Reducers;
  };

export function createParallelMapNode<
  SubI,
  SubO,
  const Reducers extends Record<string, ReducerSpec> | undefined = undefined,
>({
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
  reducers?: Reducers;
  concurrency?: number;
  inputs?: Property[];
  outputs?: Property[];
  id?: string;
  description?: string;
  metadata?: Record<string, unknown>;
}): ParallelMapNode<SubI, SubO, Reducers> {
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
  return Object.freeze({ ...parsed, subflow }) as ParallelMapNode<
    SubI,
    SubO,
    Reducers
  >;
}
