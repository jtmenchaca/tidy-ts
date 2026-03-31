// Translation of survival package test: ovarian.R
// R reference JSON: ovarian-source-test.R (sibling file)
// Tests coxph on the ovarian dataset with residuals, strata, and offset
//
// Coverage of ovarian.R:
// [x] L21-25: coxph full model (4 predictors), residuals (mart, dev, scor, scho)
// [x] L27-28: stratified coxph (strata(rx))
// [x] L36-40: offset model: coxph(~age+rx) vs coxph(~age + offset(rx*coef))
// [ ] L30-31: survfit from Cox with newdata (2-column prediction) — needs multi-newdata survfitCox
// [ ] L42-54: survfit from Cox with offset — hand-computed baseline check

import {
  coxph,
  coxResiduals,
} from "../../dataframe/ts/wasm/survival-functions.ts";
import {
  assertArrayClose,
  assertClose,
  getReferenceFromRScript,
  loadTable,
  TOL,
} from "./survival-test-helpers.ts";

const R_SOURCE_TEST = new URL("./ovarian-source-test.R", import.meta.url)
  .pathname;

interface OvarianRow {
  futime: number;
  fustat: number;
  age: number;
  resid_ds: number;
  rx: number;
  ecog_ps: number;
}

interface OvarianRef {
  fit_coef: number[];
  fit_loglik: number[];
  fit_var: number[];
  fit_mart: number[];
  fit_dev: number[];
  fit_score: number[];
  fit_scho: number[];
  fit_scho_time: number[];
  fit_strat_coef: number[];
  fit_strat_loglik: number[];
  fit1_coef: number[];
  fit2_coef: number[];
  fit1_age_coef: number;
}

const ref = getReferenceFromRScript<OvarianRef>(R_SOURCE_TEST);
const ovarian = loadTable<OvarianRow>("cancer_ovarian");

Deno.test("ovarian: full model coxph (4 predictors)", () => {
  const fit = coxph({
    time: ovarian.map((r) => r.futime),
    status: ovarian.map((r) => r.fustat),
    covariates: {
      age: ovarian.map((r) => r.age),
      resid_ds: ovarian.map((r) => r.resid_ds),
      rx: ovarian.map((r) => r.rx),
      ecog_ps: ovarian.map((r) => r.ecog_ps),
    },
    method: "efron",
  });
  assertArrayClose(fit.coefficients, ref.fit_coef, TOL, "coef");
  assertArrayClose(fit.loglik, ref.fit_loglik, TOL, "loglik");
  assertArrayClose(fit.var.flat(), ref.fit_var, TOL, "var");
});

Deno.test("ovarian: martingale residuals", () => {
  const fit = coxph({
    time: ovarian.map((r) => r.futime),
    status: ovarian.map((r) => r.fustat),
    covariates: {
      age: ovarian.map((r) => r.age),
      resid_ds: ovarian.map((r) => r.resid_ds),
      rx: ovarian.map((r) => r.rx),
      ecog_ps: ovarian.map((r) => r.ecog_ps),
    },
    method: "efron",
  });
  assertArrayClose(fit.residuals, ref.fit_mart, TOL, "mart resid");
});

Deno.test("ovarian: deviance and score residuals", () => {
  const fit = coxph({
    time: ovarian.map((r) => r.futime),
    status: ovarian.map((r) => r.fustat),
    covariates: {
      age: ovarian.map((r) => r.age),
      resid_ds: ovarian.map((r) => r.resid_ds),
      rx: ovarian.map((r) => r.rx),
      ecog_ps: ovarian.map((r) => r.ecog_ps),
    },
    method: "efron",
  });

  const dev = coxResiduals({
    time: ovarian.map((r) => r.futime),
    status: ovarian.map((r) => r.fustat),
    coef: fit.coefficients,
    covariates: {
      age: ovarian.map((r) => r.age),
      resid_ds: ovarian.map((r) => r.resid_ds),
      rx: ovarian.map((r) => r.rx),
      ecog_ps: ovarian.map((r) => r.ecog_ps),
    },
    options: { type: "deviance" },
  }) as number[];
  assertArrayClose(dev, ref.fit_dev, TOL, "dev resid");

  const score = coxResiduals({
    time: ovarian.map((r) => r.futime),
    status: ovarian.map((r) => r.fustat),
    coef: fit.coefficients,
    covariates: {
      age: ovarian.map((r) => r.age),
      resid_ds: ovarian.map((r) => r.resid_ds),
      rx: ovarian.map((r) => r.rx),
      ecog_ps: ovarian.map((r) => r.ecog_ps),
    },
    options: { type: "score" },
  }) as number[][];
  // Score residuals are [nvar][n] — flatten column-wise to match R's column-major output
  const scoreFlat = score.flat();
  assertArrayClose(scoreFlat, ref.fit_score, TOL, "score resid");
});

Deno.test("ovarian: schoenfeld residuals", () => {
  const fit = coxph({
    time: ovarian.map((r) => r.futime),
    status: ovarian.map((r) => r.fustat),
    covariates: {
      age: ovarian.map((r) => r.age),
      resid_ds: ovarian.map((r) => r.resid_ds),
      rx: ovarian.map((r) => r.rx),
      ecog_ps: ovarian.map((r) => r.ecog_ps),
    },
    method: "efron",
  });

  const scho = coxResiduals({
    time: ovarian.map((r) => r.futime),
    status: ovarian.map((r) => r.fustat),
    coef: fit.coefficients,
    covariates: {
      age: ovarian.map((r) => r.age),
      resid_ds: ovarian.map((r) => r.resid_ds),
      rx: ovarian.map((r) => r.rx),
      ecog_ps: ovarian.map((r) => r.ecog_ps),
    },
    options: { type: "scho" },
  }) as { residuals: number[][]; time: number[] };
  assertArrayClose(scho.time, ref.fit_scho_time, TOL, "scho time");
  // R returns schoenfeld as column-major [ndeaths x nvar], our WASM returns [ndeaths][nvar]
  // Transpose to column-major to match R's output order
  const ndeaths = scho.residuals.length;
  const nvar = scho.residuals[0].length;
  const schoColMajor: number[] = [];
  for (let j = 0; j < nvar; j++) {
    for (let i = 0; i < ndeaths; i++) {
      schoColMajor.push(scho.residuals[i][j]);
    }
  }
  assertArrayClose(schoColMajor, ref.fit_scho, TOL, "scho resid");
});

Deno.test("ovarian: stratified coxph (strata(rx))", () => {
  const fit = coxph({
    time: ovarian.map((r) => r.futime),
    status: ovarian.map((r) => r.fustat),
    covariates: {
      age: ovarian.map((r) => r.age),
      ecog_ps: ovarian.map((r) => r.ecog_ps),
  },
    method: "efron",
    strata: ovarian.map((r) => r.rx - 1),
  });
  assertArrayClose(fit.coefficients, ref.fit_strat_coef, TOL, "strat coef");
  assertArrayClose(fit.loglik, ref.fit_strat_loglik, TOL, "strat loglik");
});

Deno.test("ovarian: offset model (age coef matches)", () => {
  // fit1: coxph(~ age + rx)
  const fit1 = coxph({
    time: ovarian.map((r) => r.futime),
    status: ovarian.map((r) => r.fustat),
    covariates: {
      age: ovarian.map((r) => r.age),
      rx: ovarian.map((r) => r.rx),
  },
    method: "efron",
    eps: 1e-8,
  });
  assertArrayClose(fit1.coefficients, ref.fit1_coef, TOL, "fit1 coef");

  // fit2: coxph(~ age + offset(rx * fit1$coef[2]))
  const rxCoef = fit1.coefficients[1];
  const fit2 = coxph({
    time: ovarian.map((r) => r.futime),
    status: ovarian.map((r) => r.fustat),
    covariates: {
      age: ovarian.map((r) => r.age),
  },
    method: "efron",
    eps: 1e-8,
      offset: ovarian.map((r) => r.rx * rxCoef),
  });
  // age coefficient should be the same in both models
  assertClose(fit2.coefficients[0], ref.fit1_age_coef, TOL, "fit2 age coef == fit1 age coef");
});
