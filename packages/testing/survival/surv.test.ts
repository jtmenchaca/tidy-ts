// Translation of survival package test: surv.R
// R reference JSON: surv-source-test.R (sibling file)
// Tests Surv() object creation and sorting — mostly R-specific S3 behavior
//
// Coverage of surv.R:
// [ ] L10-11: Surv(time1, time2, event) interval creation — R S3 object, no TS equivalent
// [ ] L13-14: Surv type='interval2' — interval censoring not supported
// [ ] L17-18: Surv(1:5) right-censored shorthand — trivial, no Surv object in TS
// [ ] L20-24: Surv type='interval' with event status — interval censoring not supported
// [ ] L27-29: Surv with Inf values — interval censoring not supported
// [ ] L34-37: Surv object sorting — R S3 method, no TS equivalent
// [ ] L39-40: Surv type='left' — left censoring not supported
// [ ] L42-43: Surv type='interval2' sorting — interval censoring not supported
// [ ] L45-47: Surv with factor status sorting — R S3 method
//
// NOTE: This test file is intentionally minimal. The R surv.R tests exercise
// R's Surv() S3 object (interval censoring, sorting, NA handling). Our TS layer
// passes raw arrays — there is no Surv object to test. These tests document
// what R tests exist so we know what's not covered.

import { getReferenceFromRScript } from "./survival-test-helpers.ts";

const R_SOURCE_TEST = new URL("./surv-source-test.R", import.meta.url).pathname;

interface SurvRef {
  rc_interval: number[];
  right_cens_5: number[];
  sort_order: number[];
  sort_order_desc: number[];
  sorted: number[];
}

const _ref = getReferenceFromRScript<SurvRef>(R_SOURCE_TEST);

Deno.test("surv: R reference extraction works", () => {
  // Verify R extraction succeeds — the actual Surv object tests are R-specific
  // Our TS layer uses raw arrays, not Surv objects
  // This test documents that surv.R is acknowledged but not directly portable
});
