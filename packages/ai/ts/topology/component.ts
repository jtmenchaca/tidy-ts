// Component bases — mirrors Oracle OAS's ComponentBase / ComponentWithIO.
// All Topology primitives (Nodes, Edges, Agent, Topology itself) extend these.
// Source: docs/reference/agent-spec/repo/tsagentspec/src/component.ts

import { z } from "zod";
import { PropertySchema } from "./property.ts";

export const ComponentBaseSchema = z.object({
  id: z.string().min(1).default(() => crypto.randomUUID()),
  name: z.string(),
  description: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).default({}),
  componentType: z.string(),
});

export type ComponentBase = z.infer<typeof ComponentBaseSchema>;

export const ComponentWithIOSchema = ComponentBaseSchema.extend({
  inputs: z.array(PropertySchema).optional(),
  outputs: z.array(PropertySchema).optional(),
});

export type ComponentWithIO = z.infer<typeof ComponentWithIOSchema>;

export const DEFAULT_NEXT_BRANCH = "next";

export const NodeBaseSchema = ComponentWithIOSchema.extend({
  branches: z.array(z.string()).default([]),
});

export type NodeBase = z.infer<typeof NodeBaseSchema>;
