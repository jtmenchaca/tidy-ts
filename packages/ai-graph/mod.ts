/**
 * @tidy-ts/ai-graph — static SVG/HTML renderer for graph topologies.
 *
 * A generalized port of the layout + visualization engine from
 * `@blank/graph-layout`, with React stripped out. Consumes the same
 * VisualNode / VisualEdge model and emits self-contained SVG strings (and
 * an HTML shell with grid/force toggle). Pair with `@tidy-ts/ai`'s
 * `topologyToJGF` to visualize Topologies, or feed any JGF document.
 *
 * @module
 */

// ── Types ───────────────────────────────────────────────────────────────
export type {
  AssociationEdge,
  BiblioEntry,
  ColorPalette,
  ComputedGroupBounds,
  ContainmentEdge,
  DescriptionSentence,
  EdgeRelationship,
  GraphReferences,
  LayoutConfig,
  LayoutEdge,
  LayoutGroupNode,
  LayoutLeafNode,
  LayoutNode,
  LayoutResult,
  LegendItem,
  OverlapZone,
  PositionedNode,
  PositionedVisualNode,
  VisualEdge,
  VisualGroupNode,
  VisualLeafNode,
  VisualNode,
} from "./ts/types.ts";

// ── Layout engines ──────────────────────────────────────────────────────
export { computeLayout } from "./ts/engine.ts";
export { computeForceLayout } from "./ts/force-layout.ts";

// ── Geometry / metrics ──────────────────────────────────────────────────
export {
  computeEdgeLabelPositions,
  computeEdgeMidpoint,
  computeEdgePath,
  computeEdgeTargetAngle,
  LABEL_CHAR_WIDTH,
  LABEL_HEIGHT,
  LABEL_PADDING_X,
  LABEL_PADDING_Y,
} from "./ts/geometry.ts";
export { LEAF_PILL_HEIGHT, leafPillHalfHeight } from "./ts/leaf-node-metrics.ts";

// ── Descriptions ────────────────────────────────────────────────────────
export {
  flattenDescription,
  formatDescriptionWithCitations,
  parseDescriptionSentences,
  searchBlobFromDescription,
  sentence,
  validateDescriptionReferences,
} from "./ts/description.ts";

// ── JGF ─────────────────────────────────────────────────────────────────
export {
  fromJGF,
  type FromJGFResult,
  type JGFDocument,
  JGFDocumentSchema,
  type JGFEdge,
  JGFEdgeSchema,
  type JGFGraph,
  JGFGraphSchema,
  type JGFMultiDocument,
  JGFMultiDocumentSchema,
  type JGFNode,
  JGFNodeSchema,
  parseVisualJGF,
  toJGF,
  type VisualJGFResult,
} from "./ts/jgf.ts";

// ── Renderers ───────────────────────────────────────────────────────────
export { renderSVG, type RenderSvgOptions } from "./ts/render/svg.ts";
export { renderHTML, type RenderHtmlOptions } from "./ts/render/html.ts";
