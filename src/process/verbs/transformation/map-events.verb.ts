/**
 * Map events within each trace
 */

import type { XESEvent, XESTrace } from "../../readXES.ts";
import type { XESAttributes } from "../../types.ts";

export function mapEvents(fn: (event: XESEvent, trace: XESTrace) => XESEvent) {
  return (traces: readonly XESTrace[], attributes: XESAttributes) => {
    return {
      traces: traces.map((trace) => ({
        ...trace,
        events: trace.events.map((event) => fn(event, trace)),
      })),
      attributes,
    };
  };
}
