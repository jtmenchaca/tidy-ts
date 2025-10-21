/**
 * Start and End Activities Analysis
 * Find start and end activities in process traces
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

/**
 * Find start and end activities
 */
export function getStartEndActivities(log: XESLogData): {
  startActivities: Map<string, number>;
  endActivities: Map<string, number>;
} {
  const startActivities = new Map<string, number>();
  const endActivities = new Map<string, number>();

  for (const trace of log.traces) {
    if (trace.events.length === 0) continue;

    const sorted = sortedEvents(trace.events);
    const firstEvent = sorted[0];
    const lastEvent = sorted[sorted.length - 1];

    const startActivity = firstEvent["concept:name"] || firstEvent.activity;
    const endActivity = lastEvent["concept:name"] || lastEvent.activity;

    if (typeof startActivity === "string") {
      startActivities.set(
        startActivity,
        (startActivities.get(startActivity) || 0) + 1,
      );
    }

    if (typeof endActivity === "string") {
      endActivities.set(endActivity, (endActivities.get(endActivity) || 0) + 1);
    }
  }

  return { startActivities, endActivities };
}
