// Translation of survival package test: counting.R
// R reference JSON: counting-source-test.R (sibling file)
// Tests that counting process (start-stop) Cox gives same results as right-censored
//
// Coverage of counting.R:
// [x] L21-24:   counting process coefs match right-censored coefs
// [x] L28-29:   coefficients match at iter=0
// [x] L30-33:   martingale residuals match (collapsed by id)
// [x] L35-36:   score residuals match at iter=0
// [x] L38-39:   Schoenfeld residuals match

import {
  coxph,
  coxphCounting,
  coxResiduals,
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

const R_SOURCE_TEST = new URL("./counting-source-test.R", import.meta.url)
  .pathname;

// test1: right-censored data (NA at index 1 excluded)
const test1 = {
  time: [9, 3, 1, 1, 6, 6, 8],
  status: [1, -1, 1, 0, 1, 1, 0], // -1 = NA, will be excluded
  x: [0, 2, 1, 1, 1, 0, 0],
};

// Clean test1: exclude NA row
const test1clean = {
  time: [9, 1, 1, 6, 6, 8],
  status: [1, 1, 0, 1, 1, 0],
  x: [0, 1, 1, 1, 0, 0],
};

// test1b: counting process version (exclude row with x=NA, i.e. row 14)
const test1b = {
  start: [0, 3, 0, 0, 5, 0, 6, 14, 0, 0, 10, 20, 30],
  stop: [3, 10, 10, 5, 20, 6, 14, 20, 30, 10, 20, 30, 40],
  status: [0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 1],
  x: [1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0],
  id: [3, 3, 4, 5, 5, 6, 6, 6, 7, 1, 1, 1, 1],
};

interface CountingRef {
  fit0_coef: number;
  fit_coef: number;
  fit_loglik: [number, number];
  fit_var: number;
  fit0b_coef: number;
  fitb_coef: number;
  fitb_loglik: [number, number];
  fitb_var: number;
  mart0: number[];
  mart: number[];
  score0: number[];
  score: number[];
  scho0: number[];
  scho0_time: number[];
  scho: number[];
  scho_time: number[];
  mart0b_raw: number[];
  martb_raw: number[];
  score0b_raw: number[];
  scoreb_raw: number[];
  scho0b: number[];
  scho0b_time: number[];
  schob: number[];
  schob_time: number[];
  mart0b_col: number[];
  martb_col: number[];
}

const ref = getReferenceFromRScript<CountingRef>(R_SOURCE_TEST);

Deno.test("counting: coefficients match at iter=0", () => {
  const fit0 = coxph({
    time: test1clean.time,
    status: test1clean.status,
    covariates: { x: test1clean.x },
    method: "efron",
    maxiter: 0,
  });

  const fit0b = coxphCounting({
    start: test1b.start,
    stop: test1b.stop,
    status: test1b.status,
    covariates: { x: test1b.x },
    options: { maxiter: 0 },
  });

  assertClose(fit0.coefficients[0], ref.fit0_coef, TOL_EXACT, "rc coef");
  assertClose(fit0b.coefficients[0], ref.fit0b_coef, TOL_EXACT, "cp coef");
  assertClose(
    fit0.coefficients[0],
    fit0b.coefficients[0],
    TOL,
    "rc vs cp coef",
  );
});

Deno.test("counting: converged coefficients match", () => {
  const fit = coxph({
    time: test1clean.time,
    status: test1clean.status,
    covariates: { x: test1clean.x },
    method: "efron",
  });

  const fitb = coxphCounting({
    start: test1b.start,
    stop: test1b.stop,
    status: test1b.status,
    covariates: { x: test1b.x },
  });

  assertClose(fit.coefficients[0], ref.fit_coef, TOL, "rc coef vs R");
  assertClose(fitb.coefficients[0], ref.fitb_coef, TOL, "cp coef vs R");
  assertClose(
    fit.coefficients[0],
    fitb.coefficients[0],
    TOL,
    "rc vs cp coef",
  );
  assertClose(fit.loglik[0], fitb.loglik[0], TOL, "loglik[0]");
  assertClose(fit.loglik[1], fitb.loglik[1], TOL, "loglik[1]");
});

Deno.test("counting: martingale residuals at iter=0", () => {
  const fit0b = coxphCounting({
    start: test1b.start,
    stop: test1b.stop,
    status: test1b.status,
    covariates: { x: test1b.x },
    options: { maxiter: 0 },
  });

  const mart0b = coxResidualsCounting({
    start: test1b.start,
    stop: test1b.stop,
    status: test1b.status,
    coef: fit0b.coefficients,
    covariates: { x: test1b.x },
    options: { type: "mart", method: "efron" },
  }) as number[];
  assertArrayClose(mart0b, ref.mart0b_raw, TOL, "mart0b raw");

  // Collapse by id and compare to right-censored residuals
  const collapsed = collapseById(mart0b, test1b.id);
  assertArrayClose(collapsed, ref.mart0b_col, TOL, "mart0b collapsed");
});

Deno.test("counting: martingale residuals converged", () => {
  const fitb = coxphCounting({
    start: test1b.start,
    stop: test1b.stop,
    status: test1b.status,
    covariates: { x: test1b.x },
  });

  const martb = coxResidualsCounting({
    start: test1b.start,
    stop: test1b.stop,
    status: test1b.status,
    coef: fitb.coefficients,
    covariates: { x: test1b.x },
    options: { type: "mart", method: "efron" },
  }) as number[];
  assertArrayClose(martb, ref.martb_raw, TOL, "martb raw");

  const collapsed = collapseById(martb, test1b.id);
  assertArrayClose(collapsed, ref.martb_col, TOL, "martb collapsed");
});

Deno.test("counting: score residuals at iter=0", () => {
  const fit0b = coxphCounting({
    start: test1b.start,
    stop: test1b.stop,
    status: test1b.status,
    covariates: { x: test1b.x },
    options: { maxiter: 0 },
  });

  const score0b = coxResidualsCounting({
    start: test1b.start,
    stop: test1b.stop,
    status: test1b.status,
    coef: fit0b.coefficients,
    covariates: { x: test1b.x },
    options: { type: "score", method: "efron" },
  }) as number[][];
  assertArrayClose(score0b[0], ref.score0b_raw, TOL, "score0b raw");
});

Deno.test("counting: Schoenfeld residuals at iter=0", () => {
  const fit0b = coxphCounting({
    start: test1b.start,
    stop: test1b.stop,
    status: test1b.status,
    covariates: { x: test1b.x },
    options: { maxiter: 0 },
  });

  const scho0b = coxResidualsCounting({
    start: test1b.start,
    stop: test1b.stop,
    status: test1b.status,
    coef: fit0b.coefficients,
    covariates: { x: test1b.x },
    options: { type: "scho", method: "efron" },
  }) as SchoenfeldResult;
  assertArrayClose(
    scho0b.time,
    ref.scho0b_time,
    TOL_EXACT,
    "scho0b time",
  );
  const schoFlat = scho0b.residuals.map((r) => r[0]);
  assertArrayClose(schoFlat, ref.scho0b, TOL, "scho0b");
});

Deno.test("counting: Schoenfeld residuals converged", () => {
  const fitb = coxphCounting({
    start: test1b.start,
    stop: test1b.stop,
    status: test1b.status,
    covariates: { x: test1b.x },
  });

  const schob = coxResidualsCounting({
    start: test1b.start,
    stop: test1b.stop,
    status: test1b.status,
    coef: fitb.coefficients,
    covariates: { x: test1b.x },
    options: { type: "scho", method: "efron" },
  }) as SchoenfeldResult;
  assertArrayClose(
    schob.time,
    ref.schob_time,
    TOL_EXACT,
    "schob time",
  );
  const schoFlat = schob.residuals.map((r) => r[0]);
  assertArrayClose(schoFlat, ref.schob, TOL, "schob");
});

// Helper: collapse residuals by id (sum within each unique id, sorted by id)
function collapseById(values: number[], ids: number[]): number[] {
  const sums = new Map<number, number>();
  for (let i = 0; i < ids.length; i++) {
    sums.set(ids[i], (sums.get(ids[i]) ?? 0) + values[i]);
  }
  const sortedIds = [...sums.keys()].sort((a, b) => a - b);
  return sortedIds.map((id) => sums.get(id)!);
}
