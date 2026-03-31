// Translation of sandwich package test: vcovPL.R
// R reference JSON: vcovPL-source-test.R (sibling file)
// Tests panel lag (Newey-West style) covariance matrices
//
// Coverage of vcovPL.R:
// [ ] L3-6:   Two-way panel lag with adjust TRUE/FALSE
// [ ] L9-13:  Poisson GLM with single-cluster vcovPL
// [ ] L20-23: Comparison with plm::vcovSCC
// [ ] L28-33: Stata xtscc comparison

import { expect } from "@std/expect";
import {
  getReferenceFromRScript,
} from "./sandwich-test-helpers.ts";

const R_SOURCE_TEST = new URL("./vcovPL-source-test.R", import.meta.url)
  .pathname;

interface VcovPLRef {
  lm_coef: number[];
  poisson_coef: number[];
  pl_2way_adj: number[];
  pl_2way_noadj: number[];
  pl_1way_noadj: number[];
  pl_poisson_adj: number[];
  pl_poisson_noadj: number[];
  stata_se: number[];
}

// Verify R script produces valid reference data
Deno.test("vcovPL: R reference data loads", () => {
  const ref = getReferenceFromRScript<VcovPLRef>(R_SOURCE_TEST);
  expect(ref.lm_coef.length).toBe(2);
  expect(ref.poisson_coef.length).toBe(2);
  expect(ref.pl_2way_adj.length).toBe(4); // 2x2 matrix flattened
});

// TODO: Implement vcovPL in Rust and add tests here
