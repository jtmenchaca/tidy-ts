/**
 * Bottleneck Detection
 * Detect bottlenecks - activities with long waiting times
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

export interface BottleneckInfo {
  activity: string;
  avgWaitingTime: number; // milliseconds
  cases: number;
  maxWaitingTime: number;
  minWaitingTime: number;
}

/**
 * Detect bottlenecks - activities with long waiting times
 */
export function detectBottlenecks(log: XESLogData): BottleneckInfo[] {
  const bottleneckMap = new Map<string, number[]>();

  for (const trace of log.traces) {
    const sorted = sortedEvents(trace.events);
    for (let i = 0; i < sorted.length - 1; i++) {
      const currentEvent = sorted[i];
      const nextEvent = sorted[i + 1];

      const currentActivity = currentEvent["concept:name"] ||
        currentEvent.activity;
      const currentTime = currentEvent["time:timestamp"] ||
        currentEvent.timestamps;
      const nextTime = nextEvent["time:timestamp"] || nextEvent.timestamps;

      if (
        typeof currentActivity === "string" &&
        currentTime instanceof Date &&
        nextTime instanceof Date
      ) {
        const waitingTime = nextTime.getTime() - currentTime.getTime();

        if (!bottleneckMap.has(currentActivity)) {
          bottleneckMap.set(currentActivity, []);
        }
        bottleneckMap.get(currentActivity)!.push(waitingTime);
      }
    }
  }

  const bottlenecks: BottleneckInfo[] = [];
  for (const [activity, waitingTimes] of bottleneckMap.entries()) {
    if (waitingTimes.length === 0) continue;

    bottlenecks.push({
      activity,
      avgWaitingTime: waitingTimes.reduce((a, b) => a + b, 0) /
        waitingTimes.length,
      cases: waitingTimes.length,
      maxWaitingTime: Math.max(...waitingTimes),
      minWaitingTime: Math.min(...waitingTimes),
    });
  }

  return bottlenecks.sort((a, b) => b.avgWaitingTime - a.avgWaitingTime);
}
