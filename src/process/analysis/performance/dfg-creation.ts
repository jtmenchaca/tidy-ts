/**
 * Directly-Follows Graph (DFG) Creation
 * Shows which activities directly follow each other and how often
 */

import type { XESEvent, XESLogData } from "../../readXES.ts";

/**
 * Sort events by timestamp with stable ordering and NaN-safe handling
 */
function sortedEvents(events: XESEvent[]): XESEvent[] {
  return [...events].sort((a, b) => {
    const ta = a["time:timestamp"] ?? a.timestamps;
    const tb = b["time:timestamp"] ?? b.timestamps;
    const da = ta instanceof Date ? ta : new Date(String(ta));
    const db = tb instanceof Date ? tb : new Date(String(tb));
    const aT = isNaN(da.getTime()) ? Number.POSITIVE_INFINITY : da.getTime();
    const bT = isNaN(db.getTime()) ? Number.POSITIVE_INFINITY : db.getTime();
    return aT - bT;
  });
}

export interface DFGEdge {
  from: string;
  to: string;
  count: number;
}

/**
 * Create a Directly-Follows Graph (DFG)
 * Shows which activities directly follow each other and how often
 */
export function createDFG(log: XESLogData): DFGEdge[] {
  const dfgMap = new Map<string, number>();

  for (const trace of log.traces) {
    const sorted = sortedEvents(trace.events);
    const activities = sorted
      .map((event) => event["concept:name"] || event.activity)
      .filter((activity): activity is string => typeof activity === "string");

    // Create edges for consecutive activities
    for (let i = 0; i < activities.length - 1; i++) {
      const from = activities[i];
      const to = activities[i + 1];
      const key = `${from} → ${to}`;
      dfgMap.set(key, (dfgMap.get(key) || 0) + 1);
    }
  }

  // Convert to array and parse back into structured format
  const edges: DFGEdge[] = [];
  for (const [key, count] of dfgMap.entries()) {
    const [from, to] = key.split(" → ");
    edges.push({ from, to, count });
  }

  return edges.sort((a, b) => b.count - a.count);
}
