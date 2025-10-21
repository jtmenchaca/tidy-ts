/**
 * Get activity statistics with timing information
 */

import type { XESTrace } from "../../readXES.ts";
import { getActivityStats } from "../../analysis/performance/activity-stats.ts";
import type { ActivityStats } from "../../analysis/performance/activity-stats.ts";

export function activityStats() {
  return (traces: readonly XESTrace[]): ActivityStats[] => {
    return getActivityStats({ traces: [...traces], attributes: {} });
  };
}
