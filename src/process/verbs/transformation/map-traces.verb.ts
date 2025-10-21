/**
 * Map over traces, transforming each one
 */

import type { XESTrace } from "../../readXES.ts";
import type { XESAttributes } from "../../types.ts";

export function mapTraces(fn: (trace: XESTrace, index: number) => XESTrace) {
  return (traces: readonly XESTrace[], attributes: XESAttributes) => {
    return {
      traces: traces.map(fn),
      attributes,
    };
  };
}
