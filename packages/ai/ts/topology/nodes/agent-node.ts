// AgentNode — executes an Agent component inside a Topology.
// Source: docs/reference/agent-spec/repo/tsagentspec/src/flows/nodes/agent-node.ts

import { z } from "zod";
import { DEFAULT_NEXT_BRANCH, NodeBaseSchema } from "../component.ts";
import type { Property } from "../property.ts";
import type { Agent } from "../agent.ts";

declare const __anI: unique symbol;
declare const __anO: unique symbol;

export const AgentNodeSchema = NodeBaseSchema.extend({
  componentType: z.literal("AgentNode"),
  // Agent is preserved by reference; its full structure isn't validated here.
  agent: z.unknown(),
});

export type AgentNode<I = unknown, O = unknown> =
  & z.infer<typeof AgentNodeSchema>
  & {
    readonly [__anI]?: I;
    readonly [__anO]?: O;
    agent: Agent<I, O>;
  };

export function createAgentNode<I = unknown, O = unknown>({
  name,
  agent,
  id,
  description,
  metadata,
  inputs,
  outputs,
  branches,
}: {
  name: string;
  agent: Agent<I, O>;
  id?: string;
  description?: string;
  metadata?: Record<string, unknown>;
  inputs?: Property[];
  outputs?: Property[];
  branches?: string[];
}): AgentNode<I, O> {
  // Inherit Property[] declarations from the agent unless overridden.
  const resolvedInputs = inputs ?? (agent.inputs ?? []);
  const resolvedOutputs = outputs ?? (agent.outputs ?? []);
  const resolvedBranches = branches ?? [DEFAULT_NEXT_BRANCH];

  const parsed = AgentNodeSchema.parse({
    name,
    id,
    description,
    metadata,
    inputs: resolvedInputs,
    outputs: resolvedOutputs,
    branches: resolvedBranches,
    componentType: "AgentNode" as const,
    agent,
  });
  return Object.freeze({ ...parsed, agent }) as AgentNode<I, O>;
}
