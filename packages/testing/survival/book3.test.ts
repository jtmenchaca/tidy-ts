// Translation of survival package test: book3.R
// R reference JSON: book3-source-test.R (sibling file)
// Tests from Therneau & Grambsch appendix: Data set 2, Breslow estimate
// Counting process (start-stop) Cox PH
//
// Coverage of book3.R:
// [x] L69-73:   coxph Breslow iter=0, loglik, var, mart, score, scho
// [x] L76-78:   survfit from iter=0 at x=0 (surv, stdErr^2)
// [x] L79:      score test = u^2/imat
// [x] L81-83:   iter=1 coef
// [x] L86-92:   converged Breslow, loglik, var, mart, score, scho
// [x] L96-98:   survfit from converged at x=0

import {
  coxphCounting,
  coxResidualsCounting,
  survfitCox,
  type SchoenfeldResult,
} from "../../dataframe/ts/wasm/survival-functions.ts";
import {
  assertArrayClose,
  assertClose,
  getReferenceFromRScript,
  TOL,
  TOL_EXACT,
} from "./survival-test-helpers.ts";

const R_SOURCE_TEST = new URL("./book3-source-test.R", import.meta.url)
  .pathname;

// test2 dataset from book3.R (counting process data)
const test2 = {
  start: [1, 2, 5, 2, 1, 7, 3, 4, 8, 8],
  stop: [2, 3, 6, 7, 8, 9, 9, 9, 14, 17],
  event: [1, 1, 1, 1, 1, 1, 1, 0, 0, 0],
  x: [1, 0, 0, 1, 0, 1, 1, 1, 0, 0],
};

interface Book3Ref {
  fit0_loglik: number;
  fit0_var: number;
  fit0_coef: number;
  fit0_score_test: number;
  fit0_mart: number[];
  fit0_score: number[];
  fit0_scho: number[];
  fit0_scho_time: number[];
  sfit0_surv: number[];
  sfit0_stderr_sq: number[];
  sfit0_time: number[];
  fit1_coef: number;
  fit_coef: number;
  fit_loglik: [number, number];
  fit_var: number;
  fit_mart: number[];
  fit_score: number[];
  fit_scho: number[];
  fit_scho_time: number[];
  sfit_surv: number[];
  sfit_stderr_sq: number[];
  sfit_cumhaz: number[];
  sfit_time: number[];
}

const ref = getReferenceFromRScript<Book3Ref>(R_SOURCE_TEST);

Deno.test("book3: coxph counting Breslow iter=0", () => {
  const fit = coxphCounting({
    start: test2.start,
    stop: test2.stop,
    status: test2.event,
    covariates: { x: test2.x },
    options: { method: "breslow", maxiter: 0 },
  });

  assertClose(fit.coefficients[0], ref.fit0_coef, TOL_EXACT, "coef");
  assertClose(fit.loglik[0], ref.fit0_loglik, TOL, "loglik");
  assertClose(fit.var[0][0], ref.fit0_var, TOL, "var");
  assertClose(fit.score, ref.fit0_score_test, TOL, "score test");
});

Deno.test("book3: counting Breslow iter=0 residuals", () => {
  const fit = coxphCounting({
    start: test2.start,
    stop: test2.stop,
    status: test2.event,
    covariates: { x: test2.x },
    options: { method: "breslow", maxiter: 0 },
  });

  const mart = coxResidualsCounting({
    start: test2.start,
    stop: test2.stop,
    status: test2.event,
    coef: fit.coefficients,
    covariates: { x: test2.x },
    options: { type: "mart", method: "breslow" },
  }) as number[];
  assertArrayClose(mart, ref.fit0_mart, TOL, "mart");

  const scoreResid = coxResidualsCounting({
    start: test2.start,
    stop: test2.stop,
    status: test2.event,
    coef: fit.coefficients,
    covariates: { x: test2.x },
    options: { type: "score", method: "breslow" },
  }) as number[][];
  assertArrayClose(scoreResid[0], ref.fit0_score, TOL, "score");

  const scho = coxResidualsCounting({
    start: test2.start,
    stop: test2.stop,
    status: test2.event,
    coef: fit.coefficients,
    covariates: { x: test2.x },
    options: { type: "scho", method: "breslow" },
  }) as SchoenfeldResult;
  assertArrayClose(scho.time, ref.fit0_scho_time, TOL_EXACT, "scho time");
  const schoFlat = scho.residuals.map((r) => r[0]);
  assertArrayClose(schoFlat, ref.fit0_scho, TOL, "scho");
});

Deno.test("book3: survfit from counting Cox iter=0 at x=0", () => {
  const fit = coxphCounting({
    start: test2.start,
    stop: test2.stop,
    status: test2.event,
    covariates: { x: test2.x },
    options: { method: "breslow", maxiter: 0 },
  });

  const sfit = survfitCox({
    time: test2.stop,
    status: test2.event,
    options: {
      start: test2.start,
      coef: fit.coefficients,
      covariates: { x: test2.x },
      newx: [0],
      varMatrix: fit.var,
      censor: false,
    },
  });

  assertArrayClose(sfit.time, ref.sfit0_time, TOL_EXACT, "time");
  assertArrayClose(sfit.surv, ref.sfit0_surv, TOL, "surv");
  const stderrSq = sfit.stdErr.map((s) => s * s);
  assertArrayClose(stderrSq, ref.sfit0_stderr_sq, TOL, "stderr^2");
});

Deno.test("book3: coxph counting Breslow iter=1", () => {
  const fit = coxphCounting({
    start: test2.start,
    stop: test2.stop,
    status: test2.event,
    covariates: { x: test2.x },
    options: { method: "breslow", maxiter: 1 },
  });

  assertClose(fit.coefficients[0], ref.fit1_coef, TOL, "coef");
});

Deno.test("book3: coxph counting Breslow converged", () => {
  const fit = coxphCounting({
    start: test2.start,
    stop: test2.stop,
    status: test2.event,
    covariates: { x: test2.x },
    options: { method: "breslow", eps: 1e-8, nocenter: true },
  });

  assertClose(fit.coefficients[0], ref.fit_coef, TOL, "coef");
  assertClose(fit.loglik[0], ref.fit_loglik[0], TOL, "loglik[0]");
  assertClose(fit.loglik[1], ref.fit_loglik[1], TOL, "loglik[1]");
  assertClose(fit.var[0][0], ref.fit_var, TOL, "var");
});

Deno.test("book3: counting Breslow converged residuals", () => {
  const fit = coxphCounting({
    start: test2.start,
    stop: test2.stop,
    status: test2.event,
    covariates: { x: test2.x },
    options: { method: "breslow", eps: 1e-8, nocenter: true },
  });

  const mart = coxResidualsCounting({
    start: test2.start,
    stop: test2.stop,
    status: test2.event,
    coef: fit.coefficients,
    covariates: { x: test2.x },
    options: { type: "mart", method: "breslow" },
  }) as number[];
  assertArrayClose(mart, ref.fit_mart, TOL, "mart");

  const scoreResid = coxResidualsCounting({
    start: test2.start,
    stop: test2.stop,
    status: test2.event,
    coef: fit.coefficients,
    covariates: { x: test2.x },
    options: { type: "score", method: "breslow" },
  }) as number[][];
  assertArrayClose(scoreResid[0], ref.fit_score, TOL, "score");

  const scho = coxResidualsCounting({
    start: test2.start,
    stop: test2.stop,
    status: test2.event,
    coef: fit.coefficients,
    covariates: { x: test2.x },
    options: { type: "scho", method: "breslow" },
  }) as SchoenfeldResult;
  assertArrayClose(scho.time, ref.fit_scho_time, TOL_EXACT, "scho time");
  const schoFlat = scho.residuals.map((r) => r[0]);
  assertArrayClose(schoFlat, ref.fit_scho, TOL, "scho");
});

Deno.test("book3: survfit from converged counting Cox at x=0", () => {
  const fit = coxphCounting({
    start: test2.start,
    stop: test2.stop,
    status: test2.event,
    covariates: { x: test2.x },
    options: { method: "breslow", eps: 1e-8, nocenter: true },
  });

  const sfit = survfitCox({
    time: test2.stop,
    status: test2.event,
    options: {
      start: test2.start,
      coef: fit.coefficients,
      covariates: { x: test2.x },
      newx: [0],
      varMatrix: fit.var,
      censor: false,
    },
  });

  assertArrayClose(sfit.time, ref.sfit_time, TOL_EXACT, "time");
  assertArrayClose(sfit.surv, ref.sfit_surv, TOL, "surv");
  const stderrSq = sfit.stdErr.map((s) => s * s);
  assertArrayClose(stderrSq, ref.sfit_stderr_sq, TOL, "stderr^2");
  assertArrayClose(sfit.cumhaz, ref.sfit_cumhaz, TOL, "cumhaz");
});
