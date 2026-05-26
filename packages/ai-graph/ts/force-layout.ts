import type {
  ComputedGroupBounds,
  LayoutEdge,
  LayoutGroupNode,
  LayoutLeafNode,
  LayoutResult,
  OverlapZone,
} from "./types.ts";

/** Height used for bounding box calculations */
const NODE_HEIGHT = 24;

/** Space reserved for group label badge at top of group bounds */
const GROUP_LABEL_HEIGHT = 22;

// ─── Simulation parameters ──────────────────────────────────────────────────

const REPULSION_STRENGTH = 4000;
const CROSS_GROUP_REPULSION_MULTIPLIER = 3.5;
const EDGE_SPRING_STRENGTH = 0.01;
const CONTAINMENT_SPRING_STRENGTH = 0.02;
const DAMPING = 0.82;
const MIN_VELOCITY = 0.05;
const MAX_ITERATIONS = 800;
const OVERLAP_PUSH_STRENGTH = 1.0;
const OVERLAP_MARGIN = 10;
const GROUP_BOX_PADDING = 24;

// Global gravity pulls every node weakly toward the running centroid of the
// whole simulation. This is what keeps disconnected components from drifting
// apart indefinitely under cross-group repulsion: there's no edge tension
// holding them together, so without a centering force the only stable state
// would be infinitely far apart. The strength is small enough that connected
// graphs are barely affected — repulsion + edge springs still dominate
// locally — but it puts a hard ceiling on how far an isolated cluster can
// drift from the rest of the graph.
const GLOBAL_GRAVITY_STRENGTH = 0.04;

// ─── Internal types ─────────────────────────────────────────────────────────

interface SimNode {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  width: number;
  groupIds: string[];
}

// ─── Topology-driven initial positioning ────────────────────────────────────

/**
 * Assign initial positions using BFS from the most-connected node.
 * Groups that are connected via association edges end up near each other.
 * The layout fans out horizontally to produce a landscape shape.
 */
function computeInitialPositions({
  sizedNodes,
  nodeGroups,
  groupMembers,
  associationEdges,
}: {
  sizedNodes: LayoutLeafNode[];
  nodeGroups: Map<string, string[]>;
  groupMembers: Map<string, string[]>;
  associationEdges: LayoutEdge[];
}): SimNode[] {
  // Build adjacency from association edges
  const adj = new Map<string, Set<string>>();
  for (const e of associationEdges) {
    if (!adj.has(e.source)) adj.set(e.source, new Set());
    if (!adj.has(e.target)) adj.set(e.target, new Set());
    adj.get(e.source)!.add(e.target);
    adj.get(e.target)!.add(e.source);
  }

  // Also treat group co-membership as adjacency (weaker, for connectivity)
  for (const [, members] of groupMembers) {
    for (let i = 0; i < members.length; i++) {
      for (let j = i + 1; j < members.length; j++) {
        if (!adj.has(members[i])) adj.set(members[i], new Set());
        if (!adj.has(members[j])) adj.set(members[j], new Set());
        adj.get(members[i])!.add(members[j]);
        adj.get(members[j])!.add(members[i]);
      }
    }
  }

  // BFS from the highest-degree node to assign layers
  const degrees = new Map<string, number>();
  for (const n of sizedNodes) {
    degrees.set(n.id, adj.get(n.id)?.size ?? 0);
  }

  const startNode = sizedNodes.reduce((best, n) =>
    (degrees.get(n.id) ?? 0) > (degrees.get(best.id) ?? 0) ? n : best
  );

  const layer = new Map<string, number>();
  const queue: string[] = [startNode.id];
  layer.set(startNode.id, 0);

  while (queue.length > 0) {
    const current = queue.shift()!;
    const currentLayer = layer.get(current)!;
    for (const neighbor of adj.get(current) ?? []) {
      if (!layer.has(neighbor)) {
        layer.set(neighbor, currentLayer + 1);
        queue.push(neighbor);
      }
    }
  }

  // Assign unconnected nodes to the outermost layer + 1
  const maxLayer = Math.max(0, ...layer.values());
  for (const n of sizedNodes) {
    if (!layer.has(n.id)) {
      layer.set(n.id, maxLayer + 1);
    }
  }

  // Collect nodes per layer
  const layerNodes = new Map<number, LayoutLeafNode[]>();
  for (const n of sizedNodes) {
    const l = layer.get(n.id)!;
    const list = layerNodes.get(l) ?? [];
    list.push(n);
    layerNodes.set(l, list);
  }

  // Position: layers spread horizontally (landscape), nodes within a layer vertical
  const LAYER_SPACING = 200;
  const NODE_SPACING_Y = 50;

  const simNodes: SimNode[] = [];
  const sortedLayers = [...layerNodes.keys()].sort((a, b) => a - b);

  for (const l of sortedLayers) {
    const nodesInLayer = layerNodes.get(l)!;
    const x = l * LAYER_SPACING;
    const totalHeight = nodesInLayer.length * NODE_SPACING_Y;
    const startY = -totalHeight / 2;

    for (let i = 0; i < nodesInLayer.length; i++) {
      const n = nodesInLayer[i];
      // Deterministic jitter to break symmetry
      const jitterX = Math.sin(i * 7.3 + l * 3.1) * 40;
      const jitterY = Math.cos(i * 5.1 + l * 2.7) * 20;

      simNodes.push({
        id: n.id,
        x: x + jitterX,
        y: startY + i * NODE_SPACING_Y + jitterY,
        vx: 0,
        vy: 0,
        width: n.layout.width,
        groupIds: nodeGroups.get(n.id) ?? [],
      });
    }
  }

  return simNodes;
}

// ─── Main entry point ───────────────────────────────────────────────────────

/**
 * Force-directed layout engine.
 *
 * Same input/output contract as the grid engine (computeLayout) so the
 * renderer can switch between them without changes.
 *
 * Derives all structure from graph topology — no tier/column metadata is used.
 * Initial positions come from BFS layering on the association edge graph.
 *
 * Forces:
 *   a. Coulomb repulsion (all pairs, stronger for cross-group pairs)
 *   b. Edge springs (Hooke's law, width-aware ideal distance)
 *   c. Group cohesion (pull members toward group centroid)
 *   d. Hard overlap resolution (push intersecting rects apart)
 */
export function computeForceLayout<N extends LayoutLeafNode = LayoutLeafNode>({
  nodes,
  edges,
}: {
  nodes: (N | LayoutGroupNode)[];
  edges: LayoutEdge[];
}): LayoutResult<N & { x: number; y: number; groupIds: string[] }> {
  // ── Step 1: Extract leaf nodes + build group membership ────────────
  const leafNodes: N[] = [];
  const groupNodes: LayoutGroupNode[] = [];
  for (const n of nodes) {
    if (n.kind === "leaf") {
      leafNodes.push(n as N);
    } else {
      groupNodes.push(n as LayoutGroupNode);
    }
  }

  // Separate containment edges into group→leaf and group→group
  const groupIdSet = new Set(groupNodes.map((g) => g.id));
  const leafIdSet = new Set(leafNodes.map((n) => n.id));

  const groupMembers = new Map<string, string[]>();  // group → leaf members
  const nodeGroups = new Map<string, string[]>();     // leaf → parent groups
  const groupChildren = new Map<string, string[]>();  // parent group → child groups

  for (const edge of edges) {
    if (edge.relationship === "containment") {
      if (groupIdSet.has(edge.target)) {
        // group → group containment (parent ecosystem)
        const children = groupChildren.get(edge.source) ?? [];
        children.push(edge.target);
        groupChildren.set(edge.source, children);
      } else if (leafIdSet.has(edge.target)) {
        // group → leaf containment
        const members = groupMembers.get(edge.source) ?? [];
        members.push(edge.target);
        groupMembers.set(edge.source, members);

        const groups = nodeGroups.get(edge.target) ?? [];
        groups.push(edge.source);
        nodeGroups.set(edge.target, groups);
      }
    }
  }

  // Identify parent groups (those with child groups, no direct leaf members)
  const parentGroupIds = new Set<string>();
  for (const [gid, children] of groupChildren) {
    if (children.length > 0) parentGroupIds.add(gid);
  }

  // Filter out parent groups from the simulation — they don't participate in forces
  const leafGroupNodes = groupNodes.filter((g) => !parentGroupIds.has(g.id));

  // Map each leaf group to its parent ecosystem (or null if top-level)
  const leafGroupParent = new Map<string, string | null>();
  for (const lg of leafGroupNodes) {
    let parent: string | null = null;
    for (const pid of parentGroupIds) {
      const children = groupChildren.get(pid) ?? [];
      if (children.includes(lg.id)) {
        parent = pid;
        break;
      }
    }
    leafGroupParent.set(lg.id, parent);
  }

  // Map each leaf node to its parent ecosystem (transitively via leaf group)
  const nodeEcosystem = new Map<string, string | null>();
  for (const [nid, gids] of nodeGroups) {
    let eco: string | null = null;
    for (const gid of gids) {
      const p = leafGroupParent.get(gid);
      if (p) { eco = p; break; }
    }
    nodeEcosystem.set(nid, eco);
  }

  // Two leaf groups are in the same ecosystem iff their parents match (and non-null)
  function leafGroupsInSameEcosystem(gA: string, gB: string): boolean {
    const pA = leafGroupParent.get(gA);
    const pB = leafGroupParent.get(gB);
    return pA !== null && pA === pB;
  }

  const associationEdges = edges.filter((e) =>
    e.relationship === "association"
  );

  const sizedNodes = leafNodes.map((n) => ({
    ...n,
    layout: { ...n.layout, width: computeNodeWidth(n) },
  }));

  // ── Step 2: Topology-driven initial positions ──────────────────────
  const simNodes = computeInitialPositions({
    sizedNodes,
    nodeGroups,
    groupMembers,
    associationEdges,
  });

  const nodeIndex = new Map(simNodes.map((n) => [n.id, n]));

  // Precompute: do two nodes share at least one group?
  function shareGroup(a: SimNode, b: SimNode): boolean {
    for (const gid of a.groupIds) {
      if (b.groupIds.includes(gid)) return true;
    }
    return false;
  }

  // Precompute: which group pairs share at least one member node?
  const sharedGroupPairs = new Set<string>();
  for (const [, groups] of nodeGroups) {
    for (let i = 0; i < groups.length; i++) {
      for (let j = i + 1; j < groups.length; j++) {
        const key = groups[i] < groups[j]
          ? `${groups[i]}|${groups[j]}`
          : `${groups[j]}|${groups[i]}`;
        sharedGroupPairs.add(key);
      }
    }
  }

  function groupsShareMembers(gidA: string, gidB: string): boolean {
    const key = gidA < gidB ? `${gidA}|${gidB}` : `${gidB}|${gidA}`;
    return sharedGroupPairs.has(key);
  }

  // ── Step 3: Run simulation ────────────────────────────────────────
  function computeGroupCentroid(groupId: string): { x: number; y: number } {
    const members = groupMembers.get(groupId) ?? [];
    let sx = 0;
    let sy = 0;
    let count = 0;
    for (const id of members) {
      const sn = nodeIndex.get(id);
      if (sn) {
        sx += sn.x;
        sy += sn.y;
        count++;
      }
    }
    if (count === 0) return { x: 0, y: 0 };
    return { x: sx / count, y: sy / count };
  }

  for (let iter = 0; iter < MAX_ITERATIONS; iter++) {
    for (const sn of simNodes) {
      sn.vx *= DAMPING;
      sn.vy *= DAMPING;
    }

    // (a0) Global gravity — pull every node weakly toward the running
    // centroid of all sim nodes. This is the only restoring force acting on
    // disconnected components (e.g. two unconnected groups), which would
    // otherwise drift apart indefinitely under cross-group repulsion. The
    // strength is small enough that on connected / dense graphs the existing
    // edge-spring + repulsion equilibrium is essentially unchanged.
    let gxSum = 0;
    let gySum = 0;
    for (const sn of simNodes) {
      gxSum += sn.x;
      gySum += sn.y;
    }
    const gcx = gxSum / simNodes.length;
    const gcy = gySum / simNodes.length;
    for (const sn of simNodes) {
      sn.vx += (gcx - sn.x) * GLOBAL_GRAVITY_STRENGTH;
      sn.vy += (gcy - sn.y) * GLOBAL_GRAVITY_STRENGTH;
    }

    // (a) Repulsion — stronger between nodes in different groups
    for (let i = 0; i < simNodes.length; i++) {
      for (let j = i + 1; j < simNodes.length; j++) {
        const a = simNodes[i];
        const b = simNodes[j];
        let dx = b.x - a.x;
        let dy = b.y - a.y;
        const distSq = dx * dx + dy * dy;

        if (distSq < 0.01) {
          dx = 1;
          dy = 0;
        }

        const dist = Math.sqrt(distSq + 1);
        const sameGroup = shareGroup(a, b);
        // Same-group pairs get weakened repulsion so members pack tighter;
        // cross-group pairs keep the full cross-group strength so ecosystems
        // don't bleed into each other.
        const strength = sameGroup
          ? REPULSION_STRENGTH * 0.55
          : REPULSION_STRENGTH * CROSS_GROUP_REPULSION_MULTIPLIER;
        const force = strength / (distSq + 200);
        const fx = (dx / dist) * force;
        const fy = (dy / dist) * force;

        a.vx -= fx;
        a.vy -= fy;
        b.vx += fx;
        b.vy += fy;
      }
    }

    // (b) Edge springs (width-aware ideal distance)
    for (const edge of associationEdges) {
      const a = nodeIndex.get(edge.source);
      const b = nodeIndex.get(edge.target);
      if (!a || !b) continue;

      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 0.1) continue;

      const idealDist = (a.width + b.width) / 2 + 80;
      const displacement = dist - idealDist;
      const force = EDGE_SPRING_STRENGTH * displacement;
      const fx = (dx / dist) * force;
      const fy = (dy / dist) * force;

      a.vx += fx;
      a.vy += fy;
      b.vx -= fx;
      b.vy -= fy;
    }

    // (c) Group cohesion
    for (const group of leafGroupNodes) {
      const centroid = computeGroupCentroid(group.id);
      const members = groupMembers.get(group.id) ?? [];
      for (const id of members) {
        const sn = nodeIndex.get(id);
        if (!sn) continue;

        const dx = centroid.x - sn.x;
        const dy = centroid.y - sn.y;
        sn.vx += dx * CONTAINMENT_SPRING_STRENGTH;
        sn.vy += dy * CONTAINMENT_SPRING_STRENGTH;
      }
    }

    // (c1a) Group compaction: pull each member inward toward its group's
    //       bbox center, with extra pull along whichever axis is longer,
    //       so elongated groups collapse toward a more square shape.
    const GROUP_COMPACTION_STRENGTH = 0.025;
    const ASPECT_PENALTY = 1.8;
    for (const group of leafGroupNodes) {
      const members = groupMembers.get(group.id) ?? [];
      if (members.length < 2) continue;

      let bMinX = Infinity, bMaxX = -Infinity, bMinY = Infinity, bMaxY = -Infinity;
      for (const id of members) {
        const sn = nodeIndex.get(id);
        if (!sn) continue;
        bMinX = Math.min(bMinX, sn.x - sn.width / 2);
        bMaxX = Math.max(bMaxX, sn.x + sn.width / 2);
        bMinY = Math.min(bMinY, sn.y - NODE_HEIGHT / 2);
        bMaxY = Math.max(bMaxY, sn.y + NODE_HEIGHT / 2);
      }
      if (bMinX === Infinity) continue;

      const cx = (bMinX + bMaxX) / 2;
      const cy = (bMinY + bMaxY) / 2;
      const w = bMaxX - bMinX;
      const h = bMaxY - bMinY;
      // Penalize the longer axis more to push toward squarer bounds
      const xMul = w > h ? ASPECT_PENALTY : 1;
      const yMul = h > w ? ASPECT_PENALTY : 1;

      for (const id of members) {
        const sn = nodeIndex.get(id);
        if (!sn) continue;
        sn.vx += (cx - sn.x) * GROUP_COMPACTION_STRENGTH * xMul;
        sn.vy += (cy - sn.y) * GROUP_COMPACTION_STRENGTH * yMul;
      }
    }

    // (c1b) Ecosystem cohesion: pull each leaf node toward the centroid of
    //       all leaf nodes that share its parent ecosystem. Keeps the FHIR,
    //       CDISC, OHDSI ecosystems clustered apart from each other.
    const ECOSYSTEM_COHESION_STRENGTH = 0.008;
    const ecosystemCentroids = new Map<string, { x: number; y: number; count: number }>();
    for (const sn of simNodes) {
      const eco = nodeEcosystem.get(sn.id);
      if (!eco) continue;
      const c = ecosystemCentroids.get(eco) ?? { x: 0, y: 0, count: 0 };
      c.x += sn.x;
      c.y += sn.y;
      c.count++;
      ecosystemCentroids.set(eco, c);
    }
    for (const c of ecosystemCentroids.values()) {
      if (c.count > 0) { c.x /= c.count; c.y /= c.count; }
    }
    for (const sn of simNodes) {
      const eco = nodeEcosystem.get(sn.id);
      if (!eco) continue;
      const c = ecosystemCentroids.get(eco);
      if (!c || c.count === 0) continue;
      sn.vx += (c.x - sn.x) * ECOSYSTEM_COHESION_STRENGTH;
      sn.vy += (c.y - sn.y) * ECOSYSTEM_COHESION_STRENGTH;
    }

    // (c2) Shared node centering: pull multi-group nodes toward the center
    //      of the live bounding-box intersection of their groups.
    const SHARED_CENTER_STRENGTH = 0.12;
    for (const sn of simNodes) {
      if (sn.groupIds.length < 2) continue;

      // Compute intersection of all groups' live bounding boxes
      let ixMin = -Infinity, ixMax = Infinity, iyMin = -Infinity, iyMax = Infinity;
      for (const gid of sn.groupIds) {
        const members = groupMembers.get(gid) ?? [];
        let gMinX = Infinity, gMaxX = -Infinity, gMinY = Infinity, gMaxY = -Infinity;
        for (const mid of members) {
          const mn = nodeIndex.get(mid);
          if (!mn) continue;
          gMinX = Math.min(gMinX, mn.x - mn.width / 2);
          gMaxX = Math.max(gMaxX, mn.x + mn.width / 2);
          gMinY = Math.min(gMinY, mn.y - NODE_HEIGHT / 2);
          gMaxY = Math.max(gMaxY, mn.y + NODE_HEIGHT / 2);
        }
        ixMin = Math.max(ixMin, gMinX);
        ixMax = Math.min(ixMax, gMaxX);
        iyMin = Math.max(iyMin, gMinY);
        iyMax = Math.min(iyMax, gMaxY);
      }

      if (ixMax > ixMin && iyMax > iyMin) {
        const cx = (ixMin + ixMax) / 2;
        const cy = (iyMin + iyMax) / 2;
        sn.vx += (cx - sn.x) * SHARED_CENTER_STRENGTH;
        sn.vy += (cy - sn.y) * SHARED_CENTER_STRENGTH;
      } else {
        // No intersection yet — fall back to centroid midpoint
        let mx = 0, my = 0;
        for (const gid of sn.groupIds) {
          const c = computeGroupCentroid(gid);
          mx += c.x;
          my += c.y;
        }
        mx /= sn.groupIds.length;
        my /= sn.groupIds.length;
        sn.vx += (mx - sn.x) * SHARED_CENTER_STRENGTH;
        sn.vy += (my - sn.y) * SHARED_CENTER_STRENGTH;
      }
    }

    // (d) Group separation: push apart non-sharing groups' bounding boxes
    //     Compute live bounding boxes per group and repel overlapping pairs
    //     that don't share members.
    const liveBounds = new Map<string, { minX: number; maxX: number; minY: number; maxY: number }>();
    for (const group of leafGroupNodes) {
      const members = groupMembers.get(group.id) ?? [];
      let minX = Infinity;
      let maxX = -Infinity;
      let minY = Infinity;
      let maxY = -Infinity;
      for (const id of members) {
        const sn = nodeIndex.get(id);
        if (!sn) continue;
        minX = Math.min(minX, sn.x - sn.width / 2);
        maxX = Math.max(maxX, sn.x + sn.width / 2);
        minY = Math.min(minY, sn.y - NODE_HEIGHT / 2);
        maxY = Math.max(maxY, sn.y + NODE_HEIGHT / 2);
      }
      if (minX < Infinity) {
        const pad = 60;
        liveBounds.set(group.id, { minX: minX - pad, maxX: maxX + pad, minY: minY - pad, maxY: maxY + pad });
      }
    }

    const GROUP_SEP_STRENGTH = 0.5;
    const CROSS_ECO_SEP_MULTIPLIER = 2.5;
    for (let i = 0; i < leafGroupNodes.length; i++) {
      const bA = liveBounds.get(leafGroupNodes[i].id);
      if (!bA) continue;
      for (let j = i + 1; j < leafGroupNodes.length; j++) {
        if (groupsShareMembers(leafGroupNodes[i].id, leafGroupNodes[j].id)) continue;
        const bB = liveBounds.get(leafGroupNodes[j].id);
        if (!bB) continue;

        // Check if bounding boxes overlap
        const overX = Math.min(bA.maxX, bB.maxX) - Math.max(bA.minX, bB.minX);
        const overY = Math.min(bA.maxY, bB.maxY) - Math.max(bA.minY, bB.minY);
        if (overX <= 0 || overY <= 0) continue;

        // Push members of each group apart along the axis of least overlap
        const membersA = groupMembers.get(leafGroupNodes[i].id) ?? [];
        const membersB = groupMembers.get(leafGroupNodes[j].id) ?? [];

        const cAx = (bA.minX + bA.maxX) / 2;
        const cAy = (bA.minY + bA.maxY) / 2;
        const cBx = (bB.minX + bB.maxX) / 2;
        const cBy = (bB.minY + bB.maxY) / 2;

        const dx = cBx - cAx;
        const dy = cBy - cAy;
        const dist = Math.sqrt(dx * dx + dy * dy) + 1;

        // Cross-ecosystem pairs get a stronger push so unrelated ecosystems
        // (e.g. US Regulatory vs FHIR ecosystem) don't end up overlapping.
        const sameEco = leafGroupsInSameEcosystem(leafGroupNodes[i].id, leafGroupNodes[j].id);
        const strength = sameEco
          ? GROUP_SEP_STRENGTH
          : GROUP_SEP_STRENGTH * CROSS_ECO_SEP_MULTIPLIER;
        const pushMag = Math.min(overX, overY) * strength;
        const px = (dx / dist) * pushMag;
        const py = (dy / dist) * pushMag;

        for (const id of membersA) {
          const sn = nodeIndex.get(id);
          if (sn) { sn.vx -= px / membersA.length; sn.vy -= py / membersA.length; }
        }
        for (const id of membersB) {
          const sn = nodeIndex.get(id);
          if (sn) { sn.vx += px / membersB.length; sn.vy += py / membersB.length; }
        }
      }
    }

    // (d1b) Parent-ecosystem separation: compute live bounds per parent
    //       ecosystem (union of its child leaf groups' bounds) and push
    //       apart any leaf group whose parent ecosystem differs and whose
    //       bounds intersect the parent ecosystem's bounds.
    const ecoBounds = new Map<string, { minX: number; maxX: number; minY: number; maxY: number }>();
    for (const lg of leafGroupNodes) {
      const eco = leafGroupParent.get(lg.id);
      if (!eco) continue;
      const lb = liveBounds.get(lg.id);
      if (!lb) continue;
      const cur = ecoBounds.get(eco);
      if (!cur) {
        ecoBounds.set(eco, { minX: lb.minX, maxX: lb.maxX, minY: lb.minY, maxY: lb.maxY });
      } else {
        cur.minX = Math.min(cur.minX, lb.minX);
        cur.maxX = Math.max(cur.maxX, lb.maxX);
        cur.minY = Math.min(cur.minY, lb.minY);
        cur.maxY = Math.max(cur.maxY, lb.maxY);
      }
    }

    const PARENT_SEP_STRENGTH = 0.4;
    for (const lg of leafGroupNodes) {
      const lgEco = leafGroupParent.get(lg.id);
      const lgB = liveBounds.get(lg.id);
      if (!lgB) continue;
      for (const [ecoId, ecoB] of ecoBounds) {
        if (ecoId === lgEco) continue; // same ecosystem — allowed
        const overX = Math.min(lgB.maxX, ecoB.maxX) - Math.max(lgB.minX, ecoB.minX);
        const overY = Math.min(lgB.maxY, ecoB.maxY) - Math.max(lgB.minY, ecoB.minY);
        if (overX <= 0 || overY <= 0) continue;

        const cLgx = (lgB.minX + lgB.maxX) / 2;
        const cLgy = (lgB.minY + lgB.maxY) / 2;
        const cEcox = (ecoB.minX + ecoB.maxX) / 2;
        const cEcoy = (ecoB.minY + ecoB.maxY) / 2;

        const dx = cLgx - cEcox;
        const dy = cLgy - cEcoy;

        // Push along axis of least overlap
        const pushMag = Math.min(overX, overY) * PARENT_SEP_STRENGTH;
        let px = 0, py = 0;
        if (overX < overY) {
          px = (dx >= 0 ? 1 : -1) * pushMag;
        } else {
          py = (dy >= 0 ? 1 : -1) * pushMag;
        }

        const members = groupMembers.get(lg.id) ?? [];
        for (const id of members) {
          const sn = nodeIndex.get(id);
          if (sn) { sn.vx += px / members.length; sn.vy += py / members.length; }
        }
      }
    }

    // (d2) Non-member exclusion: push nodes out of any group's live bounds
    //      they aren't a member of. Prevents non-members from straddling
    //      a group's border.
    const NON_MEMBER_PUSH_STRENGTH = 0.6;
    const NON_MEMBER_MARGIN = 8;
    for (const group of leafGroupNodes) {
      const b = liveBounds.get(group.id);
      if (!b) continue;
      const memberSet = new Set(groupMembers.get(group.id) ?? []);
      // Rendered group bounds = tight member bounds + GROUP_BOX_PADDING.
      // liveBounds added a pad of 60, so subtract it back to recover tight,
      // then expand by GROUP_BOX_PADDING to match what's drawn on screen.
      const tMinX = b.minX + 60 - GROUP_BOX_PADDING - NON_MEMBER_MARGIN;
      const tMaxX = b.maxX - 60 + GROUP_BOX_PADDING + NON_MEMBER_MARGIN;
      const tMinY = b.minY + 60 - GROUP_BOX_PADDING - NON_MEMBER_MARGIN;
      const tMaxY = b.maxY - 60 + GROUP_BOX_PADDING + NON_MEMBER_MARGIN;

      for (const sn of simNodes) {
        if (memberSet.has(sn.id)) continue;
        // Check if this node's rect intersects the group's tight bounds
        const nLeft = sn.x - sn.width / 2;
        const nRight = sn.x + sn.width / 2;
        const nTop = sn.y - NODE_HEIGHT / 2;
        const nBottom = sn.y + NODE_HEIGHT / 2;
        if (nRight <= tMinX || nLeft >= tMaxX || nBottom <= tMinY || nTop >= tMaxY) {
          continue;
        }

        // Compute distance to push out each side
        const pushRight = tMaxX - nLeft;   // push right by this to clear
        const pushLeft = nRight - tMinX;   // push left by this to clear
        const pushDown = tMaxY - nTop;
        const pushUp = nBottom - tMinY;

        const minPush = Math.min(pushRight, pushLeft, pushDown, pushUp);
        if (minPush === pushRight) {
          sn.vx += pushRight * NON_MEMBER_PUSH_STRENGTH;
        } else if (minPush === pushLeft) {
          sn.vx -= pushLeft * NON_MEMBER_PUSH_STRENGTH;
        } else if (minPush === pushDown) {
          sn.vy += pushDown * NON_MEMBER_PUSH_STRENGTH;
        } else {
          sn.vy -= pushUp * NON_MEMBER_PUSH_STRENGTH;
        }
      }
    }

    // (e) Hard overlap resolution
    for (let i = 0; i < simNodes.length; i++) {
      for (let j = i + 1; j < simNodes.length; j++) {
        const a = simNodes[i];
        const b = simNodes[j];

        const halfWa = a.width / 2 + OVERLAP_MARGIN;
        const halfWb = b.width / 2 + OVERLAP_MARGIN;
        const halfH = NODE_HEIGHT / 2 + OVERLAP_MARGIN;

        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const overlapX = halfWa + halfWb - Math.abs(dx);
        const overlapY = halfH + halfH - Math.abs(dy);

        if (overlapX > 0 && overlapY > 0) {
          if (overlapX < overlapY) {
            const push = overlapX * OVERLAP_PUSH_STRENGTH * 0.5;
            const dirX = dx >= 0 ? 1 : -1;
            a.vx -= dirX * push;
            b.vx += dirX * push;
          } else {
            const push = overlapY * OVERLAP_PUSH_STRENGTH * 0.5;
            const dirY = dy >= 0 ? 1 : -1;
            a.vy -= dirY * push;
            b.vy += dirY * push;
          }
        }
      }
    }

    // Apply velocities
    let maxV = 0;
    for (const sn of simNodes) {
      sn.x += sn.vx;
      sn.y += sn.vy;
      maxV = Math.max(maxV, Math.abs(sn.vx), Math.abs(sn.vy));
    }

    if (maxV < MIN_VELOCITY) break;
  }

  // ── Final overlap cleanup ─────────────────────────────────────────
  for (let pass = 0; pass < 100; pass++) {
    let anyOverlap = false;
    for (let i = 0; i < simNodes.length; i++) {
      for (let j = i + 1; j < simNodes.length; j++) {
        const a = simNodes[i];
        const b = simNodes[j];

        const halfWa = a.width / 2 + OVERLAP_MARGIN;
        const halfWb = b.width / 2 + OVERLAP_MARGIN;
        const halfH = NODE_HEIGHT / 2 + OVERLAP_MARGIN;

        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const overlapX = halfWa + halfWb - Math.abs(dx);
        const overlapY = halfH + halfH - Math.abs(dy);

        if (overlapX > 0 && overlapY > 0) {
          anyOverlap = true;
          if (overlapX < overlapY) {
            const push = overlapX * 0.5;
            const dirX = dx >= 0 ? 1 : -1;
            a.x -= dirX * push;
            b.x += dirX * push;
          } else {
            const push = overlapY * 0.5;
            const dirY = dy >= 0 ? 1 : -1;
            a.y -= dirY * push;
            b.y += dirY * push;
          }
        }
      }
    }
    if (!anyOverlap) break;
  }

  // ── Step 4: Normalize — shift so content starts at padding ─────────
  // Account for group bounds overhead: leaf group adds 24 (box padding) + 22 (label height)
  // above the topmost node, and parent groups add 12 (parent padding) + 22 (label height)
  // on top of that.
  const groupOverhead = 24 + GROUP_LABEL_HEIGHT
    + (parentGroupIds.size > 0 ? 12 + GROUP_LABEL_HEIGHT : 0);
  const padding = 40 + groupOverhead;
  let minX = Infinity;
  let minY = Infinity;
  for (const sn of simNodes) {
    minX = Math.min(minX, sn.x - sn.width / 2);
    minY = Math.min(minY, sn.y - NODE_HEIGHT / 2);
  }

  const offsetX = padding - minX;
  const offsetY = padding - minY;

  for (const sn of simNodes) {
    sn.x += offsetX;
    sn.y += offsetY;
  }

  const sizedNodeMap = new Map(sizedNodes.map((n) => [n.id, n]));
  type PositionedN = N & { x: number; y: number; groupIds: string[] };

  // ── Step 6: Compute group bounding boxes ──────────────────────────
  const PARENT_GROUP_PADDING = 12;

  function computeAllGroupBounds(): Map<string, ComputedGroupBounds> {
    const boundsMap = new Map<string, ComputedGroupBounds>();

    for (const group of leafGroupNodes) {
      const members = groupMembers.get(group.id) ?? [];
      const memberSims = members
        .map((id) => nodeIndex.get(id))
        .filter((n): n is SimNode => n != null);

      if (memberSims.length === 0) {
        boundsMap.set(group.id, {
          groupId: group.id, childGroupIds: [], x: 0, y: 0, width: 0, height: 0,
        });
        continue;
      }

      let gMinX = Infinity, gMinY = Infinity, gMaxX = -Infinity, gMaxY = -Infinity;
      for (const sn of memberSims) {
        gMinX = Math.min(gMinX, sn.x - sn.width / 2);
        gMaxX = Math.max(gMaxX, sn.x + sn.width / 2);
        gMinY = Math.min(gMinY, sn.y - NODE_HEIGHT / 2);
        gMaxY = Math.max(gMaxY, sn.y + NODE_HEIGHT / 2);
      }

      boundsMap.set(group.id, {
        groupId: group.id,
        childGroupIds: [],
        x: gMinX - GROUP_BOX_PADDING,
        y: gMinY - GROUP_BOX_PADDING - GROUP_LABEL_HEIGHT,
        width: gMaxX - gMinX + GROUP_BOX_PADDING * 2,
        height: gMaxY - gMinY + GROUP_BOX_PADDING * 2 + GROUP_LABEL_HEIGHT,
      });
    }

    for (const parentGroup of groupNodes.filter((g) => parentGroupIds.has(g.id))) {
      const children = groupChildren.get(parentGroup.id) ?? [];
      const childBoundsList = children
        .map((cid) => boundsMap.get(cid))
        .filter((b): b is ComputedGroupBounds => b != null && b.width > 0);

      if (childBoundsList.length === 0) continue;

      let pMinX = Infinity, pMinY = Infinity, pMaxX = -Infinity, pMaxY = -Infinity;
      for (const cb of childBoundsList) {
        pMinX = Math.min(pMinX, cb.x);
        pMinY = Math.min(pMinY, cb.y);
        pMaxX = Math.max(pMaxX, cb.x + cb.width);
        pMaxY = Math.max(pMaxY, cb.y + cb.height);
      }

      boundsMap.set(parentGroup.id, {
        groupId: parentGroup.id,
        childGroupIds: children,
        x: pMinX - PARENT_GROUP_PADDING,
        y: pMinY - PARENT_GROUP_PADDING - GROUP_LABEL_HEIGHT,
        width: pMaxX - pMinX + PARENT_GROUP_PADDING * 2,
        height: pMaxY - pMinY + PARENT_GROUP_PADDING * 2 + GROUP_LABEL_HEIGHT,
      });
    }

    return boundsMap;
  }

  const groupBoundsMap = computeAllGroupBounds();

  // ── Step 6b: Expand group bounds to contain all member node rects ──
  // The tight-fit bounds only consider node centers. Expand each group's
  // bounds so that every member node's full rect (including width) fits.
  for (const group of leafGroupNodes) {
    const gb = groupBoundsMap.get(group.id);
    if (!gb || gb.width === 0) continue;

    const members = groupMembers.get(group.id) ?? [];
    for (const id of members) {
      const sn = nodeIndex.get(id);
      if (!sn) continue;

      const nodeLeft = sn.x - sn.width / 2;
      const nodeRight = sn.x + sn.width / 2;
      const nodeTop = sn.y - NODE_HEIGHT / 2;
      const nodeBottom = sn.y + NODE_HEIGHT / 2;

      const gbRight = gb.x + gb.width;
      const gbBottom = gb.y + gb.height;
      const contentTop = gb.y + GROUP_LABEL_HEIGHT;

      if (nodeLeft < gb.x + GROUP_BOX_PADDING) {
        const expand = (gb.x + GROUP_BOX_PADDING) - nodeLeft;
        gb.x -= expand;
        gb.width += expand;
      }
      if (nodeRight > gbRight - GROUP_BOX_PADDING) {
        const expand = nodeRight - (gbRight - GROUP_BOX_PADDING);
        gb.width += expand;
      }
      if (nodeTop < contentTop + GROUP_BOX_PADDING) {
        const expand = (contentTop + GROUP_BOX_PADDING) - nodeTop;
        gb.y -= expand;
        gb.height += expand;
      }
      if (nodeBottom > gbBottom - GROUP_BOX_PADDING) {
        const expand = nodeBottom - (gbBottom - GROUP_BOX_PADDING);
        gb.height += expand;
      }
    }
  }

  // ── Step 6c: Iteratively push non-member nodes out of any group bounds ──
  // After Step 6b expansion, a non-member node's rect might still intersect
  // a group's bounds. Push it out the nearest edge, then re-expand bounds
  // for members of any groups it actually belongs to.
  for (let pass = 0; pass < 50; pass++) {
    let movedAny = false;

    for (const group of leafGroupNodes) {
      const gb = groupBoundsMap.get(group.id);
      if (!gb || gb.width === 0) continue;

      const memberSet = new Set(groupMembers.get(group.id) ?? []);
      const gbRight = gb.x + gb.width;
      const gbBottom = gb.y + gb.height;

      for (const sn of simNodes) {
        if (memberSet.has(sn.id)) continue;

        const nLeft = sn.x - sn.width / 2;
        const nRight = sn.x + sn.width / 2;
        const nTop = sn.y - NODE_HEIGHT / 2;
        const nBottom = sn.y + NODE_HEIGHT / 2;

        // Check intersection with group bounds
        if (nRight <= gb.x || nLeft >= gbRight || nBottom <= gb.y || nTop >= gbBottom) {
          continue;
        }

        // Push out by the smallest distance
        const pushRight = gbRight - nLeft + 4;
        const pushLeft = nRight - gb.x + 4;
        const pushDown = gbBottom - nTop + 4;
        const pushUp = nBottom - gb.y + 4;

        const minPush = Math.min(pushRight, pushLeft, pushDown, pushUp);
        if (minPush === pushRight) {
          sn.x += pushRight;
        } else if (minPush === pushLeft) {
          sn.x -= pushLeft;
        } else if (minPush === pushDown) {
          sn.y += pushDown;
        } else {
          sn.y -= pushUp;
        }
        movedAny = true;
      }
    }

    // Re-expand member bounds since we may have moved nodes (members
    // can shift in the overlap-resolution sweep below). Always run this,
    // even when no non-members moved, so the final bounds reflect final
    // node positions.
    for (const group of leafGroupNodes) {
      const gb = groupBoundsMap.get(group.id);
      if (!gb || gb.width === 0) continue;
      const members = groupMembers.get(group.id) ?? [];

      // Recompute tight bounds from current member positions
      let gMinX = Infinity, gMinY = Infinity, gMaxX = -Infinity, gMaxY = -Infinity;
      for (const id of members) {
        const sn = nodeIndex.get(id);
        if (!sn) continue;
        gMinX = Math.min(gMinX, sn.x - sn.width / 2);
        gMaxX = Math.max(gMaxX, sn.x + sn.width / 2);
        gMinY = Math.min(gMinY, sn.y - NODE_HEIGHT / 2);
        gMaxY = Math.max(gMaxY, sn.y + NODE_HEIGHT / 2);
      }
      if (gMinX === Infinity) continue;

      gb.x = gMinX - GROUP_BOX_PADDING;
      gb.y = gMinY - GROUP_BOX_PADDING - GROUP_LABEL_HEIGHT;
      gb.width = gMaxX - gMinX + GROUP_BOX_PADDING * 2;
      gb.height = gMaxY - gMinY + GROUP_BOX_PADDING * 2 + GROUP_LABEL_HEIGHT;
    }

    // Re-resolve hard node-node overlaps caused by the push
    for (let op = 0; op < 20; op++) {
      let any = false;
      for (let i = 0; i < simNodes.length; i++) {
        for (let j = i + 1; j < simNodes.length; j++) {
          const a = simNodes[i];
          const b = simNodes[j];
          const halfWa = a.width / 2 + OVERLAP_MARGIN;
          const halfWb = b.width / 2 + OVERLAP_MARGIN;
          const halfH = NODE_HEIGHT / 2 + OVERLAP_MARGIN;
          const dx = b.x - a.x;
          const dy = b.y - a.y;
          const overlapX = halfWa + halfWb - Math.abs(dx);
          const overlapY = halfH + halfH - Math.abs(dy);
          if (overlapX > 0 && overlapY > 0) {
            any = true;
            if (overlapX < overlapY) {
              const push = overlapX * 0.5;
              const dirX = dx >= 0 ? 1 : -1;
              a.x -= dirX * push;
              b.x += dirX * push;
            } else {
              const push = overlapY * 0.5;
              const dirY = dy >= 0 ? 1 : -1;
              a.y -= dirY * push;
              b.y += dirY * push;
            }
          }
        }
      }
      if (!any) break;
    }

    if (!movedAny) break;
  }

  // Recompute parent group bounds after expansion
  for (const parentGroup of groupNodes.filter((g) => parentGroupIds.has(g.id))) {
    const children = groupChildren.get(parentGroup.id) ?? [];
    const childBoundsList = children
      .map((cid) => groupBoundsMap.get(cid))
      .filter((b): b is ComputedGroupBounds => b != null && b.width > 0);
    if (childBoundsList.length === 0) continue;

    let pMinX = Infinity, pMinY = Infinity, pMaxX = -Infinity, pMaxY = -Infinity;
    for (const cb of childBoundsList) {
      pMinX = Math.min(pMinX, cb.x);
      pMinY = Math.min(pMinY, cb.y);
      pMaxX = Math.max(pMaxX, cb.x + cb.width);
      pMaxY = Math.max(pMaxY, cb.y + cb.height);
    }

    const existing = groupBoundsMap.get(parentGroup.id);
    if (existing) {
      existing.x = pMinX - PARENT_GROUP_PADDING;
      existing.y = pMinY - PARENT_GROUP_PADDING - GROUP_LABEL_HEIGHT;
      existing.width = pMaxX - pMinX + PARENT_GROUP_PADDING * 2;
      existing.height = pMaxY - pMinY + PARENT_GROUP_PADDING * 2 + GROUP_LABEL_HEIGHT;
    }
  }

  const groupBounds: ComputedGroupBounds[] = groupNodes
    .filter((g) => groupBoundsMap.has(g.id))
    .map((g) => groupBoundsMap.get(g.id)!);

  // ── Step 7: Compute overlap zones ─────────────────────────────────
  const overlapZones: OverlapZone[] = [];

  for (let i = 0; i < leafGroupNodes.length; i++) {
    const membersA = new Set(groupMembers.get(leafGroupNodes[i].id) ?? []);
    for (let j = i + 1; j < leafGroupNodes.length; j++) {
      const membersB = groupMembers.get(leafGroupNodes[j].id) ?? [];
      const shared = membersB.filter((id) => membersA.has(id));
      if (shared.length === 0) continue;

      const boundsA = groupBoundsMap.get(leafGroupNodes[i].id);
      const boundsB = groupBoundsMap.get(leafGroupNodes[j].id);
      if (!boundsA || !boundsB) continue;

      const ix1 = Math.max(boundsA.x, boundsB.x);
      const iy1 = Math.max(boundsA.y, boundsB.y);
      const ix2 = Math.min(
        boundsA.x + boundsA.width,
        boundsB.x + boundsB.width,
      );
      const iy2 = Math.min(
        boundsA.y + boundsA.height,
        boundsB.y + boundsB.height,
      );

      if (ix2 > ix1 && iy2 > iy1) {
        overlapZones.push({
          groupIds: [leafGroupNodes[i].id, leafGroupNodes[j].id],
          sharedNodeIds: shared,
          x: ix1,
          y: iy1,
          width: ix2 - ix1,
          height: iy2 - iy1,
        });
      }
    }
  }

  // ── Step 8: Build positioned nodes from final simNode positions ────
  const positioned: PositionedN[] = simNodes.map((sn) => {
    const original = sizedNodeMap.get(sn.id)!;
    return {
      ...original,
      x: sn.x,
      y: sn.y,
      groupIds: nodeGroups.get(sn.id) ?? [],
    } as PositionedN;
  });

  return { nodes: positioned, groupBounds, overlapZones };
}

// ─── Auto-sizing ────────────────────────────────────────────────────────────

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

  return Math.max(computed, node.layout.width);
}
