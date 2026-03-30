// Translation of survival package test: coxsurv4.R
// R reference JSON: coxsurv4-source-test.R (sibling file)
// Tests strata-by-covariate interactions in Cox survival curves
//
// Coverage of coxsurv4.R:
// [ ] L1-10: coxph(age * strata(sex) + strata(ph.ecog)) — needs strata-by-covariate interaction
// [ ] L12+:  survfit subscripting with interaction strata — needs multi-strata survfit
//
// NOTE: coxsurv4.R tests strata-by-covariate interactions where the Cox model
// has age*strata(sex) + strata(ph.ecog). This creates separate coefficients
// per stratum interaction, which is complex formula parsing not yet in WASM.

import { getReferenceFromRScript } from "./survival-test-helpers.ts";

const R_SOURCE_TEST = new URL("./coxsurv4-source-test.R", import.meta.url)
  .pathname;

interface Coxsurv4Ref {
  coef: number[];
  loglik: [number, number];
  n: number;
  nevent: number;
  coef_names: string[];
}

const ref = getReferenceFromRScript<Coxsurv4Ref>(R_SOURCE_TEST);

Deno.test("coxsurv4: R reference extraction works", () => {
  // Strata-by-covariate interactions require formula parsing extensions
  // Verify R extraction works and we know the expected structure
  if (ref.coef.length !== 2) {
    throw new Error(`Expected 2 coefficients, got ${ref.coef.length}`);
  }
});
