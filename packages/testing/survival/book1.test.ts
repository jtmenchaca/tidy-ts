// Translation of survival package test: book1.R
// R reference JSON: book1-source-test.R (sibling file)
// Tests from Therneau & Grambsch appendix: Breslow estimate on test1 dataset
//
// Coverage of book1.R:
// [x] L73-76:  coxph Breslow iter=0 (loglik, var, mart, scho, score)
// [x] L80-83:  survfit from Cox iter=0 at x=0 (cumhaz, surv, std_err^2)
// [x] L84:     score residuals at iter=0 (exact check)
// [x] L86-87:  coxph Breslow iter=1 (coef)
// [x] L93-95:  coxph Breslow converged (coef, loglik)
// [x] L96-101: converged residuals (loglik, var, mart, scho, score)
// [x] L105-110: survfit from converged Cox at x=0 (censor=FALSE and TRUE)

import { expect } from "@std/expect";
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

const R_SOURCE_TEST = new URL("./book1-source-test.R", import.meta.url)
  .pathname;

// test1 dataset from book1.R (row 2 has NA status, excluded by R)
const test1 = {
  time: [9, 3, 1, 1, 6, 6, 8],
  status: [1, NaN, 1, 0, 1, 1, 0],
  x: [0, 2, 1, 1, 1, 0, 0],
};

// Remove NA observation (row index 1) — R's na.action=na.exclude drops it
const clean = (() => {
  const keep = test1.status.map((s) => !isNaN(s));
  return {
    time: test1.time.filter((_, i) => keep[i]),
    status: test1.status.filter((_, i) => keep[i]),
    x: test1.x.filter((_, i) => keep[i]),
  };
})();

interface Book1Ref {
  fit0_loglik: number;
  fit0_var: number;
  fit0_coef: number;
  fit0_mart: number[];
  fit0_score: number[];
  fit0_scho: number[];
  fit0_scho_time: number[];
  sfit0_cumhaz: number[];
  sfit0_surv: number[];
  sfit0_stderr_sq: number[];
  sfit0_time: number[];
  fit1_coef: number;
  fit_coef: number;
  fit_loglik: [number, number];
  fit_var: number;
  fit_means: number;
  fit_mart: number[];
  fit_score: number[];
  fit_scho: number[];
  fit_scho_time: number[];
  sfit_surv: number[];
  sfit_cumhaz: number[];
  sfit_stderr_sq: number[];
  sfit_time: number[];
  sfit_nc_surv: number[];
  sfit_nc_stderr_sq: number[];
  sfit_nc_time: number[];
}

const ref = getReferenceFromRScript<Book1Ref>(R_SOURCE_TEST);

Deno.test("book1: coxph Breslow iter=0", () => {
  const fit = coxph({
    time: clean.time,
    status: clean.status,
    covariates: { x: clean.x },
    method: "breslow", maxiter: 0,
  });

  assertClose(fit.loglik[0], ref.fit0_loglik, TOL, "loglik");
  assertClose(fit.var[0][0], ref.fit0_var, TOL, "var");
  assertClose(fit.coefficients[0], ref.fit0_coef, TOL_EXACT, "coef");
});

Deno.test("book1: residuals at iter=0 Breslow", () => {
  const fit = coxph({
    time: clean.time,
    status: clean.status,
    covariates: { x: clean.x },
    method: "breslow", maxiter: 0,
  });

  // Martingale residuals
  const mart = coxResiduals({
    time: clean.time,
    status: clean.status,
    coef: fit.coefficients,
    covariates: { x: clean.x },
    options: { type: "mart", method: "breslow" },
  }) as number[];
  assertArrayClose(mart, ref.fit0_mart, TOL, "mart");

  // Score residuals
  const scoreResid = coxResiduals({
    time: clean.time,
    status: clean.status,
    coef: fit.coefficients,
    covariates: { x: clean.x },
    options: { type: "score", method: "breslow" },
  }) as number[][];
  assertArrayClose(scoreResid[0], ref.fit0_score, TOL, "score");

  // Schoenfeld residuals
  const scho = coxResiduals({
    time: clean.time,
    status: clean.status,
    coef: fit.coefficients,
    covariates: { x: clean.x },
    options: { type: "scho", method: "breslow" },
  }) as SchoenfeldResult;
  assertArrayClose(scho.time, ref.fit0_scho_time, TOL_EXACT, "scho time");
  const schoFlat = scho.residuals.map((r) => r[0]);
  assertArrayClose(schoFlat, ref.fit0_scho, TOL, "scho");
});

Deno.test("book1: survfit from Cox iter=0 at x=0", () => {
  const fit = coxph({
    time: clean.time,
    status: clean.status,
    covariates: { x: clean.x },
    method: "breslow", maxiter: 0,
  });

  const sfit = survfitCox({
    time: clean.time,
    status: clean.status,
    options: {
      coef: fit.coefficients,
      covariates: { x: clean.x },
      stype: 2,
      ctype: 1,
      censor: true,
      newx: [0],
      means: [fit.means[0]],
      varMatrix: fit.var,
    },
  });

  assertArrayClose(sfit.time, ref.sfit0_time, TOL_EXACT, "time");
  assertArrayClose(sfit.cumhaz, ref.sfit0_cumhaz, TOL, "cumhaz");
  assertArrayClose(sfit.surv, ref.sfit0_surv, TOL, "surv");
  // Check std_err^2
  const stderrSq = sfit.stdErr.map((s) => s * s);
  assertArrayClose(stderrSq, ref.sfit0_stderr_sq, TOL, "std_err^2");
});

Deno.test("book1: coxph Breslow iter=1", () => {
  const fit = coxph({
    time: clean.time,
    status: clean.status,
    covariates: { x: clean.x },
    method: "breslow", maxiter: 1,
  });

  assertClose(fit.coefficients[0], ref.fit1_coef, TOL, "coef");
});

Deno.test("book1: coxph Breslow converged", () => {
  const fit = coxph({
    time: clean.time,
    status: clean.status,
    covariates: { x: clean.x },
    method: "breslow", eps: 1e-8, nocenter: true,
  });

  assertClose(fit.coefficients[0], ref.fit_coef, TOL, "coef");
  assertClose(fit.loglik[0], ref.fit_loglik[0], TOL, "loglik[0]");
  assertClose(fit.loglik[1], ref.fit_loglik[1], TOL, "loglik[1]");
  assertClose(fit.var[0][0], ref.fit_var, TOL, "var");
});

Deno.test("book1: residuals at converged Breslow", () => {
  const fit = coxph({
    time: clean.time,
    status: clean.status,
    covariates: { x: clean.x },
    method: "breslow", eps: 1e-8, nocenter: true,
  });

  const mart = coxResiduals({
    time: clean.time,
    status: clean.status,
    coef: fit.coefficients,
    covariates: { x: clean.x },
    options: { type: "mart", method: "breslow" },
  }) as number[];
  assertArrayClose(mart, ref.fit_mart, TOL, "mart");

  const scoreResid = coxResiduals({
    time: clean.time,
    status: clean.status,
    coef: fit.coefficients,
    covariates: { x: clean.x },
    options: { type: "score", method: "breslow" },
  }) as number[][];
  assertArrayClose(scoreResid[0], ref.fit_score, TOL, "score");

  const scho = coxResiduals({
    time: clean.time,
    status: clean.status,
    coef: fit.coefficients,
    covariates: { x: clean.x },
    options: { type: "scho", method: "breslow" },
  }) as SchoenfeldResult;
  assertArrayClose(scho.time, ref.fit_scho_time, TOL_EXACT, "scho time");
  const schoFlat = scho.residuals.map((r) => r[0]);
  assertArrayClose(schoFlat, ref.fit_scho, TOL, "scho");
});

Deno.test("book1: survfit from converged Cox at x=0, censor=FALSE", () => {
  const fit = coxph({
    time: clean.time,
    status: clean.status,
    covariates: { x: clean.x },
    method: "breslow", eps: 1e-8, nocenter: true,
  });

  const sfit = survfitCox({
    time: clean.time,
    status: clean.status,
    options: {
      coef: fit.coefficients,
      covariates: { x: clean.x },
      stype: 2,
      ctype: 1,
      censor: false,
      newx: [0],
      means: [fit.means[0]],
      varMatrix: fit.var,
    },
  });

  assertArrayClose(sfit.time, ref.sfit_nc_time, TOL_EXACT, "time");
  assertArrayClose(sfit.surv, ref.sfit_nc_surv, TOL, "surv");
  const stderrSq = sfit.stdErr.map((s) => s * s);
  assertArrayClose(stderrSq, ref.sfit_nc_stderr_sq, TOL, "std_err^2");
});

Deno.test("book1: survfit from converged Cox at x=0, censor=TRUE", () => {
  const fit = coxph({
    time: clean.time,
    status: clean.status,
    covariates: { x: clean.x },
    method: "breslow", eps: 1e-8, nocenter: true,
  });

  const sfit = survfitCox({
    time: clean.time,
    status: clean.status,
    options: {
      coef: fit.coefficients,
      covariates: { x: clean.x },
      stype: 2,
      ctype: 1,
      censor: true,
      newx: [0],
      means: [fit.means[0]],
      varMatrix: fit.var,
    },
  });

  assertArrayClose(sfit.time, ref.sfit_time, TOL_EXACT, "time");
  assertArrayClose(sfit.surv, ref.sfit_surv, TOL, "surv");
  assertArrayClose(sfit.cumhaz, ref.sfit_cumhaz, TOL, "cumhaz");
  const stderrSq = sfit.stdErr.map((s) => s * s);
  assertArrayClose(stderrSq, ref.sfit_stderr_sq, TOL, "std_err^2");
});
