// Translation of survival package test: residsf.R
// R reference JSON: residsf-source-test.R (sibling file)
// Tests residuals.survfit — influence-based residuals for survfit objects
//
// Coverage of residsf.R:
// [ ] residuals.survfit with influence=TRUE — influence computation not yet available
// [ ] IJ variance estimates from survfit influence — requires influence support
// [ ] residuals for cumulative hazard (cumhaz) — needs influence in survfit
// [ ] multi-state survfit residuals — Tier 4
//
// NOTE: residuals.survfit depends on influence matrix computation within
// survfit. Our current survfit WASM does not expose influence arrays.

import { getReferenceFromRScript } from "./survival-test-helpers.ts";

const R_SOURCE_TEST = new URL("./residsf-source-test.R", import.meta.url)
  .pathname;

interface ResidsfRef {
  surv: number[];
  time: number[];
  n_risk: number[];
  note: string;
}

const ref = getReferenceFromRScript<ResidsfRef>(R_SOURCE_TEST);

Deno.test("residsf: R reference extraction works (survfit influence)", () => {
  // Verify R reference extracts correctly
  // Influence-based residuals require survfit influence support
  if (ref.surv.length === 0) {
    throw new Error("Expected non-empty survival probabilities from R");
  }
  if (ref.time.length !== ref.surv.length) {
    throw new Error("Expected time and surv arrays to have same length");
  }
});
