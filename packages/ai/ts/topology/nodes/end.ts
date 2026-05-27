// EndNode — the exit point of a Topology. Receives the topology's declared
// output via incoming data-flow edges. Every input the EndNode declares
// (derived from its outputSchema) must be wired with an explicit
// dataFlowEdge — there is no implicit pass-through from the prior node.

import { z } from "zod";
import { DEFAULT_NEXT_BRANCH, NodeBaseSchema } from "../component.ts";
import type { Property } from "../property.ts";
import { zodObjectToProperties } from "../zod-to-properties.ts";

declare const __endO: unique symbol;

export const EndNodeSchema = NodeBaseSchema.extend({
  componentType: z.literal("EndNode"),
  branchName: z.string().default(DEFAULT_NEXT_BRANCH),
});

export type EndNode<O = unknown> = z.infer<typeof EndNodeSchema> & {
  readonly [__endO]?: O;
  outputSchema?: z.ZodType<O>;
};

export function createEndNode<O = unknown>({
  name,
  outputSchema,
  id,
  description,
  metadata,
  branchName,
  inputs,
  outputs,
}: {
  name: string;
  outputSchema?: z.ZodType<O>;
  id?: string;
  description?: string;
  metadata?: Record<string, unknown>;
  branchName?: string;
  inputs?: Property[];
  outputs?: Property[];
}): EndNode<O> {
  // EndNode inputs receive the topology's final outputs. Derive from
  // outputSchema unless explicitly overridden.
  const resolvedInputs = inputs ??
    (outputSchema ? zodObjectToProperties(outputSchema) : []);

  const parsed = EndNodeSchema.parse({
    name,
    id,
    description,
    metadata,
    branchName,
    inputs: resolvedInputs,
    outputs: outputs ?? [],
    branches: [],
    componentType: "EndNode" as const,
  });
  return Object.freeze({ ...parsed, outputSchema }) as EndNode<O>;
}
