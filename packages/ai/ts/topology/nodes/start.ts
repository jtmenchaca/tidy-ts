// StartNode — the entry point of a Topology. Exposes the topology's
// declared input shape to downstream nodes via data-flow edges.

import { z } from "zod";
import { DEFAULT_NEXT_BRANCH, NodeBaseSchema } from "../component.ts";
import type { Property } from "../property.ts";
import { zodObjectToProperties } from "../zod-to-properties.ts";

declare const __startI: unique symbol;

export const StartNodeSchema = NodeBaseSchema.extend({
  componentType: z.literal("StartNode"),
});

export type StartNode<I = unknown> = z.infer<typeof StartNodeSchema> & {
  readonly [__startI]?: I;
  inputSchema?: z.ZodType<I>;
};

export function createStartNode<I = unknown>({
  name,
  inputSchema,
  id,
  description,
  metadata,
  inputs,
  outputs,
}: {
  name: string;
  inputSchema?: z.ZodType<I>;
  id?: string;
  description?: string;
  metadata?: Record<string, unknown>;
  inputs?: Property[];
  outputs?: Property[];
}): StartNode<I> {
  // Outputs of a StartNode are the topology's inputs surfaced to downstream
  // nodes via data-flow edges. Derive from inputSchema unless overridden.
  const resolvedOutputs = outputs ??
    (inputSchema ? zodObjectToProperties(inputSchema) : []);

  const parsed = StartNodeSchema.parse({
    name,
    id,
    description,
    metadata,
    inputs: inputs ?? [],
    outputs: resolvedOutputs,
    branches: [DEFAULT_NEXT_BRANCH],
    componentType: "StartNode" as const,
  });
  return Object.freeze({ ...parsed, inputSchema }) as StartNode<I>;
}
