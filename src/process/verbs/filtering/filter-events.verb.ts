/**
 * Filter events within each trace (keeps all traces)
 */

import type { XESEvent, XESTrace } from "../../readXES.ts";
import type { XESAttributes } from "../../types.ts";

export function filterEvents(
  predicate: (event: XESEvent, trace: XESTrace) => boolean,
) {
  return (traces: readonly XESTrace[], attributes: XESAttributes) => {
    return {
      traces: traces.map((trace) => ({
        ...trace,
        events: trace.events.filter((event) => predicate(event, trace)),
      })),
      attributes,
    };
  };
}
