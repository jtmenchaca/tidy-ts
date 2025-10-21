/**
 * Directly-Follows Graph (DFG) construction
 * Foundation for many process mining algorithms
 */

import type { XESLogData } from "../../readXES.ts";
import type { Activity, DFG, DFGEdge } from "../../types.ts";

/**
 * Sort events by timestamp with NaN-safe handling
 */
function sortByTime(
  events: Array<Record<string, unknown>>,
): Array<Record<string, unknown>> {
  return [...events].map((e, i) => ({ e, i }))
    .sort((a, b) => {
      const ta = a.e["time:timestamp"] ?? a.e["timestamps"];
      const tb = b.e["time:timestamp"] ?? b.e["timestamps"];
      const da = ta instanceof Date ? ta : new Date(String(ta));
      const db = tb instanceof Date ? tb : new Date(String(tb));
      const aT = isNaN(da.getTime()) ? Number.POSITIVE_INFINITY : da.getTime();
      const bT = isNaN(db.getTime()) ? Number.POSITIVE_INFINITY : db.getTime();
      const dt = aT - bT;
      return dt !== 0 ? dt : a.i - b.i; // stable tiebreaker by original index
    })
    .map((x) => x.e);
}

/**
 * Build a Directly-Follows Graph from an XES event log
 * Core data structure for process discovery algorithms
 */
export function buildDFG(log: XESLogData): DFG {
  const activities = new Set<Activity>();
  const edges = new Map<string, DFGEdge>();
  const startActivities = new Map<Activity, number>();
  const endActivities = new Map<Activity, number>();

  for (const trace of log.traces) {
    if (trace.events.length === 0) continue;

    // CRITICAL: Sort events by timestamp to ensure correct ordering
    const sortedTrace = sortByTime(trace.events);

    // Extract activity names
    const getActivity = (e: Record<string, unknown>): string | undefined => {
      const act = e["concept:name"] ?? e["activity"];
      return typeof act === "string" ? act : undefined;
    };

    const firstAct = getActivity(sortedTrace[0]);
    if (!firstAct) continue;

    activities.add(firstAct);
    startActivities.set(firstAct, (startActivities.get(firstAct) || 0) + 1);

    const lastAct = getActivity(sortedTrace[sortedTrace.length - 1]);
    if (lastAct) {
      activities.add(lastAct);
      endActivities.set(lastAct, (endActivities.get(lastAct) || 0) + 1);
    }

    // Build directly-follows edges
    for (let i = 0; i < sortedTrace.length - 1; i++) {
      const from = getActivity(sortedTrace[i]);
      const to = getActivity(sortedTrace[i + 1]);

      if (!from || !to) continue;

      activities.add(from);
      activities.add(to);

      const key = `${from}->${to}`;
      const existing = edges.get(key);

      if (existing) {
        existing.frequency++;
      } else {
        edges.set(key, { from, to, frequency: 1 });
      }
    }
  }

  return {
    activities,
    edges,
    startActivities,
    endActivities,
  };
}

/**
 * Calculate percentile threshold from sorted values
 * Handles edge cases and avoids off-by-one errors
 */
function percentileThreshold(values: number[], p: number): number {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const clampedP = Math.min(Math.max(p, 0), 1);
  const idx = Math.floor((sorted.length - 1) * clampedP);
  return sorted[idx];
}

/**
 * Filter DFG by removing infrequent edges
 * Used in Split Miner and other noise-reduction techniques
 * Keeps edges with frequency STRICTLY GREATER than the percentile threshold
 */
export function filterDFG(dfg: DFG, percentile: number): DFG {
  const edgeArray = Array.from(dfg.edges.values());
  const frequencies = edgeArray.map((e) => e.frequency);

  const threshold = percentileThreshold(frequencies, percentile);

  const filteredEdges = new Map<string, DFGEdge>();
  for (const [key, edge] of dfg.edges.entries()) {
    if (edge.frequency > threshold) {
      filteredEdges.set(key, edge);
    }
  }

  return {
    ...dfg,
    edges: filteredEdges,
  };
}

/**
 * Get activities that directly follow a given activity
 */
export function getDirectSuccessors(
  dfg: DFG,
  activity: Activity,
): Set<Activity> {
  const successors = new Set<Activity>();
  for (const edge of dfg.edges.values()) {
    if (edge.from === activity) {
      successors.add(edge.to);
    }
  }
  return successors;
}

/**
 * Get activities that directly precede a given activity
 */
export function getDirectPredecessors(
  dfg: DFG,
  activity: Activity,
): Set<Activity> {
  const predecessors = new Set<Activity>();
  for (const edge of dfg.edges.values()) {
    if (edge.to === activity) {
      predecessors.add(edge.from);
    }
  }
  return predecessors;
}

/**
 * Check if there's a path between two activities in the DFG
 */
export function hasPath(
  dfg: DFG,
  from: Activity,
  to: Activity,
): boolean {
  const visited = new Set<Activity>();
  const queue: Activity[] = [from];

  while (queue.length > 0) {
    const current = queue.shift()!;
    if (current === to) return true;
    if (visited.has(current)) continue;

    visited.add(current);
    const successors = getDirectSuccessors(dfg, current);
    queue.push(...successors);
  }

  return false;
}

/**
 * Compute activity frequency in the log
 */
export function getActivityFrequency(
  log: XESLogData,
): Map<Activity, number> {
  const freq = new Map<Activity, number>();

  for (const trace of log.traces) {
    for (const event of trace.events) {
      const activity = event["concept:name"] ?? event["activity"];
      if (typeof activity === "string") {
        freq.set(activity, (freq.get(activity) || 0) + 1);
      }
    }
  }

  return freq;
}
