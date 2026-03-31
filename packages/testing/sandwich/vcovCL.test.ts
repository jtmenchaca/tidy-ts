// Translation of sandwich package test: vcovCL.R
// R reference JSON: vcovCL-source-test.R (sibling file)
// Tests clustered covariance matrices for LM and GLM
//
// Coverage of vcovCL.R:
// [x] L3-4:   LM (via Gaussian GLM) and GLM (logit) fits on PetersenCL
// [x] L9-12:  Single-cluster HC0/HC1 with/without cadjust (LM via Gaussian GLM)
// [x] L9-12:  Single-cluster HC0/HC1 with/without cadjust (GLM logit)
// [x] L59-70: Stata reference comparison (both LM and GLM)
// [ ] L13-16: HC2/HC3 types — not yet implemented
// [ ] L18-25: Two-way clustering (firm + year) — not yet implemented

import { expect } from "@std/expect";
import {
  glmFit,
  vcovCL,
} from "../../dataframe/ts/wasm/glm-functions.ts";
import {
  assertMatrixClose,
  getReferenceFromRScript,
  loadPetersenCL,
  TOL,
  TOL_STATA,
} from "./sandwich-test-helpers.ts";

const R_SOURCE_TEST = new URL("./vcovCL-source-test.R", import.meta.url)
  .pathname;

interface VcovCLRef {
  lm_coef: number[];
  glm_coef: number[];
  gauss_coef: number[];
  lm_hc0_ca: number[];
  lm_hc0_noca: number[];
  lm_hc1_ca: number[];
  lm_hc1_noca: number[];
  glm_hc0_ca: number[];
  glm_hc0_noca: number[];
  glm_hc1_ca: number[];
  glm_hc1_noca: number[];
  gauss_hc0_ca: number[];
  gauss_hc0_noca: number[];
  gauss_hc1_ca: number[];
  gauss_hc1_noca: number[];
  stata_lm: number[];
  stata_glm: number[];
  n_firms: number;
  n_obs: number;
}

const ref = getReferenceFromRScript<VcovCLRef>(R_SOURCE_TEST);
const petersen = loadPetersenCL();

// Build data arrays
const xVals = petersen.map((r) => r.x);
const firmCluster = petersen.map((r) => r.firm);

// Logit data: binary y
const logitData = {
  x: xVals,
  y: petersen.map((r) => r.y > 0 ? 1 : 0),
};

// Gaussian data: continuous y (equivalent to lm)
const gaussData = {
  x: xVals,
  y: petersen.map((r) => r.y),
};

// ── Gaussian GLM (LM equivalent) single-cluster tests ────────────────────────

Deno.test("vcovCL: Gaussian GLM coefficients match R lm()", () => {
  const fit = glmFit("y ~ x", "gaussian", "identity", gaussData);
  for (let i = 0; i < ref.gauss_coef.length; i++) {
    expect(Math.abs(fit.coefficients[i] - ref.gauss_coef[i])).toBeLessThan(TOL);
  }
});

Deno.test("vcovCL: Gaussian GLM HC0 cadjust=TRUE matches R lm()", () => {
  const fit = glmFit("y ~ x", "gaussian", "identity", gaussData);
  const result = vcovCL({
    result: fit,
    cluster: firmCluster,
    type: "HC0",
    cadjust: true,
  });
  expect(result.nClusters).toBe(ref.n_firms);
  assertMatrixClose(result.matrix, ref.gauss_hc0_ca, TOL, "gauss_hc0_ca");
});

Deno.test("vcovCL: Gaussian GLM HC0 cadjust=FALSE matches R lm()", () => {
  const fit = glmFit("y ~ x", "gaussian", "identity", gaussData);
  const result = vcovCL({
    result: fit,
    cluster: firmCluster,
    type: "HC0",
    cadjust: false,
  });
  assertMatrixClose(result.matrix, ref.gauss_hc0_noca, TOL, "gauss_hc0_noca");
});

Deno.test("vcovCL: Gaussian GLM HC1 cadjust=TRUE matches R lm()", () => {
  const fit = glmFit("y ~ x", "gaussian", "identity", gaussData);
  const result = vcovCL({
    result: fit,
    cluster: firmCluster,
    type: "HC1",
    cadjust: true,
  });
  assertMatrixClose(result.matrix, ref.gauss_hc1_ca, TOL, "gauss_hc1_ca");
});

Deno.test("vcovCL: Gaussian GLM HC1 cadjust=FALSE matches R lm()", () => {
  const fit = glmFit("y ~ x", "gaussian", "identity", gaussData);
  const result = vcovCL({
    result: fit,
    cluster: firmCluster,
    type: "HC1",
    cadjust: false,
  });
  assertMatrixClose(result.matrix, ref.gauss_hc1_noca, TOL, "gauss_hc1_noca");
});

// ── GLM (logit) single-cluster tests ─────────────────────────────────────────

Deno.test("vcovCL: GLM coefficients match R", () => {
  const fit = glmFit("y ~ x", "binomial", "logit", logitData);
  for (let i = 0; i < ref.glm_coef.length; i++) {
    expect(Math.abs(fit.coefficients[i] - ref.glm_coef[i])).toBeLessThan(TOL);
  }
});

Deno.test("vcovCL: GLM HC0 cadjust=TRUE matches R", () => {
  const fit = glmFit("y ~ x", "binomial", "logit", logitData);
  const result = vcovCL({
    result: fit,
    cluster: firmCluster,
    type: "HC0",
    cadjust: true,
  });
  expect(result.nClusters).toBe(ref.n_firms);
  assertMatrixClose(result.matrix, ref.glm_hc0_ca, TOL, "glm_hc0_ca");
});

Deno.test("vcovCL: GLM HC0 cadjust=FALSE matches R", () => {
  const fit = glmFit("y ~ x", "binomial", "logit", logitData);
  const result = vcovCL({
    result: fit,
    cluster: firmCluster,
    type: "HC0",
    cadjust: false,
  });
  assertMatrixClose(result.matrix, ref.glm_hc0_noca, TOL, "glm_hc0_noca");
});

Deno.test("vcovCL: GLM HC1 cadjust=TRUE matches R", () => {
  const fit = glmFit("y ~ x", "binomial", "logit", logitData);
  const result = vcovCL({
    result: fit,
    cluster: firmCluster,
    type: "HC1",
    cadjust: true,
  });
  assertMatrixClose(result.matrix, ref.glm_hc1_ca, TOL, "glm_hc1_ca");
});

Deno.test("vcovCL: GLM HC1 cadjust=FALSE matches R", () => {
  const fit = glmFit("y ~ x", "binomial", "logit", logitData);
  const result = vcovCL({
    result: fit,
    cluster: firmCluster,
    type: "HC1",
    cadjust: false,
  });
  assertMatrixClose(result.matrix, ref.glm_hc1_noca, TOL, "glm_hc1_noca");
});

// ── Stata reference comparison ───────────────────────────────────────────────

Deno.test("vcovCL: Gaussian GLM matches Stata regress cluster SEs", () => {
  const fit = glmFit("y ~ x", "gaussian", "identity", gaussData);
  const result = vcovCL({
    result: fit,
    cluster: firmCluster,
    type: "HC1",
    cadjust: true,
  });
  // Stata regress uses HC1 with cadjust by default
  assertMatrixClose(result.matrix, ref.stata_lm, TOL_STATA, "stata_lm");
});

Deno.test("vcovCL: GLM matches Stata logit cluster SEs", () => {
  const fit = glmFit("y ~ x", "binomial", "logit", logitData);
  const result = vcovCL({
    result: fit,
    cluster: firmCluster,
    type: "HC0",
    cadjust: true,
  });
  // Stata uses HC0 with cadjust by default for logit
  assertMatrixClose(result.matrix, ref.stata_glm, TOL_STATA, "stata_glm");
});
