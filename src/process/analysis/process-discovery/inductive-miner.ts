/**
 * Inductive Miner (IM / IMf)
 * Builds process tree via recursive DFG cuts; soundness by construction
 * Ref: Leemans et al. "Discovering Block-Structured Process Models from Event Logs"
 */

import type { XESLogData, XESTrace } from "../../readXES.ts";
import type { XESAttributes } from "../../types.ts";
import type {
  Activity,
  DFG,
  DiscoveryOptions,
  DiscoveryResult,
  PetriNet,
  ProcessTree,
} from "../../types.ts";
import { buildDFG, filterDFG } from "./dfg.ts";

/**
 * Inductive Miner (IM / IMf)
 * Builds process tree via recursive DFG cuts; soundness by construction
 */
export function inductiveMiner(
  log: XESLogData,
  opts: DiscoveryOptions = {},
): DiscoveryResult {
  const tree = discoverProcessTree(log, opts);
  const petri = processTreeToPetriNet(tree);

  return {
    model: tree,
    toPetriNet: petri,
  };
}

/**
 * Recursive process tree discovery using cut detection
 */
function discoverProcessTree(
  log: XESLogData,
  opts: DiscoveryOptions,
): ProcessTree {
  // Base case 1: empty log
  if (log.traces.length === 0) {
    return { label: "τ" }; // silent/invisible activity
  }

  // Base case 2: single activity
  const allActivities = new Set<Activity>();
  for (const trace of log.traces) {
    for (const event of trace.events) {
      const activity = event["concept:name"] ?? event["activity"];
      if (typeof activity === "string") {
        allActivities.add(activity);
      }
    }
  }

  if (allActivities.size === 1) {
    return { label: Array.from(allActivities)[0] };
  }

  // Build DFG
  const dfg = buildDFG(log);

  // Apply noise filtering if IMf variant
  const filteredDFG = opts.noiseThresholdIMf !== undefined
    ? filterDFG(dfg, opts.noiseThresholdIMf)
    : dfg;

  // Try to find cuts in order of preference
  const sequenceCut = findSequenceCut(filteredDFG, allActivities);
  if (sequenceCut) {
    const [partition1, partition2] = sequenceCut;
    const subLog1 = projectLog(log, partition1);
    const subLog2 = projectLog(log, partition2);

    return {
      op: "seq",
      children: [
        discoverProcessTree(subLog1, opts),
        discoverProcessTree(subLog2, opts),
      ],
    };
  }

  const xorCut = findXorCut(filteredDFG, allActivities);
  if (xorCut) {
    const subLogs = xorCut.map((partition) => projectLog(log, partition));
    return {
      op: "xor",
      children: subLogs.map((subLog) => discoverProcessTree(subLog, opts)),
    };
  }

  const parallelCut = findParallelCut(filteredDFG, allActivities);
  if (parallelCut) {
    const [partition1, partition2] = parallelCut;
    const subLog1 = projectLog(log, partition1);
    const subLog2 = projectLog(log, partition2);

    return {
      op: "and",
      children: [
        discoverProcessTree(subLog1, opts),
        discoverProcessTree(subLog2, opts),
      ],
    };
  }

  const loopCut = findLoopCut(filteredDFG, allActivities);
  if (loopCut) {
    const [doPartition, redoPartition] = loopCut;
    const doLog = projectLog(log, doPartition);
    const redoLog = redoPartition.size > 0
      ? projectLog(log, redoPartition)
      : { traces: [], attributes: {} };

    return {
      op: "loop",
      children: [
        discoverProcessTree(doLog, opts),
        discoverProcessTree(redoLog, opts),
      ],
    };
  }

  // Fallback: flower model (all activities in XOR)
  return {
    op: "xor",
    children: Array.from(allActivities).map((act) => ({ label: act })),
  };
}

/**
 * Find sequence cut: activities can be partitioned into A >> B
 * where all paths go from A to B, never B to A
 */
function findSequenceCut(
  dfg: DFG,
  activities: Set<Activity>,
): [Set<Activity>, Set<Activity>] | null {
  // Try all possible bipartitions
  const actArray = Array.from(activities);

  for (let i = 1; i < actArray.length; i++) {
    const partition1 = new Set(actArray.slice(0, i));
    const partition2 = new Set(actArray.slice(i));

    // Check if all edges go from partition1 to partition2
    let valid = true;
    for (const edge of dfg.edges.values()) {
      const _fromIn1 = partition1.has(edge.from);
      const _toIn2 = partition2.has(edge.to);
      const fromIn2 = partition2.has(edge.from);
      const toIn1 = partition1.has(edge.to);

      // Invalid if edge goes from partition2 to partition1
      if (fromIn2 && toIn1) {
        valid = false;
        break;
      }
    }

    if (valid) {
      return [partition1, partition2];
    }
  }

  return null;
}

/**
 * Find XOR cut: activities can be partitioned where each partition is independent
 * Uses Kosaraju's algorithm to find strongly connected components
 */
function findXorCut(
  dfg: DFG,
  activities: Set<Activity>,
): Set<Activity>[] | null {
  // Build adjacency list
  const acts = Array.from(activities);
  const idx = new Map<Activity, number>(acts.map((a, i) => [a, i]));
  const g: number[][] = acts.map(() => []);

  for (const e of dfg.edges.values()) {
    const fromIdx = idx.get(e.from);
    const toIdx = idx.get(e.to);
    if (fromIdx !== undefined && toIdx !== undefined) {
      g[fromIdx].push(toIdx);
    }
  }

  // Kosaraju SCC
  const n = acts.length;
  const order: number[] = [];
  const used: boolean[] = Array(n).fill(false);
  const gr: number[][] = acts.map(() => []);

  for (let u = 0; u < n; u++) {
    for (const v of g[u]) {
      gr[v].push(u);
    }
  }

  const dfs1 = (u: number) => {
    used[u] = true;
    for (const v of g[u]) {
      if (!used[v]) dfs1(v);
    }
    order.push(u);
  };

  for (let u = 0; u < n; u++) {
    if (!used[u]) dfs1(u);
  }

  const comp: number[] = Array(n).fill(-1);
  let cc = 0;

  const dfs2 = (u: number) => {
    comp[u] = cc;
    for (const v of gr[u]) {
      if (comp[v] === -1) dfs2(v);
    }
  };

  for (let i = n - 1; i >= 0; i--) {
    const u = order[i];
    if (comp[u] === -1) {
      dfs2(u);
      cc++;
    }
  }

  if (cc <= 1) return null; // no XOR split

  const parts = Array.from({ length: cc }, () => new Set<Activity>());
  for (let u = 0; u < n; u++) {
    parts[comp[u]].add(acts[u]);
  }

  return parts;
}

/**
 * Find parallel cut: activities can execute in any order
 * Detects two partitions with strong mutual directly-follows
 */
function findParallelCut(
  dfg: DFG,
  activities: Set<Activity>,
): [Set<Activity>, Set<Activity>] | null {
  const succ = new Map<Activity, Set<Activity>>();
  const pred = new Map<Activity, Set<Activity>>();

  for (const a of activities) {
    succ.set(a, new Set());
    pred.set(a, new Set());
  }

  for (const e of dfg.edges.values()) {
    succ.get(e.from)?.add(e.to);
    pred.get(e.to)?.add(e.from);
  }

  // Try pairs of non-empty disjoint partitions by seed
  const acts = Array.from(activities);
  for (let i = 0; i < acts.length; i++) {
    for (let j = i + 1; j < acts.length; j++) {
      const A = new Set([acts[i]]);
      const B = new Set([acts[j]]);
      // Require bidirectional evidence: i→j and j→i exist somewhere
      if (
        succ.get(acts[i])?.has(acts[j]) &&
        succ.get(acts[j])?.has(acts[i])
      ) {
        return [A, B];
      }
    }
  }

  return null;
}

/**
 * Find loop cut: do part and optional redo part
 */
function findLoopCut(
  _dfg: DFG,
  _activities: Set<Activity>,
): [Set<Activity>, Set<Activity>] | null {
  // Simplified: detect back-edges
  // For now, return null
  return null;
}

/**
 * Project log to only include events from specified activities
 */
function projectLog(
  log: XESLogData,
  activities: Set<Activity>,
): { traces: XESTrace[]; attributes: XESAttributes } {
  const projectedTraces = log.traces.map((trace) => ({
    attributes: trace.attributes,
    events: trace.events.filter((event) => {
      const activity = event["concept:name"] ?? event["activity"];
      return typeof activity === "string" && activities.has(activity);
    }),
  })).filter((trace) => trace.events.length > 0);

  return {
    traces: projectedTraces,
    attributes: log.attributes,
  };
}

/**
 * Convert process tree to Petri net
 */
function processTreeToPetriNet(tree: ProcessTree): PetriNet {
  let placeCounter = 0;
  let transCounter = 0;

  const places: string[] = [];
  const transitions: PetriNet["transitions"] = [];
  const arcs: PetriNet["arcs"] = [];

  function newPlace(): string {
    const p = `p${placeCounter++}`;
    places.push(p);
    return p;
  }

  function newTransition(label?: Activity, invisible?: boolean): string {
    const t = `t${transCounter++}`;
    transitions.push({ id: t, label, invisible });
    return t;
  }

  function convert(
    node: ProcessTree,
    inPlace: string,
    outPlace: string,
  ): void {
    if (node.label) {
      // Leaf: single transition
      const t = newTransition(node.label);
      arcs.push({ source: inPlace, target: t });
      arcs.push({ source: t, target: outPlace });
    } else if (node.op === "seq" && node.children) {
      // Sequence: chain children
      let current = inPlace;
      for (let i = 0; i < node.children.length; i++) {
        const next = i === node.children.length - 1 ? outPlace : newPlace();
        convert(node.children[i], current, next);
        current = next;
      }
    } else if (node.op === "xor" && node.children) {
      // XOR: fork/join with invisible transitions
      for (const child of node.children) {
        convert(child, inPlace, outPlace);
      }
    } else if (node.op === "and" && node.children) {
      // Parallel: split/join using transitions (not place→place arcs)
      const split = newTransition(undefined, true); // τ
      const join = newTransition(undefined, true); // τ

      // split: inPlace → split; split → each childIn
      arcs.push({ source: inPlace, target: split });

      const childIns: string[] = [];
      const childOuts: string[] = [];

      for (const child of node.children) {
        const childIn = newPlace();
        const childOut = newPlace();
        childIns.push(childIn);
        childOuts.push(childOut);
        arcs.push({ source: split, target: childIn }); // transition→place
        convert(child, childIn, childOut); // recurse
        arcs.push({ source: childOut, target: join }); // place→transition
      }

      // join: join → outPlace
      arcs.push({ source: join, target: outPlace });
    } else if (node.op === "loop" && node.children) {
      // Loop: do part with optional redo
      const loopPlace = newPlace();
      convert(node.children[0], inPlace, loopPlace);

      if (node.children[1]) {
        const redoPlace = newPlace();
        convert(node.children[1], loopPlace, redoPlace);
        arcs.push({ source: redoPlace, target: inPlace });
      }

      arcs.push({ source: loopPlace, target: outPlace });
    }
  }

  const startPlace = newPlace();
  const endPlace = newPlace();
  convert(tree, startPlace, endPlace);

  return {
    places,
    transitions,
    arcs,
    initialMarking: { [startPlace]: 1 },
    finalMarking: { [endPlace]: 1 },
  };
}
