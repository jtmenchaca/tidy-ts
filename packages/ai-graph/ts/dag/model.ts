// DAG model — the in-memory shape consumed by layout + rendering.
//
// A topology is flattened into:
//   - Containers: the topology itself and every subflow-bearing node
//     (CatchExceptionNode, FlowNode, MapNode, ParallelMapNode,
//     ParallelFlowNode). Containers nest; each has a label and a parent.
//   - Leaves: every Start/End/Llm/Agent/Branching node. Subflow-bearing
//     nodes ALSO appear as a leaf inside their parent container — that
//     leaf is the "wrapping shape" shown in the diagram, and its `id`
//     matches the container's `id`. The renderer can detect this via
//     `node.containerId !== undefined`.
//
// Edges carry the source/target node id and a `kind` discriminator so the
// renderer styles control vs data flow differently.

export type NodeShape =
  | "stadium-start"   // StartNode — pill with ▶ glyph
  | "stadium-end"     // EndNode — pill with ■ glyph
  | "rect"            // LlmNode, AgentNode, FlowNode, MapNode, etc.
  | "diamond"         // BranchingNode
  | "hexagon";        // CatchExceptionNode (also acts as container)

export interface DagLeaf {
  id: string;
  label: string;
  /** Short type-label rendered under the main label (e.g. "LlmNode"). */
  sublabel: string;
  shape: NodeShape;
  /** Container id this leaf belongs to (topology id or wrapping-node id). */
  parentContainerId: string;
  /**
   * If this leaf IS also a container (CatchExceptionNode / FlowNode etc.),
   * the container's id matches this leaf's id. The renderer treats it
   * specially: the wrapping shape encloses the container area visually.
   */
  containerId?: string;
}

export interface DagContainer {
  id: string;
  label: string;
  /** Parent container id; null only for the root topology. */
  parentContainerId: string | null;
  /** Container kind drives styling (dashed border for catch, etc.). */
  kind: "topology" | "catch-exception" | "flow" | "map" | "parallel-map" | "parallel-flow";
  /** When true, the wrapping leaf (same id) draws a labeled chrome around the container. */
  wrappedByLeaf: boolean;
}

export type DagEdgeKind = "control" | "data";

export interface DagEdge {
  id: string;
  source: string;
  target: string;
  kind: DagEdgeKind;
  /** Control: branch name (e.g. "urgent"). Data: "sourceOutput→destInput". */
  label?: string;
}

export interface DagModel {
  rootContainerId: string;
  containers: DagContainer[];
  leaves: DagLeaf[];
  edges: DagEdge[];
}
