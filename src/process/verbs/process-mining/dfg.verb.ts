/**
 * Build directly-follows graph
 */

import { buildDFG } from "../../analysis/process-discovery/dfg.ts";
import type { DFG } from "../../types.ts";
import type { XESTrace } from "../../readXES.ts";
import type { XESAttributes } from "../../types.ts";

export function dfg() {
  return (
    traces: readonly XESTrace[],
    attributes: XESAttributes,
  ): DFG => {
    return buildDFG({ traces: [...traces], attributes });
  };
}
