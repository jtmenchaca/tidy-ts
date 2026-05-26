/**
 * Types for the graph layout engine and visualization components.
 *
 * Three layers:
 *   1. Layout types — consumed by the layout engine (no visual concerns)
 *   2. Visual types — extend layout types with rendering fields (description sentences + citations; color under layout)
 *   3. Output types — positioned nodes and computed bounds returned by the engine
 *
 * The engine operates on a unified node model: both groups and leaf nodes are
 * "nodes" distinguished by a `kind` discriminator. Containment (which leaf
 * nodes belong to which groups) is expressed as edges with
 * `relationship: "containment"`.
 */

// ═══════════════════════════════════════════════════════════════════════════════
// LAYOUT TYPES — engine input, no visual concerns
// ═══════════════════════════════════════════════════════════════════════════════

// ─── Node types ─────────────────────────────────────────────────────────────

/** Shared fields for all nodes in the layout graph. */
interface LayoutNodeBase {
  id: string;
  label: string;
}

/**
 * A leaf node — a concrete item rendered as a pill in the SVG.
 * Position is computed by the layout engine.
 */
export interface LayoutLeafNode extends LayoutNodeBase {
  kind: "leaf";
  subtitle: string;
  layout: {
    width: number;
  };
}

/**
 * A group node — defines a spatial region that contains leaf nodes.
 * Rendered as a labeled bounding box. Containment is expressed via
 * edges with `relationship: "containment"`, not a `nodeIds` array.
 *
 * Layout fields (`tier`, `column`, etc.) describe grid placement for the grid engine.
 */
export interface LayoutGroupNode extends LayoutNodeBase {
  kind: "group";
  layout: {
    /** Vertical ordering (0 = top). Groups in the same tier sit side-by-side. */
    tier: number;
    /** Horizontal position within a tier (0 = leftmost). */
    column: number;
    /** How many column slots this group occupies (default 1). */
    columnSpan?: number;
    /** Internal spacing between the group boundary and its nodes. */
    padding: number;
    /** Horizontal gap between nodes within the group. */
    nodeSpacing: number;
  };
}

/** Discriminated union of all layout node types. */
export type LayoutNode = LayoutLeafNode | LayoutGroupNode;

// ─── Edge types ─────────────────────────────────────────────────────────────

/**
 * Edge relationship discriminator.
 * - `containment`: group → leaf node membership, or group → group nesting
 * - `association`: semantic connection between leaf nodes (rendered as a path)
 */
export type EdgeRelationship = "containment" | "association";

/** An edge in the layout graph. */
export interface LayoutEdge {
  source: string;
  target: string;
  relationship: EdgeRelationship;
}

// ─── Config ─────────────────────────────────────────────────────────────────

/**
 * Top-level configuration for the layout engine.
 * Canvas dimensions and spacing only — group definitions live in the node array.
 */
export interface LayoutConfig {
  canvasWidth: number;
  canvasHeight: number;
  canvasPadding: number;
  tierSpacing: number;
}

// ═══════════════════════════════════════════════════════════════════════════════
// VISUAL TYPES — extend layout types with rendering fields
// ═══════════════════════════════════════════════════════════════════════════════

// ─── Color ──────────────────────────────────────────────────────────────────

export interface ColorPalette {
  fill: string;
  stroke: string;
  text: string;
  subtitleText: string;
}

// ─── Bibliography (graph-level metadata) ─────────────────────────────────────

/**
 * BibTeX-like fields for a single entry. The map key in `GraphReferences` is the citation key
 * (e.g. `Hernan2025TargetTrialFramework`), analogous to `@article{Key, ...}`.
 */
export interface BiblioEntry {
  type?: string;
  author?: string;
  year?: string | number;
  title?: string;
  journal?: string;
  volume?: string | number;
  number?: string | number;
  pages?: string;
  doi?: string;
  pmid?: string | number;
  pmcid?: string;
  url?: string;
  date?: string;
}

export type GraphReferences = Record<string, BiblioEntry>;

/** One sentence of node copy, each with optional links to `graph.metadata.references` keys. */
export interface DescriptionSentence {
  text: string;
  /** Citation keys; every key must exist in `GraphReferences`. */
  references: string[];
}

// ─── Visual nodes ───────────────────────────────────────────────────────────

/** A leaf node with a color key for palette lookup and a description for tooltips. */
export interface VisualLeafNode extends LayoutLeafNode {
  description: DescriptionSentence[];
  layout: LayoutLeafNode["layout"] & {
    color: string;
  };
}

/** A group node with a description. Optional `layout.color` lets a group declare its own palette key; when omitted, the renderer derives the group's color from its contained leaves. */
export interface VisualGroupNode extends LayoutGroupNode {
  description: DescriptionSentence[];
  layout: LayoutGroupNode["layout"] & {
    color?: string;
  };
}

/** Discriminated union of visual node types. */
export type VisualNode = VisualLeafNode | VisualGroupNode;

// ─── Visual edges ───────────────────────────────────────────────────────────

export interface ContainmentEdge extends LayoutEdge {
  relationship: "containment";
}

export interface AssociationEdge extends LayoutEdge {
  relationship: "association";
  color: string;
  label?: string;
  style: "solid" | "dashed";
}

export type VisualEdge = ContainmentEdge | AssociationEdge;

// ─── Legend ─────────────────────────────────────────────────────────────────

export interface LegendItem {
  color: string;
  label: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// OUTPUT TYPES — returned by the layout engine
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * A positioned leaf node — the raw output of the layout engine.
 * Each logical node appears exactly once, even if it belongs to multiple groups.
 *
 * - `groupIds`: All groups this node belongs to. When a node sits in the overlap
 *   zone of multiple groups, all participating group IDs are listed.
 */
export interface PositionedNode extends LayoutLeafNode {
  x: number;
  y: number;
  groupIds: string[];
}

/** A positioned visual leaf node — layout output with visual fields preserved. */
export interface PositionedVisualNode extends VisualLeafNode {
  x: number;
  y: number;
  groupIds: string[];
}

/** Computed bounding rectangle for a group node, returned by the layout engine. */
export interface ComputedGroupBounds {
  groupId: string;
  x: number;
  y: number;
  width: number;
  height: number;
  /** IDs of child groups nested inside this group. Empty for leaf-level groups. */
  childGroupIds: string[];
}

/**
 * An overlap zone is the rectangular intersection of two groups that share nodes.
 * Shared nodes are positioned inside this zone. The zone is rendered as a
 * visually distinct region (e.g. slightly different fill).
 */
export interface OverlapZone {
  groupIds: [string, string];
  sharedNodeIds: string[];
  x: number;
  y: number;
  width: number;
  height: number;
}

/** Full output of the layout engine. Generic over the node type to preserve domain fields. */
export interface LayoutResult<N extends PositionedNode = PositionedNode> {
  nodes: N[];
  groupBounds: ComputedGroupBounds[];
  overlapZones: OverlapZone[];
}

// ─── Component props ────────────────────────────────────────────────────────

export interface NetworkGraphProps {
  nodes: VisualNode[];
  edges: VisualEdge[];
  colors: Record<string, ColorPalette>;
  /** When set, tooltips may show resolved citation detail alongside description lines. */
  references?: GraphReferences;
  legendItems?: LegendItem[];
  config?: Partial<LayoutConfig>;
  focusOnHover?: boolean;
  legendFooter?: string;
  initialLayoutMode?: "grid" | "force";
}
