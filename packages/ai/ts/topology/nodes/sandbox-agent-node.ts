// SandboxAgentNode — executes a SandboxAgent inside a Topology.
//
// Distinct from `AgentNode` because the executor wires sandbox client
// + capabilities + manifest at run time. Authors choose explicitly:
// `createAgentNode` for a plain LLM-with-tools agent, this for a
// workspace-aware agent that can use skills, filesystem, shell, etc.

import { z } from "zod";
import { DEFAULT_NEXT_BRANCH, NodeBaseSchema } from "../component.ts";
import type { Property } from "../property.ts";
import type { SandboxAgent } from "../sandbox/sandbox-agent.ts";

declare const __sanI: unique symbol;
declare const __sanO: unique symbol;

export const SandboxAgentNodeSchema = NodeBaseSchema.extend({
  componentType: z.literal("SandboxAgentNode"),
  agent: z.unknown(),
});

export type SandboxAgentNode<I = unknown, O = unknown> =
  & z.infer<typeof SandboxAgentNodeSchema>
  & {
    readonly [__sanI]?: I;
    readonly [__sanO]?: O;
    agent: SandboxAgent<I, O>;
  };

export function createSandboxAgentNode<I = unknown, O = unknown>({
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
  agent: SandboxAgent<I, O>;
  id?: string;
  description?: string;
  metadata?: Record<string, unknown>;
  inputs?: Property[];
  outputs?: Property[];
  branches?: string[];
}): SandboxAgentNode<I, O> {
  const resolvedInputs = inputs ?? (agent.inputs ?? []);
  const resolvedOutputs = outputs ?? (agent.outputs ?? []);
  const resolvedBranches = branches ?? [DEFAULT_NEXT_BRANCH];

  const parsed = SandboxAgentNodeSchema.parse({
    componentType: "SandboxAgentNode" as const,
    name,
    id,
    description,
    metadata,
    inputs: resolvedInputs,
    outputs: resolvedOutputs,
    branches: resolvedBranches,
    agent,
  });
  return Object.freeze({ ...parsed, agent }) as SandboxAgentNode<I, O>;
}
