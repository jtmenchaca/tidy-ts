// Translation of survival package test: nested.R
// R reference JSON: nested-source-test.R (sibling file)
// Tests that survfit works correctly when called from a nested function scope
//
// Coverage of nested.R:
// [x] L9:     coxph(~ age + factor(sex)) on lung
// [x] L12-15: survfit(fit, newdata) produces same result inside/outside function

import {
  coxph,
  survfitCox,
} from "../../dataframe/ts/wasm/survival-functions.ts";
import {
  assertArrayClose,
  assertClose,
  getReferenceFromRScript,
  loadTable,
  TOL,
} from "./survival-test-helpers.ts";

const R_SOURCE_TEST = new URL("./nested-source-test.R", import.meta.url)
  .pathname;

interface LungRow {
  time: number;
  status: number;
  age: number;
  sex: number;
}

interface NestedRef {
  fit_coef: number[];
  fit_loglik: number[];
  fit_means: number[];
  fit_var: number[];
  sf_time: number[];
  sf_surv_1: number[];
  sf_surv_5: number[];
  sf_cumhaz_1: number[];
  sf_cumhaz_5: number[];
  newdata_age: number[];
  newdata_sex: number[];
}

const ref = getReferenceFromRScript<NestedRef>(R_SOURCE_TEST);
const lungRaw = loadTable<LungRow>("cancer_lung");
const complete = lungRaw.filter(
  (r) => r.age != null && r.sex != null && r.time != null && r.status != null,
);

Deno.test("nested: coxph fit matches R", () => {
  const fit = coxph({
    time: complete.map((r) => r.time),
    status: complete.map((r) => r.status - 1),
    covariates: {
      age: complete.map((r) => r.age),
      "factor(sex)2": complete.map((r) => (r.sex === 2 ? 1 : 0)),
    },
  });
  assertArrayClose(fit.coefficients, ref.fit_coef, TOL, "coef");
  assertArrayClose(fit.loglik, ref.fit_loglik, TOL, "loglik");
});

Deno.test("nested: survfitCox at newdata[1] matches R", () => {
  const fit = coxph({
    time: complete.map((r) => r.time),
    status: complete.map((r) => r.status - 1),
    covariates: {
      age: complete.map((r) => r.age),
      "factor(sex)2": complete.map((r) => (r.sex === 2 ? 1 : 0)),
    },
  });

  // Predict at first newdata row: age=74, sex=1 -> factor(sex)2=0
  const sf = survfitCox({
    time: complete.map((r) => r.time),
    status: complete.map((r) => r.status - 1),
    options: {
      coef: fit.coefficients,
      covariates: {
        age: complete.map((r) => r.age),
        "factor(sex)2": complete.map((r) => (r.sex === 2 ? 1 : 0)),
      },
      newx: [ref.newdata_age[0], ref.newdata_sex[0] === 2 ? 1 : 0],
      means: fit.means,
      varMatrix: fit.var,
      // Default coxph (here and in R) is Efron; survfit after that fit uses Efron baseline.
      ctype: 2,
    },
  });

  assertArrayClose(sf.time, ref.sf_time, TOL, "time");
  assertArrayClose(sf.surv, ref.sf_surv_1, TOL, "surv at newdata[1]");
  assertArrayClose(sf.cumhaz, ref.sf_cumhaz_1, TOL, "cumhaz at newdata[1]");
});

Deno.test("nested: survfitCox at newdata[5] matches R", () => {
  const fit = coxph({
    time: complete.map((r) => r.time),
    status: complete.map((r) => r.status - 1),
    covariates: {
      age: complete.map((r) => r.age),
      "factor(sex)2": complete.map((r) => (r.sex === 2 ? 1 : 0)),
    },
  });

  // Predict at fifth newdata row: age=60, sex=1 -> factor(sex)2=0
  const sf = survfitCox({
    time: complete.map((r) => r.time),
    status: complete.map((r) => r.status - 1),
    options: {
      coef: fit.coefficients,
      covariates: {
        age: complete.map((r) => r.age),
        "factor(sex)2": complete.map((r) => (r.sex === 2 ? 1 : 0)),
      },
      newx: [ref.newdata_age[4], ref.newdata_sex[4] === 2 ? 1 : 0],
      means: fit.means,
      varMatrix: fit.var,
      ctype: 2,
    },
  });

  assertArrayClose(sf.surv, ref.sf_surv_5, TOL, "surv at newdata[5]");
  assertArrayClose(sf.cumhaz, ref.sf_cumhaz_5, TOL, "cumhaz at newdata[5]");
});
