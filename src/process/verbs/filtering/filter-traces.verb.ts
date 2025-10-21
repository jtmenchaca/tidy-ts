/**
 * Filter traces by predicate
 */

import type { XESTrace } from "../../readXES.ts";
import type { XESAttributes } from "../../types.ts";

export function filterTraces(
  predicate: (trace: XESTrace, index: number) => boolean,
) {
  return (traces: readonly XESTrace[], attributes: XESAttributes) => {
    return {
      traces: traces.filter(predicate),
      attributes,
    };
  };
}
