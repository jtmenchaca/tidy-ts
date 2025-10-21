/**
 * Take first N traces or slice trace range
 */

import type { XESTrace } from "../../readXES.ts";
import type { XESAttributes } from "../../types.ts";

export function sliceTraces(n: number) {
  return (traces: readonly XESTrace[], attributes: XESAttributes) => {
    return {
      traces: traces.slice(0, n),
      attributes,
    };
  };
}

export function sliceTracesRange(start: number, end: number) {
  return (traces: readonly XESTrace[], attributes: XESAttributes) => {
    return {
      traces: traces.slice(start, end),
      attributes,
    };
  };
}
