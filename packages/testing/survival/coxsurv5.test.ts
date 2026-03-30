// Translation of survival package test: coxsurv5.R
// R reference JSON: coxsurv5-source-test.R (sibling file)
// Tests multi-state survival curves — Tier 4
//
// Coverage of coxsurv5.R:
// [ ] All: multi-state survival with transition matrices — Tier 4
//
// NOTE: coxsurv5.R tests multi-state Cox survival with Surv(t1, t2, state)
// where state is a factor. This requires multi-state support (Tier 4):
// Aalen-Johansen estimator, matrix exponential, state probability computation.

import { getReferenceFromRScript } from "./survival-test-helpers.ts";

const R_SOURCE_TEST = new URL("./coxsurv5-source-test.R", import.meta.url)
  .pathname;

interface Coxsurv5Ref {
  note?: string;
  coef?: number[];
}

const ref = getReferenceFromRScript<Coxsurv5Ref>(R_SOURCE_TEST);

Deno.test("coxsurv5: multi-state survival (Tier 4)", () => {
  // Multi-state survival requires Tier 4 implementation
  // This test documents the dependency
});
