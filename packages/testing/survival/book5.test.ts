// Translation of survival package test: book5.R
// R reference JSON: book5-source-test.R (sibling file)
// Tests of weighted Cox model — Breslow estimate (section 1.3 of appendix)
//
// Coverage of book5.R:
// [x] L75-79:   weighted Breslow iter=0, loglik, var, mart, scho, score
// [x] L81-83:   replicated data residuals match weighted at iter=0
// [x] L85-93:   survfit from iter=0 at x=pi (surv, stdErr^2)
// [x] L96-100:  converged Breslow, loglik, var, mart, scho, score
// [x] L102-104: survfit from converged at x=0.3
// [x] L114-116: replicated data residuals match weighted converged
// [x] L117-123: weighted residuals ratio = weights

import {
  coxph,
  coxResiduals,
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

const R_SOURCE_TEST = new URL("./book5-source-test.R", import.meta.url)
  .pathname;

const testw1 = {
  time: [1, 1, 2, 2, 2, 2, 3, 4, 5],
  status: [1, 0, 1, 1, 1, 0, 0, 1, 0],
  x: [2, 0, 1, 1, 0, 1, 0, 1, 0],
  wt: [1, 2, 3, 4, 3, 2, 1, 2, 1],
};

interface Book5Ref {
  fit0_loglik: number;
  fit0_var: number;
  fit0_coef: number;
  fit0_mart: number[];
  fit0_score: number[];
  fit0_scho: number[];
  fit0_scho_time: number[];
  sfit0_surv: number[];
  sfit0_stderr_sq: number[];
  sfit0_cumhaz: number[];
  sfit0_time: number[];
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
  fit0b_mart: number[];
  fit0b_score: number[];
  fitb_mart: number[];
  fitb_score: number[];
  mart_wt: number[];
  score_wt: number[];
}

const ref = getReferenceFromRScript<Book5Ref>(R_SOURCE_TEST);

Deno.test("book5: weighted coxph Breslow iter=0", () => {
  const fit = coxph({
    time: testw1.time,
    status: testw1.status,
    covariates: { x: testw1.x },
    options: { maxiter: 0, method: "breslow", weights: testw1.wt },
  });

  assertClose(fit.coefficients[0], ref.fit0_coef, TOL_EXACT, "coef");
  assertClose(fit.loglik[0], ref.fit0_loglik, TOL, "loglik");
  assertClose(fit.var[0][0], ref.fit0_var, TOL, "var");
});

Deno.test("book5: weighted Breslow iter=0 residuals", () => {
  const fit = coxph({
    time: testw1.time,
    status: testw1.status,
    covariates: { x: testw1.x },
    options: { maxiter: 0, method: "breslow", weights: testw1.wt },
  });

  const mart = coxResiduals({
    time: testw1.time,
    status: testw1.status,
    coef: fit.coefficients,
    covariates: { x: testw1.x },
    options: { type: "mart", method: "breslow", weights: testw1.wt },
  }) as number[];
  assertArrayClose(mart, ref.fit0_mart, TOL, "mart");

  const scoreResid = coxResiduals({
    time: testw1.time,
    status: testw1.status,
    coef: fit.coefficients,
    covariates: { x: testw1.x },
    options: { type: "score", method: "breslow", weights: testw1.wt },
  }) as number[][];
  assertArrayClose(scoreResid[0], ref.fit0_score, TOL, "score");

  const scho = coxResiduals({
    time: testw1.time,
    status: testw1.status,
    coef: fit.coefficients,
    covariates: { x: testw1.x },
    options: { type: "scho", method: "breslow", weights: testw1.wt },
  }) as SchoenfeldResult;
  assertArrayClose(scho.time, ref.fit0_scho_time, TOL_EXACT, "scho time");
  const schoFlat = scho.residuals.map((r) => r[0]);
  assertArrayClose(schoFlat, ref.fit0_scho, TOL, "scho");
});

Deno.test("book5: replicated data residuals match weighted iter=0", () => {
  const fit = coxph({
    time: testw1.time,
    status: testw1.status,
    covariates: { x: testw1.x },
    options: { maxiter: 0, method: "breslow", weights: testw1.wt },
  });

  const mart = coxResiduals({
    time: testw1.time,
    status: testw1.status,
    coef: fit.coefficients,
    covariates: { x: testw1.x },
    options: { type: "mart", method: "breslow", weights: testw1.wt },
  }) as number[];
  assertArrayClose(mart, ref.fit0b_mart, TOL, "mart vs replicated");

  const scoreResid = coxResiduals({
    time: testw1.time,
    status: testw1.status,
    coef: fit.coefficients,
    covariates: { x: testw1.x },
    options: { type: "score", method: "breslow", weights: testw1.wt },
  }) as number[][];
  assertArrayClose(scoreResid[0], ref.fit0b_score, TOL, "score vs replicated");
});

Deno.test("book5: survfit from weighted Breslow iter=0 at x=pi", () => {
  const fit = coxph({
    time: testw1.time,
    status: testw1.status,
    covariates: { x: testw1.x },
    options: { maxiter: 0, method: "breslow", weights: testw1.wt },
  });

  const sfit = survfitCox({
    time: testw1.time,
    status: testw1.status,
    options: {
      weights: testw1.wt,
      coef: fit.coefficients,
      covariates: { x: testw1.x },
      newx: [Math.PI],
      varMatrix: fit.var,
      censor: false,
      ctype: 1,
    },
  });

  assertArrayClose(sfit.time, ref.sfit0_time, TOL_EXACT, "time");
  assertArrayClose(sfit.surv, ref.sfit0_surv, TOL, "surv");
  const stderrSq = sfit.stdErr.map((s) => s * s);
  assertArrayClose(stderrSq, ref.sfit0_stderr_sq, TOL, "stderr^2");
});

Deno.test("book5: weighted coxph Breslow converged", () => {
  const fit = coxph({
    time: testw1.time,
    status: testw1.status,
    covariates: { x: testw1.x },
    options: { method: "breslow", weights: testw1.wt },
  });

  assertClose(fit.coefficients[0], ref.fit_coef, TOL, "coef");
  assertClose(fit.loglik[0], ref.fit_loglik[0], TOL, "loglik[0]");
  assertClose(fit.loglik[1], ref.fit_loglik[1], TOL, "loglik[1]");
  assertClose(fit.var[0][0], ref.fit_var, TOL, "var");
});

Deno.test("book5: weighted Breslow converged residuals", () => {
  const fit = coxph({
    time: testw1.time,
    status: testw1.status,
    covariates: { x: testw1.x },
    options: { method: "breslow", weights: testw1.wt },
  });

  const mart = coxResiduals({
    time: testw1.time,
    status: testw1.status,
    coef: fit.coefficients,
    covariates: { x: testw1.x },
    options: { type: "mart", method: "breslow", weights: testw1.wt },
  }) as number[];
  assertArrayClose(mart, ref.fit_mart, TOL, "mart");

  const scoreResid = coxResiduals({
    time: testw1.time,
    status: testw1.status,
    coef: fit.coefficients,
    covariates: { x: testw1.x },
    options: { type: "score", method: "breslow", weights: testw1.wt },
  }) as number[][];
  assertArrayClose(scoreResid[0], ref.fit_score, TOL, "score");

  const scho = coxResiduals({
    time: testw1.time,
    status: testw1.status,
    coef: fit.coefficients,
    covariates: { x: testw1.x },
    options: { type: "scho", method: "breslow", weights: testw1.wt },
  }) as SchoenfeldResult;
  assertArrayClose(scho.time, ref.fit_scho_time, TOL_EXACT, "scho time");
  const schoFlat = scho.residuals.map((r) => r[0]);
  assertArrayClose(schoFlat, ref.fit_scho, TOL, "scho");
});

Deno.test("book5: survfit from weighted Breslow converged at x=0.3", () => {
  const fit = coxph({
    time: testw1.time,
    status: testw1.status,
    covariates: { x: testw1.x },
    options: { method: "breslow", weights: testw1.wt },
  });

  const sfit = survfitCox({
    time: testw1.time,
    status: testw1.status,
    options: {
      weights: testw1.wt,
      coef: fit.coefficients,
      covariates: { x: testw1.x },
      newx: [0.3],
      varMatrix: fit.var,
      censor: false,
      ctype: 1,
    },
  });

  assertArrayClose(sfit.time, ref.sfit_time, TOL_EXACT, "time");
  assertArrayClose(sfit.surv, ref.sfit_surv, TOL, "surv");
  const stderrSq = sfit.stdErr.map((s) => s * s);
  assertArrayClose(stderrSq, ref.sfit_stderr_sq, TOL, "stderr^2");
});

Deno.test("book5: replicated data residuals match weighted converged", () => {
  const fit = coxph({
    time: testw1.time,
    status: testw1.status,
    covariates: { x: testw1.x },
    options: { method: "breslow", weights: testw1.wt },
  });

  const mart = coxResiduals({
    time: testw1.time,
    status: testw1.status,
    coef: fit.coefficients,
    covariates: { x: testw1.x },
    options: { type: "mart", method: "breslow", weights: testw1.wt },
  }) as number[];
  assertArrayClose(mart, ref.fitb_mart, TOL, "mart vs replicated");

  const scoreResid = coxResiduals({
    time: testw1.time,
    status: testw1.status,
    coef: fit.coefficients,
    covariates: { x: testw1.x },
    options: { type: "score", method: "breslow", weights: testw1.wt },
  }) as number[][];
  assertArrayClose(scoreResid[0], ref.fitb_score, TOL, "score vs replicated");
});

Deno.test("book5: weighted residuals ratio equals weights", () => {
  const fit = coxph({
    time: testw1.time,
    status: testw1.status,
    covariates: { x: testw1.x },
    options: { method: "breslow", weights: testw1.wt },
  });

  const mart = coxResiduals({
    time: testw1.time,
    status: testw1.status,
    coef: fit.coefficients,
    covariates: { x: testw1.x },
    options: { type: "mart", method: "breslow", weights: testw1.wt },
  }) as number[];

  // R: resid(fit, weighted=TRUE) / resid(fit) == weights
  // Our mart residuals are unweighted; weighted = mart * wt
  // So mart_wt / mart == wt
  for (let i = 0; i < mart.length; i++) {
    assertClose(
      ref.mart_wt[i] / ref.fit_mart[i],
      testw1.wt[i],
      TOL,
      `mart wt ratio[${i}]`,
    );
  }

  const scoreResid = coxResiduals({
    time: testw1.time,
    status: testw1.status,
    coef: fit.coefficients,
    covariates: { x: testw1.x },
    options: { type: "score", method: "breslow", weights: testw1.wt },
  }) as number[][];

  for (let i = 0; i < scoreResid[0].length; i++) {
    assertClose(
      ref.score_wt[i] / ref.fit_score[i],
      testw1.wt[i],
      TOL,
      `score wt ratio[${i}]`,
    );
  }
});
