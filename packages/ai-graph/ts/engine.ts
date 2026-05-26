import type {
  LayoutLeafNode,
  LayoutGroupNode,
  LayoutNode,
  LayoutEdge,
  LayoutConfig,
  LayoutResult,
  PositionedNode,
  ComputedGroupBounds,
  OverlapZone,
} from "./types.ts";

/** Height used for bounding box calculations */
const NODE_HEIGHT = 24;

/**
 * Vertical space reserved at the top of each group for the label badge.
 * Matches the rendering in NetworkGraph: y offset (5) + rect height (14) + gap (3).
 */
const GROUP_LABEL_HEIGHT = 22;

// ─── Internal types ──────────────────────────────────────────────────────────

/** Derived group info — reconstructed from group nodes + containment edges. */
interface DerivedGroup {
  id: string;
  label: string;
  tier: number;
  column: number;
  columnSpan: number;
  padding: number;
  nodeSpacing: number;
  nodeIds: string[];
}

interface TierSlot {
  tier: number;
  groups: DerivedGroup[];
}

interface GroupBounds {
  groupId: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

// ─── Derive groups from nodes + edges ────────────────────────────────────────

/**
 * Extract group definitions from the unified node+edge model.
 * Group nodes carry tier/column/padding; containment edges define membership.
 */
/**
 * Identifies which groups are "parent" groups (contain other groups via
 * containment edges) and returns the parent→child mapping.
 */
function findParentGroups({
  nodes,
  edges,
}: {
  nodes: LayoutNode[];
  edges: LayoutEdge[];
}): Map<string, string[]> {
  const groupIdSet = new Set(
    nodes.filter((n) => n.kind === "group").map((n) => n.id)
  );
  const parentChildren = new Map<string, string[]>();
  for (const edge of edges) {
    if (edge.relationship === "containment" && groupIdSet.has(edge.target)) {
      const children = parentChildren.get(edge.source) ?? [];
      children.push(edge.target);
      parentChildren.set(edge.source, children);
    }
  }
  return parentChildren;
}

function deriveGroups({
  nodes,
  edges,
}: {
  nodes: LayoutNode[];
  edges: LayoutEdge[];
}): DerivedGroup[] {
  const parentGroups = findParentGroups({ nodes, edges });
  const groupNodes = nodes.filter(
    (n): n is LayoutGroupNode => n.kind === "group" && !parentGroups.has(n.id)
  );

  const leafIdSet = new Set(
    nodes.filter((n) => n.kind === "leaf").map((n) => n.id)
  );

  // Build nodeIds for each group from containment edges (only group→leaf)
  const groupNodeIds = new Map<string, string[]>();
  for (const edge of edges) {
    if (edge.relationship === "containment" && leafIdSet.has(edge.target)) {
      const list = groupNodeIds.get(edge.source) ?? [];
      list.push(edge.target);
      groupNodeIds.set(edge.source, list);
    }
  }

  return groupNodes.map((g) => ({
    id: g.id,
    label: g.label,
    tier: g.layout.tier,
    column: g.layout.column,
    columnSpan: g.layout.columnSpan ?? 1,
    padding: g.layout.padding,
    nodeSpacing: g.layout.nodeSpacing,
    nodeIds: groupNodeIds.get(g.id) ?? [],
  }));
}

// ─── Group relationship analysis ─────────────────────────────────────────────

/**
 * Build a map from each nodeId to all groupIds that contain it.
 */
function buildNodeGroupMembership({
  groups,
}: {
  groups: DerivedGroup[];
}): Map<string, string[]> {
  const membership = new Map<string, string[]>();
  for (const group of groups) {
    for (const nodeId of group.nodeIds) {
      const list = membership.get(nodeId) ?? [];
      list.push(group.id);
      membership.set(nodeId, list);
    }
  }
  return membership;
}

/**
 * Find all pairs of groups that share at least one node.
 */
function findOverlapPairs({
  groups,
}: {
  groups: DerivedGroup[];
}): Array<{
  groupA: string;
  groupB: string;
  sharedNodeIds: string[];
}> {
  const pairs: Array<{
    groupA: string;
    groupB: string;
    sharedNodeIds: string[];
  }> = [];
  for (let i = 0; i < groups.length; i++) {
    const setA = new Set(groups[i].nodeIds);
    for (let j = i + 1; j < groups.length; j++) {
      const shared = groups[j].nodeIds.filter((id) => setA.has(id));
      if (shared.length > 0) {
        pairs.push({
          groupA: groups[i].id,
          groupB: groups[j].id,
          sharedNodeIds: shared,
        });
      }
    }
  }
  return pairs;
}

// ─── Main entry point ────────────────────────────────────────────────────────

/**
 * Computes positioned nodes from unpositioned definitions + layout config + edges.
 *
 * Algorithm:
 *   1. Derive group definitions from group nodes + containment edges
 *   2. Auto-size node widths
 *   3. Analyze group relationships (detect shared nodes)
 *   4. Compute column grid + group bounds from tier/column config
 *   5. For overlapping same-tier groups, extend bounds to create Venn overlap
 *   6. Place all nodes within their groups (shared nodes placed once)
 *   7. Compute overlap zones from bounds intersection
 */
export function computeLayout<N extends LayoutLeafNode = LayoutLeafNode>({
  nodes,
  edges,
  config,
}: {
  nodes: (N | LayoutGroupNode)[];
  edges: LayoutEdge[];
  config: LayoutConfig;
}): LayoutResult<N & { x: number; y: number; groupIds: string[] }> {
  // ── Step 0: Derive groups + extract leaf nodes ──────────────────────
  const groups = deriveGroups({ nodes: nodes as LayoutNode[], edges });
  const leafNodes: N[] = [];
  for (const n of nodes) {
    if (n.kind === "leaf") {
      leafNodes.push(n as N);
    }
  }

  // ── Step 1: Auto-size node widths ──────────────────────────────────
  const sizedNodes = leafNodes.map((n) => ({
    ...n,
    layout: { ...n.layout, width: computeNodeWidth(n) },
  }));

  const nodeMap = new Map(sizedNodes.map((n) => [n.id, n]));

  // ── Step 2: Analyze group relationships ────────────────────────────
  const nodeGroupMembership = buildNodeGroupMembership({ groups });
  const overlapPairs = findOverlapPairs({ groups });

  // Build a lookup for groups
  const groupById = new Map(groups.map((g) => [g.id, g]));

  // ── Step 3: Collect tiers + compute column grid ────────────────────
  const tierMap = new Map<number, DerivedGroup[]>();
  for (const group of groups) {
    const list = tierMap.get(group.tier) ?? [];
    list.push(group);
    tierMap.set(group.tier, list);
  }
  const tiers: TierSlot[] = [...tierMap.entries()]
    .sort(([a], [b]) => a - b)
    .map(([tier, tierGroups]) => ({ tier, groups: tierGroups }));

  const maxColumn = Math.max(
    ...groups.map((g) => g.column + g.columnSpan)
  );
  const usableWidth = config.canvasWidth - config.canvasPadding * 2;
  const colWidth = usableWidth / maxColumn;

  // ── Step 4: Compute group bounds from tier/column grid ─────────────
  const groupBoundsMap = new Map<string, GroupBounds>();
  let currentY = config.canvasPadding;

  for (const tierSlot of tiers) {
    let maxTierHeight = 0;
    const tierGroupBounds: GroupBounds[] = [];

    for (const group of tierSlot.groups) {
      const gx = config.canvasPadding + group.column * colWidth;
      const gw = group.columnSpan * colWidth;

      const groupNodes = group.nodeIds
        .map((id) => nodeMap.get(id))
        .filter(<T>(n: T | undefined): n is T => n != null);

      const requiredHeight = estimateGroupHeight({
        nodes: groupNodes,
        availableWidth: gw - group.padding * 2,
        nodeSpacing: group.nodeSpacing,
        padding: group.padding,
      });

      const bounds: GroupBounds = {
        groupId: group.id,
        x: gx,
        y: currentY,
        width: gw,
        height: requiredHeight,
      };

      tierGroupBounds.push(bounds);
      maxTierHeight = Math.max(maxTierHeight, requiredHeight);
    }

    // Normalize all groups in this tier to the same height
    for (const bounds of tierGroupBounds) {
      bounds.height = maxTierHeight;
      groupBoundsMap.set(bounds.groupId, bounds);
    }

    currentY += maxTierHeight + config.tierSpacing;
  }

  // ── Step 5: Extend same-tier groups to create Venn overlap ─────────
  // For same-tier overlap pairs, extend adjacent groups toward each other.
  // The overlap zone must be wide enough to contain the widest shared node
  // plus padding on both sides.
  const OVERLAP_PADDING = 16; // px padding around nodes inside overlap zone

  for (const pair of overlapPairs) {
    const gA = groupById.get(pair.groupA);
    const gB = groupById.get(pair.groupB);
    if (!gA || !gB) continue;

    const boundsA = groupBoundsMap.get(pair.groupA);
    const boundsB = groupBoundsMap.get(pair.groupB);
    if (!boundsA || !boundsB) continue;

    // Find the widest shared node to determine required overlap zone width
    const maxSharedNodeWidth = Math.max(
      ...pair.sharedNodeIds
        .map((id) => nodeMap.get(id))
        .filter(<T>(n: T | undefined): n is T => n != null)
        .map((n) => n.layout.width),
      0
    );
    const requiredZoneWidth = maxSharedNodeWidth + OVERLAP_PADDING * 2;

    if (gA.tier === gB.tier) {
      // Same tier — extend horizontally toward each other
      const [leftBounds, rightBounds] =
        boundsA.x < boundsB.x ? [boundsA, boundsB] : [boundsB, boundsA];

      const boundary = leftBounds.x + leftBounds.width;
      // Only extend if they're adjacent (boundary matches)
      if (Math.abs(boundary - rightBounds.x) < 1) {
        // Each side extends by half the required zone width
        const inset = Math.ceil(requiredZoneWidth / 2);
        leftBounds.width += inset;
        rightBounds.x -= inset;
        rightBounds.width += inset;
      }
    } else {
      // Cross-tier — extend vertically toward each other
      const [upperBounds, lowerBounds] =
        boundsA.y < boundsB.y ? [boundsA, boundsB] : [boundsB, boundsA];

      const vertInset = Math.min(
        Math.ceil(requiredZoneWidth / 2),
        config.tierSpacing * 0.4
      );
      upperBounds.height += vertInset;
      lowerBounds.y -= vertInset;
      lowerBounds.height += vertInset;
    }
  }

  // ── Step 6: Compute overlap zones from bounds intersection ─────────
  // (Moved before node placement so we can place shared nodes in zones)
  const computedOverlapZones: OverlapZone[] = [];

  for (const pair of overlapPairs) {
    const boundsA = groupBoundsMap.get(pair.groupA);
    const boundsB = groupBoundsMap.get(pair.groupB);
    if (!boundsA || !boundsB) continue;

    // Compute rectangle intersection
    const ix1 = Math.max(boundsA.x, boundsB.x);
    const iy1 = Math.max(boundsA.y, boundsB.y);
    const ix2 = Math.min(boundsA.x + boundsA.width, boundsB.x + boundsB.width);
    const iy2 = Math.min(boundsA.y + boundsA.height, boundsB.y + boundsB.height);

    if (ix2 > ix1 && iy2 > iy1) {
      computedOverlapZones.push({
        groupIds: [pair.groupA, pair.groupB],
        sharedNodeIds: pair.sharedNodeIds,
        x: ix1,
        y: iy1,
        width: ix2 - ix1,
        height: iy2 - iy1,
      });
    }
  }

  // ── Step 7: Place nodes — exclusive first, then shared in overlap zones ─
  // Build a set of shared nodeIds (belong to 2+ groups)
  const sharedNodeIds = new Set<string>();
  for (const [nodeId, memberGroups] of nodeGroupMembership) {
    if (memberGroups.length > 1) {
      sharedNodeIds.add(nodeId);
    }
  }

  // Compute exclusive regions for each group by subtracting overlap zones.
  // For same-tier horizontal overlaps, this trims the group bounds on the
  // side that faces the overlapping partner so exclusive nodes stay clear.
  const exclusiveRegionMap = new Map<string, GroupBounds>();
  for (const group of groups) {
    const b = groupBoundsMap.get(group.id);
    if (!b) continue;
    exclusiveRegionMap.set(group.id, { ...b });
  }

  for (const zone of computedOverlapZones) {
    for (const gId of zone.groupIds) {
      const excl = exclusiveRegionMap.get(gId);
      if (!excl) continue;

      // Determine if the overlap is on the left or right side of this group
      if (zone.x <= excl.x + 1) {
        // Overlap is on the left edge — shrink from the left
        const trimRight = zone.x + zone.width;
        const oldLeft = excl.x;
        excl.x = trimRight;
        excl.width -= trimRight - oldLeft;
      } else if (zone.x + zone.width >= excl.x + excl.width - 1) {
        // Overlap is on the right edge — shrink from the right
        excl.width = zone.x - excl.x;
      }
      // For vertical overlaps (top/bottom), trim similarly
      else if (zone.y <= excl.y + 1) {
        const trimBottom = zone.y + zone.height;
        const oldTop = excl.y;
        excl.y = trimBottom;
        excl.height -= trimBottom - oldTop;
      } else if (zone.y + zone.height >= excl.y + excl.height - 1) {
        excl.height = zone.y - excl.y;
      }
    }
  }

  // Only use association edges for adjacency (not containment)
  const associationEdges = edges.filter(
    (e) => e.relationship === "association"
  );
  const adjacency = buildAdjacency({ edges: associationEdges });

  type PositionedN = N & { x: number; y: number; groupIds: string[] };
  const positioned: PositionedN[] = [];
  const placedNodeIds = new Set<string>();

  // Pass 1: Place exclusive nodes in the exclusive region (avoiding overlap zones)
  for (const group of groups) {
    const exclBounds = exclusiveRegionMap.get(group.id);
    if (!exclBounds || exclBounds.width <= 0 || exclBounds.height <= 0)
      continue;

    // Only exclusive nodes for this group
    const exclusiveNodeDefs = group.nodeIds
      .filter((id) => !sharedNodeIds.has(id) && !placedNodeIds.has(id))
      .map((id) => nodeMap.get(id))
      .filter(<T>(n: T | undefined): n is T => n != null);

    if (exclusiveNodeDefs.length === 0) continue;

    const reordered = barycentricSort({
      nodes: exclusiveNodeDefs,
      positioned,
      adjacency,
    });

    placeNodesInRegion({
      nodes: reordered,
      bounds: exclBounds,
      padding: group.padding,
      nodeSpacing: group.nodeSpacing,
      nodeGroupMembership,
      groupId: group.id,
      placedNodeIds,
      positioned,
    });
  }

  // Pass 2: Place shared nodes in overlap zones
  for (const zone of computedOverlapZones) {
    const zoneNodeDefs = zone.sharedNodeIds
      .filter((id) => !placedNodeIds.has(id))
      .map((id) => nodeMap.get(id))
      .filter(<T>(n: T | undefined): n is T => n != null);

    if (zoneNodeDefs.length === 0) continue;

    const reordered = barycentricSort({
      nodes: zoneNodeDefs,
      positioned,
      adjacency,
    });

    const zoneBounds: GroupBounds = {
      groupId: zone.groupIds[0],
      x: zone.x,
      y: zone.y,
      width: zone.width,
      height: zone.height,
    };

    const zonePadding = 8;
    const zoneSpacing = 12;

    placeNodesInRegion({
      nodes: reordered,
      bounds: zoneBounds,
      padding: zonePadding,
      nodeSpacing: zoneSpacing,
      nodeGroupMembership,
      groupId: zone.groupIds[0],
      placedNodeIds,
      positioned,
    });
  }

  // ── Build output ───────────────────────────────────────────────────
  const groupBounds: ComputedGroupBounds[] = groups.map((group) => {
    const b = groupBoundsMap.get(group.id);
    return {
      groupId: group.id,
      childGroupIds: [],
      x: b?.x ?? 0,
      y: b?.y ?? 0,
      width: b?.width ?? 0,
      height: b?.height ?? 0,
    };
  });

  // Compute parent group bounds as union of child group bounds
  const parentGroups = findParentGroups({ nodes: nodes as LayoutNode[], edges });
  const GROUP_LABEL_HEIGHT_PARENT = 22;
  const PARENT_PADDING = 12;

  for (const [parentId, childIds] of parentGroups) {
    const childBoundsList = childIds
      .map((cid) => groupBounds.find((gb) => gb.groupId === cid))
      .filter((b): b is ComputedGroupBounds => b != null && b.width > 0);

    if (childBoundsList.length === 0) continue;

    let pMinX = Infinity;
    let pMinY = Infinity;
    let pMaxX = -Infinity;
    let pMaxY = -Infinity;
    for (const cb of childBoundsList) {
      pMinX = Math.min(pMinX, cb.x);
      pMinY = Math.min(pMinY, cb.y);
      pMaxX = Math.max(pMaxX, cb.x + cb.width);
      pMaxY = Math.max(pMaxY, cb.y + cb.height);
    }

    groupBounds.push({
      groupId: parentId,
      childGroupIds: childIds,
      x: pMinX - PARENT_PADDING,
      y: pMinY - PARENT_PADDING - GROUP_LABEL_HEIGHT_PARENT,
      width: pMaxX - pMinX + PARENT_PADDING * 2,
      height: pMaxY - pMinY + PARENT_PADDING * 2 + GROUP_LABEL_HEIGHT_PARENT,
    });
  }

  return { nodes: positioned, groupBounds, overlapZones: computedOverlapZones };
}

// ─── Adjacency helper ────────────────────────────────────────────────────────

function buildAdjacency({
  edges,
}: {
  edges: LayoutEdge[];
}): Map<string, string[]> {
  const adj = new Map<string, string[]>();
  for (const edge of edges) {
    const sourceList = adj.get(edge.source) ?? [];
    sourceList.push(edge.target);
    adj.set(edge.source, sourceList);

    const targetList = adj.get(edge.target) ?? [];
    targetList.push(edge.source);
    adj.set(edge.target, targetList);
  }
  return adj;
}

// ─── Region placement helper ─────────────────────────────────────────────────

function placeNodesInRegion<N extends LayoutLeafNode>({
  nodes,
  bounds,
  padding,
  nodeSpacing,
  nodeGroupMembership,
  groupId,
  placedNodeIds,
  positioned,
}: {
  nodes: N[];
  bounds: GroupBounds;
  padding: number;
  nodeSpacing: number;
  nodeGroupMembership: Map<string, string[]>;
  groupId: string;
  placedNodeIds: Set<string>;
  positioned: Array<N & { x: number; y: number; groupIds: string[] }>;
}): void {
  const innerWidth = bounds.width - padding * 2;
  const innerX = bounds.x + padding;

  // The usable vertical region starts below the group label
  const contentTop = bounds.y + GROUP_LABEL_HEIGHT;
  const contentHeight = bounds.height - GROUP_LABEL_HEIGHT;
  const centerY = contentTop + contentHeight / 2;

  const rows = packIntoRows({
    nodes,
    availableWidth: innerWidth,
    nodeSpacing,
  });

  const totalRowsHeight =
    rows.length * NODE_HEIGHT + (rows.length - 1) * nodeSpacing;
  let rowY = centerY - totalRowsHeight / 2 + NODE_HEIGHT / 2;

  for (const row of rows) {
    const rowContentWidth =
      row.reduce((sum, n) => sum + n.layout.width, 0) +
      (row.length - 1) * nodeSpacing;

    let nodeX = innerX + innerWidth / 2 - rowContentWidth / 2;

    for (const node of row) {
      const cx = nodeX + node.layout.width / 2;
      placedNodeIds.add(node.id);
      const groupIds = nodeGroupMembership.get(node.id) ?? [groupId];
      positioned.push({
        ...node,
        x: cx,
        y: rowY,
        groupIds,
      } as N & { x: number; y: number; groupIds: string[] });
      nodeX += node.layout.width + nodeSpacing;
    }

    rowY += NODE_HEIGHT + nodeSpacing;
  }
}

// ─── Barycentric sort ────────────────────────────────────────────────────────

function barycentricSort({
  nodes,
  positioned,
  adjacency,
}: {
  nodes: LayoutLeafNode[];
  positioned: PositionedNode[];
  adjacency: Map<string, string[]>;
}): LayoutLeafNode[] {
  const positionedMap = new Map(positioned.map((p) => [p.id, p]));

  interface ScoredNode {
    node: LayoutLeafNode;
    barycenter: number | null;
    originalIndex: number;
  }

  const scored: ScoredNode[] = nodes.map((node, i) => {
    const neighbors = adjacency.get(node.id) ?? [];
    const positionedNeighbors = neighbors
      .map((id) => positionedMap.get(id))
      .filter((n): n is PositionedNode => n != null);

    if (positionedNeighbors.length === 0) {
      return { node, barycenter: null, originalIndex: i };
    }

    const avgX =
      positionedNeighbors.reduce((sum, n) => sum + n.x, 0) /
      positionedNeighbors.length;

    return { node, barycenter: avgX, originalIndex: i };
  });

  return scored
    .sort((a, b) => {
      if (a.barycenter != null && b.barycenter != null) {
        return a.barycenter - b.barycenter;
      }
      if (a.barycenter != null) return -1;
      if (b.barycenter != null) return 1;
      return a.originalIndex - b.originalIndex;
    })
    .map((s) => s.node);
}

// ─── Row packing ─────────────────────────────────────────────────────────────

function packIntoRows({
  nodes,
  availableWidth,
  nodeSpacing,
}: {
  nodes: LayoutLeafNode[];
  availableWidth: number;
  nodeSpacing: number;
}): LayoutLeafNode[][] {
  const rows: LayoutLeafNode[][] = [];
  let currentRow: LayoutLeafNode[] = [];
  let currentWidth = 0;

  for (const node of nodes) {
    const neededWidth =
      currentRow.length === 0 ? node.layout.width : nodeSpacing + node.layout.width;

    if (currentWidth + neededWidth > availableWidth && currentRow.length > 0) {
      rows.push(currentRow);
      currentRow = [node];
      currentWidth = node.layout.width;
    } else {
      currentRow.push(node);
      currentWidth += neededWidth;
    }
  }

  if (currentRow.length > 0) {
    rows.push(currentRow);
  }

  return rows;
}

// ─── Height estimation ───────────────────────────────────────────────────────

function estimateGroupHeight({
  nodes,
  availableWidth,
  nodeSpacing,
  padding,
}: {
  nodes: LayoutLeafNode[];
  availableWidth: number;
  nodeSpacing: number;
  padding: number;
}): number {
  const rows = packIntoRows({ nodes, availableWidth, nodeSpacing });
  const contentHeight =
    rows.length * NODE_HEIGHT + (rows.length - 1) * nodeSpacing;
  return GROUP_LABEL_HEIGHT + contentHeight + padding * 2;
}

// ─── Auto-sizing ─────────────────────────────────────────────────────────────

/**
 * Approximate text width using per-character metrics.
 * These are calibrated for the SVG font sizes used in NetworkNode:
 *   - label: 11px, fontWeight 500 (~6.6px avg char width)
 *   - subtitle: 9px (~5.2px avg char width)
 *
 * We use the wider of the two, plus horizontal padding for the rounded rect.
 */
function computeNodeWidth(node: LayoutLeafNode): number {
  const LABEL_CHAR_WIDTH = 6.8;
  const SUBTITLE_CHAR_WIDTH = 5.3;
  const HORIZONTAL_PADDING = 16;

  const labelWidth = node.label.length * LABEL_CHAR_WIDTH;
  const subtitleWidth = node.subtitle
    ? node.subtitle.length * SUBTITLE_CHAR_WIDTH
    : 0;

  const textWidth = Math.max(labelWidth, subtitleWidth);
  const computed = Math.ceil(textWidth + HORIZONTAL_PADDING);

  // Use the larger of the computed width and the manually specified width
  return Math.max(computed, node.layout.width);
}
