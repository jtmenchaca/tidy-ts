// Translation of survival package test: factor.R
// R reference JSON: factor-source-test.R (sibling file)
// Tests coxph with factor (dummy-coded) predictors
//
// Coverage of factor.R:
// [x] L10:    coxph(~ age + factor(ph.ecog)) — coef, loglik, var
// [x] L11:    predict(type='risk') — risk scores
// [ ] L20-23: survreg with factor — needs survreg (Tier 4)
// [ ] L30-33: survreg with na.omit — needs survreg (Tier 4)

import {
  coxph,
} from "../../dataframe/ts/wasm/survival-functions.ts";
import {
  assertArrayClose,
  getReferenceFromRScript,
  loadTable,
  TOL,
} from "./survival-test-helpers.ts";

const R_SOURCE_TEST = new URL("./factor-source-test.R", import.meta.url)
  .pathname;

interface LungRow {
  time: number;
  status: number;
  ph_ecog: number | null;
  age: number;
}

interface FactorRef {
  fit_coef: number[];
  fit_loglik: number[];
  fit_var: number[];
  fit_lp: (number | null)[];
  fit_risk: (number | null)[];
  coef_names: string[];
}

const ref = getReferenceFromRScript<FactorRef>(R_SOURCE_TEST);
const lungRaw = loadTable<LungRow>("cancer_lung");

// R's na.exclude preserves rows but returns NA for predictions on NA rows
// We need to create dummy variables for factor(ph.ecog) with treatment contrast (ref=0)
// ph.ecog levels: 0, 1, 2, 3
function createDummies(data: LungRow[]): {
  complete: LungRow[];
  ph_ecog_1: number[];
  ph_ecog_2: number[];
  ph_ecog_3: number[];
} {
  const complete = data.filter((r) => r.ph_ecog != null);
  return {
    complete,
    ph_ecog_1: complete.map((r) => (r.ph_ecog === 1 ? 1 : 0)),
    ph_ecog_2: complete.map((r) => (r.ph_ecog === 2 ? 1 : 0)),
    ph_ecog_3: complete.map((r) => (r.ph_ecog === 3 ? 1 : 0)),
  };
}

Deno.test("factor: coxph with age + factor(ph.ecog)", () => {
  const { complete, ph_ecog_1, ph_ecog_2, ph_ecog_3 } =
    createDummies(lungRaw);

  const fit = coxph({
    time: complete.map((r) => r.time),
    status: complete.map((r) => r.status - 1),
    covariates: {
      age: complete.map((r) => r.age),
      "factor(ph.ecog)1": ph_ecog_1,
      "factor(ph.ecog)2": ph_ecog_2,
      "factor(ph.ecog)3": ph_ecog_3,
    },
  });

  assertArrayClose(fit.coefficients, ref.fit_coef, TOL, "coef");
  assertArrayClose(fit.loglik, ref.fit_loglik, TOL, "loglik");
  assertArrayClose(fit.var.flat(), ref.fit_var, TOL, "var");
});

Deno.test("factor: risk predictions match R", () => {
  const { complete, ph_ecog_1, ph_ecog_2, ph_ecog_3 } =
    createDummies(lungRaw);

  const fit = coxph({
    time: complete.map((r) => r.time),
    status: complete.map((r) => r.status - 1),
    covariates: {
      age: complete.map((r) => r.age),
      "factor(ph.ecog)1": ph_ecog_1,
      "factor(ph.ecog)2": ph_ecog_2,
      "factor(ph.ecog)3": ph_ecog_3,
    },
  });

  // Compare linear predictors for complete cases
  // R's na.exclude returns null for NA rows; filter those out of reference
  const refLpComplete = ref.fit_lp.filter((v) => v !== null) as number[];
  assertArrayClose(fit.linear_predictors, refLpComplete, TOL, "lp");

  // Risk = exp(lp)
  const risk = fit.linear_predictors.map(Math.exp);
  const refRiskComplete = ref.fit_risk.filter((v) => v !== null) as number[];
  assertArrayClose(risk, refRiskComplete, TOL, "risk");
});
