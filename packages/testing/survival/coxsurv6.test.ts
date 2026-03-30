// Translation of survival package test: coxsurv6.R
// R reference JSON: coxsurv6-source-test.R (sibling file)
// Tests multi-state survival with shared hazards — Tier 4
//
// Coverage of coxsurv6.R:
// [ ] All: multi-state with shared baseline hazards — Tier 4
//
// NOTE: coxsurv6.R tests multi-state Cox survival with shared baseline hazards,
// time-dependent covariates via tmerge(), and complex transition structures.
// This requires multi-state support (Tier 4).

import { getReferenceFromRScript } from "./survival-test-helpers.ts";

const R_SOURCE_TEST = new URL("./coxsurv6-source-test.R", import.meta.url)
  .pathname;

interface Coxsurv6Ref {
  note?: string;
}

const ref = getReferenceFromRScript<Coxsurv6Ref>(R_SOURCE_TEST);

Deno.test("coxsurv6: multi-state with shared hazards (Tier 4)", () => {
  // Multi-state with shared hazards requires Tier 4 implementation
  // This test documents the dependency
});
