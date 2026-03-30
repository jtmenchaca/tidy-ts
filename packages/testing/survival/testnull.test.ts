// Translation of survival package test: testnull.R
// R reference JSON: testnull-source-test.R (sibling file)
// Tests null Cox models (strata only, no covariates)
//
// Coverage of testnull.R:
// [x] L8-12:  right-censored: coxph iter=0 loglik matches strata-only model
// [x] L15-19: counting-process: coxph iter=0 loglik matches strata-only model
// [ ] L12:    residual comparison (fit1$resid == fit2$resid) — needs null model residuals
// [ ] L19:    residual comparison for counting process — needs null model residuals

import {
  coxph,
  coxphCounting,
} from "../../dataframe/ts/wasm/survival-functions.ts";
import {
  assertClose,
  getReferenceFromRScript,
  loadTable,
  TOL,
  TOL_EXACT,
} from "./survival-test-helpers.ts";

const R_SOURCE_TEST = new URL("./testnull-source-test.R", import.meta.url)
  .pathname;

interface TestnullRef {
  rc_loglik_iter0: number;
  rc_loglik_null: number;
  rc_resid_iter0: number[];
  rc_resid_null: number[];
  rc_coef: number;
  cp_loglik_iter0: number;
  cp_loglik_null: number;
  cp_resid_iter0: number[];
  cp_resid_null: number[];
  cp_coef: number;
}

const ref = getReferenceFromRScript<TestnullRef>(R_SOURCE_TEST);

interface BladderRow {
  id: number;
  rx: number;
  number: number;
  size: number;
  stop: number;
  event: number;
  enum: number;
}

interface Bladder2Row {
  id: number;
  rx: number;
  number: number;
  size: number;
  start: number;
  stop: number;
  event: number;
  enum: number;
}

Deno.test("testnull: right-censored coxph iter=0 matches null loglik", () => {
  const bladder = loadTable<BladderRow>("cancer_bladder");

  const fit = coxph({
    time: bladder.map((r) => r.stop),
    status: bladder.map((r) => r.event),
    covariates: {
      rx: bladder.map((r) => r.rx),
    },
    options: {
      strata: bladder.map((r) => r.number),
      maxiter: 0,
    },
  });

  // At iter=0 (beta=0), loglik should equal the null model's loglik
  assertClose(fit.loglik[1], ref.rc_loglik_iter0, TOL, "rc loglik iter0");
  assertClose(
    ref.rc_loglik_iter0,
    ref.rc_loglik_null,
    TOL,
    "R: iter0 == null",
  );
});

Deno.test("testnull: counting-process coxph iter=0 matches null loglik", () => {
  const bladder2 = loadTable<Bladder2Row>("cancer_bladder2");

  const fit = coxphCounting({
    start: bladder2.map((r) => r.start),
    stop: bladder2.map((r) => r.stop),
    status: bladder2.map((r) => r.event),
    covariates: {
      rx: bladder2.map((r) => r.rx),
    },
    options: {
      strata: bladder2.map((r) => r.number),
      maxiter: 0,
    },
  });

  assertClose(fit.loglik[1], ref.cp_loglik_iter0, TOL, "cp loglik iter0");
  assertClose(
    ref.cp_loglik_iter0,
    ref.cp_loglik_null,
    TOL,
    "R: cp iter0 == null",
  );
});
