// Translation of survival package test: book4.R
// R reference JSON: book4-source-test.R (sibling file)
// Tests from Therneau & Grambsch appendix: Data set 2, Efron estimate
// Counting process (start-stop) Cox PH with Efron ties
//
// Coverage of book4.R:
// [x] L67-73:   coxph Efron iter=0, loglik, var, mart, score, scho
// [x] L76-82:   converged Efron, loglik, var, mart, score, scho

import {
  coxphCounting,
  coxResidualsCounting,
  type SchoenfeldResult,
} from "../../dataframe/ts/wasm/survival-functions.ts";
import {
  assertArrayClose,
  assertClose,
  getReferenceFromRScript,
  TOL,
  TOL_EXACT,
} from "./survival-test-helpers.ts";

const R_SOURCE_TEST = new URL("./book4-source-test.R", import.meta.url)
  .pathname;

// test2 dataset (same as book3 — counting process data)
const test2 = {
  start: [1, 2, 5, 2, 1, 7, 3, 4, 8, 8],
  stop: [2, 3, 6, 7, 8, 9, 9, 9, 14, 17],
  event: [1, 1, 1, 1, 1, 1, 1, 0, 0, 0],
  x: [1, 0, 0, 1, 0, 1, 1, 1, 0, 0],
};

interface Book4Ref {
  fit0_loglik: number;
  fit0_var: number;
  fit0_coef: number;
  fit0_mart: number[];
  fit0_score: number[];
  fit0_scho: number[];
  fit0_scho_time: number[];
  fit_coef: number;
  fit_loglik: [number, number];
  fit_var: number;
  fit_mart: number[];
  fit_score: number[];
  fit_scho: number[];
  fit_scho_time: number[];
}

const ref = getReferenceFromRScript<Book4Ref>(R_SOURCE_TEST);

Deno.test("book4: coxph counting Efron iter=0", () => {
  const fit = coxphCounting({
    start: test2.start,
    stop: test2.stop,
    status: test2.event,
    covariates: { x: test2.x },
    options: { method: "efron", maxiter: 0 },
  });

  assertClose(fit.coefficients[0], ref.fit0_coef, TOL_EXACT, "coef");
  assertClose(fit.loglik[0], ref.fit0_loglik, TOL, "loglik");
  assertClose(fit.var[0][0], ref.fit0_var, TOL, "var");
});

Deno.test("book4: counting Efron iter=0 residuals", () => {
  const fit = coxphCounting({
    start: test2.start,
    stop: test2.stop,
    status: test2.event,
    covariates: { x: test2.x },
    options: { method: "efron", maxiter: 0 },
  });

  const mart = coxResidualsCounting({
    start: test2.start,
    stop: test2.stop,
    status: test2.event,
    coef: fit.coefficients,
    covariates: { x: test2.x },
    options: { type: "mart", method: "efron" },
  }) as number[];
  assertArrayClose(mart, ref.fit0_mart, TOL, "mart");

  const scoreResid = coxResidualsCounting({
    start: test2.start,
    stop: test2.stop,
    status: test2.event,
    coef: fit.coefficients,
    covariates: { x: test2.x },
    options: { type: "score", method: "efron" },
  }) as number[][];
  assertArrayClose(scoreResid[0], ref.fit0_score, TOL, "score");

  const scho = coxResidualsCounting({
    start: test2.start,
    stop: test2.stop,
    status: test2.event,
    coef: fit.coefficients,
    covariates: { x: test2.x },
    options: { type: "scho", method: "efron" },
  }) as SchoenfeldResult;
  assertArrayClose(scho.time, ref.fit0_scho_time, TOL_EXACT, "scho time");
  const schoFlat = scho.residuals.map((r) => r[0]);
  assertArrayClose(schoFlat, ref.fit0_scho, TOL, "scho");
});

Deno.test("book4: coxph counting Efron converged", () => {
  const fit = coxphCounting({
    start: test2.start,
    stop: test2.stop,
    status: test2.event,
    covariates: { x: test2.x },
    options: { method: "efron", eps: 1e-8, nocenter: true },
  });

  assertClose(fit.coefficients[0], ref.fit_coef, TOL, "coef");
  assertClose(fit.loglik[0], ref.fit_loglik[0], TOL, "loglik[0]");
  assertClose(fit.loglik[1], ref.fit_loglik[1], TOL, "loglik[1]");
  assertClose(fit.var[0][0], ref.fit_var, TOL, "var");
});

Deno.test("book4: counting Efron converged residuals", () => {
  const fit = coxphCounting({
    start: test2.start,
    stop: test2.stop,
    status: test2.event,
    covariates: { x: test2.x },
    options: { method: "efron", eps: 1e-8, nocenter: true },
  });

  const mart = coxResidualsCounting({
    start: test2.start,
    stop: test2.stop,
    status: test2.event,
    coef: fit.coefficients,
    covariates: { x: test2.x },
    options: { type: "mart", method: "efron" },
  }) as number[];
  assertArrayClose(mart, ref.fit_mart, TOL, "mart");

  const scoreResid = coxResidualsCounting({
    start: test2.start,
    stop: test2.stop,
    status: test2.event,
    coef: fit.coefficients,
    covariates: { x: test2.x },
    options: { type: "score", method: "efron" },
  }) as number[][];
  assertArrayClose(scoreResid[0], ref.fit_score, TOL, "score");

  const scho = coxResidualsCounting({
    start: test2.start,
    stop: test2.stop,
    status: test2.event,
    coef: fit.coefficients,
    covariates: { x: test2.x },
    options: { type: "scho", method: "efron" },
  }) as SchoenfeldResult;
  assertArrayClose(scho.time, ref.fit_scho_time, TOL_EXACT, "scho time");
  const schoFlat = scho.residuals.map((r) => r[0]);
  assertArrayClose(schoFlat, ref.fit_scho, TOL, "scho");
});
