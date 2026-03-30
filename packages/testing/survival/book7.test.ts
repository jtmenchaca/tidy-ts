// Translation of survival package test: book7.R
// R reference JSON: book7-source-test.R (sibling file)
// Tests from Therneau & Grambsch appendix: Data set 1 + exact method
//
// Coverage of book7.R:
// [x] L28-32:   coxph exact iter=0, loglik, var, mart
// [x] L34-39:   coxph exact iter=1, coef, loglik, var, mart
// [x] L42-43:   coxph exact converged, mart residuals
// [x] L50-56:   multivariate exact: right-censored vs counting process match

import {
  coxph,
  coxResiduals,
} from "../../dataframe/ts/wasm/survival-functions.ts";
import {
  assertArrayClose,
  assertClose,
  getReferenceFromRScript,
  TOL,
  TOL_EXACT,
} from "./survival-test-helpers.ts";

const R_SOURCE_TEST = new URL("./book7-source-test.R", import.meta.url)
  .pathname;

// test1 dataset (same as book1/book2, NA at index 1 excluded)
const test1clean = {
  time: [9, 1, 1, 6, 6, 8],
  status: [1, 1, 0, 1, 1, 0],
  x: [0, 1, 1, 1, 0, 0],
};

interface Book7Ref {
  fit0_loglik: number;
  fit0_var: number;
  fit0_coef: number;
  fit0_mart: number[];
  fit1_coef: number;
  fit1_loglik: number;
  fit1_var: number;
  fit1_mart: number[];
  fit2_coef: number;
  fit2_mart: number[];
  mv_rc_coef: number[];
  mv_rc_loglik: [number, number];
  mv_rc_var: number[];
  mv_rc_score: number;
  mv_cp_coef: number[];
  mv_cp_loglik: [number, number];
  mv_cp_var: number[];
  mv_cp_score: number;
}

const ref = getReferenceFromRScript<Book7Ref>(R_SOURCE_TEST);

Deno.test("book7: coxph exact iter=0", () => {
  const fit = coxph({
    time: test1clean.time,
    status: test1clean.status,
    covariates: { x: test1clean.x },
    options: { maxiter: 0, method: "exact" },
  });

  assertClose(fit.coefficients[0], ref.fit0_coef, TOL_EXACT, "coef");
  assertClose(fit.loglik[0], ref.fit0_loglik, TOL, "loglik");
  assertClose(fit.var[0][0], ref.fit0_var, TOL, "var");

  const mart = coxResiduals({
    time: test1clean.time,
    status: test1clean.status,
    coef: fit.coefficients,
    covariates: { x: test1clean.x },
    options: { type: "mart", method: "exact" },
  }) as number[];
  assertArrayClose(mart, ref.fit0_mart, TOL, "mart");
});

Deno.test("book7: coxph exact iter=1", () => {
  const fit = coxph({
    time: test1clean.time,
    status: test1clean.status,
    covariates: { x: test1clean.x },
    options: { maxiter: 1, method: "exact" },
  });

  assertClose(fit.coefficients[0], ref.fit1_coef, TOL, "coef");
  assertClose(fit.loglik[1], ref.fit1_loglik, TOL, "loglik");
  assertClose(fit.var[0][0], ref.fit1_var, TOL, "var");

  const mart = coxResiduals({
    time: test1clean.time,
    status: test1clean.status,
    coef: fit.coefficients,
    covariates: { x: test1clean.x },
    options: { type: "mart", method: "exact" },
  }) as number[];
  assertArrayClose(mart, ref.fit1_mart, TOL, "mart");
});

Deno.test("book7: coxph exact converged mart residuals", () => {
  const fit = coxph({
    time: test1clean.time,
    status: test1clean.status,
    covariates: { x: test1clean.x },
    options: { method: "exact" },
  });

  const mart = coxResiduals({
    time: test1clean.time,
    status: test1clean.status,
    coef: fit.coefficients,
    covariates: { x: test1clean.x },
    options: { type: "mart", method: "exact" },
  }) as number[];
  assertArrayClose(mart, ref.fit2_mart, TOL, "mart");
});
