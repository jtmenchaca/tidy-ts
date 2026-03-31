// Translation of survival package test: coxsurv2.R
// R reference JSON: coxsurv2-source-test.R (sibling file)
// Tests that Cox survfit with beta=0 matches ordinary KM survfit
//
// Coverage of coxsurv2.R:
// [x] L7-18:  Aalen survfit by sex matches Cox iter=0 survfit (stype=2)
// [x] L27-29: KM survfit by sex matches Cox iter=0 survfit (stype=1)
// [ ] L33-55: weighted variants with random weights — needs reproducible seed
// [ ] L22-24: Efron method ctype=2 — needs ctype option

import { survfit } from "../../dataframe/ts/wasm/survival-functions.ts";
import {
  assertArrayClose,
  getReferenceFromRScript,
  loadTable,
  TOL,
  TOL_EXACT,
} from "./survival-test-helpers.ts";

const R_SOURCE_TEST = new URL("./coxsurv2-source-test.R", import.meta.url)
  .pathname;

interface Coxsurv2Ref {
  km_time: number[];
  km_surv: number[];
  km_cumhaz: number[];
  km_std_err: number[];
  km_strata: number[];
  km_n_risk: number[];
  km_n_event: number[];
  aalen_time: number[];
  aalen_surv: number[];
  aalen_cumhaz: number[];
  aalen_std_err: number[];
  aalen_strata: number[];
}

interface LungRow {
  time: number;
  status: number;
  sex: number;
}

const ref = getReferenceFromRScript<Coxsurv2Ref>(R_SOURCE_TEST);

Deno.test("coxsurv2: KM survfit by sex on lung", () => {
  const lung = loadTable<LungRow>("cancer_lung");
  // sex is 1 or 2 in lung data, map to 0-based groups
  const groups = lung.map((r) => r.sex - 1);

  const fit = survfit({
    time: lung.map((r) => r.time),
    status: lung.map((r) => r.status - 1),
    options: { groups },
  });

  assertArrayClose(fit.time, ref.km_time, TOL_EXACT, "km_time");
  assertArrayClose(fit.surv, ref.km_surv, TOL, "km_surv");
  assertArrayClose(fit.cumhaz, ref.km_cumhaz, TOL, "km_cumhaz");
  assertArrayClose(fit.nRisk, ref.km_n_risk, TOL_EXACT, "km_n_risk");
  assertArrayClose(fit.nEvent, ref.km_n_event, TOL_EXACT, "km_n_event");
});

Deno.test("coxsurv2: Aalen (stype=2) survfit by sex on lung", () => {
  const lung = loadTable<LungRow>("cancer_lung");
  const groups = lung.map((r) => r.sex - 1);

  // R's stype=2 means exp(-cumhaz) survival = our stype 3 (exp+NA)
  const fit = survfit({
    time: lung.map((r) => r.time),
    status: lung.map((r) => r.status - 1),
    options: { groups, stype: 3 },
  });

  assertArrayClose(fit.time, ref.aalen_time, TOL_EXACT, "aalen_time");
  assertArrayClose(fit.surv, ref.aalen_surv, TOL, "aalen_surv");
  assertArrayClose(fit.cumhaz, ref.aalen_cumhaz, TOL, "aalen_cumhaz");
});
