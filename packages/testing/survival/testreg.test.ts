// Translation of survival package test: testreg.R
// R reference JSON: testreg-source-test.R (sibling file)
// Tests parametric survival regression (survreg) — Tier 4
//
// Coverage of testreg.R:
// [ ] L11-29: survreg Weibull on test1 data — survreg not implemented (Tier 4)
// [ ] L31-52: survreg exponential, lognormal, loglogistic — Tier 4
// [ ] L54-73: dsurvreg/psurvreg/qsurvreg distribution functions — Tier 4
// [ ] L75+:   interval censoring, custom distributions — Tier 4
//
// NOTE: survreg (parametric AFT models) is Tier 4 functionality.
// This test documents what's needed and verifies R extraction works.

import { getReferenceFromRScript } from "./survival-test-helpers.ts";

const R_SOURCE_TEST = new URL("./testreg-source-test.R", import.meta.url)
  .pathname;

interface TestregRef {
  coef: number[];
  loglik: [number, number];
  scale: number;
  dist: string;
  n: number;
}

const ref = getReferenceFromRScript<TestregRef>(R_SOURCE_TEST);

Deno.test("testreg: R reference extraction works (survreg Tier 4)", () => {
  // Verify the R reference extracts correctly
  // survreg functionality requires Tier 4 implementation
  if (ref.dist !== "weibull") {
    throw new Error(`Expected dist=weibull, got ${ref.dist}`);
  }
});
