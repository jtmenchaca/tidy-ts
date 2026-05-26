import type { PositionedNode } from "./types.ts";

const NODE_HEIGHT = 24;
const NODE_HEIGHT_NO_SUBTITLE = 18;

// Label dimension constants — shared between position computation and rendering
export const LABEL_CHAR_WIDTH = 4.8;
export const LABEL_PADDING_X = 3;
export const LABEL_PADDING_Y = 2;
export const LABEL_HEIGHT = 10 + LABEL_PADDING_Y * 2;

// Visual breathing room between labels and obstacles
const LABEL_MARGIN = 6;

function nodeBottom(node: PositionedNode): number {
  return node.y + (node.subtitle ? NODE_HEIGHT : NODE_HEIGHT_NO_SUBTITLE) / 2;
}

function nodeTop(node: PositionedNode): number {
  return node.y - (node.subtitle ? NODE_HEIGHT : NODE_HEIGHT_NO_SUBTITLE) / 2;
}

function nodeLeft(node: PositionedNode): number {
  return node.x - node.layout.width / 2;
}

function nodeRight(node: PositionedNode): number {
  return node.x + node.layout.width / 2;
}

/**
 * Determines the best connection points (ports) on source and target nodes,
 * and returns a smooth bezier path between them.
 *
 * Port selection:
 *  - If target is below source → bottom of source, top of target
 *  - If target is above source → top of source, bottom of target
 *  - If roughly same row → right/left sides depending on relative position
 *
 * The bezier control points are spread apart proportional to the distance,
 * keeping curves gentle and avoiding overlap with nearby nodes.
 */
// Minimum arc height when an edge carries a label.
// A quadratic bezier only reaches ~50% of the control-point offset at t=0.5,
// so we need roughly 2x the desired visual clearance as the arc height.
const LABEL_CLEARANCE = LABEL_HEIGHT + LABEL_MARGIN * 2 + NODE_HEIGHT / 2;
const LABELED_ARC_MIN_HEIGHT = LABEL_CLEARANCE * 2;

function sameRowArcHeight({ absDx, hasLabel }: { absDx: number; hasLabel: boolean }): number {
  const base = Math.min(35, absDx * 0.15);
  return hasLabel ? Math.max(LABELED_ARC_MIN_HEIGHT, base) : base;
}

export function computeEdgePath({ source, target, hasLabel = false }: { source: PositionedNode; target: PositionedNode; hasLabel?: boolean }): string {
  const dy = target.y - source.y;
  const dx = target.x - source.x;
  const absDy = Math.abs(dy);
  const absDx = Math.abs(dx);

  // Same-row connections: use side ports with arc
  if (absDy < 30) {
    const goRight = dx > 0;
    const x1 = goRight ? nodeRight(source) : nodeLeft(source);
    const y1 = source.y;
    const x2 = goRight ? nodeLeft(target) : nodeRight(target);
    const y2 = target.y;
    const arcHeight = sameRowArcHeight({ absDx, hasLabel });
    const cy = Math.min(y1, y2) - arcHeight;
    return `M${x1} ${y1} Q${(x1 + x2) / 2} ${cy} ${x2} ${y2}`;
  }

  // Vertical connections: use top/bottom ports
  const goDown = dy > 0;
  const x1 = source.x;
  const y1 = goDown ? nodeBottom(source) : nodeTop(source);
  const x2 = target.x;
  const y2 = goDown ? nodeTop(target) : nodeBottom(target);

  const edgeDy = y2 - y1;

  // For mostly-vertical edges (small horizontal offset), use a gentle S-curve
  if (absDx < 60) {
    const cp = Math.abs(edgeDy) * 0.4;
    return `M${x1} ${y1} C${x1} ${y1 + (goDown ? cp : -cp)} ${x2} ${y2 - (goDown ? cp : -cp)} ${x2} ${y2}`;
  }

  // For diagonal edges, use an orthogonal-ish routing:
  // Drop down vertically from source, then curve across, then drop into target.
  // This produces cleaner visual separation than a single diagonal bezier.
  const verticalDrop = Math.abs(edgeDy) * 0.35;
  const cp1x = x1;
  const cp1y = y1 + (goDown ? verticalDrop : -verticalDrop);
  const cp2x = x2;
  const cp2y = y2 - (goDown ? verticalDrop : -verticalDrop);

  return `M${x1} ${y1} C${cp1x} ${cp1y} ${cp2x} ${cp2y} ${x2} ${y2}`;
}

/**
 * Returns the bezier control points for an edge, matching the curve produced by computeEdgePath.
 * For quadratic (same-row) arcs, we return the single control point duplicated to form a cubic.
 */
function edgeBezierPoints({ source, target, hasLabel = false }: { source: PositionedNode; target: PositionedNode; hasLabel?: boolean }): {
  p0: { x: number; y: number };
  p1: { x: number; y: number };
  p2: { x: number; y: number };
  p3: { x: number; y: number };
} {
  const dy = target.y - source.y;
  const dx = target.x - source.x;
  const absDy = Math.abs(dy);
  const absDx = Math.abs(dx);

  // Same-row: quadratic arc → promote to cubic
  if (absDy < 30) {
    const goRight = dx > 0;
    const x1 = goRight ? nodeRight(source) : nodeLeft(source);
    const y1 = source.y;
    const x2 = goRight ? nodeLeft(target) : nodeRight(target);
    const y2 = target.y;
    const arcHeight = sameRowArcHeight({ absDx, hasLabel });
    const qx = (x1 + x2) / 2;
    const qy = Math.min(y1, y2) - arcHeight;
    // Quadratic→cubic: CP1 = P0 + 2/3*(Q-P0), CP2 = P3 + 2/3*(Q-P3)
    return {
      p0: { x: x1, y: y1 },
      p1: { x: x1 + (2 / 3) * (qx - x1), y: y1 + (2 / 3) * (qy - y1) },
      p2: { x: x2 + (2 / 3) * (qx - x2), y: y2 + (2 / 3) * (qy - y2) },
      p3: { x: x2, y: y2 },
    };
  }

  const goDown = dy > 0;
  const x1 = source.x;
  const y1 = goDown ? nodeBottom(source) : nodeTop(source);
  const x2 = target.x;
  const y2 = goDown ? nodeTop(target) : nodeBottom(target);
  const edgeDy = y2 - y1;

  if (absDx < 60) {
    const cp = Math.abs(edgeDy) * 0.4;
    return {
      p0: { x: x1, y: y1 },
      p1: { x: x1, y: y1 + (goDown ? cp : -cp) },
      p2: { x: x2, y: y2 - (goDown ? cp : -cp) },
      p3: { x: x2, y: y2 },
    };
  }

  const verticalDrop = Math.abs(edgeDy) * 0.35;
  return {
    p0: { x: x1, y: y1 },
    p1: { x: x1, y: y1 + (goDown ? verticalDrop : -verticalDrop) },
    p2: { x: x2, y: y2 - (goDown ? verticalDrop : -verticalDrop) },
    p3: { x: x2, y: y2 },
  };
}

/**
 * Split a cubic bezier at parameter t using De Casteljau's algorithm.
 * Returns the control points for the first segment [0, t].
 */
function splitCubicAt({ p0, p1, p2, p3, t }: {
  p0: { x: number; y: number };
  p1: { x: number; y: number };
  p2: { x: number; y: number };
  p3: { x: number; y: number };
  t: number;
}): { p0: { x: number; y: number }; p1: { x: number; y: number }; p2: { x: number; y: number }; p3: { x: number; y: number } } {
  const lerp = (a: { x: number; y: number }, b: { x: number; y: number }) => ({
    x: a.x + (b.x - a.x) * t,
    y: a.y + (b.y - a.y) * t,
  });
  const a = lerp(p0, p1);
  const b = lerp(p1, p2);
  const c = lerp(p2, p3);
  const d = lerp(a, b);
  const e = lerp(b, c);
  const f = lerp(d, e);
  return { p0, p1: a, p2: d, p3: f };
}

/** Evaluate a cubic bezier at parameter t ∈ [0,1]. */
function evalCubicBezier({ p0, p1, p2, p3, t }: {
  p0: { x: number; y: number };
  p1: { x: number; y: number };
  p2: { x: number; y: number };
  p3: { x: number; y: number };
  t: number;
}): { x: number; y: number } {
  const u = 1 - t;
  const uu = u * u;
  const uuu = uu * u;
  const tt = t * t;
  const ttt = tt * t;
  return {
    x: uuu * p0.x + 3 * uu * t * p1.x + 3 * u * tt * p2.x + ttt * p3.x,
    y: uuu * p0.y + 3 * uu * t * p1.y + 3 * u * tt * p2.y + ttt * p3.y,
  };
}

/** Get the midpoint of an edge for label placement — offset to avoid overlapping the path */
export function computeEdgeMidpoint({ source, target }: { source: PositionedNode; target: PositionedNode }): { x: number; y: number } {
  return evalCubicBezier({ ...edgeBezierPoints({ source, target, hasLabel: true }), t: 0.5 });
}

/**
 * Returns the endpoint position and incoming angle (in degrees) at the target end of an edge.
 * The angle points in the direction the path is traveling as it arrives at the target,
 * suitable for rotating an arrowhead via `transform="rotate(angle)"`.
 *
 * Walks back from the endpoint by a fixed arc length (matching the arrowhead size) to find
 * the point where the arrowhead base sits. The angle is then the direction from that point
 * to the endpoint. This correctly handles the "elbow" near endpoints where the curve bends
 * sharply from diagonal to vertical.
 */
export function computeEdgeTargetAngle({ source, target, hasLabel = false, arrowSize = 5 }: {
  source: PositionedNode;
  target: PositionedNode;
  hasLabel?: boolean;
  arrowSize?: number;
}): { x: number; y: number; angle: number; truncatedPath: string } {
  const bezier = edgeBezierPoints({ source, target, hasLabel });
  const end = bezier.p3;

  // Walk backward from t=1 by arc length equal to arrowSize.
  // Sample small steps and accumulate distance until we've covered arrowSize pixels.
  const steps = 50;
  const dt = 1 / steps;
  let accum = 0;
  let baseT = 0; // fallback to start if curve is shorter than arrowSize

  let prev = end;
  for (let i = 1; i <= steps; i++) {
    const t = 1 - i * dt;
    const pt = evalCubicBezier({ ...bezier, t });
    const segDx = prev.x - pt.x;
    const segDy = prev.y - pt.y;
    accum += Math.sqrt(segDx * segDx + segDy * segDy);
    if (accum >= arrowSize) {
      // Interpolate to find the exact t where we hit arrowSize
      const overshoot = accum - arrowSize;
      const segLen = Math.sqrt(segDx * segDx + segDy * segDy);
      const frac = segLen > 0 ? overshoot / segLen : 0;
      baseT = t + frac * dt;
      break;
    }
    prev = pt;
  }

  const basePoint = evalCubicBezier({ ...bezier, t: baseT });
  const angle = Math.atan2(end.y - basePoint.y, end.x - basePoint.x) * (180 / Math.PI);

  // Build truncated path that ends at baseT (arrow base) instead of the full endpoint.
  const truncated = splitCubicAt({ ...bezier, t: baseT });
  const truncatedPath = `M${truncated.p0.x} ${truncated.p0.y} C${truncated.p1.x} ${truncated.p1.y} ${truncated.p2.x} ${truncated.p2.y} ${truncated.p3.x} ${truncated.p3.y}`;

  return { x: end.x, y: end.y, angle, truncatedPath };
}

// ─── Label rect helpers ──────────────────────────────────────────────────────

interface Rect {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

function inflateRect(r: Rect, margin: number): Rect {
  return { x1: r.x1 - margin, y1: r.y1 - margin, x2: r.x2 + margin, y2: r.y2 + margin };
}

function labelRect({ cx, cy, width }: { cx: number; cy: number; width: number }): Rect {
  return {
    x1: cx - width / 2,
    y1: cy - 6 - LABEL_PADDING_Y,
    x2: cx + width / 2,
    y2: cy - 6 - LABEL_PADDING_Y + LABEL_HEIGHT,
  };
}

function nodeRect(node: PositionedNode): Rect {
  const halfH = (node.subtitle ? NODE_HEIGHT : NODE_HEIGHT_NO_SUBTITLE) / 2;
  return {
    x1: node.x - node.layout.width / 2,
    y1: node.y - halfH,
    x2: node.x + node.layout.width / 2,
    y2: node.y + halfH,
  };
}

function rectsOverlap(a: Rect, b: Rect): boolean {
  return a.x1 < b.x2 && a.x2 > b.x1 && a.y1 < b.y2 && a.y2 > b.y1;
}

function labelOverlapsAnyNode({ cx, cy, width, nodeRects }: {
  cx: number;
  cy: number;
  width: number;
  nodeRects: Rect[];
}): boolean {
  const lr = labelRect({ cx, cy, width });
  return nodeRects.some((nr) => rectsOverlap(lr, inflateRect(nr, LABEL_MARGIN)));
}

function labelOverlapsAnyLabel({ cx, cy, width, placedLabels }: {
  cx: number;
  cy: number;
  width: number;
  placedLabels: Array<{ cx: number; cy: number; width: number }>;
}): boolean {
  const lr = labelRect({ cx, cy, width });
  return placedLabels.some((pl) => rectsOverlap(lr, inflateRect(labelRect(pl), LABEL_MARGIN)));
}

/**
 * Compute collision-free label positions for all labeled edges.
 *
 * Strategy: slide the label along the actual bezier curve by trying different
 * parametric t values (centered on t=0.5). This keeps labels visually on the
 * edge path while avoiding node rects and already-placed labels.
 */
export function computeEdgeLabelPositions({ edges, nodeMap, allNodes }: {
  edges: Array<{ source: string; target: string; label?: string }>;
  nodeMap: Map<string, PositionedNode>;
  allNodes: PositionedNode[];
}): Map<number, { x: number; y: number }> {
  const result = new Map<number, { x: number; y: number }>();
  const nRects = allNodes.map(nodeRect);
  const placedLabels: Array<{ cx: number; cy: number; width: number }> = [];

  // Candidate t values: start at midpoint, then fan out toward endpoints
  const tCandidates = [
    0.50, 0.45, 0.55, 0.40, 0.60, 0.35, 0.65,
    0.30, 0.70, 0.25, 0.75, 0.20, 0.80, 0.15, 0.85,
  ];

  for (let i = 0; i < edges.length; i++) {
    const edge = edges[i];
    if (!edge.label) continue;

    const source = nodeMap.get(edge.source);
    const target = nodeMap.get(edge.target);
    if (!source || !target) continue;

    const bezier = edgeBezierPoints({ source, target, hasLabel: true });
    const labelWidth = edge.label.length * LABEL_CHAR_WIDTH + LABEL_PADDING_X * 2;

    let bestPos = evalCubicBezier({ ...bezier, t: 0.5 });
    let found = false;

    for (const t of tCandidates) {
      const pos = evalCubicBezier({ ...bezier, t });
      if (
        !labelOverlapsAnyNode({ cx: pos.x, cy: pos.y, width: labelWidth, nodeRects: nRects }) &&
        !labelOverlapsAnyLabel({ cx: pos.x, cy: pos.y, width: labelWidth, placedLabels })
      ) {
        bestPos = pos;
        found = true;
        break;
      }
    }

    // If no on-curve position works, try small perpendicular offsets from each t
    if (!found) {
      const perpOffsets = [8, -8, 16, -16, 24, -24];
      for (const t of tCandidates) {
        const pos = evalCubicBezier({ ...bezier, t });
        // Compute curve tangent for perpendicular direction
        const tA = evalCubicBezier({ ...bezier, t: Math.max(0, t - 0.01) });
        const tB = evalCubicBezier({ ...bezier, t: Math.min(1, t + 0.01) });
        const tdx = tB.x - tA.x;
        const tdy = tB.y - tA.y;
        const tLen = Math.sqrt(tdx * tdx + tdy * tdy) || 1;
        const nx = -tdy / tLen;
        const ny = tdx / tLen;

        for (const off of perpOffsets) {
          const cx = pos.x + nx * off;
          const cy = pos.y + ny * off;
          if (
            !labelOverlapsAnyNode({ cx, cy, width: labelWidth, nodeRects: nRects }) &&
            !labelOverlapsAnyLabel({ cx, cy, width: labelWidth, placedLabels })
          ) {
            bestPos = { x: cx, y: cy };
            found = true;
            break;
          }
        }
        if (found) break;
      }
    }

    result.set(i, bestPos);
    placedLabels.push({ cx: bestPos.x, cy: bestPos.y, width: labelWidth });
  }

  return result;
}
