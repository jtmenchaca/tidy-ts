/**
 * Activity Statistics Analysis
 * Get activity statistics with timing information
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

export interface ActivityStats {
  activity: string;
  frequency: number;
  avgDuration?: number;
  minDuration?: number;
  maxDuration?: number;
}

/**
 * Get activity statistics with timing information
 */
export function getActivityStats(log: XESLogData): ActivityStats[] {
  const activityMap = new Map<string, number[]>();

  for (const trace of log.traces) {
    const sorted = sortedEvents(trace.events);
    for (let i = 0; i < sorted.length; i++) {
      const event = sorted[i];
      const activity = event["concept:name"] || event.activity;
      if (typeof activity !== "string") continue;

      // Initialize activity tracking
      if (!activityMap.has(activity)) {
        activityMap.set(activity, []);
      }

      // Calculate duration if we have next event timestamp
      if (i < sorted.length - 1) {
        const currentTime = event["time:timestamp"] || event.timestamps;
        const nextTime = sorted[i + 1]["time:timestamp"] ||
          sorted[i + 1].timestamps;

        if (currentTime instanceof Date && nextTime instanceof Date) {
          const duration = nextTime.getTime() - currentTime.getTime();
          activityMap.get(activity)!.push(duration);
        }
      }
    }
  }

  const stats: ActivityStats[] = [];
  for (const [activity, durations] of activityMap.entries()) {
    const stat: ActivityStats = {
      activity,
      frequency: durations.length,
    };

    if (durations.length > 0) {
      stat.avgDuration = durations.reduce((a, b) => a + b, 0) /
        durations.length;
      stat.minDuration = Math.min(...durations);
      stat.maxDuration = Math.max(...durations);
    }

    stats.push(stat);
  }

  return stats.sort((a, b) => b.frequency - a.frequency);
}
