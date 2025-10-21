/**
 * Keep only traces containing specific activity
 */

import type { XESTrace } from "../../readXES.ts";
import type { XESAttributes } from "../../types.ts";

export function filterTracesWithActivity(activity: string) {
  return (traces: readonly XESTrace[], attributes: XESAttributes) => {
    return {
      traces: traces.filter((trace) =>
        trace.events.some((event) =>
          (event["concept:name"] || event.activity) === activity
        )
      ),
      attributes,
    };
  };
}
