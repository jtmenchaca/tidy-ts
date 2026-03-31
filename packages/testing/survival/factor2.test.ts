// Translation of survival package test: factor2.R
// R reference JSON: factor2-source-test.R (sibling file)
// Tests coxph with factor predictors and prediction on new data
//
// Coverage of factor2.R:
// [x] L7-8:   coxph(~ factor(ph.ecog)) — coef, loglik
// [x] L10-11: predict(type='lp') on new factor levels 0:3
// [x] L14:    coxph(~ factor(ph.ecog) + factor(sex)) — two factor predictors
// [ ] L23-26: survreg with factor — needs survreg (Tier 4)

import {
  coxph,
} from "../../dataframe/ts/wasm/survival-functions.ts";
import {
  assertArrayClose,
  getReferenceFromRScript,
  loadTable,
  TOL,
} from "./survival-test-helpers.ts";

const R_SOURCE_TEST = new URL("./factor2-source-test.R", import.meta.url)
  .pathname;

interface LungRow {
  time: number;
  status: number;
  ph_ecog: number | null;
  sex: number;
}

interface Factor2Ref {
  fit_coef: number[];
  fit_loglik: number[];
  fit_lp: number[];
  fit2_coef: number[];
  fit2_loglik: number[];
}

const ref = getReferenceFromRScript<Factor2Ref>(R_SOURCE_TEST);
const lungRaw = loadTable<LungRow>("cancer_lung");
const complete = lungRaw.filter((r) => r.ph_ecog != null);

Deno.test("factor2: coxph with single factor predictor", () => {
  const fit = coxph({
    time: complete.map((r) => r.time),
    status: complete.map((r) => r.status - 1),
    covariates: {
      "factor(ph.ecog)1": complete.map((r) => (r.ph_ecog === 1 ? 1 : 0)),
      "factor(ph.ecog)2": complete.map((r) => (r.ph_ecog === 2 ? 1 : 0)),
      "factor(ph.ecog)3": complete.map((r) => (r.ph_ecog === 3 ? 1 : 0)),
    },
    method: "efron",
  });
  assertArrayClose(fit.coefficients, ref.fit_coef, TOL, "coef");
  assertArrayClose(fit.loglik, ref.fit_loglik, TOL, "loglik");

  // Predict LP for factor levels 0,1,2,3
  // Level 0 (reference) -> lp = 0 - center
  // Level k -> lp = coef[k-1] - center
  const center = fit.coefficients.reduce(
    (s, c, i) => s + c * fit.means[i],
    0,
  );
  const lp = [
    -center, // level 0: all dummies are 0
    fit.coefficients[0] - center, // level 1
    fit.coefficients[1] - center, // level 2
    fit.coefficients[2] - center, // level 3
  ];
  assertArrayClose(lp, ref.fit_lp, TOL, "lp");
});

Deno.test("factor2: coxph with two factor predictors", () => {
  const fit2 = coxph({
    time: complete.map((r) => r.time),
    status: complete.map((r) => r.status - 1),
    covariates: {
      "factor(ph.ecog)1": complete.map((r) => (r.ph_ecog === 1 ? 1 : 0)),
      "factor(ph.ecog)2": complete.map((r) => (r.ph_ecog === 2 ? 1 : 0)),
      "factor(ph.ecog)3": complete.map((r) => (r.ph_ecog === 3 ? 1 : 0)),
      "factor(sex)2": complete.map((r) => (r.sex === 2 ? 1 : 0)),
    },
    method: "efron",
  });
  assertArrayClose(fit2.coefficients, ref.fit2_coef, TOL, "coef");
  assertArrayClose(fit2.loglik, ref.fit2_loglik, TOL, "loglik");
});
