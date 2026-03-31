// Translation of survival package test: coxsurv3.R
// R reference JSON: coxsurv3-source-test.R (sibling file)
// Tests counting-process Cox survfit with hand-computed hazard values
//
// Coverage of coxsurv3.R:
// [x] L30-37: coxph fit on test2 counting process data + survfit(fit, x=0)
// [x] L34-37: hand-computed hazard matches survfit cumhaz
// [ ] L40-44: survfit with time-dependent newdata (id=patn) — needs id-based prediction
// [ ] L49-65: multi-strata survfit subscripting — needs strata handling
// [ ] L91-106: multi-strata subject trajectories — needs id-based multi-strata prediction

import {
  coxphCounting,
  survfitCox,
} from "../../dataframe/ts/wasm/survival-functions.ts";
import {
  assertArrayClose,
  assertClose,
  getReferenceFromRScript,
  TOL,
  TOL_EXACT,
} from "./survival-test-helpers.ts";

const R_SOURCE_TEST = new URL("./coxsurv3-source-test.R", import.meta.url)
  .pathname;

interface Coxsurv3Ref {
  coef: number;
  loglik: [number, number];
  surv1_time: number[];
  surv1_surv: number[];
  surv1_cumhaz: number[];
  surv1_std_err: number[];
  true_lambda: number[];
  true_time: number[];
  true_cumhaz: number[];
}

const ref = getReferenceFromRScript<Coxsurv3Ref>(R_SOURCE_TEST);

const test2 = {
  start: [1, 2, 5, 2, 1, 7, 3, 4, 8, 8],
  stop: [2, 3, 6, 7, 8, 9, 9, 9, 14, 17],
  event: [1, 1, 1, 1, 1, 1, 1, 0, 0, 0],
  x: [1, 0, 0, 1, 0, 1, 1, 1, 0, 0],
};

Deno.test("coxsurv3: coxph counting process fit on test2", () => {
  const fit = coxphCounting({
    start: test2.start,
    stop: test2.stop,
    status: test2.event,
    covariates: { x: test2.x },
  });

  assertClose(fit.coefficients[0], ref.coef, TOL, "coef");
  assertClose(fit.loglik[0], ref.loglik[0], TOL, "loglik[0]");
  assertClose(fit.loglik[1], ref.loglik[1], TOL, "loglik[1]");
});

Deno.test("coxsurv3: hand-computed hazard matches cumhaz", () => {
  const fit = coxphCounting({
    start: test2.start,
    stop: test2.stop,
    status: test2.event,
    covariates: { x: test2.x },
  });

  // Hand-computed hazard at each event time for x=0
  const r = Math.exp(fit.coefficients[0]);
  const trueLambda = [
    1 / (r + 1),
    1 / (r + 2),
    1 / (3 * r + 2),
    1 / (3 * r + 1),
    1 / (3 * r + 1),
    1 / (3 * r + 2) + 1 / (2 * r + 2),
  ];
  const trueCumhaz: number[] = [];
  let cumSum = 0;
  for (const l of trueLambda) {
    cumSum += l;
    trueCumhaz.push(cumSum);
  }

  assertArrayClose(trueLambda, ref.true_lambda, TOL, "true_lambda");
  assertArrayClose(trueCumhaz, ref.true_cumhaz, TOL, "true_cumhaz");
});

Deno.test("coxsurv3: survfit from counting-process Cox at x=0", () => {
  const fit = coxphCounting({
    start: test2.start,
    stop: test2.stop,
    status: test2.event,
    covariates: { x: test2.x },
  });

  const sf = survfitCox({
    time: test2.stop,
    status: test2.event,
    options: {
      start: test2.start,
      coef: fit.coefficients,
      covariates: { x: test2.x },
      censor: false,
      ctype: 2, // Efron cumhaz to match R's survfit.coxph default for Efron-fit models
      newx: [0],
      means: fit.means,
      varMatrix: fit.var,
    },
  });

  // Compute expected haz at each time
  const r = Math.exp(fit.coefficients[0]);
  // Expected nrisk at each event time for Breslow:
  // t=2: at risk = {start<2, stop>=2}: ids 0(1,2),1(2,3),3(2,7),4(1,8) → 4 people, wrisk = r+1+r+1 = 2r+2
  // t=3: at risk = {start<3, stop>=3}: ids 1(2,3),3(2,7),4(1,8) → 3, wrisk = 1+r+1 = r+2
  // etc.
  // haz = nevent/nrisk, cumhaz = cumsum(haz)
  assertArrayClose(sf.time, ref.surv1_time, TOL_EXACT, "surv1_time");
  // -log(surv) should equal cumsum(true_lambda)
  const negLogSurv = sf.surv.map((s) => -Math.log(s));
  assertArrayClose(negLogSurv, ref.true_cumhaz, TOL, "negLogSurv == cumhaz");
});
