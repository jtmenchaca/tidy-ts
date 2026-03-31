// Translation of survival package test: stratatest.R
// R reference JSON: stratatest-source-test.R (sibling file)
// Trivial test of stratified residuals — duplicating strata should give
// the exact same residuals for each copy.
//
// Coverage of stratatest.R:
// [x] L23-28: right-censored: unstratified vs duplicated strata (mart, score, scho)
// [x] L38-43: counting process: unstratified vs duplicated strata (mart, score, scho)

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

const R_SOURCE_TEST = new URL("./stratatest-source-test.R", import.meta.url)
  .pathname;

// test1 (right-censored) — NA at index 1 excluded
const test1clean = {
  time: [9, 1, 1, 6, 6, 8],
  status: [1, 1, 0, 1, 1, 0],
  x: [0, 1, 1, 1, 0, 0],
};

// test2 (counting process)
const test2 = {
  start: [1, 2, 5, 2, 1, 7, 3, 4, 8, 8],
  stop: [2, 3, 6, 7, 8, 9, 9, 9, 14, 17],
  event: [1, 1, 1, 1, 1, 1, 1, 0, 0, 0],
  x: [1, 0, 0, 1, 0, 1, 1, 1, 0, 0],
};

interface StratatestRef {
  fit1_coef: number;
  fit1_loglik: [number, number];
  fit1_var: number;
  fit1_mart: number[];
  fit1_score: number[];
  fit1_scho: number[];
  fit1_scho_time: number[];
  fit2_coef: number;
  fit2_loglik: [number, number];
  fit2_var: number;
  fit2_mart: number[];
  fit2_score: number[];
  fit2_scho: number[];
  fit2_scho_time: number[];
  n1: number;
  ndead1: number;
  fit3_coef: number;
  fit3_loglik: [number, number];
  fit3_var: number;
  fit3_mart: number[];
  fit3_score: number[];
  fit3_scho: number[];
  fit3_scho_time: number[];
  fit4_coef: number;
  fit4_loglik: [number, number];
  fit4_var: number;
  fit4_mart: number[];
  fit4_score: number[];
  fit4_scho: number[];
  fit4_scho_time: number[];
  n2: number;
  ndead2: number;
}

const ref = getReferenceFromRScript<StratatestRef>(R_SOURCE_TEST);

// ── Right-censored: unstratified ────────────────────────────────────────

Deno.test("stratatest: right-censored unstratified fit", () => {
  const fit = coxph({
    time: test1clean.time,
    status: test1clean.status,
    covariates: { x: test1clean.x },
    method: "efron",
  });
  assertClose(fit.coefficients[0], ref.fit1_coef, TOL, "coef");
  assertClose(fit.loglik[0], ref.fit1_loglik[0], TOL, "loglik[0]");
  assertClose(fit.loglik[1], ref.fit1_loglik[1], TOL, "loglik[1]");
  assertClose(fit.var[0][0], ref.fit1_var, TOL, "var");
});

Deno.test("stratatest: right-censored unstratified residuals", () => {
  const fit = coxph({
    time: test1clean.time,
    status: test1clean.status,
    covariates: { x: test1clean.x },
    method: "efron",
  });

  const mart = coxResiduals({
    time: test1clean.time,
    status: test1clean.status,
    coef: fit.coefficients,
    covariates: { x: test1clean.x },
    options: { type: "mart" },
  }) as number[];
  assertArrayClose(mart, ref.fit1_mart, TOL, "mart");

  const score = coxResiduals({
    time: test1clean.time,
    status: test1clean.status,
    coef: fit.coefficients,
    covariates: { x: test1clean.x },
    options: { type: "score" },
  }) as number[][];
  assertArrayClose(score[0], ref.fit1_score, TOL, "score");

  const scho = coxResiduals({
    time: test1clean.time,
    status: test1clean.status,
    coef: fit.coefficients,
    covariates: { x: test1clean.x },
    options: { type: "scho" },
  }) as SchoenfeldResult;
  assertArrayClose(scho.time, ref.fit1_scho_time, TOL_EXACT, "scho time");
  const schoFlat = scho.residuals.map((r) => r[0]);
  assertArrayClose(schoFlat, ref.fit1_scho, TOL, "scho");
});

// ── Right-censored: duplicated strata should match ──────────────────────

Deno.test("stratatest: right-censored stratified fit matches", () => {
  // Duplicate data with strata
  const n = test1clean.time.length;
  const dupTime = [...test1clean.time, ...test1clean.time];
  const dupStatus = [...test1clean.status, ...test1clean.status];
  const dupX = [...test1clean.x, ...test1clean.x];
  const strata = [...Array(n).fill(0), ...Array(n).fill(1)];

  const fit = coxph({
    time: dupTime,
    status: dupStatus,
    covariates: { x: dupX },
    method: "efron",
    strata,
  });
  assertClose(fit.coefficients[0], ref.fit1_coef, TOL, "coef matches unstratified");
});

Deno.test("stratatest: right-censored stratified residuals match", () => {
  const n = test1clean.time.length;
  const dupTime = [...test1clean.time, ...test1clean.time];
  const dupStatus = [...test1clean.status, ...test1clean.status];
  const dupX = [...test1clean.x, ...test1clean.x];
  const strata = [...Array(n).fill(0), ...Array(n).fill(1)];

  const fit = coxph({
    time: dupTime,
    status: dupStatus,
    covariates: { x: dupX },
    method: "efron",
    strata,
  });

  const mart = coxResiduals({
    time: dupTime,
    status: dupStatus,
    coef: fit.coefficients,
    covariates: { x: dupX },
    options: { type: "mart", strata },
  }) as number[];
  // First n residuals should match unstratified
  assertArrayClose(mart.slice(0, n), ref.fit1_mart, TOL, "mart first stratum");
  // Second n should be identical
  assertArrayClose(mart.slice(n), ref.fit1_mart, TOL, "mart second stratum");
});

// ── Counting process: unstratified ──────────────────────────────────────

Deno.test("stratatest: counting process unstratified fit", () => {
  const fit = coxphCounting({
    start: test2.start,
    stop: test2.stop,
    status: test2.event,
    covariates: { x: test2.x },
  });
  assertClose(fit.coefficients[0], ref.fit3_coef, TOL, "coef");
  assertClose(fit.loglik[0], ref.fit3_loglik[0], TOL, "loglik[0]");
  assertClose(fit.loglik[1], ref.fit3_loglik[1], TOL, "loglik[1]");
  assertClose(fit.var[0][0], ref.fit3_var, TOL, "var");
});

Deno.test("stratatest: counting process unstratified residuals", () => {
  const fit = coxphCounting({
    start: test2.start,
    stop: test2.stop,
    status: test2.event,
    covariates: { x: test2.x },
  });

  const mart = coxResidualsCounting({
    start: test2.start,
    stop: test2.stop,
    status: test2.event,
    coef: fit.coefficients,
    covariates: { x: test2.x },
    options: { type: "mart" },
  }) as number[];
  assertArrayClose(mart, ref.fit3_mart, TOL, "mart");

  const score = coxResidualsCounting({
    start: test2.start,
    stop: test2.stop,
    status: test2.event,
    coef: fit.coefficients,
    covariates: { x: test2.x },
    options: { type: "score" },
  }) as number[][];
  assertArrayClose(score[0], ref.fit3_score, TOL, "score");

  const scho = coxResidualsCounting({
    start: test2.start,
    stop: test2.stop,
    status: test2.event,
    coef: fit.coefficients,
    covariates: { x: test2.x },
    options: { type: "scho" },
  }) as SchoenfeldResult;
  assertArrayClose(scho.time, ref.fit3_scho_time, TOL_EXACT, "scho time");
  const schoFlat = scho.residuals.map((r) => r[0]);
  assertArrayClose(schoFlat, ref.fit3_scho, TOL, "scho");
});

// ── Counting process: duplicated strata should match ────────────────────

Deno.test("stratatest: counting process stratified fit matches", () => {
  const n = test2.start.length;
  const fit = coxphCounting({
    start: [...test2.start, ...test2.start],
    stop: [...test2.stop, ...test2.stop],
    status: [...test2.event, ...test2.event],
    covariates: { x: [...test2.x, ...test2.x] },
    options: {
      strata: [...Array(n).fill(0), ...Array(n).fill(1)],
    },
  });
  assertClose(fit.coefficients[0], ref.fit3_coef, TOL, "coef matches unstratified");
});

Deno.test("stratatest: counting process stratified residuals match", () => {
  const n = test2.start.length;
  const dupStart = [...test2.start, ...test2.start];
  const dupStop = [...test2.stop, ...test2.stop];
  const dupEvent = [...test2.event, ...test2.event];
  const dupX = [...test2.x, ...test2.x];
  const strata = [...Array(n).fill(0), ...Array(n).fill(1)];

  const fit = coxphCounting({
    start: dupStart,
    stop: dupStop,
    status: dupEvent,
    covariates: { x: dupX },
    options: { strata },
  });

  const mart = coxResidualsCounting({
    start: dupStart,
    stop: dupStop,
    status: dupEvent,
    coef: fit.coefficients,
    covariates: { x: dupX },
    options: { type: "mart", strata },
  }) as number[];
  assertArrayClose(mart.slice(0, n), ref.fit3_mart, TOL, "mart first stratum");
  assertArrayClose(mart.slice(n), ref.fit3_mart, TOL, "mart second stratum");
});
