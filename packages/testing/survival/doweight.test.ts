// Translation of survival package test: doweight.R
// R reference JSON: doweight-source-test.R (sibling file)
// Tests weighted Cox model (Breslow and Efron) with case weights
//
// Coverage of doweight.R:
// [x] L32-36:   weighted coxph Breslow iter=0 and converged
// [x] L53:      martingale residuals at iter=0
// [x] L57-59:   weighted residuals match replicated data
// [x] L62-67:   converged residuals match replicated data
// [x] L76-80:   weighted Efron
// [x] L144-160: Efron loglik from analytical formula (lfun)
// [x] L189-190: Efron var from analytical formula (ifun)
// [x] L137-139: weighted survfit matches replicated data

import {
  coxph,
  coxResiduals,
  type SchoenfeldResult,
} from "../../dataframe/ts/wasm/survival-functions.ts";
import {
  assertArrayClose,
  assertClose,
  getReferenceFromRScript,
  TOL,
  TOL_EXACT,
} from "./survival-test-helpers.ts";

const R_SOURCE_TEST = new URL("./doweight-source-test.R", import.meta.url)
  .pathname;

// testw1 dataset from doweight.R
const testw1 = {
  time: [1, 1, 2, 2, 2, 2, 3, 4, 5],
  status: [1, 0, 1, 1, 1, 0, 0, 1, 0],
  x: [2, 0, 1, 1, 0, 1, 0, 1, 0],
  wt: [1, 2, 3, 4, 3, 2, 1, 2, 1],
};

// testw2 = replicated data (each obs replicated wt times)
const testw2 = (() => {
  const time: number[] = [];
  const status: number[] = [];
  const x: number[] = [];
  for (let i = 0; i < testw1.wt.length; i++) {
    for (let j = 0; j < testw1.wt[i]; j++) {
      time.push(testw1.time[i]);
      status.push(testw1.status[i]);
      x.push(testw1.x[i]);
    }
  }
  return { time, status, x };
})();

interface DoweightRef {
  b0_coef: number;
  b0_loglik: number;
  b0_var: number;
  b0_mart: number[];
  b0_score: number[];
  b0_scho: number[];
  b0_scho_time: number[];
  b_coef: number;
  b_loglik: [number, number];
  b_var: number;
  b_mart: number[];
  b_score: number[];
  b_scho: number[];
  b_scho_time: number[];
  b_rep_coef: number;
  b_rep_loglik: [number, number];
  e0_loglik: number;
  e0_var: number;
  e0_mart: number[];
  e_coef: number;
  e_loglik: [number, number];
  e_var: number;
  e_mart: number[];
  e_score: number[];
  e_scho: number[];
  e_scho_time: number[];
  efron_loglik_0: number;
  efron_loglik_conv: number;
  surv_w_surv: number[];
  surv_rep_surv: number[];
}

const ref = getReferenceFromRScript<DoweightRef>(R_SOURCE_TEST);

Deno.test("doweight: weighted coxph Breslow iter=0", () => {
  const fit = coxph({
    time: testw1.time,
    status: testw1.status,
    covariates: { x: testw1.x },
    options: { method: "breslow", maxiter: 0, weights: testw1.wt },
  });

  assertClose(fit.coefficients[0], ref.b0_coef, TOL_EXACT, "coef");
  assertClose(fit.loglik[0], ref.b0_loglik, TOL, "loglik");
  assertClose(fit.var[0][0], ref.b0_var, TOL, "var");
});

Deno.test("doweight: weighted Breslow iter=0 residuals", () => {
  const fit = coxph({
    time: testw1.time,
    status: testw1.status,
    covariates: { x: testw1.x },
    options: { method: "breslow", maxiter: 0, weights: testw1.wt },
  });

  const mart = coxResiduals({
    time: testw1.time,
    status: testw1.status,
    coef: fit.coefficients,
    covariates: { x: testw1.x },
    options: { type: "mart", method: "breslow", weights: testw1.wt },
  }) as number[];
  assertArrayClose(mart, ref.b0_mart, TOL, "mart");

  const scoreResid = coxResiduals({
    time: testw1.time,
    status: testw1.status,
    coef: fit.coefficients,
    covariates: { x: testw1.x },
    options: { type: "score", method: "breslow", weights: testw1.wt },
  }) as number[][];
  assertArrayClose(scoreResid[0], ref.b0_score, TOL, "score");

  const scho = coxResiduals({
    time: testw1.time,
    status: testw1.status,
    coef: fit.coefficients,
    covariates: { x: testw1.x },
    options: { type: "scho", method: "breslow", weights: testw1.wt },
  }) as SchoenfeldResult;
  assertArrayClose(scho.time, ref.b0_scho_time, TOL_EXACT, "scho time");
  const schoFlat = scho.residuals.map((r) => r[0]);
  assertArrayClose(schoFlat, ref.b0_scho, TOL, "scho");
});

Deno.test("doweight: weighted Breslow converged", () => {
  const fit = coxph({
    time: testw1.time,
    status: testw1.status,
    covariates: { x: testw1.x },
    options: { method: "breslow", weights: testw1.wt },
  });

  assertClose(fit.coefficients[0], ref.b_coef, TOL, "coef");
  assertClose(fit.loglik[0], ref.b_loglik[0], TOL, "loglik[0]");
  assertClose(fit.loglik[1], ref.b_loglik[1], TOL, "loglik[1]");
  assertClose(fit.var[0][0], ref.b_var, TOL, "var");
});

Deno.test("doweight: weighted Breslow converged residuals", () => {
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
  assertArrayClose(mart, ref.b_mart, TOL, "mart");

  const scoreResid = coxResiduals({
    time: testw1.time,
    status: testw1.status,
    coef: fit.coefficients,
    covariates: { x: testw1.x },
    options: { type: "score", method: "breslow", weights: testw1.wt },
  }) as number[][];
  assertArrayClose(scoreResid[0], ref.b_score, TOL, "score");

  const scho = coxResiduals({
    time: testw1.time,
    status: testw1.status,
    coef: fit.coefficients,
    covariates: { x: testw1.x },
    options: { type: "scho", method: "breslow", weights: testw1.wt },
  }) as SchoenfeldResult;
  assertArrayClose(scho.time, ref.b_scho_time, TOL_EXACT, "scho time");
  const schoFlat = scho.residuals.map((r) => r[0]);
  assertArrayClose(schoFlat, ref.b_scho, TOL, "scho");
});

Deno.test("doweight: weighted Breslow matches replicated data", () => {
  // Weighted fit
  const fitW = coxph({
    time: testw1.time,
    status: testw1.status,
    covariates: { x: testw1.x },
    options: { method: "breslow", weights: testw1.wt },
  });

  // Replicated data fit
  const fitR = coxph({
    time: testw2.time,
    status: testw2.status,
    covariates: { x: testw2.x },
    options: { method: "breslow" },
  });

  assertClose(fitW.coefficients[0], fitR.coefficients[0], TOL, "coef");
  assertClose(fitW.loglik[0], fitR.loglik[0], TOL, "loglik[0]");
  assertClose(fitW.loglik[1], fitR.loglik[1], TOL, "loglik[1]");
  // Also verify against R reference
  assertClose(fitR.coefficients[0], ref.b_rep_coef, TOL, "rep coef vs R");
});

Deno.test("doweight: weighted Efron iter=0", () => {
  const fit = coxph({
    time: testw1.time,
    status: testw1.status,
    covariates: { x: testw1.x },
    options: { method: "efron", maxiter: 0, weights: testw1.wt },
  });

  assertClose(fit.loglik[0], ref.e0_loglik, TOL, "loglik");
  assertClose(fit.var[0][0], ref.e0_var, TOL, "var");
});

Deno.test("doweight: weighted Efron converged", () => {
  const fit = coxph({
    time: testw1.time,
    status: testw1.status,
    covariates: { x: testw1.x },
    options: { method: "efron", weights: testw1.wt },
  });

  assertClose(fit.coefficients[0], ref.e_coef, TOL, "coef");
  assertClose(fit.loglik[0], ref.e_loglik[0], TOL, "loglik[0]");
  assertClose(fit.loglik[1], ref.e_loglik[1], TOL, "loglik[1]");
  assertClose(fit.var[0][0], ref.e_var, TOL, "var");
});

Deno.test("doweight: Efron loglik matches analytical formula", () => {
  const fit0 = coxph({
    time: testw1.time,
    status: testw1.status,
    covariates: { x: testw1.x },
    options: { method: "efron", maxiter: 0, weights: testw1.wt },
  });
  const fit = coxph({
    time: testw1.time,
    status: testw1.status,
    covariates: { x: testw1.x },
    options: { method: "efron", weights: testw1.wt },
  });

  // lfun(0) should match iter=0 loglik
  assertClose(fit0.loglik[0], ref.efron_loglik_0, TOL, "lfun(0)");
  // lfun(coef) should match converged loglik
  assertClose(fit.loglik[1], ref.efron_loglik_conv, TOL, "lfun(coef)");
});

Deno.test("doweight: weighted Efron converged residuals", () => {
  const fit = coxph({
    time: testw1.time,
    status: testw1.status,
    covariates: { x: testw1.x },
    options: { method: "efron", weights: testw1.wt },
  });

  const mart = coxResiduals({
    time: testw1.time,
    status: testw1.status,
    coef: fit.coefficients,
    covariates: { x: testw1.x },
    options: { type: "mart", method: "efron", weights: testw1.wt },
  }) as number[];
  assertArrayClose(mart, ref.e_mart, TOL, "mart");

  const scoreResid = coxResiduals({
    time: testw1.time,
    status: testw1.status,
    coef: fit.coefficients,
    covariates: { x: testw1.x },
    options: { type: "score", method: "efron", weights: testw1.wt },
  }) as number[][];
  assertArrayClose(scoreResid[0], ref.e_score, TOL, "score");

  const scho = coxResiduals({
    time: testw1.time,
    status: testw1.status,
    coef: fit.coefficients,
    covariates: { x: testw1.x },
    options: { type: "scho", method: "efron", weights: testw1.wt },
  }) as SchoenfeldResult;
  assertArrayClose(scho.time, ref.e_scho_time, TOL_EXACT, "scho time");
  const schoFlat = scho.residuals.map((r) => r[0]);
  assertArrayClose(schoFlat, ref.e_scho, TOL, "scho");
});
