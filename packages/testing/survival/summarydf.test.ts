// Translation of survival package test: summarydf.R
// R reference JSON: summarydf-source-test.R (sibling file)
// Tests the data.frame option of summary.survfit
//
// Coverage of summarydf.R:
// [x] R reference extraction: survfit(Surv(time, status) ~ ph.ecog, lung)
// [ ] summary(survfit, times=...) as data.frame — needs TS wrapper
// [ ] data.frame output with strata column — needs TS wrapper
// [ ] Interpolated survival at monthly intervals — needs TS wrapper
//
// NOTE: R's summary.survfit with the data.frame option converts the summary
// output to a data.frame with columns for time, surv, strata, etc. This is
// a convenience feature for downstream analysis. The source test extracts
// summary metadata (n_times, first_time, n_strata) for future validation.

import { getReferenceFromRScript } from "./survival-test-helpers.ts";

const R_SOURCE_TEST = new URL("./summarydf-source-test.R", import.meta.url)
  .pathname;

interface SummarydfRef {
  n_times: number;
  first_time: number;
  n_strata: number;
}

const ref = getReferenceFromRScript<SummarydfRef>(R_SOURCE_TEST);

Deno.test("summarydf: R reference extracted for lung data", () => {
  // Verify the R reference was extracted successfully
  if (ref.n_times <= 0) {
    throw new Error("Expected positive n_times from R reference");
  }
  if (ref.n_strata <= 0) {
    throw new Error("Expected positive n_strata from R reference");
  }
});

Deno.test("summarydf: data.frame summary output (stub)", () => {
  // summary.survfit data.frame features need a TS wrapper that:
  // 1. Computes survival at specified time points (interpolation)
  // 2. Returns results as a structured table with strata labels
  // 3. Supports the extend argument for extrapolating beyond last event
  // These build on survfit results with time-point interpolation logic.
});
