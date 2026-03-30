// Translation of survival package test: survtest.R
// R reference JSON: survtest-source-test.R (sibling file)
// Tests survfit on right-censored and counting-process data
//
// Coverage of survtest.R:
// [x] L53-59: right-censored KM on test1 (with NA filtering)
// [ ] L20-23: counting-process KM (start, stop) — survfit WASM doesn't accept start/stop
// [ ] L25-33: comparison of KM with coxph survfit — needs counting-process survfit
// [ ] L41-48: counting-process KM on test2 — survfit WASM doesn't accept start/stop
// [ ] L62-64: summary at arbitrary times — summary not exposed
// [ ] L72-88: conditional survival (start.time) — not exposed
// [ ] L92-100: mgus2 with covariates — needs large dataset + newdata

import { survfit } from "../../dataframe/ts/wasm/survival-functions.ts";
import {
  assertArrayClose,
  assertClose,
  getReferenceFromRScript,
  TOL,
  TOL_EXACT,
} from "./survival-test-helpers.ts";

const R_SOURCE_TEST = new URL("./survtest-source-test.R", import.meta.url)
  .pathname;

interface SurvtestRef {
  rc_time: number[];
  rc_n: number;
  rc_nRisk: number[];
  rc_nEvent: number[];
  rc_surv: number[];
  rc_stdErr: number[];
  cp_n: number;
  cp_time: number[];
  cp_nRisk: number[];
  cp_nEvent: number[];
  cp_surv_at_events: number[];
  cp_stdErr: number[];
}

const ref = getReferenceFromRScript<SurvtestRef>(R_SOURCE_TEST);

Deno.test("survtest: right-censored KM on test1", () => {
  // test1 data from R (status[1]=NA is excluded by na.action=na.exclude)
  const time = [9, 1, 1, 6, 6, 8]; // row 2 (time=3, status=NA) excluded
  const status = [1, 1, 0, 1, 1, 0]; // corresponding statuses

  const fit = survfit({ time, status });

  assertClose(fit.time.length, ref.rc_time.length, 0, "n_times");
  assertArrayClose(fit.time, ref.rc_time, TOL_EXACT, "time");
  assertArrayClose(fit.nRisk, ref.rc_nRisk, TOL_EXACT, "nRisk");
  assertArrayClose(fit.nEvent, ref.rc_nEvent, TOL_EXACT, "nEvent");
  assertArrayClose(fit.surv, ref.rc_surv, TOL, "surv");
  // stdErr: last value is Inf in R (S=0 → log(S)=-Inf → se=Inf)
  // Compare only finite values
  const finiteIdx = ref.rc_stdErr.filter((v) => isFinite(v));
  assertArrayClose(
    fit.stdErr.slice(0, finiteIdx.length),
    finiteIdx,
    TOL,
    "stdErr",
  );
});

Deno.test("survtest: right-censored KM assertions from summary", () => {
  // From lines 53-59: survfit(Surv(time, status) ~1, test1)
  // Then summary(fit, time=c(.5,1,1.5,6,7.5,8,8.9,9,10), extend=TRUE)
  // We verify our fit object has the right structure
  const time = [9, 1, 1, 6, 6, 8];
  const status = [1, 1, 0, 1, 1, 0];

  const fit = survfit({ time, status });

  // Verify n.risk at event times matches R
  assertArrayClose(fit.nRisk, [6, 4, 2, 1], TOL_EXACT, "nRisk at events");
  // Verify n.event
  assertArrayClose(fit.nEvent, [1, 2, 0, 1], TOL_EXACT, "nEvent");
  // Verify survival
  assertClose(fit.surv[0], 5 / 6, TOL, "surv at t=1");
  assertClose(fit.surv[1], 5 / 12, TOL, "surv at t=6");
});
