// Translation of survival package test: book2.R
// R reference JSON: book2-source-test.R (sibling file)
// Tests from Therneau & Grambsch appendix: Efron estimate on test1 dataset
//
// Coverage of book2.R:
// [x] L63-70:  coxph Efron iter=0 (loglik, var, mart, scho, score)
// [x] L71-73:  survfit from Cox iter=0 at x=0 (surv, std_err^2)
// [x] L75-83:  coxph Efron converged (coef, loglik, var, mart, scho, score)
// [x] L94-96:  survfit from converged Cox at x=0 (surv, std_err^2)

import {
  coxph,
  coxResiduals,
  type SchoenfeldResult,
  survfitCox,
} from "../../dataframe/ts/wasm/survival-functions.ts";
import {
  assertArrayClose,
  assertClose,
  getReferenceFromRScript,
  TOL,
  TOL_EXACT,
} from "./survival-test-helpers.ts";

const R_SOURCE_TEST = new URL("./book2-source-test.R", import.meta.url)
  .pathname;

// test1 dataset (same as book1) — remove NA row
const clean = (() => {
  const time = [9, 3, 1, 1, 6, 6, 8];
  const status = [1, NaN, 1, 0, 1, 1, 0];
  const x = [0, 2, 1, 1, 1, 0, 0];
  const keep = status.map((s) => !isNaN(s));
  return {
    time: time.filter((_, i) => keep[i]),
    status: status.filter((_, i) => keep[i]),
    x: x.filter((_, i) => keep[i]),
  };
})();

interface Book2Ref {
  fit0_loglik: number;
  fit0_var: number;
  fit0_coef: number;
  fit0_mart: number[];
  fit0_score: number[];
  fit0_scho: number[];
  fit0_scho_time: number[];
  sfit0_surv: number[];
  sfit0_stderr_sq: number[];
  sfit0_time: number[];
  fit_coef: number;
  fit_loglik: [number, number];
  fit_var: number;
  fit_means: number;
  fit_mart: number[];
  fit_score: number[];
  fit_scho: number[];
  fit_scho_time: number[];
  sfit_surv: number[];
  sfit_stderr_sq: number[];
  sfit_time: number[];
}

const ref = getReferenceFromRScript<Book2Ref>(R_SOURCE_TEST);

Deno.test("book2: coxph Efron iter=0", () => {
  const fit = coxph({
    time: clean.time,
    status: clean.status,
    covariates: { x: clean.x },
    method: "efron", maxiter: 0,
  });

  assertClose(fit.loglik[0], ref.fit0_loglik, TOL, "loglik");
  assertClose(fit.var[0][0], ref.fit0_var, TOL, "var");
  assertClose(fit.coefficients[0], ref.fit0_coef, TOL_EXACT, "coef");
});

Deno.test("book2: residuals at iter=0 Efron", () => {
  const fit = coxph({
    time: clean.time,
    status: clean.status,
    covariates: { x: clean.x },
    method: "efron", maxiter: 0,
  });

  const mart = coxResiduals({
    time: clean.time,
    status: clean.status,
    coef: fit.coefficients,
    covariates: { x: clean.x },
    options: { type: "mart", method: "efron" },
  }) as number[];
  assertArrayClose(mart, ref.fit0_mart, TOL, "mart");

  const scoreResid = coxResiduals({
    time: clean.time,
    status: clean.status,
    coef: fit.coefficients,
    covariates: { x: clean.x },
    options: { type: "score", method: "efron" },
  }) as number[][];
  assertArrayClose(scoreResid[0], ref.fit0_score, TOL, "score");

  const scho = coxResiduals({
    time: clean.time,
    status: clean.status,
    coef: fit.coefficients,
    covariates: { x: clean.x },
    options: { type: "scho", method: "efron" },
  }) as SchoenfeldResult;
  assertArrayClose(scho.time, ref.fit0_scho_time, TOL_EXACT, "scho time");
  const schoFlat = scho.residuals.map((r) => r[0]);
  assertArrayClose(schoFlat, ref.fit0_scho, TOL, "scho");
});

Deno.test("book2: survfit from Cox iter=0 at x=0", () => {
  const fit = coxph({
    time: clean.time,
    status: clean.status,
    covariates: { x: clean.x },
    method: "efron", maxiter: 0,
  });

  const sfit = survfitCox({
    time: clean.time,
    status: clean.status,
    options: {
      coef: fit.coefficients,
      covariates: { x: clean.x },
      stype: 2,
      ctype: 2, // Efron uses ctype=2 by default
      censor: false,
      newx: [0],
      means: [fit.means[0]],
      varMatrix: fit.var,
    },
  });

  assertArrayClose(sfit.time, ref.sfit0_time, TOL_EXACT, "time");
  assertArrayClose(sfit.surv, ref.sfit0_surv, TOL, "surv");
  const stderrSq = sfit.stdErr.map((s) => s * s);
  assertArrayClose(stderrSq, ref.sfit0_stderr_sq, TOL, "std_err^2");
});

Deno.test("book2: coxph Efron converged", () => {
  const fit = coxph({
    time: clean.time,
    status: clean.status,
    covariates: { x: clean.x },
    method: "efron", eps: 1e-8, nocenter: true,
  });

  assertClose(fit.coefficients[0], ref.fit_coef, TOL, "coef");
  assertClose(fit.loglik[0], ref.fit_loglik[0], TOL, "loglik[0]");
  assertClose(fit.loglik[1], ref.fit_loglik[1], TOL, "loglik[1]");
  assertClose(fit.var[0][0], ref.fit_var, TOL, "var");
});

Deno.test("book2: residuals at converged Efron", () => {
  const fit = coxph({
    time: clean.time,
    status: clean.status,
    covariates: { x: clean.x },
    method: "efron", eps: 1e-8, nocenter: true,
  });

  const mart = coxResiduals({
    time: clean.time,
    status: clean.status,
    coef: fit.coefficients,
    covariates: { x: clean.x },
    options: { type: "mart", method: "efron" },
  }) as number[];
  assertArrayClose(mart, ref.fit_mart, TOL, "mart");

  const scoreResid = coxResiduals({
    time: clean.time,
    status: clean.status,
    coef: fit.coefficients,
    covariates: { x: clean.x },
    options: { type: "score", method: "efron" },
  }) as number[][];
  assertArrayClose(scoreResid[0], ref.fit_score, TOL, "score");

  const scho = coxResiduals({
    time: clean.time,
    status: clean.status,
    coef: fit.coefficients,
    covariates: { x: clean.x },
    options: { type: "scho", method: "efron" },
  }) as SchoenfeldResult;
  assertArrayClose(scho.time, ref.fit_scho_time, TOL_EXACT, "scho time");
  const schoFlat = scho.residuals.map((r) => r[0]);
  assertArrayClose(schoFlat, ref.fit_scho, TOL, "scho");
});

Deno.test("book2: survfit from converged Cox at x=0", () => {
  const fit = coxph({
    time: clean.time,
    status: clean.status,
    covariates: { x: clean.x },
    method: "efron", eps: 1e-8, nocenter: true,
  });

  const sfit = survfitCox({
    time: clean.time,
    status: clean.status,
    options: {
      coef: fit.coefficients,
      covariates: { x: clean.x },
      stype: 2,
      ctype: 2,
      censor: false,
      newx: [0],
      means: [fit.means[0]],
      varMatrix: fit.var,
    },
  });

  assertArrayClose(sfit.time, ref.sfit_time, TOL_EXACT, "time");
  assertArrayClose(sfit.surv, ref.sfit_surv, TOL, "surv");
  const stderrSq = sfit.stdErr.map((s) => s * s);
  assertArrayClose(stderrSq, ref.sfit_stderr_sq, TOL, "std_err^2");
});
