// BranchingNode executor — reads a single declared input value and
// returns the outgoing branch label the walker should follow next.
// Produces no node output; the walker preserves the predecessor's
// outputs for the downstream node.

import type { BranchingNode } from "../../topology/nodes/branching.ts";
import { DEFAULT_BRANCH } from "../../topology/nodes/branching.ts";
import { InputValidationError } from "../errors.ts";

export function executeBranchingNode(
  node: BranchingNode,
  input: Record<string, unknown>,
): string {
  // The branching node has exactly one input: the value used as the
  // mapping key. We read whichever input title was declared on the node.
  const inputTitle = (node.inputs ?? [])[0]?.title;
  if (!inputTitle) {
    throw new InputValidationError({
      message: `BranchingNode '${node.name}' is missing its declared input property.`,
    });
  }
  const raw = input[inputTitle];
  const key = typeof raw === "string" ? raw : String(raw);
  return node.mapping[key] ?? DEFAULT_BRANCH;
}
