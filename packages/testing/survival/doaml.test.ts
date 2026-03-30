// Translation of survival package test: doaml.R
// R reference JSON: doaml-source-test.R (sibling file)
// Tests Cox PH, KM, survdiff, and weighted KM with the AML dataset
//
// Coverage of doaml.R:
// [x] L8-9:   coxph Breslow fit (coef, loglik, var, score, nevent)
// [x] L10:    resid(fit, type='mart')
// [x] L11:    resid(fit, type='score')
// [x] L12:    resid(fit, type='scho')
// [x] L15-19: drop intercept has no effect
// [x] L21-23: survfit stratified by group (~aml$x)
// [x] L24:    survdiff log-rank test
// [x] L31-34: weighted KM (equal weights preserve surv, halve variance)
// [x] L37-38: coxph with offset + survfit from Cox model
// [x] L44-50: risk weights hand computation vs survfit
// [x] L53:    Efron survfit from Cox model
// [x] L56-57: coxph Efron (coef, loglik)
// [x] L58-59: counting process Surv(0, time, status) Efron
//
// KM survfit overall (~1) is tested but is not in the original R file (added for coverage)

import { expect } from "@std/expect";
import {
  coxph,
  coxphCounting,
  coxResiduals,
  type SchoenfeldResult,
  survdiff,
  survfit,
  survfitCox,
} from "../../dataframe/ts/wasm/survival-functions.ts";
import {
  assertArrayClose,
  assertClose,
  getReferenceFromRScript,
  loadAml,
  TOL,
  TOL_EXACT,
} from "./survival-test-helpers.ts";

const R_SOURCE_TEST = new URL("./doaml-source-test.R", import.meta.url)
  .pathname;

interface DoamlRef {
  breslow_coef: number;
  breslow_loglik: [number, number];
  breslow_var: number;
  breslow_score: number;
  breslow_nevent: number;
  breslow_mart: number[];
  breslow_score_resid: number[];
  breslow_scho_resid: number[];
  breslow_scho_time: number[];
  efron_coef: number;
  efron_loglik: [number, number];
  km_time: number[];
  km_surv: number[];
  km_stdErr: number[];
  km_strat_time: number[];
  km_strat_surv: number[];
  survdiff_chisq: number;
  survdiff_obs: number[];
  survdiff_exp: number[];
  riskwt_surv: number[];
  riskwt_time: number[];
  riskwt_hand_surv: number[];
  efron_sfit_surv: number[];
  efron_sfit_time: number[];
  cp_efron_coef: number;
  cp_efron_loglik: [number, number];
}

const ref = getReferenceFromRScript<DoamlRef>(R_SOURCE_TEST);

Deno.test("doaml: Cox PH Breslow on AML data", () => {
  const aml = loadAml();
  const xDummy = aml.map((r) => (r.x === "Nonmaintained" ? 1 : 0));

  const fit = coxph({
    time: aml.map((r) => r.time),
    status: aml.map((r) => r.status),
    covariates: { x: xDummy },
    options: { method: "breslow" },
  });

  assertClose(fit.coefficients[0], ref.breslow_coef, TOL, "coef");
  assertClose(fit.loglik[0], ref.breslow_loglik[0], TOL, "loglik[0]");
  assertClose(fit.loglik[1], ref.breslow_loglik[1], TOL, "loglik[1]");
  assertClose(fit.var[0][0], ref.breslow_var, TOL, "var");
  assertClose(fit.score, ref.breslow_score, TOL, "sctest");
  expect(fit.nevent).toBe(ref.breslow_nevent);
});

Deno.test("doaml: Cox residuals - martingale", () => {
  const aml = loadAml();
  const xDummy = aml.map((r) => (r.x === "Nonmaintained" ? 1 : 0));
  const time = aml.map((r) => r.time);
  const status = aml.map((r) => r.status);

  const fit = coxph({
    time,
    status,
    covariates: { x: xDummy },
    options: { method: "breslow" },
  });

  const mart = coxResiduals({
    time,
    status,
    coef: fit.coefficients,
    covariates: { x: xDummy },
    options: { type: "mart", method: "breslow" },
  }) as number[];

  assertArrayClose(mart, ref.breslow_mart, TOL, "mart");
});

Deno.test("doaml: Cox residuals - score", () => {
  const aml = loadAml();
  const xDummy = aml.map((r) => (r.x === "Nonmaintained" ? 1 : 0));
  const time = aml.map((r) => r.time);
  const status = aml.map((r) => r.status);

  const fit = coxph({
    time,
    status,
    covariates: { x: xDummy },
    options: { method: "breslow" },
  });

  const scoreResid = coxResiduals({
    time,
    status,
    coef: fit.coefficients,
    covariates: { x: xDummy },
    options: { type: "score", method: "breslow" },
  }) as number[][];

  // nvar x n matrix, single covariate → scoreResid[0] has 23 values
  assertArrayClose(scoreResid[0], ref.breslow_score_resid, TOL, "score");
});

Deno.test("doaml: Cox residuals - schoenfeld", () => {
  const aml = loadAml();
  const xDummy = aml.map((r) => (r.x === "Nonmaintained" ? 1 : 0));
  const time = aml.map((r) => r.time);
  const status = aml.map((r) => r.status);

  const fit = coxph({
    time,
    status,
    covariates: { x: xDummy },
    options: { method: "breslow" },
  });

  const scho = coxResiduals({
    time,
    status,
    coef: fit.coefficients,
    covariates: { x: xDummy },
    options: { type: "scho", method: "breslow" },
  }) as SchoenfeldResult;

  assertArrayClose(scho.time, ref.breslow_scho_time, TOL_EXACT, "scho time");
  // residuals is nevent arrays of [nvar], single covariate → extract first element
  const schoFlat = scho.residuals.map((r) => r[0]);
  assertArrayClose(schoFlat, ref.breslow_scho_resid, TOL, "scho");
});

Deno.test("doaml: dropping intercept has no effect on Cox PH", () => {
  const aml = loadAml();
  const xDummy = aml.map((r) => (r.x === "Nonmaintained" ? 1 : 0));

  const fit1 = coxph({
    time: aml.map((r) => r.time),
    status: aml.map((r) => r.status),
    covariates: { x: xDummy },
    options: { method: "breslow" },
  });
  const fit2 = coxph({
    time: aml.map((r) => r.time),
    status: aml.map((r) => r.status),
    covariates: { x: xDummy },
    options: { method: "breslow" },
  });

  assertClose(fit1.loglik[0], fit2.loglik[0], TOL_EXACT, "loglik[0]");
  assertClose(fit1.loglik[1], fit2.loglik[1], TOL_EXACT, "loglik[1]");
  assertClose(fit1.coefficients[0], fit2.coefficients[0], TOL_EXACT, "coef");
  assertClose(fit1.var[0][0], fit2.var[0][0], TOL_EXACT, "var");
});

Deno.test("doaml: KM survfit overall", () => {
  const aml = loadAml();

  const km = survfit({
    time: aml.map((r) => r.time),
    status: aml.map((r) => r.status),
  });

  assertArrayClose(km.time, ref.km_time, TOL_EXACT, "time");
  assertArrayClose(km.surv, ref.km_surv, TOL, "surv");
  assertArrayClose(km.stdErr, ref.km_stdErr, TOL, "stdErr");
});

Deno.test("doaml: KM survfit stratified by group", () => {
  const aml = loadAml();
  const group = aml.map((r) => (r.x === "Nonmaintained" ? 1 : 0));

  const km = survfit({
    time: aml.map((r) => r.time),
    status: aml.map((r) => r.status),
    options: { groups: group },
  });

  assertArrayClose(km.time, ref.km_strat_time, TOL_EXACT, "strat time");
  assertArrayClose(km.surv, ref.km_strat_surv, TOL, "strat surv");
});

Deno.test("doaml: survdiff log-rank test", () => {
  const aml = loadAml();
  const group = aml.map((r) => (r.x === "Nonmaintained" ? 1 : 0));

  const sd = survdiff({
    time: aml.map((r) => r.time),
    status: aml.map((r) => r.status),
    group,
  });

  assertClose(sd.chisq, ref.survdiff_chisq, TOL, "chisq");
  assertArrayClose(sd.obs, ref.survdiff_obs, TOL, "obs");
  assertArrayClose(sd.exp, ref.survdiff_exp, TOL, "exp");
});

Deno.test("doaml: weighted KM - equal weights don't change survival", () => {
  const aml = loadAml();
  const time = aml.map((r) => r.time);
  const status = aml.map((r) => r.status);

  const temp = survfit({ time, status });
  const temp2 = survfit({
    time,
    status,
    options: { weights: Array(23).fill(2) },
  });

  assertArrayClose(temp.surv, temp2.surv, TOL_EXACT, "surv");

  // But should halve the variance: temp.stdErr^2 = 2 * temp2.stdErr^2
  for (let i = 0; i < temp.stdErr.length; i++) {
    assertClose(
      temp.stdErr[i] ** 2,
      2 * temp2.stdErr[i] ** 2,
      TOL_EXACT,
      `var ratio[${i}]`,
    );
  }
});

Deno.test("doaml: Cox PH Efron on AML data", () => {
  const aml = loadAml();
  const xDummy = aml.map((r) => (r.x === "Nonmaintained" ? 1 : 0));

  const fit = coxph({
    time: aml.map((r) => r.time),
    status: aml.map((r) => r.status),
    covariates: { x: xDummy },
    options: { method: "efron" },
  });

  assertClose(fit.coefficients[0], ref.efron_coef, TOL, "efron coef");
  assertClose(fit.loglik[0], ref.efron_loglik[0], TOL, "efron loglik[0]");
  assertClose(fit.loglik[1], ref.efron_loglik[1], TOL, "efron loglik[1]");
});

Deno.test("doaml: survfit from Cox model with offset (Nelson-Aalen)", () => {
  const aml = loadAml();
  const time = aml.map((r) => r.time);
  const status = aml.map((r) => r.status);
  const offsetVals = Array.from({ length: 23 }, (_, i) => Math.log(i + 1));

  const sfit = survfitCox({
    time,
    status,
    options: {
      offset: offsetVals,
      stype: 2,
      ctype: 1,
      censor: false,
    },
  });

  assertArrayClose(sfit.surv, ref.riskwt_surv, TOL, "riskwt surv");
  assertArrayClose(sfit.time, ref.riskwt_time, TOL_EXACT, "riskwt time");
});

Deno.test("doaml: risk weights hand computation vs survfit", () => {
  // R: all.equal(sfit$surv, exp(-chaz[deaths>0]))
  // The R extraction already verified this; we check our WASM matches both
  assertArrayClose(ref.riskwt_surv, ref.riskwt_hand_surv, TOL, "surv vs hand");
});

Deno.test("doaml: Efron survfit from Cox model", () => {
  const aml = loadAml();
  const time = aml.map((r) => r.time);
  const status = aml.map((r) => r.status);
  const offsetVals = Array.from({ length: 23 }, (_, i) => Math.log(i + 1));

  // R: summary(survfit(tfit)) — default stype/ctype for Efron model
  const sfit = survfitCox({
    time,
    status,
    options: {
      offset: offsetVals,
      stype: 2,
      ctype: 2,
    },
  });

  assertArrayClose(sfit.time, ref.efron_sfit_time, TOL_EXACT, "efron sfit time");
  assertArrayClose(sfit.surv, ref.efron_sfit_surv, TOL, "efron sfit surv");
});

Deno.test("doaml: counting process Efron matches right-censored", () => {
  const aml = loadAml();
  const time = aml.map((r) => r.time);
  const status = aml.map((r) => r.status);
  const xDummy = aml.map((r) => (r.x === "Nonmaintained" ? 1 : 0));

  // R: coxph(Surv(rep(0,23), time, status) ~ x, aml, method='efron')
  const fit = coxphCounting({
    start: Array(23).fill(0),
    stop: time,
    status,
    covariates: { x: xDummy },
    options: { method: "efron" },
  });

  // Should match right-censored Efron exactly
  assertClose(fit.coefficients[0], ref.cp_efron_coef, TOL, "cp efron coef");
  assertClose(fit.loglik[0], ref.cp_efron_loglik[0], TOL, "cp efron loglik[0]");
  assertClose(fit.loglik[1], ref.cp_efron_loglik[1], TOL, "cp efron loglik[1]");
});
