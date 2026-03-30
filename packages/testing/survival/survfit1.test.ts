// Translation of survival package test: survfit1.R
// R reference JSON: survfit1-source-test.R (sibling file)
// Tests basic Kaplan-Meier estimation with groups and stype options
//
// Coverage of survfit1.R:
// [x] L95-101:  fit1 basic KM (NA hazard, KM survival) on aml with groups
// [x] L172-178: fit1 stype=2 (exp(-cumhaz) survival) on aml with groups
// [ ] L103-116: counting process KM — survfit WASM doesn't accept start/stop
// [ ] L119-134: IJ variance / influence — not exposed in TS layer
// [ ] L148-169: influence leverage values + brute force — not exposed
// [ ] L198-228: weighted fits with influence — not exposed
// [ ] L232-243: grouped jackknife — not exposed
// [ ] L248-337: Fleming-Harrington (ctype=2) — separate stype needed

import { survfit } from "../../dataframe/ts/wasm/survival-functions.ts";
import {
  assertArrayClose,
  assertClose,
  getReferenceFromRScript,
  loadAml,
  TOL,
  TOL_EXACT,
} from "./survival-test-helpers.ts";

const R_SOURCE_TEST = new URL("./survfit1-source-test.R", import.meta.url)
  .pathname;

interface Survfit1Ref {
  time: number[];
  nRisk: number[];
  nEvent: number[];
  nCensor: number[];
  surv: number[];
  cumhaz: number[];
  stdErr: number[];
  stdChaz: number[];
  strata: number[];
  logse: boolean;
  surv_s2: number[];
  cumhaz_s2: number[];
  stdErr_s2: number[];
  stdChaz_s2: number[];
  nRisk_s2: number[];
  nEvent_s2: number[];
}

const ref = getReferenceFromRScript<Survfit1Ref>(R_SOURCE_TEST);

Deno.test("survfit1: basic KM on aml with groups", () => {
  const aml = loadAml();
  const time = aml.map((r) => r.time);
  const status = aml.map((r) => r.status);
  const groups = aml.map((r) => (r.x === "Maintained" ? 0 : 1));

  const fit = survfit({ time, status, options: { groups } });

  assertArrayClose(fit.time, ref.time, TOL_EXACT, "time");
  assertArrayClose(fit.nRisk, ref.nRisk, TOL_EXACT, "nRisk");
  assertArrayClose(fit.nEvent, ref.nEvent, TOL_EXACT, "nEvent");
  assertArrayClose(fit.nCensor, ref.nCensor, TOL_EXACT, "nCensor");
  assertArrayClose(fit.surv, ref.surv, TOL, "surv");
  assertArrayClose(fit.cumhaz, ref.cumhaz, TOL, "cumhaz");
  // R's std.err with logse=TRUE is se(log(S)) = stdErr, not se(S)
  assertArrayClose(fit.stdErr, ref.stdErr, TOL, "stdErr");
  assertArrayClose(fit.stdChaz, ref.stdChaz, TOL, "stdChaz");
});

Deno.test("survfit1: stype=2 (exp(-cumhaz) survival)", () => {
  const aml = loadAml();
  const time = aml.map((r) => r.time);
  const status = aml.map((r) => r.status);
  const groups = aml.map((r) => (r.x === "Maintained" ? 0 : 1));

  // stype mapping: R's stype=2 means exp(-cumhaz) for survival
  // Our WASM: stype 1=KM+NA, 2=KM+FH, 3=exp+NA, 4=exp+FH
  // R's stype=2 with default ctype=1 → our stype=3 (exp(-NA))
  const fit = survfit({ time, status, options: { groups, stype: 3 } });

  assertArrayClose(fit.surv, ref.surv_s2, TOL, "surv_s2");
  assertArrayClose(fit.cumhaz, ref.cumhaz_s2, TOL, "cumhaz_s2");
  assertArrayClose(fit.stdErr, ref.stdErr_s2, TOL, "stdErr_s2");
  assertArrayClose(fit.stdChaz, ref.stdChaz_s2, TOL, "stdChaz_s2");
  assertArrayClose(fit.nRisk, ref.nRisk_s2, TOL_EXACT, "nRisk_s2");
  assertArrayClose(fit.nEvent, ref.nEvent_s2, TOL_EXACT, "nEvent_s2");
});
