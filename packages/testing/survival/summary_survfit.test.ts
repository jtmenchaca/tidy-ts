// Translation of survival package test: summary_survfit.R
// R reference JSON: summary_survfit-source-test.R (sibling file)
// Tests the scale option and subscripting of summary.survfit
//
// Coverage of summary_survfit.R:
// [x] R reference extraction: survfit(Surv(futime, fustat) ~ rx, ovarian)
// [ ] summary.survfit scale option (scale=365.25 for years) — needs TS wrapper
// [ ] summary.survfit subscripting (summary(fit[1])) — needs TS wrapper
// [ ] summary.survfit times argument — needs TS wrapper
// [ ] summary.survfit confidence intervals — needs TS wrapper
//
// NOTE: R's summary.survfit provides formatted output with optional scaling,
// time restriction, and subsetting by strata. This is a presentation-layer
// feature that would need a TypeScript wrapper around the raw survfit results.
// The source test extracts the base survfit results for future validation.

import { getReferenceFromRScript } from "./survival-test-helpers.ts";

const R_SOURCE_TEST = new URL(
  "./summary_survfit-source-test.R",
  import.meta.url,
).pathname;

interface SummarySurvfitRef {
  time: number[];
  surv: number[];
  n_risk: number[];
  strata: number[];
}

const ref = getReferenceFromRScript<SummarySurvfitRef>(R_SOURCE_TEST);

Deno.test("summary_survfit: R reference extracted for ovarian data", () => {
  // Verify the R reference was extracted successfully
  // The ovarian dataset has survfit by rx (2 strata)
  if (ref.time.length === 0) {
    throw new Error("Expected non-empty time array from R reference");
  }
  if (ref.surv.length !== ref.time.length) {
    throw new Error("Expected surv and time arrays to have same length");
  }
});

Deno.test("summary_survfit: scale and subscript features (stub)", () => {
  // summary.survfit scale/subscript features need a TS wrapper that:
  // 1. Accepts a scale parameter to convert time units (e.g., days -> years)
  // 2. Supports subscripting by strata index (e.g., fit[1])
  // 3. Accepts a times parameter for interpolated survival at specific times
  // These are presentation-layer features on top of raw survfit output.
});
