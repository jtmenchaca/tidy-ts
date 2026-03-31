// Translation of survival package test: infcox.R
// R reference JSON: infcox-source-test.R (sibling file)
// Tests the "infinity" check on 2 variables — coefficients go to -infinity
//
// Coverage of infcox.R:
// [x] L14:    coxph with 2 covariates, converged
// [x] L16:    all coefficients < -22
// [x] L17:    loglik matches expected (rounded to 4 decimal places)
// [x] L35:    loglik at converged coef matches analytical formula

import { coxph } from "../../dataframe/ts/wasm/survival-functions.ts";
import {
  assertClose,
  getReferenceFromRScript,
  TOL,
} from "./survival-test-helpers.ts";

const R_SOURCE_TEST = new URL("./infcox-source-test.R", import.meta.url)
  .pathname;

const test3 = {
  futime: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
  fustat: [1, 0, 1, 0, 1, 0, 0, 0, 0, 0, 0, 0],
  x1: [0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1],
  x2: [0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1],
};

interface InfcoxRef {
  coef: number[];
  loglik: [number, number];
  var: number[];
  coefs_below_neg22: boolean;
  true_loglik_at_coef: number;
}

const ref = getReferenceFromRScript<InfcoxRef>(R_SOURCE_TEST);

Deno.test("infcox: multivariate Cox converges with near-infinite coefs", () => {
  const fit = coxph({
    time: test3.futime,
    status: test3.fustat,
    covariates: { x1: test3.x1, x2: test3.x2 },
    method: "efron",
    maxiter: 25,
  });

  // Both coefficients should be strongly negative (< -22)
  if (fit.coefficients[0] >= -22 || fit.coefficients[1] >= -22) {
    throw new Error(
      `Expected both coefs < -22, got [${fit.coefficients[0]}, ${fit.coefficients[1]}]`,
    );
  }

  // Loglik matches R reference (rounded to 4 decimal places)
  assertClose(
    Math.round(fit.loglik[0] * 10000) / 10000,
    Math.round(ref.loglik[0] * 10000) / 10000,
    1e-4,
    "loglik[0] rounded",
  );
  assertClose(
    Math.round(fit.loglik[1] * 10000) / 10000,
    Math.round(ref.loglik[1] * 10000) / 10000,
    1e-4,
    "loglik[1] rounded",
  );
});

Deno.test("infcox: loglik at converged coef matches analytical formula", () => {
  const fit = coxph({
    time: test3.futime,
    status: test3.fustat,
    covariates: { x1: test3.x1, x2: test3.x2 },
    method: "efron",
    maxiter: 25,
  });

  // Analytical loglik formula from infcox.R lines 27-33
  const r1 = Math.exp(fit.coefficients[0]);
  const r2 = Math.exp(fit.coefficients[1]);
  const trueLoglik =
    -Math.log(3 * (1 + r1 + r2 + r1 * r2)) -
    Math.log(2 + 2 * r1 + 3 * r2 + 3 * r1 * r2) -
    Math.log(1 + r1 + 3 * r2 + 3 * r1 * r2);

  assertClose(fit.loglik[1], trueLoglik, TOL, "loglik matches analytical");
});
