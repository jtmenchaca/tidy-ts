// Translation of sandwich package test: vcovPC.R
// R reference JSON: vcovPC-source-test.R (sibling file)
// Tests panel-corrected covariance matrices
//
// Coverage of vcovPC.R:
// [ ] L3-4:  Balanced panel vcovPC (firm + year)
// [ ] L6-9:  Unbalanced panel with pairwise TRUE/FALSE
// [ ] L13-17: Stata xtpcse comparison

import { expect } from "@std/expect";
import {
  getReferenceFromRScript,
  loadPetersenCL,
} from "./sandwich-test-helpers.ts";

const R_SOURCE_TEST = new URL("./vcovPC-source-test.R", import.meta.url)
  .pathname;

interface VcovPCRef {
  coef: number[];
  pc_full: number[];
  pc_unbal_pw: number[];
  pc_unbal_nopw: number[];
  stata_se: number[];
  n_obs: number;
  n_firms: number;
  n_years: number;
}

// Verify R script produces valid reference data
Deno.test("vcovPC: R reference data loads", () => {
  const ref = getReferenceFromRScript<VcovPCRef>(R_SOURCE_TEST);
  expect(ref.coef.length).toBe(2);
  expect(ref.n_obs).toBe(5000);
  expect(ref.n_firms).toBe(500);
  expect(ref.n_years).toBe(10);
});

// TODO: Implement vcovPC in Rust and add tests here
