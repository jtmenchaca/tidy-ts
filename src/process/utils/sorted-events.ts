/**
 * Sort events by timestamp with stable ordering and NaN-safe handling
 * Shared utility function used across multiple verb files
 */

import type { XESEvent } from "../readXES.ts";

/**
 * Sort events by timestamp with stable ordering and NaN-safe handling
 */
export function sortedEvents(events: XESEvent[]): XESEvent[] {
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
