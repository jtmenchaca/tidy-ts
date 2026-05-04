#!/usr/bin/env -S deno test --allow-all
/**
 * GLM family coverage gaps: Quasipoisson, Gamma log link, Inverse Gaussian log link,
 * and sandwich estimators for Gamma, Inverse Gaussian, and Quasipoisson families.
 * Reference values from R 4.x (generate-family-gap-refs.R).
 */

import { expect } from "@std/expect";
import { createDataFrame } from "../../dataframe/ts/dataframe/index.ts";
import { glm, glmFit, vcovCL } from "../../dataframe/ts/wasm/glm-functions.ts";
import { TOL, assertClose, assertArrayClose } from "./glm-test-helpers.ts";

import ref from "./family-gap-refs.json" with { type: "json" };

function assertMatrixClose(
  actual: number[][],
  expected: number[][],
  tol: number,
  label: string,
) {
  expect(actual.length).toBe(expected.length);
  for (let i = 0; i < actual.length; i++) {
    expect(actual[i].length).toBe(expected[i].length);
    for (let j = 0; j < actual[i].length; j++) {
      const relErr = Math.abs(actual[i][j] - expected[i][j]) /
        Math.max(Math.abs(expected[i][j]), 1e-10);
      if (relErr > tol) {
        throw new Error(
          `${label}[${i}][${j}]: got ${actual[i][j]}, expected ${expected[i][j]}, relErr=${relErr}`,
        );
      }
    }
  }
}

// ════════════════════════════════════════════════════════════════════════════
// QUASIPOISSON FAMILY
// ════════════════════════════════════════════════════════════════════════════

Deno.test("quasipoisson: carb ~ wt + hp — coef and SE", () => {
  const { wt, hp, y, coef, se } = ref.quasipoisson;
  const df = createDataFrame({ columns: { y, wt, hp } });
  const fit = glm({ formula: "y ~ wt + hp", family: "quasipoisson", link: "log", data: df });

  assertArrayClose(fit.coefficients, coef, TOL, "coef");
  assertArrayClose(fit.std_errors, se, TOL, "SE");
});

Deno.test("quasipoisson: carb ~ wt + hp — deviance and dispersion", () => {
  const { wt, hp, y, deviance, null_deviance, dispersion } = ref.quasipoisson;
  const df = createDataFrame({ columns: { y, wt, hp } });
  const fit = glm({ formula: "y ~ wt + hp", family: "quasipoisson", link: "log", data: df });

  assertClose(fit.deviance, deviance, TOL, "deviance");
  assertClose(fit.null_deviance, null_deviance, TOL, "null deviance");
  assertClose(fit.dispersion_parameter, dispersion, TOL, "dispersion");
});

Deno.test("quasipoisson: carb ~ wt + hp — Wald confidence intervals", () => {
  const { wt, hp, y, confint_lower, confint_upper } = ref.quasipoisson;
  const df = createDataFrame({ columns: { y, wt, hp } });
  const fit = glm({ formula: "y ~ wt + hp", family: "quasipoisson", link: "log", data: df });

  const z = 1.959963984540054;
  for (let i = 0; i < fit.coefficients.length; i++) {
    const waldLower = fit.coefficients[i] - z * fit.std_errors[i];
    const waldUpper = fit.coefficients[i] + z * fit.std_errors[i];
    assertClose(waldLower, confint_lower[i], TOL, `Wald CI lower[${i}]`);
    assertClose(waldUpper, confint_upper[i], TOL, `Wald CI upper[${i}]`);
  }
});

Deno.test("quasipoisson: fitted values match R", () => {
  const { wt, hp, y, fitted5 } = ref.quasipoisson;
  const df = createDataFrame({ columns: { y, wt, hp } });
  const fit = glm({ formula: "y ~ wt + hp", family: "quasipoisson", link: "log", data: df });

  assertArrayClose(fit.fitted_values.slice(0, 5), fitted5, TOL, "fitted[0:5]");
});

// ════════════════════════════════════════════════════════════════════════════
// GAMMA LOG LINK (non-canonical)
// ════════════════════════════════════════════════════════════════════════════

Deno.test("gamma log link: coef, SE, deviance", () => {
  const { x, y, coef, se, deviance, null_deviance, aic } = ref.gamma_log;
  const df = createDataFrame({ columns: { y, x } });
  const fit = glm({ formula: "y ~ x", family: "gamma", link: "log", data: df });

  assertArrayClose(fit.coefficients, coef, TOL, "coef");
  assertArrayClose(fit.std_errors, se, TOL, "SE");
  assertClose(fit.deviance, deviance, TOL, "deviance");
  assertClose(fit.null_deviance, null_deviance, TOL, "null deviance");
  assertClose(fit.aic, aic, TOL, "AIC");
});

Deno.test("gamma log link: fitted values match R", () => {
  const { x, y, fitted5 } = ref.gamma_log;
  const df = createDataFrame({ columns: { y, x } });
  const fit = glm({ formula: "y ~ x", family: "gamma", link: "log", data: df });

  assertArrayClose(fit.fitted_values.slice(0, 5), fitted5, TOL, "fitted[0:5]");
});

Deno.test("gamma log link: Wald confidence intervals", () => {
  const { x, y, confint_lower, confint_upper } = ref.gamma_log;
  const df = createDataFrame({ columns: { y, x } });
  const fit = glm({ formula: "y ~ x", family: "gamma", link: "log", data: df });

  const z = 1.959963984540054;
  for (let i = 0; i < fit.coefficients.length; i++) {
    const waldLower = fit.coefficients[i] - z * fit.std_errors[i];
    const waldUpper = fit.coefficients[i] + z * fit.std_errors[i];
    assertClose(waldLower, confint_lower[i], TOL, `Wald CI lower[${i}]`);
    assertClose(waldUpper, confint_upper[i], TOL, `Wald CI upper[${i}]`);
  }
});

// ════════════════════════════════════════════════════════════════════════════
// INVERSE GAUSSIAN LOG LINK (non-canonical)
// ════════════════════════════════════════════════════════════════════════════

Deno.test("inverse_gaussian log link: coef, SE, deviance", () => {
  const { x, y, coef, se, deviance, null_deviance, aic } = ref.invgauss_log;
  const df = createDataFrame({ columns: { y, x } });
  const fit = glm({ formula: "y ~ x", family: "inverse_gaussian", link: "log", data: df });

  assertArrayClose(fit.coefficients, coef, TOL, "coef");
  assertArrayClose(fit.std_errors, se, TOL, "SE");
  assertClose(fit.deviance, deviance, TOL, "deviance");
  assertClose(fit.null_deviance, null_deviance, TOL, "null deviance");
  assertClose(fit.aic, aic, TOL, "AIC");
});

Deno.test("inverse_gaussian log link: fitted values match R", () => {
  const { x, y, fitted5 } = ref.invgauss_log;
  const df = createDataFrame({ columns: { y, x } });
  const fit = glm({ formula: "y ~ x", family: "inverse_gaussian", link: "log", data: df });

  assertArrayClose(fit.fitted_values.slice(0, 5), fitted5, TOL, "fitted[0:5]");
});

// ════════════════════════════════════════════════════════════════════════════
// GAMMA SANDWICH (vcovCL HC0-HC3)
// ════════════════════════════════════════════════════════════════════════════

Deno.test("vcovCL gamma: HC0 clustered matches R", () => {
  const { x1, x2, y, cluster, coef } = ref.sandwich_gamma;
  const fit = glmFit("y ~ x1 + x2", "gamma", "log", { x1, x2, y });

  for (let i = 0; i < coef.length; i++) {
    expect(Math.abs(fit.coefficients[i] - coef[i])).toBeLessThan(1e-6);
  }

  const result = vcovCL({ result: fit, cluster, type: "HC0", cadjust: true });
  assertMatrixClose(result.matrix, ref.sandwich_gamma.vcov_hc0, TOL, "gamma HC0");
});

Deno.test("vcovCL gamma: HC1 clustered matches R", () => {
  const { x1, x2, y, cluster } = ref.sandwich_gamma;
  const fit = glmFit("y ~ x1 + x2", "gamma", "log", { x1, x2, y });
  const result = vcovCL({ result: fit, cluster, type: "HC1", cadjust: true });
  assertMatrixClose(result.matrix, ref.sandwich_gamma.vcov_hc1, TOL, "gamma HC1");
});

Deno.test("vcovCL gamma: HC2 clustered matches R", () => {
  const { x1, x2, y, cluster } = ref.sandwich_gamma;
  const fit = glmFit("y ~ x1 + x2", "gamma", "log", { x1, x2, y });
  const result = vcovCL({ result: fit, cluster, type: "HC2", cadjust: true });
  assertMatrixClose(result.matrix, ref.sandwich_gamma.vcov_hc2, TOL, "gamma HC2");
});

Deno.test("vcovCL gamma: HC3 clustered matches R", () => {
  const { x1, x2, y, cluster } = ref.sandwich_gamma;
  const fit = glmFit("y ~ x1 + x2", "gamma", "log", { x1, x2, y });
  const result = vcovCL({ result: fit, cluster, type: "HC3", cadjust: true });
  assertMatrixClose(result.matrix, ref.sandwich_gamma.vcov_hc3, TOL, "gamma HC3");
});

// ════════════════════════════════════════════════════════════════════════════
// INVERSE GAUSSIAN SANDWICH (vcovCL HC0-HC3)
// ════════════════════════════════════════════════════════════════════════════

Deno.test("vcovCL inverse_gaussian: HC0 clustered matches R", () => {
  const { x1, x2, y, cluster, coef } = ref.sandwich_invgauss;
  const fit = glmFit("y ~ x1 + x2", "inverse_gaussian", "inverse_squared", { x1, x2, y });

  for (let i = 0; i < coef.length; i++) {
    expect(Math.abs(fit.coefficients[i] - coef[i])).toBeLessThan(1e-6);
  }

  const result = vcovCL({ result: fit, cluster, type: "HC0", cadjust: true });
  assertMatrixClose(result.matrix, ref.sandwich_invgauss.vcov_hc0, TOL, "invgauss HC0");
});

Deno.test("vcovCL inverse_gaussian: HC1 clustered matches R", () => {
  const { x1, x2, y, cluster } = ref.sandwich_invgauss;
  const fit = glmFit("y ~ x1 + x2", "inverse_gaussian", "inverse_squared", { x1, x2, y });
  const result = vcovCL({ result: fit, cluster, type: "HC1", cadjust: true });
  assertMatrixClose(result.matrix, ref.sandwich_invgauss.vcov_hc1, TOL, "invgauss HC1");
});

Deno.test("vcovCL inverse_gaussian: HC2 clustered matches R", () => {
  const { x1, x2, y, cluster } = ref.sandwich_invgauss;
  const fit = glmFit("y ~ x1 + x2", "inverse_gaussian", "inverse_squared", { x1, x2, y });
  const result = vcovCL({ result: fit, cluster, type: "HC2", cadjust: true });
  assertMatrixClose(result.matrix, ref.sandwich_invgauss.vcov_hc2, TOL, "invgauss HC2");
});

Deno.test("vcovCL inverse_gaussian: HC3 clustered matches R", () => {
  const { x1, x2, y, cluster } = ref.sandwich_invgauss;
  const fit = glmFit("y ~ x1 + x2", "inverse_gaussian", "inverse_squared", { x1, x2, y });
  const result = vcovCL({ result: fit, cluster, type: "HC3", cadjust: true });
  assertMatrixClose(result.matrix, ref.sandwich_invgauss.vcov_hc3, TOL, "invgauss HC3");
});

// ════════════════════════════════════════════════════════════════════════════
// QUASIPOISSON SANDWICH (vcovCL HC0-HC3)
// ════════════════════════════════════════════════════════════════════════════

Deno.test("vcovCL quasipoisson: HC0 clustered matches R", () => {
  const { x1, x2, y, cluster, coef } = ref.sandwich_quasipoisson;
  const fit = glmFit("y ~ x1 + x2", "quasipoisson", "log", { x1, x2, y });

  for (let i = 0; i < coef.length; i++) {
    expect(Math.abs(fit.coefficients[i] - coef[i])).toBeLessThan(1e-6);
  }

  const result = vcovCL({ result: fit, cluster, type: "HC0", cadjust: true });
  assertMatrixClose(result.matrix, ref.sandwich_quasipoisson.vcov_hc0, TOL, "quasipoisson HC0");
});

Deno.test("vcovCL quasipoisson: HC1 clustered matches R", () => {
  const { x1, x2, y, cluster } = ref.sandwich_quasipoisson;
  const fit = glmFit("y ~ x1 + x2", "quasipoisson", "log", { x1, x2, y });
  const result = vcovCL({ result: fit, cluster, type: "HC1", cadjust: true });
  assertMatrixClose(result.matrix, ref.sandwich_quasipoisson.vcov_hc1, TOL, "quasipoisson HC1");
});

Deno.test("vcovCL quasipoisson: HC2 clustered matches R", () => {
  const { x1, x2, y, cluster } = ref.sandwich_quasipoisson;
  const fit = glmFit("y ~ x1 + x2", "quasipoisson", "log", { x1, x2, y });
  const result = vcovCL({ result: fit, cluster, type: "HC2", cadjust: true });
  assertMatrixClose(result.matrix, ref.sandwich_quasipoisson.vcov_hc2, TOL, "quasipoisson HC2");
});

Deno.test("vcovCL quasipoisson: HC3 clustered matches R", () => {
  const { x1, x2, y, cluster } = ref.sandwich_quasipoisson;
  const fit = glmFit("y ~ x1 + x2", "quasipoisson", "log", { x1, x2, y });
  const result = vcovCL({ result: fit, cluster, type: "HC3", cadjust: true });
  assertMatrixClose(result.matrix, ref.sandwich_quasipoisson.vcov_hc3, TOL, "quasipoisson HC3");
});
