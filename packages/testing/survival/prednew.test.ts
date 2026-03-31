// Translation of survival package test: prednew.R
// R reference JSON: prednew-source-test.R (sibling file)
// Tests predict(coxfit, newdata=...) for lp, risk, expected, terms
//
// Coverage of prednew.R:
// [x] Stratified coxph fit — coef, loglik, n extraction
// [x] Simple coxph fit — coef, loglik validation
// [ ] predict(myfit, type='lp') — needs TS predict wrapper
// [ ] predict(myfit, type='risk') — needs TS predict wrapper
// [ ] predict(myfit, type='expected') — needs TS predict wrapper
// [ ] predict(myfit, type='terms') — needs TS predict wrapper
// [ ] predict with newdata — needs TS predict(newdata=...) wrapper
//
// NOTE: R's predict.coxph returns lp/risk/expected/terms predictions.
// Our WASM coxph returns linearPredictors in the fit result, but
// newdata prediction and type='expected'/'terms' need a dedicated
// predict wrapper in TypeScript.

import {
  coxph,
} from "../../dataframe/ts/wasm/survival-functions.ts";
import {
  assertArrayClose,
  assertClose,
  getReferenceFromRScript,
  loadTable,
  TOL,
  TOL_EXACT,
} from "./survival-test-helpers.ts";

const R_SOURCE_TEST = new URL("./prednew-source-test.R", import.meta.url)
  .pathname;

interface PrednewRef {
  coef: number[];
  loglik: [number, number];
  n: number;
  nevent: number;
  simple_coef: number[];
  simple_loglik: [number, number];
  simple_n: number;
  simple_nevent: number;
  simple_lp_first5: number[];
}

const ref = getReferenceFromRScript<PrednewRef>(R_SOURCE_TEST);

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

Deno.test("prednew: simple coxph(age + factor(sex)) on lung", () => {
  const lung = loadTable<LungRow>("cancer_lung");
  const complete = lung.filter(
    (r) =>
      r.time != null && r.status != null && r.age != null && r.sex != null,
  );

  const fit = coxph({
    time: complete.map((r) => r.time),
    status: complete.map((r) => r.status - 1),
    covariates: {
      age: complete.map((r) => r.age),
      sex: complete.map((r) => r.sex),
    },
    method: "efron",
  });

  assertArrayClose(fit.coefficients, ref.simple_coef, TOL, "simple coef");
  assertClose(fit.loglik[0], ref.simple_loglik[0], TOL, "simple loglik[0]");
  assertClose(fit.loglik[1], ref.simple_loglik[1], TOL, "simple loglik[1]");
  assertClose(fit.n, ref.simple_n, TOL_EXACT, "simple n");
  assertClose(fit.nevent, ref.simple_nevent, TOL_EXACT, "simple nevent");
});

Deno.test("prednew: stratified coxph(age + factor(ph.ecog) + strata(sex)) on lung", () => {
  const lung = loadTable<LungRow>("cancer_lung");
  // R's na.exclude drops rows with NA in any model term
  const complete = lung.filter(
    (r) =>
      r.time != null &&
      r.status != null &&
      r.age != null &&
      r.ph_ecog != null &&
      r.sex != null,
  );

  // factor(ph.ecog) creates indicator columns for each level beyond the reference
  const ecogLevels = [...new Set(complete.map((r) => r.ph_ecog!))].sort(
    (a, b) => a - b,
  );
  const covariates: Record<string, number[]> = {
    age: complete.map((r) => r.age),
  };
  // Create indicator variables for ph.ecog levels > reference (first level)
  for (let i = 1; i < ecogLevels.length; i++) {
    covariates[`ph_ecog_${ecogLevels[i]}`] = complete.map((r) =>
      r.ph_ecog === ecogLevels[i] ? 1 : 0,
    );
  }

  const fit = coxph({
    time: complete.map((r) => r.time),
    status: complete.map((r) => r.status - 1),
    covariates,
    method: "efron",
    strata: complete.map((r) => r.sex),
  });

  assertArrayClose(fit.coefficients, ref.coef, TOL, "coef");
  assertClose(fit.loglik[0], ref.loglik[0], TOL, "loglik[0]");
  assertClose(fit.loglik[1], ref.loglik[1], TOL, "loglik[1]");
  assertClose(fit.n, ref.n, TOL_EXACT, "n");
  assertClose(fit.nevent, ref.nevent, TOL_EXACT, "nevent");
});
