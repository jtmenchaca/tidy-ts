/**
 * Sort events by timestamp within each trace
 */

import type { XESTrace } from "../../readXES.ts";
import type { XESAttributes } from "../../types.ts";
import { sortedEvents } from "../../utils/sorted-events.ts";

export function sortEvents() {
  return (traces: readonly XESTrace[], attributes: XESAttributes) => {
    return {
      traces: traces.map((trace) => ({
        ...trace,
        events: sortedEvents(trace.events),
      })),
      attributes,
    };
  };
}
