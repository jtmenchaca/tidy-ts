// Topology — the OAS "Flow" equivalent: a DAG of typed Nodes connected by
// ControlFlowEdges (what runs next) and DataFlowEdges (which output feeds
// which input). Authored as a constant; consumed by `ai.evaluate`.
//
// Source mirror: docs/reference/agent-spec/repo/tsagentspec/src/flows/flow.ts

import { z } from "zod";
import { ComponentWithIOSchema } from "./component.ts";
import {
  type ControlFlowEdge,
  ControlFlowEdgeSchema,
  type DataFlowEdge,
  DataFlowEdgeSchema,
} from "./edges.ts";
import { NodeRefSchema } from "./node-union.ts";
import { type Property } from "./property.ts";
import type { EndNode } from "./nodes/end.ts";
import type { StartNode } from "./nodes/start.ts";
import { validateTopology } from "./validate.ts";

export const TopologySchema = ComponentWithIOSchema.extend({
  componentType: z.literal("Topology"),
  startNode: NodeRefSchema,
  nodes: z.array(NodeRefSchema),
  controlFlowConnections: z.array(ControlFlowEdgeSchema),
  dataFlowConnections: z.array(DataFlowEdgeSchema).optional(),
  /** Optional semver-like version string. Together with `name` this is the
   * citable identity used by downstream metric runs. */
  version: z.string().optional(),
  /** Optional free-form citation string for the methods section. */
  citation: z.string().optional(),
});

// Phantom brand keys carry input/output types up from StartNode/EndNode so
// `ai.evaluate({ topology, input })` can infer both sides. We use named
// (non-symbol) keys so other files can reach them via `infer` (the file-local
// `unique symbol` form is unreachable from outside this file).
export type Topology<I = unknown, O = unknown> = z.infer<typeof TopologySchema> & {
  readonly __input?: I;
  readonly __output?: O;
};

interface NodeShape {
  id: string;
  name: string;
  componentType: string;
  inputs?: Property[];
  outputs?: Property[];
}

function asNode(n: Record<string, unknown>): NodeShape {
  return {
    id: n.id as string,
    name: n.name as string,
    componentType: n.componentType as string,
    inputs: n.inputs as Property[] | undefined,
    outputs: n.outputs as Property[] | undefined,
  };
}

function getEndNodes(nodes: NodeShape[]): NodeShape[] {
  return nodes.filter((n) => n.componentType === "EndNode");
}

function inferTopologyInputs(startNode: NodeShape): Property[] {
  return startNode.inputs ?? [];
}

function inferTopologyOutputs(nodes: NodeShape[]): Property[] {
  const ends = getEndNodes(nodes);
  if (ends.length === 0) return [];
  const seen: Record<string, Property> = {};
  for (const end of ends) {
    for (const out of end.inputs ?? []) {
      if (out.title in seen) continue;
      const inAll = ends.every((e) => (e.inputs ?? []).some((p) => p.title === out.title));
      if (inAll) seen[out.title] = out;
    }
  }
  return Object.values(seen);
}

function validateTopologyInvariants({
  startNode,
  nodes,
  controlFlowConnections,
  dataFlowConnections,
}: {
  startNode: NodeShape;
  nodes: NodeShape[];
  controlFlowConnections: ControlFlowEdge[];
  dataFlowConnections?: DataFlowEdge[];
}): void {
  const starts = nodes.filter((n) => n.componentType === "StartNode");
  if (starts.length !== 1) {
    throw new Error(
      `A Topology must contain exactly one StartNode, found ${starts.length}.`,
    );
  }
  if (starts[0].id !== startNode.id) {
    throw new Error(
      `startNode mismatch: opts.startNode is '${startNode.name}' but the StartNode in nodes is '${starts[0].name}'.`,
    );
  }

  const startOutgoing = controlFlowConnections.filter(
    (e) => (e.fromNode as { id: string }).id === startNode.id,
  );
  if (startOutgoing.length !== 1) {
    throw new Error(
      `StartNode must have exactly one outgoing control-flow edge, found ${startOutgoing.length}.`,
    );
  }
  const startIncoming = controlFlowConnections.filter(
    (e) => (e.toNode as { componentType: string }).componentType === "StartNode",
  );
  if (startIncoming.length > 0) {
    throw new Error(
      `Control-flow edges into StartNode are not allowed: ${startIncoming.map((e) => e.name).join(", ")}`,
    );
  }

  const ends = getEndNodes(nodes);
  if (ends.length === 0) {
    throw new Error("A Topology must contain at least one EndNode.");
  }
  for (const end of ends) {
    const incoming = controlFlowConnections.filter(
      (e) => (e.toNode as { id: string }).id === end.id,
    );
    if (incoming.length === 0) {
      throw new Error(
        `EndNode '${end.name}' has no incoming control-flow edge.`,
      );
    }
  }
  const endOutgoing = controlFlowConnections.filter(
    (e) => (e.fromNode as { componentType: string }).componentType === "EndNode",
  );
  if (endOutgoing.length > 0) {
    throw new Error(
      `Control-flow edges out of EndNode are not allowed: ${endOutgoing.map((e) => e.name).join(", ")}`,
    );
  }

  const nodeIds = new Set(nodes.map((n) => n.id));
  function assertInFlow(node: { id: string; name: string }, kind: string, role: string): void {
    if (!nodeIds.has(node.id)) {
      throw new Error(`${kind} references ${role} '${node.name}' which is not in the topology's node list.`);
    }
  }
  for (const e of controlFlowConnections) {
    assertInFlow(e.fromNode as { id: string; name: string }, "Control-flow edge", "source node");
    assertInFlow(e.toNode as { id: string; name: string }, "Control-flow edge", "destination node");
  }
  for (const e of dataFlowConnections ?? []) {
    assertInFlow(e.sourceNode as { id: string; name: string }, "Data-flow edge", "source node");
    assertInFlow(e.destinationNode as { id: string; name: string }, "Data-flow edge", "destination node");
  }
}

export function createTopology<I = unknown, O = unknown>({
  id,
  name,
  startNode,
  endNode: _endNode,
  nodes,
  controlFlowConnections,
  dataFlowConnections,
  description,
  metadata,
  inputs,
  outputs,
  version,
  citation,
  validate = "throw",
}: {
  /**
   * Stable, citable identifier for this Topology. Required so a downstream
   * metric run / paper / notebook can refer to the topology by name (e.g.,
   * `"EXTRACT_SYMPTOM_SEVERITY"`). Use SCREAMING_SNAKE_CASE by convention.
   * Nodes' `id` fields auto-generate UUIDs — only the Topology itself needs
   * an author-set identifier.
   */
  id: string;
  name: string;
  startNode: StartNode<I>;
  /**
   * Optional: pass the EndNode that determines the topology's output type.
   * Only used for type inference; runtime relies on `nodes` containing it.
   */
  endNode?: EndNode<O>;
  nodes: Record<string, unknown>[];
  controlFlowConnections: ControlFlowEdge[];
  dataFlowConnections?: DataFlowEdge[];
  description?: string;
  metadata?: Record<string, unknown>;
  inputs?: Property[];
  outputs?: Property[];
  /** Optional semver-like version. With `id`, forms the citable identity. */
  version?: string;
  /** Optional free-form citation string for methods sections. */
  citation?: string;
  /**
   * How to handle structural issues surfaced by `validateTopology` at
   * authoring time. Default `"throw"` — any error-severity issue raises at
   * construction so the topology can't reach `ai.evaluate` in a broken
   * state. `"warn"` logs error-severity issues to `console.error` and
   * continues; `false` skips validation entirely (use only for tests that
   * deliberately construct invalid topologies).
   */
  validate?: "throw" | "warn" | false;
}): Topology<I, O> {
  const startShape = asNode(startNode);
  const nodeShapes = nodes.map(asNode);
  validateTopologyInvariants({
    startNode: startShape,
    nodes: nodeShapes,
    controlFlowConnections,
    dataFlowConnections,
  });
  const resolvedInputs = inputs ?? inferTopologyInputs(startShape);
  const resolvedOutputs = outputs ?? inferTopologyOutputs(nodeShapes);
  const topology = Object.freeze(
    TopologySchema.parse({
      name,
      startNode,
      nodes,
      controlFlowConnections,
      dataFlowConnections,
      id,
      description,
      metadata,
      inputs: resolvedInputs,
      outputs: resolvedOutputs,
      version,
      citation,
      componentType: "Topology" as const,
    }),
  ) as Topology<I, O>;

  if (validate !== false) {
    const issues = validateTopology(topology);
    const errors = issues.filter((i) => i.severity === "error");
    if (errors.length > 0) {
      const lines = errors
        .map((i) => `  - [${i.code}] ${i.message}`)
        .join("\n");
      const summary =
        `Topology '${id}' failed validation with ${errors.length} error-severity issue${errors.length === 1 ? "" : "s"}:\n${lines}`;
      if (validate === "throw") {
        throw new Error(summary);
      }
      console.error(summary);
    }
  }

  return topology;
}
