// Translation of survival package test: r_lung.R
// R reference JSON: r_lung-source-test.R (sibling file)
// Tests parametric survreg with strata, ridge, pspline on lung data — Tier 4
//
// Coverage of r_lung.R:
// [ ] survreg with strata(sex) on lung data — survreg not implemented (Tier 4)
// [ ] ridge penalty in survreg — Tier 4
// [ ] pspline terms in survreg — Tier 4
// [ ] predict.survreg with type="response" — Tier 4
//
// NOTE: survreg (parametric AFT models) is Tier 4 functionality.
// This test documents what's needed and verifies R extraction works.

import { getReferenceFromRScript } from "./survival-test-helpers.ts";

const R_SOURCE_TEST = new URL("./r_lung-source-test.R", import.meta.url)
  .pathname;

interface RLungRef {
  coef: number[];
  loglik: [number, number];
  scale: number[];
}

const ref = getReferenceFromRScript<RLungRef>(R_SOURCE_TEST);

Deno.test("r_lung: R reference extraction works (survreg Tier 4)", () => {
  // Verify R reference extracts correctly
  // survreg with strata requires Tier 4 implementation
  if (ref.coef.length !== 3) {
    throw new Error(
      `Expected 3 coefficients (intercept, age, ph.ecog), got ${ref.coef.length}`,
    );
  }
});
