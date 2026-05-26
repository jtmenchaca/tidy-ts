// Control-flow and data-flow edge traversal helpers used by the walker.

import type { Topology } from "../../topology/topology.ts";
import { DEFAULT_BRANCH } from "../../topology/nodes/branching.ts";

import type { DispatchableNode } from "./_node-types.ts";

/**
 * Find the outgoing control-flow edge from `fromId` matching `branch`.
 * If `branch` is undefined, return the first (and typically only) outgoing
 * edge. For BranchingNodes, callers pass the chosen branch name; if no
 * matching edge exists, falls back to an edge with `fromBranch === DEFAULT_BRANCH`.
 */
export function controlSuccessorOf(
  topology: Topology,
  fromId: string,
  branch?: string,
): DispatchableNode | undefined {
  const edges = topology.controlFlowConnections.filter(
    (e) => (e.fromNode as { id: string }).id === fromId,
  );
  if (edges.length === 0) return undefined;
  if (branch === undefined) {
    return edges[0].toNode as DispatchableNode;
  }
  const exact = edges.find((e) => e.fromBranch === branch);
  if (exact) return exact.toNode as DispatchableNode;
  const fallback = edges.find((e) => e.fromBranch === DEFAULT_BRANCH);
  return fallback ? (fallback.toNode as DispatchableNode) : undefined;
}

export function incomingDataEdgesOf(
  topology: Topology,
  toId: string,
): Array<{
  sourceId: string;
  sourceOutput: string;
  destinationInput: string;
}> {
  const out: Array<{
    sourceId: string;
    sourceOutput: string;
    destinationInput: string;
  }> = [];
  for (const e of topology.dataFlowConnections ?? []) {
    const dst = e.destinationNode as { id: string };
    if (dst.id === toId) {
      out.push({
        sourceId: (e.sourceNode as { id: string }).id,
        sourceOutput: e.sourceOutput,
        destinationInput: e.destinationInput,
      });
    }
  }
  return out;
}
