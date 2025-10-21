/**
 * Slice events within each trace
 */

import type { XESTrace } from "../../readXES.ts";
import type { XESAttributes } from "../../types.ts";

export function sliceEvents(start: number, end?: number) {
  return (traces: readonly XESTrace[], attributes: XESAttributes) => {
    return {
      traces: traces.map((trace) => ({
        ...trace,
        events: trace.events.slice(start, end),
      })),
      attributes,
    };
  };
}
