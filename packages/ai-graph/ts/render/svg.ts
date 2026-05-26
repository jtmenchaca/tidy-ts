// Static SVG renderer — string-builder translation of NetworkGraph.tsx.
//
// Same drawing primitives (groups, leaves, edges, arrows, legend) and same
// look-and-feel. No React, no DOM, no hover/toggle. The output is a single
// self-contained <svg> element that can be:
//   - written to disk as `.svg`
//   - embedded in HTML / papers / READMEs
//   - converted to PNG by any SVG→PNG tool (rsvg-convert, sharp, etc.)

import { computeLayout } from "../engine.ts";
import { computeForceLayout } from "../force-layout.ts";
import { computeEdgeLabelPositions, computeEdgeTargetAngle, LABEL_CHAR_WIDTH, LABEL_PADDING_X, LABEL_PADDING_Y } from "../geometry.ts";
import { LEAF_PILL_HEIGHT, leafPillHalfHeight } from "../leaf-node-metrics.ts";
import type {
  AssociationEdge,
  ColorPalette,
  ComputedGroupBounds,
  LayoutConfig,
  LegendItem,
  PositionedVisualNode,
  VisualEdge,
  VisualGroupNode,
  VisualLeafNode,
  VisualNode,
} from "../types.ts";

const DEFAULT_CONFIG: LayoutConfig = {
  canvasWidth: 1400,
  canvasHeight: 1150,
  canvasPadding: 40,
  tierSpacing: 50,
};

const NEUTRAL_GROUP_FILL = "#F1EFEA";
const NEUTRAL_GROUP_STROKE = "#D8D6CE";
const ARROW_SIZE = 5;

export interface RenderSvgOptions {
  nodes: VisualNode[];
  edges: VisualEdge[];
  colors: Record<string, ColorPalette>;
  legendItems?: LegendItem[];
  legendFooter?: string;
  config?: Partial<LayoutConfig>;
  /** Which layout engine to use. Defaults to "grid". */
  layoutMode?: "grid" | "force";
}

/** Render a graph as a complete, self-contained `<svg>...</svg>` string. */
export function renderSVG({
  nodes,
  edges,
  colors,
  legendItems,
  legendFooter,
  config: configOverrides,
  layoutMode = "grid",
}: RenderSvgOptions): string {
  const config: LayoutConfig = { ...DEFAULT_CONFIG, ...configOverrides };

  const layoutResult = layoutMode === "force"
    ? computeForceLayout<VisualLeafNode>({ nodes, edges })
    : computeLayout<VisualLeafNode>({ nodes, edges, config });

  const positionedNodes = layoutResult.nodes as PositionedVisualNode[];
  const groupBounds = layoutResult.groupBounds;

  const groupLabels: Record<string, string> = {};
  const groupNodesById = new Map<string, VisualGroupNode>();
  for (const n of nodes) {
    if (n.kind === "group") {
      groupLabels[n.id] = n.label;
      groupNodesById.set(n.id, n);
    }
  }

  const nodeMap = new Map<string, PositionedVisualNode>();
  for (const n of positionedNodes) {
    if (!nodeMap.has(n.id)) nodeMap.set(n.id, n);
  }

  const associationEdges = edges.filter(
    (e): e is AssociationEdge => e.relationship === "association",
  );

  const labelPositions = computeEdgeLabelPositions({
    edges: associationEdges,
    nodeMap,
    allNodes: positionedNodes,
  });

  // ── viewBox sizing — match NetworkGraph.tsx semantics ────────────────
  let maxX = 0;
  let maxY = 0;
  for (const n of positionedNodes) {
    maxX = Math.max(maxX, n.x + n.layout.width / 2);
    maxY = Math.max(maxY, n.y + leafPillHalfHeight({ subtitle: n.subtitle }));
  }
  for (const gb of groupBounds) {
    maxX = Math.max(maxX, gb.x + gb.width);
    maxY = Math.max(maxY, gb.y + gb.height);
  }
  const pad = config.canvasPadding;
  const legendTop = Math.ceil(maxY + pad);
  const legendHeight = legendItems ? 90 : 0;
  const vbWidth = Math.ceil(maxX + pad);
  const vbHeight = legendTop + legendHeight;

  // Largest first so smaller groups draw on top (matches React renderer)
  const sortedGroupBounds = [...groupBounds].sort(
    (a, b) => b.width * b.height - a.width * a.height,
  );

  const parts: string[] = [];
  parts.push(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${vbWidth} ${vbHeight}" width="${vbWidth}" height="${vbHeight}" font-family="-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">`,
  );

  // Groups
  parts.push("<g>");
  for (const gb of sortedGroupBounds) {
    parts.push(renderGroup({ gb, label: groupLabels[gb.groupId], groupNode: groupNodesById.get(gb.groupId), positionedNodes, colors }));
  }
  parts.push("</g>");

  // Edges
  parts.push("<g>");
  associationEdges.forEach((edge, i) => {
    const source = nodeMap.get(edge.source);
    const target = nodeMap.get(edge.target);
    if (!source || !target) return;
    parts.push(renderEdge({ edge, source, target, labelPosition: labelPositions.get(i) }));
  });
  parts.push("</g>");

  // Nodes
  parts.push("<g>");
  for (const node of positionedNodes) {
    parts.push(renderNode({ node, palette: paletteForLeaf({ colors, colorKey: node.layout.color }) }));
  }
  parts.push("</g>");

  if (legendItems) {
    parts.push(renderLegend({ topY: legendTop, items: legendItems, colors, footer: legendFooter }));
  }

  parts.push("</svg>");
  return parts.join("");
}

// ─── Group rendering ─────────────────────────────────────────────────────────

function renderGroup({
  gb,
  label,
  groupNode,
  positionedNodes,
  colors,
}: {
  gb: ComputedGroupBounds;
  label: string | undefined;
  groupNode: VisualGroupNode | undefined;
  positionedNodes: PositionedVisualNode[];
  colors: Record<string, ColorPalette>;
}): string {
  const isParent = gb.childGroupIds.length > 0;
  const colorKey = resolveGroupColorKey({ groupId: gb.groupId, groupNode, positionedNodes });
  const groupPalette = colorKey ? colors[colorKey] : undefined;

  const fill = isParent
    ? "none"
    : groupPalette
      ? washHexWithWhite({ hex: groupPalette.fill, weight: 0.55 })
      : NEUTRAL_GROUP_FILL;
  const stroke = isParent
    ? "#C0BDB5"
    : groupPalette
      ? washHexWithWhite({ hex: groupPalette.stroke, weight: 0.45 })
      : NEUTRAL_GROUP_STROKE;

  const rx = isParent ? 12 : 8;
  const strokeWidth = isParent ? 1 : 0.75;
  const dashAttr = isParent ? ` stroke-dasharray="6 3"` : "";

  let out = `<g><rect x="${gb.x + 2}" y="${gb.y + 2}" width="${gb.width - 4}" height="${gb.height - 4}" rx="${rx}" fill="${fill}" stroke="${stroke}" stroke-width="${strokeWidth}"${dashAttr} />`;

  if (label) {
    if (isParent) {
      out += `<text x="${gb.x + 10}" y="${gb.y + 14}" font-size="10" font-weight="700" fill="#999" letter-spacing="0.5px">${escapeXml(label)}</text>`;
    } else {
      const badgeWidth = label.length * 5.2 + 10;
      out += `<rect x="${gb.x + 6}" y="${gb.y + 5}" width="${badgeWidth}" height="14" rx="3" fill="white" opacity="0.95" />`;
      out += `<text x="${gb.x + 11}" y="${gb.y + 14}" font-size="8" font-weight="600" fill="#555550">${escapeXml(label)}</text>`;
    }
  }
  out += "</g>";
  return out;
}

function resolveGroupColorKey({
  groupId,
  groupNode,
  positionedNodes,
}: {
  groupId: string;
  groupNode: VisualGroupNode | undefined;
  positionedNodes: PositionedVisualNode[];
}): string | null {
  if (groupNode?.layout.color) return groupNode.layout.color;

  const counts = new Map<string, number>();
  for (const n of positionedNodes) {
    if (!n.groupIds.includes(groupId)) continue;
    counts.set(n.layout.color, (counts.get(n.layout.color) ?? 0) + 1);
  }
  if (counts.size === 0) return null;

  let bestKey: string | null = null;
  let bestCount = -1;
  for (const [key, count] of counts) {
    if (count > bestCount) {
      bestKey = key;
      bestCount = count;
    }
  }
  return bestKey;
}

function washHexWithWhite({ hex, weight }: { hex: string; weight: number }): string {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex);
  if (!m) return hex;
  const n = parseInt(m[1], 16);
  const r = (n >> 16) & 0xff;
  const g = (n >> 8) & 0xff;
  const b = n & 0xff;
  const mix = (c: number) => Math.round(c * weight + 255 * (1 - weight));
  const hex2 = (c: number) => c.toString(16).padStart(2, "0");
  return `#${hex2(mix(r))}${hex2(mix(g))}${hex2(mix(b))}`;
}

// ─── Node rendering ──────────────────────────────────────────────────────────

function renderNode({ node, palette }: { node: PositionedVisualNode; palette: ColorPalette }): string {
  const hw = node.layout.width / 2;
  const h = node.subtitle ? LEAF_PILL_HEIGHT.withSubtitle : LEAF_PILL_HEIGHT.noSubtitle;

  let out = `<g><rect x="${node.x - hw}" y="${node.y - h / 2}" width="${node.layout.width}" height="${h}" rx="5" fill="${palette.fill}" stroke="${palette.stroke}" stroke-width="0.5" />`;
  out += `<text x="${node.x}" y="${node.subtitle ? node.y - 4 : node.y}" text-anchor="middle" dominant-baseline="central" font-size="11" font-weight="500" fill="${palette.text}">${escapeXml(node.label)}</text>`;
  if (node.subtitle) {
    out += `<text x="${node.x}" y="${node.y + 7}" text-anchor="middle" dominant-baseline="central" font-size="9" fill="${palette.subtitleText}">${escapeXml(node.subtitle)}</text>`;
  }
  out += "</g>";
  return out;
}

function paletteForLeaf({ colors, colorKey }: { colors: Record<string, ColorPalette>; colorKey: string }): ColorPalette {
  const direct = colors[colorKey];
  if (direct) return direct;
  for (const p of Object.values(colors)) {
    if (p) return p;
  }
  return { fill: "#f5f5f5", stroke: "#c5c5c5", text: "#333333", subtitleText: "#666666" };
}

// ─── Edge rendering ──────────────────────────────────────────────────────────

function renderEdge({
  edge,
  source,
  target,
  labelPosition,
}: {
  edge: AssociationEdge;
  source: PositionedVisualNode;
  target: PositionedVisualNode;
  labelPosition: { x: number; y: number } | undefined;
}): string {
  const t = computeEdgeTargetAngle({ source, target, hasLabel: !!edge.label, arrowSize: ARROW_SIZE });
  const pathOpacity = edge.style === "dashed" ? 0.25 : 0.55;
  const dashAttr = edge.style === "dashed" ? ` stroke-dasharray="4 3"` : "";
  const strokeWidth = edge.style === "dashed" ? 0.7 : 1;

  let out = `<g>`;
  out += `<path d="${t.truncatedPath}" fill="none" stroke="${edge.color}" stroke-width="${strokeWidth}" opacity="${pathOpacity}"${dashAttr} />`;
  out += `<polygon points="${-ARROW_SIZE},${-ARROW_SIZE / 2} 0,0 ${-ARROW_SIZE},${ARROW_SIZE / 2}" fill="${edge.color}" opacity="0.7" transform="translate(${t.x},${t.y}) rotate(${t.angle})" />`;

  if (labelPosition && edge.label) {
    const labelWidth = edge.label.length * LABEL_CHAR_WIDTH + LABEL_PADDING_X * 2;
    out += `<rect x="${labelPosition.x - labelWidth / 2}" y="${labelPosition.y - 6 - LABEL_PADDING_Y}" width="${labelWidth}" height="${10 + LABEL_PADDING_Y * 2}" rx="3" fill="white" opacity="0.85" />`;
    out += `<text x="${labelPosition.x}" y="${labelPosition.y - 1}" text-anchor="middle" dominant-baseline="central" font-size="8" fill="#888780">${escapeXml(edge.label)}</text>`;
  }
  out += `</g>`;
  return out;
}

// ─── Legend rendering ────────────────────────────────────────────────────────

function renderLegend({
  topY,
  items,
  colors,
  footer,
}: {
  topY: number;
  items: LegendItem[];
  colors: Record<string, ColorPalette>;
  footer?: string;
}): string {
  const cols = 3;
  let out = `<g>`;
  items.forEach((item, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const x = 40 + col * 420;
    const y = topY + row * 18;
    const palette = colors[item.color];
    if (!palette) return;
    out += `<g><rect x="${x}" y="${y - 5}" width="10" height="10" rx="2" fill="${palette.fill}" stroke="${palette.stroke}" stroke-width="0.5" />`;
    out += `<text x="${x + 15}" y="${y + 1}" dominant-baseline="central" font-size="10" fill="#5F5E5A">${escapeXml(item.label)}</text></g>`;
  });
  if (footer) {
    out += `<text x="40" y="${topY + 65}" dominant-baseline="central" font-size="10" fill="#888780">${escapeXml(footer)}</text>`;
  }
  out += `</g>`;
  return out;
}

// ─── Utilities ───────────────────────────────────────────────────────────────

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
