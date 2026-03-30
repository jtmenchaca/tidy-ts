// Translation of survival package test: predsurv.R
// R reference JSON: predsurv-source-test.R (sibling file)
// Tests that predict(coxfit) agrees with survfit for type=expected and survival
//
// Coverage of predsurv.R:
// [x] coxph(Surv(time, status) ~ age + ph.ecog, lung) — coef, loglik, n, nevent
// [ ] predict(fit1, type='expected') vs survfit cumhaz — needs predict wrapper
// [ ] predict(fit1, type='survival') vs survfit surv — needs predict wrapper
// [ ] predict with individual=TRUE — needs individual survival curves
// [ ] survfit(fit1) baseline hazard comparison — partially available via survfitCox
//
// NOTE: R's predsurv.R validates that predict.coxph type='expected' matches
// the cumulative hazard from survfit, and type='survival' matches the survival
// probability. Our WASM has survfitCox for baseline survival but the predict
// wrapper mapping individual expected/survival values is not yet implemented.

import {
  coxph,
  type CoxphResult,
} from "../../dataframe/ts/wasm/survival-functions.ts";
import {
  assertArrayClose,
  assertClose,
  getReferenceFromRScript,
  loadTable,
  TOL,
  TOL_EXACT,
} from "./survival-test-helpers.ts";

const R_SOURCE_TEST = new URL("./predsurv-source-test.R", import.meta.url)
  .pathname;

interface PredsurRef {
  coef: number[];
  loglik: [number, number];
  n: number;
  nevent: number;
  means: number[];
  var_diag: number[];
}

const ref = getReferenceFromRScript<PredsurRef>(R_SOURCE_TEST);

interface LungRow {
  inst: number | null;
  time: number;
  status: number;
  age: number;
  sex: number;
  ph_ecog: number | null;
  ph_karno: number | null;
  pat_karno: number | null;
  meal_cal: number | null;
  wt_loss: number | null;
}

Deno.test("predsurv: coxph(age + ph.ecog) on lung", () => {
  const lung = loadTable<LungRow>("cancer_lung");
  // Filter complete cases for age and ph.ecog (matching R's na.exclude behavior)
  const complete = lung.filter(
    (r) =>
      r.time != null &&
      r.status != null &&
      r.age != null &&
      r.ph_ecog != null,
  );

  const fit = coxph({
    time: complete.map((r) => r.time),
    // R lung$status is 1=censored, 2=dead; convert to 0/1
    status: complete.map((r) => r.status - 1),
    covariates: {
      age: complete.map((r) => r.age),
      ph_ecog: complete.map((r) => r.ph_ecog!),
    },
  });

  assertArrayClose(fit.coefficients, ref.coef, TOL, "coef");
  assertClose(fit.loglik[0], ref.loglik[0], TOL, "loglik[0]");
  assertClose(fit.loglik[1], ref.loglik[1], TOL, "loglik[1]");
  assertClose(fit.n, ref.n, TOL_EXACT, "n");
  assertClose(fit.nevent, ref.nevent, TOL_EXACT, "nevent");
});
