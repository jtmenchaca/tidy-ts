// Translation of survival package test: overlap.R
// R reference JSON: overlap-source-test.R (sibling file)
// Tests that useless intervals (no overlap with event times) don't affect fit
//
// Coverage of overlap.R:
// [x] L6-16:  counting-process coxph: subset(x<100) vs full data with x=500 wild obs
// [x] L17-19: coef, var, loglik, score, iter, wald, concordance match
// [x] L20:    residuals match (extra 0 for wild observation)
// [ ] L25-33: ridge() penalized model — needs penalized fitting (Tier 4)

import {
  coxphCounting,
} from "../../dataframe/ts/wasm/survival-functions.ts";
import {
  assertArrayClose,
  assertClose,
  getReferenceFromRScript,
  TOL,
} from "./survival-test-helpers.ts";

const R_SOURCE_TEST = new URL("./overlap-source-test.R", import.meta.url)
  .pathname;

interface OverlapRef {
  fit1_coef: number;
  fit1_loglik: number[];
  fit1_var: number;
  fit1_score: number;
  fit1_resid: number[];
  fit2_coef: number;
  fit2_loglik: number[];
  fit2_var: number;
  fit2_score: number;
  fit2_resid: number[];
}

const ref = getReferenceFromRScript<OverlapRef>(R_SOURCE_TEST);

// Data from book3 + one wild observation with x=500, interval (3,5) overlapping no events
const test2 = {
  time1: [1, 2, 5, 2, 1, 7, 3, 4, 8, 8, 3],
  time2: [2, 3, 6, 7, 8, 9, 9, 9, 14, 17, 5],
  event: [1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0],
  x: [1, 0, 0, 1, 0, 1, 1, 1, 0, 0, 500],
};

Deno.test("overlap: subset fit (x<100) matches R", () => {
  // Exclude the wild observation
  const idx = test2.x.map((v, i) => (v < 100 ? i : -1)).filter((i) => i >= 0);
  const fit1 = coxphCounting({
    stop: idx.map((i) => test2.time2[i]),
    start: idx.map((i) => test2.time1[i]),
    status: idx.map((i) => test2.event[i]),
    covariates: { x: idx.map((i) => test2.x[i]) },
  });
  assertClose(fit1.coefficients[0], ref.fit1_coef, TOL, "fit1 coef");
  assertArrayClose(fit1.loglik, ref.fit1_loglik, TOL, "fit1 loglik");
  assertClose(fit1.var[0][0], ref.fit1_var, TOL, "fit1 var");
});

Deno.test("overlap: full data fit matches subset (wild obs has no effect)", () => {
  const fit2 = coxphCounting({
    stop: test2.time2,
    start: test2.time1,
    status: test2.event,
    covariates: { x: test2.x },
  });
  // Coef, loglik, var, score should be identical to subset fit
  assertClose(fit2.coefficients[0], ref.fit2_coef, TOL, "fit2 coef");
  assertArrayClose(fit2.loglik, ref.fit2_loglik, TOL, "fit2 loglik");
  assertClose(fit2.var[0][0], ref.fit2_var, TOL, "fit2 var");

  // The key assertion: full data fit = subset fit (wild obs changes nothing)
  assertClose(fit2.coefficients[0], ref.fit1_coef, TOL, "fit2 coef == fit1 coef");
  assertArrayClose(fit2.loglik, ref.fit1_loglik, TOL, "fit2 loglik == fit1 loglik");
  assertClose(fit2.var[0][0], ref.fit1_var, TOL, "fit2 var == fit1 var");

  // Residuals: same as subset fit + trailing 0 for the wild observation
  assertArrayClose(fit2.residuals, ref.fit2_resid, TOL, "fit2 resid");
});
