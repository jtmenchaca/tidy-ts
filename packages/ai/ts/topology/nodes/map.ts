// MapNode — execute a nested Topology on each element of a list input,
// then reduce the per-element outputs.
//
// Source: docs/reference/agent-spec/repo/tsagentspec/src/flows/nodes/map-node.ts

import { z } from "zod";
import { DEFAULT_NEXT_BRANCH, NodeBaseSchema } from "../component.ts";
import type { Property } from "../property.ts";
import type { Topology } from "../topology.ts";

export const ReductionMethod = {
  APPEND: "append",
  SUM: "sum",
  AVERAGE: "average",
  MAX: "max",
  MIN: "min",
} as const;

export type ReductionMethod =
  (typeof ReductionMethod)[keyof typeof ReductionMethod];

export const MapNodeSchema = NodeBaseSchema.extend({
  componentType: z.literal("MapNode"),
  // subflow is preserved by reference; not structurally validated here.
  subflow: z.unknown(),
  reducers: z.record(
    z.string(),
    z.enum(["append", "sum", "average", "max", "min"]),
  ).optional(),
  /** Name of the input Property to iterate over. */
  iterateOver: z.string(),
});

declare const __mapI: unique symbol;
declare const __mapO: unique symbol;

export type MapNode<SubI = unknown, SubO = unknown> =
  & z.infer<typeof MapNodeSchema>
  & {
    readonly [__mapI]?: SubI;
    readonly [__mapO]?: SubO;
    subflow: Topology<SubI, SubO>;
  };

export function createMapNode<SubI, SubO>({
  name,
  subflow,
  iterateOver,
  reducers,
  inputs,
  outputs,
  id,
  description,
  metadata,
}: {
  name: string;
  subflow: Topology<SubI, SubO>;
  /**
   * Name of the input Property that holds the list to map over. Each element
   * of that list is passed to the subflow as its single input field.
   * The subflow input shape must accept `{ [iterateOver]: <element> }`.
   */
  iterateOver: string;
  reducers?: Record<string, ReductionMethod>;
  inputs?: Property[];
  outputs?: Property[];
  id?: string;
  description?: string;
  metadata?: Record<string, unknown>;
}): MapNode<SubI, SubO> {
  const parsed = MapNodeSchema.parse({
    name,
    subflow,
    iterateOver,
    reducers,
    inputs: inputs ?? [],
    outputs: outputs ?? [],
    id,
    description,
    metadata,
    branches: [DEFAULT_NEXT_BRANCH],
    componentType: "MapNode" as const,
  });
  return Object.freeze({ ...parsed, subflow }) as MapNode<SubI, SubO>;
}
