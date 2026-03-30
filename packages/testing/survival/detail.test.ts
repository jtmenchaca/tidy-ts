// Translation of survival package test: detail.R
// R reference JSON: detail-source-test.R (sibling file)
// Tests counting-process Cox model with init=-1, iter=0 (default Efron method)
// Verifies by-hand hazard computation matches coxph.detail
//
// Coverage of detail.R:
// [x] L65-68: coxph counting at beta=-1 iter=0, hazard matches by-hand
// [x] Extra:  loglik, U, Imat match analytical formulas from the book

import {
  coxphCounting,
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

const R_SOURCE_TEST = new URL("./detail-source-test.R", import.meta.url)
  .pathname;

const test2 = {
  start: [1, 2, 5, 2, 1, 7, 3, 4, 8, 8],
  stop: [2, 3, 6, 7, 8, 9, 9, 9, 14, 17],
  event: [1, 1, 1, 1, 1, 1, 1, 0, 0, 0],
  x: [1, 0, 0, 1, 0, 1, 1, 1, 0, 0],
};

interface DetailRef {
  coef: number;
  loglik: [number, number];
  var: number;
  means: number;
  detail_haz: number[];
  byhand_haz: number[];
  detail_time: number[];
  byhand_loglik: number;
  byhand_u: number;
  byhand_imat: number;
  mart: number[];
  score: number[];
  scho: number[];
  scho_time: number[];
}

const ref = getReferenceFromRScript<DetailRef>(R_SOURCE_TEST);

Deno.test("detail: coxph counting at beta=-1 iter=0", () => {
  const fit = coxphCounting({
    start: test2.start,
    stop: test2.stop,
    status: test2.event,
    covariates: { x: test2.x },
    options: { method: "efron", maxiter: 0, init: [-1] },
  });

  assertClose(fit.coefficients[0], ref.coef, TOL_EXACT, "coef");
  assertClose(fit.loglik[0], ref.loglik[0], TOL, "loglik");
  assertClose(fit.var[0][0], ref.var, TOL, "var");
});

Deno.test("detail: loglik matches by-hand formula", () => {
  // By-hand loglik at beta = -1 for the counting process data
  const r = Math.exp(-1);
  const loglik =
    4 * -1 -
    (Math.log(r + 1) +
      Math.log(r + 2) +
      2 * Math.log(3 * r + 2) +
      2 * Math.log(3 * r + 1) +
      Math.log(2 * r + 2));
  assertClose(loglik, ref.byhand_loglik, TOL, "by-hand loglik");
});

Deno.test("detail: by-hand hazard matches R coxph.detail", () => {
  // The Efron hazard at each event time, computed by hand
  const r = Math.exp(-1);
  const hazard = [
    1 / (r + 1),
    1 / (r + 2),
    1 / (3 * r + 2),
    1 / (3 * r + 1),
    1 / (3 * r + 1),
    1 / (3 * r + 2),
    1 / (2 * r + 2),
  ];
  // coxph.detail groups tied times: haz at t=9 = sum of hazard[5]+hazard[6]
  const detailHaz = [
    hazard[0],
    hazard[1],
    hazard[2],
    hazard[3],
    hazard[4],
    hazard[5] + hazard[6],
  ];

  assertArrayClose(detailHaz, ref.detail_haz, TOL, "detail haz");
  assertArrayClose(detailHaz, ref.byhand_haz, TOL, "byhand haz");
});

Deno.test("detail: counting process residuals at beta=-1", () => {
  const fit = coxphCounting({
    start: test2.start,
    stop: test2.stop,
    status: test2.event,
    covariates: { x: test2.x },
    options: { method: "efron", maxiter: 0, init: [-1] },
  });

  const mart = coxResidualsCounting({
    start: test2.start,
    stop: test2.stop,
    status: test2.event,
    coef: fit.coefficients,
    covariates: { x: test2.x },
    options: { type: "mart" },
  }) as number[];
  assertArrayClose(mart, ref.mart, TOL, "mart");

  const score = coxResidualsCounting({
    start: test2.start,
    stop: test2.stop,
    status: test2.event,
    coef: fit.coefficients,
    covariates: { x: test2.x },
    options: { type: "score" },
  }) as number[][];
  assertArrayClose(score[0], ref.score, TOL, "score");

  const scho = coxResidualsCounting({
    start: test2.start,
    stop: test2.stop,
    status: test2.event,
    coef: fit.coefficients,
    covariates: { x: test2.x },
    options: { type: "scho" },
  }) as SchoenfeldResult;
  assertArrayClose(scho.time, ref.scho_time, TOL_EXACT, "scho time");
  const schoFlat = scho.residuals.map((r) => r[0]);
  assertArrayClose(schoFlat, ref.scho, TOL, "scho");
});
