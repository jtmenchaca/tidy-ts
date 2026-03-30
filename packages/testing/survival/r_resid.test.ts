// Translation of survival package test: r_resid.R
// R reference JSON: r_resid-source-test.R (sibling file)
// Tests parametric survreg residuals (Weibull) — Tier 4
//
// Coverage of r_resid.R:
// [ ] survreg Weibull residuals on ovarian data — survreg not implemented (Tier 4)
// [ ] deviance, dfbeta, dfbetas, working, ldcase, ldresp, ldshape residuals — Tier 4
// [ ] martingale and response residuals for survreg — Tier 4
//
// NOTE: survreg (parametric AFT models) is Tier 4 functionality.
// This test documents what's needed and verifies R extraction works.

import { getReferenceFromRScript } from "./survival-test-helpers.ts";

const R_SOURCE_TEST = new URL("./r_resid-source-test.R", import.meta.url)
  .pathname;

interface RResidRef {
  coef: number[];
  loglik: [number, number];
  scale: number;
}

const ref = getReferenceFromRScript<RResidRef>(R_SOURCE_TEST);

Deno.test("r_resid: R reference extraction works (survreg Tier 4)", () => {
  // Verify R reference extracts correctly
  // survreg residual functionality requires Tier 4 implementation
  if (ref.coef.length !== 3) {
    throw new Error(
      `Expected 3 coefficients (intercept, age, ecog.ps), got ${ref.coef.length}`,
    );
  }
});
