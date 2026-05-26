// BranchingNode — routes control flow based on the value of a string input.
//
// The runner reads the node's single input field and looks up the value in
// `mapping`. The resulting branch name is matched against outgoing
// ControlFlowEdge.fromBranch. If no match, falls back to the "default"
// branch.
//
// Source: docs/reference/agent-spec/repo/tsagentspec/src/flows/nodes/branching-node.ts

import { z } from "zod";
import { NodeBaseSchema } from "../component.ts";
import type { Property } from "../property.ts";

export const DEFAULT_BRANCH = "default";
export const BRANCHING_MAPPING_KEY = "branching_mapping_key";

export const BranchingNodeSchema = NodeBaseSchema.extend({
  componentType: z.literal("BranchingNode"),
  mapping: z.record(z.string(), z.string()),
});

export type BranchingNode = z.infer<typeof BranchingNodeSchema>;

export function createBranchingNode({
  name,
  mapping,
  inputs,
  id,
  description,
  metadata,
}: {
  name: string;
  /** Map of input value → branch name. */
  mapping: Record<string, string>;
  inputs?: Property[];
  id?: string;
  description?: string;
  metadata?: Record<string, unknown>;
}): BranchingNode {
  const mappingValues = new Set(Object.values(mapping));
  const branches = [
    ...new Set([DEFAULT_BRANCH, ...mappingValues]),
  ].sort();

  const inputTitle = inputs && inputs.length > 0
    ? inputs[0].title
    : BRANCHING_MAPPING_KEY;

  const resolvedInputs: Property[] = inputs ?? [
    {
      jsonSchema: {
        title: inputTitle,
        type: "string",
        description: "Value used to select the next branch.",
      },
      title: inputTitle,
      description: "Value used to select the next branch.",
      type: "string",
    },
  ];

  return Object.freeze(
    BranchingNodeSchema.parse({
      name,
      mapping,
      inputs: resolvedInputs,
      outputs: [],
      branches,
      id,
      description,
      metadata,
      componentType: "BranchingNode" as const,
    }),
  );
}
