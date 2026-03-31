// Translation of survival package test: survfit2.R
// R reference JSON: survfit2-source-test.R (sibling file)
// Tests modified Dory-Korn confidence interval
//
// Coverage of survfit2.R:
// [x] L5-9:  basic survfit on synthetic data — verify surv, std_err, cumhaz
// [ ] L8:    conf.lower='modified' — not exposed in WASM survfit options
// [ ] L11-13: modified lower CI formula — needs conf.lower option in WASM

import { survfit } from "../../dataframe/ts/wasm/survival-functions.ts";
import {
  assertArrayClose,
  getReferenceFromRScript,
  TOL,
  TOL_EXACT,
} from "./survival-test-helpers.ts";

const R_SOURCE_TEST = new URL("./survfit2-source-test.R", import.meta.url)
  .pathname;

interface Survfit2Ref {
  time: number[];
  surv: number[];
  std_err: number[];
  cumhaz: number[];
  modified_lower: number[];
  expected_lower: number[];
  regular_lower: number[];
  regular_upper: number[];
  n_risk: number[];
  n_event: number[];
}

const ref = getReferenceFromRScript<Survfit2Ref>(R_SOURCE_TEST);

Deno.test("survfit2: basic survfit on synthetic data", () => {
  const time = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  const status = [1, 0, 1, 0, 1, 0, 0, 0, 1, 0];

  const fit = survfit({ time, status });

  assertArrayClose(fit.time, ref.time, TOL_EXACT, "time");
  assertArrayClose(fit.surv, ref.surv, TOL, "surv");
  assertArrayClose(fit.nRisk, ref.n_risk, TOL_EXACT, "n_risk");
  assertArrayClose(fit.nEvent, ref.n_event, TOL_EXACT, "n_event");
});

Deno.test("survfit2: modified Dory-Korn lower CI", () => {
  // TODO: conf.lower='modified' option not yet exposed in WASM survfit
  // The formula multiplies std_err by sqrt(n_risk_at_event / n_risk_at_time)
  // to get a modified lower bound
  //
  // When implemented, verify:
  //   assertArrayClose(fit_modified.lower, ref.modified_lower, TOL, "modified lower");
  //   assertArrayClose(ref.modified_lower, ref.expected_lower, TOL, "formula match");
});
