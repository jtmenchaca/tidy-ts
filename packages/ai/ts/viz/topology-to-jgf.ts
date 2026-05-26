// Topology → JGF adapter.
//
// Converts a @tidy-ts/ai Topology into a JGF document suitable for
// @tidy-ts/ai-graph's renderSVG / renderHTML. Mapping:
//
//   Topology / nested subflow  → group node
//   Node (Start/End/Llm/...)   → leaf node (subtitle = componentType)
//   "node lives in topology X" → containment edge X → node
//   ControlFlowEdge            → association edge (solid, labeled with `fromBranch` if set)
//   DataFlowEdge               → association edge (dashed, no label)
//
// Subflow-bearing nodes (CatchExceptionNode, FlowNode, MapNode,
// ParallelMapNode, ParallelFlowNode) are rendered as a leaf node AND emit
// containment edges so their nested subflow's nodes are drawn inside a
// labeled group.

import type { Topology } from "../topology/topology.ts";
import type { ControlFlowEdge, DataFlowEdge } from "../topology/edges.ts";

// ─── JGF emit types — kept local so we don't import zod here ────────────

interface JGFNode {
  label: string;
  metadata: Record<string, unknown>;
}
interface JGFEdge {
  source: string;
  target: string;
  relation: "containment" | "association";
  metadata?: Record<string, unknown>;
}
interface JGFDocument {
  graph: {
    id?: string;
    label?: string;
    directed: true;
    metadata?: Record<string, unknown>;
    nodes: Record<string, JGFNode>;
    edges: JGFEdge[];
  };
}

// ─── Color palette: one entry per componentType ─────────────────────────

const COMPONENT_PALETTE: Record<string, { fill: string; stroke: string; text: string; subtitleText: string }> = {
  StartNode:           { fill: "#E6F4EA", stroke: "#34A853", text: "#1E5C2C", subtitleText: "#3A8C4D" },
  EndNode:             { fill: "#FCE8E6", stroke: "#D93025", text: "#7A1F18", subtitleText: "#A8392D" },
  AgentNode:           { fill: "#E8F0FE", stroke: "#1A73E8", text: "#174EA6", subtitleText: "#2C6BD1" },
  SandboxAgentNode:    { fill: "#F3E8FD", stroke: "#9333EA", text: "#5B1A8F", subtitleText: "#7A2EBD" },
  BranchingNode:       { fill: "#FEF7E0", stroke: "#F9AB00", text: "#7C5A00", subtitleText: "#A87E00" },
  CatchExceptionNode:  { fill: "#FFF3E0", stroke: "#F57C00", text: "#7C3F00", subtitleText: "#A86200" },
  FlowNode:            { fill: "#E0F7FA", stroke: "#0097A7", text: "#005662", subtitleText: "#00747F" },
  MapNode:             { fill: "#F1F8E9", stroke: "#689F38", text: "#33691E", subtitleText: "#558B2F" },
  ParallelMapNode:     { fill: "#E8F5E9", stroke: "#43A047", text: "#1B5E20", subtitleText: "#388E3C" },
  ParallelFlowNode:    { fill: "#EDE7F6", stroke: "#5E35B1", text: "#311B92", subtitleText: "#4527A0" },
};

const FALLBACK_PALETTE = { fill: "#F1F3F4", stroke: "#80868B", text: "#3C4043", subtitleText: "#5F6368" };

const CONTROL_EDGE_COLOR = "#3C4043";
const DATA_EDGE_COLOR = "#5F6368";

// ─── Public API ─────────────────────────────────────────────────────────

export interface TopologyToJGFOptions {
  /** Optional title for the outer group label. Defaults to topology.name. */
  title?: string;
}

/** Convert a Topology (including any nested subflows) into a JGF document. */
export function topologyToJGF<I, O>(
  topology: Topology<I, O>,
  { title }: TopologyToJGFOptions = {},
): JGFDocument {
  const ctx: BuildCtx = {
    nodes: {},
    edges: [],
    visitedTopologies: new Set(),
    usedComponentTypes: new Set(),
  };

  walkTopology({ topology, ctx, label: title ?? topology.name, tier: 0, column: 0 });

  const colors: Record<string, typeof FALLBACK_PALETTE> = {};
  for (const t of ctx.usedComponentTypes) {
    colors[t] = COMPONENT_PALETTE[t] ?? FALLBACK_PALETTE;
  }

  const legendItems = [...ctx.usedComponentTypes]
    .sort()
    .map((t) => ({ color: t, label: t }));

  return {
    graph: {
      id: topology.id,
      label: title ?? topology.name,
      directed: true,
      metadata: {
        colors,
        legendItems,
        legendFooter: topology.version
          ? `${topology.id} v${topology.version}`
          : topology.id,
      },
      nodes: ctx.nodes,
      edges: ctx.edges,
    },
  };
}

// ─── Internals ──────────────────────────────────────────────────────────

interface BuildCtx {
  nodes: Record<string, JGFNode>;
  edges: JGFEdge[];
  visitedTopologies: Set<string>;
  usedComponentTypes: Set<string>;
}

interface TopologyNode {
  id: string;
  name: string;
  componentType: string;
  subflow?: unknown;
  subflows?: unknown[];
}

function walkTopology({
  topology,
  ctx,
  label,
  tier,
  column,
}: {
  topology: Topology<unknown, unknown>;
  ctx: BuildCtx;
  label: string;
  tier: number;
  column: number;
}): void {
  if (ctx.visitedTopologies.has(topology.id)) return;
  ctx.visitedTopologies.add(topology.id);

  const topoNodes = (topology.nodes ?? []) as unknown as TopologyNode[];
  const nestedSubflows: Array<Topology<unknown, unknown>> = [];
  for (const node of topoNodes) {
    for (const sub of collectSubflows(node)) {
      if (!nestedSubflows.some((s) => s.id === sub.id)) {
        nestedSubflows.push(sub);
      }
    }
  }
  const hasNestedSubflows = nestedSubflows.length > 0;

  // Group node for the topology itself. The engine treats a group as "parent"
  // (no direct leaf placement, dashed outline) iff it contains other groups.
  // When this topology has nested subflows AND its own leaves, we'd hit a
  // dead end — the topology group becomes parent and its direct leaves get
  // dropped. To avoid that, emit a synthetic "body" child group that owns
  // the topology's own leaves; the topology group then cleanly nests both
  // the body group and the subflow group(s).
  ctx.nodes[topology.id] = {
    label,
    metadata: {
      kind: "group",
      description: [
        {
          text: topology.description ?? `Topology ${topology.name}`,
          references: [],
        },
      ],
      layout: { tier, column, padding: 20, nodeSpacing: 24 },
    },
  };

  const ownLeafContainerId = hasNestedSubflows
    ? `${topology.id}__body`
    : topology.id;

  if (hasNestedSubflows) {
    ctx.nodes[ownLeafContainerId] = {
      label: "",
      metadata: {
        kind: "group",
        description: [{ text: `${topology.name} body`, references: [] }],
        layout: { tier: tier + 1, column, padding: 20, nodeSpacing: 24 },
      },
    };
    // Body group nested inside the topology group
    ctx.edges.push({
      source: topology.id,
      target: ownLeafContainerId,
      relation: "containment",
    });
  }

  for (const node of topoNodes) {
    addLeafNode({ node, ctx });

    // group → leaf containment (into the body group, or directly into the
    // topology group if there are no subflows)
    ctx.edges.push({
      source: ownLeafContainerId,
      target: node.id,
      relation: "containment",
    });

    // Recurse into subflows. Render the nested subflow as a nested group
    // and add a parent→child containment edge so the engine draws the
    // nested group inside its parent.
    for (const sub of collectSubflows(node)) {
      walkTopology({
        topology: sub,
        ctx,
        label: sub.name,
        tier: tier + 2,
        column: column,
      });
      ctx.edges.push({
        source: topology.id,
        target: sub.id,
        relation: "containment",
      });
    }
  }

  // Control-flow edges → association edges (solid, labeled by branch if present)
  const controlEdges = (topology.controlFlowConnections ?? []) as unknown as ControlFlowEdge[];
  for (const e of controlEdges) {
    const from = (e.fromNode as { id: string }).id;
    const to = (e.toNode as { id: string }).id;
    const label = e.fromBranch;
    ctx.edges.push({
      source: from,
      target: to,
      relation: "association",
      metadata: {
        color: CONTROL_EDGE_COLOR,
        style: "solid",
        ...(label !== undefined && { label }),
      },
    });
  }

  // Data-flow edges → association edges (dashed)
  const dataEdges = (topology.dataFlowConnections ?? []) as unknown as DataFlowEdge[];
  for (const e of dataEdges) {
    const from = (e.sourceNode as { id: string }).id;
    const to = (e.destinationNode as { id: string }).id;
    ctx.edges.push({
      source: from,
      target: to,
      relation: "association",
      metadata: {
        color: DATA_EDGE_COLOR,
        style: "dashed",
        label: `${e.sourceOutput}→${e.destinationInput}`,
      },
    });
  }
}

function addLeafNode({ node, ctx }: { node: TopologyNode; ctx: BuildCtx }): void {
  // Topologies can list the same node-equivalent reference twice in
  // edge cases; skip if already present.
  if (ctx.nodes[node.id]) return;
  ctx.usedComponentTypes.add(node.componentType);
  ctx.nodes[node.id] = {
    label: node.name,
    metadata: {
      kind: "leaf",
      subtitle: node.componentType,
      description: [{ text: `${node.componentType}: ${node.name}`, references: [] }],
      layout: { width: 0, color: node.componentType },
    },
  };
}

function collectSubflows(node: TopologyNode): Array<Topology<unknown, unknown>> {
  const out: Array<Topology<unknown, unknown>> = [];
  if (node.subflow && isTopology(node.subflow)) out.push(node.subflow);
  if (Array.isArray(node.subflows)) {
    for (const s of node.subflows) {
      if (isTopology(s)) out.push(s);
    }
  }
  return out;
}

function isTopology(x: unknown): x is Topology<unknown, unknown> {
  return (
    x !== null &&
    typeof x === "object" &&
    "id" in x &&
    "componentType" in x &&
    (x as { componentType: unknown }).componentType === "Topology"
  );
}
