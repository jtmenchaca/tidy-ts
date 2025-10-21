/**
 * Get start and end activities
 */

import type { XESTrace } from "../../readXES.ts";
import { getStartEndActivities } from "../../analysis/performance/start-end-activities.ts";

export function startEndActivities() {
  return (traces: readonly XESTrace[]): {
    startActivities: Map<string, number>;
    endActivities: Map<string, number>;
  } => {
    return getStartEndActivities({ traces: [...traces], attributes: {} });
  };
}
