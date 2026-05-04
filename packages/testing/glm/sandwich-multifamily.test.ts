#!/usr/bin/env -S deno test --allow-all
/**
 * Sandwich variance estimators (vcovCL) with Gaussian and Poisson families.
 * Validates HC0/HC1/HC2/HC3 clustered standard errors against R sandwich package.
 * Reference values from R 4.x using sandwich::vcovCL.
 */

import { expect } from "@std/expect";
import { glmFit, vcovCL } from "../../dataframe/ts/wasm/glm-functions.ts";
import { TOL } from "./glm-test-helpers.ts";

import ref from "./gap-refs.json" with { type: "json" };

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
// GAUSSIAN FAMILY
// ════════════════════════════════════════════════════════════════════════════

Deno.test("vcovCL gaussian: HC0 clustered matches R", () => {
  const { x1, x2, y, cluster, coef } = ref.sandwich_gaussian;
  const fit = glmFit("y ~ x1 + x2", "gaussian", "identity", { x1, x2, y });

  for (let i = 0; i < coef.length; i++) {
    expect(Math.abs(fit.coefficients[i] - coef[i])).toBeLessThan(1e-6);
  }

  const result = vcovCL({ result: fit, cluster, type: "HC0", cadjust: true });
  assertMatrixClose(result.matrix, ref.sandwich_gaussian.vcov_hc0, TOL, "gaussian HC0");
});

Deno.test("vcovCL gaussian: HC1 clustered matches R", () => {
  const { x1, x2, y, cluster } = ref.sandwich_gaussian;
  const fit = glmFit("y ~ x1 + x2", "gaussian", "identity", { x1, x2, y });
  const result = vcovCL({ result: fit, cluster, type: "HC1", cadjust: true });
  assertMatrixClose(result.matrix, ref.sandwich_gaussian.vcov_hc1, TOL, "gaussian HC1");
});

Deno.test("vcovCL gaussian: HC2 clustered matches R", () => {
  const { x1, x2, y, cluster } = ref.sandwich_gaussian;
  const fit = glmFit("y ~ x1 + x2", "gaussian", "identity", { x1, x2, y });
  const result = vcovCL({ result: fit, cluster, type: "HC2", cadjust: true });
  assertMatrixClose(result.matrix, ref.sandwich_gaussian.vcov_hc2, TOL, "gaussian HC2");
});

Deno.test("vcovCL gaussian: HC3 clustered matches R", () => {
  const { x1, x2, y, cluster } = ref.sandwich_gaussian;
  const fit = glmFit("y ~ x1 + x2", "gaussian", "identity", { x1, x2, y });
  const result = vcovCL({ result: fit, cluster, type: "HC3", cadjust: true });
  assertMatrixClose(result.matrix, ref.sandwich_gaussian.vcov_hc3, TOL, "gaussian HC3");
});

// ════════════════════════════════════════════════════════════════════════════
// POISSON FAMILY
// ════════════════════════════════════════════════════════════════════════════

Deno.test("vcovCL poisson: HC0 clustered matches R", () => {
  const { x1, x2, y, cluster, coef } = ref.sandwich_poisson;
  const fit = glmFit("y ~ x1 + x2", "poisson", "log", { x1, x2, y });

  for (let i = 0; i < coef.length; i++) {
    expect(Math.abs(fit.coefficients[i] - coef[i])).toBeLessThan(1e-6);
  }

  const result = vcovCL({ result: fit, cluster, type: "HC0", cadjust: true });
  assertMatrixClose(result.matrix, ref.sandwich_poisson.vcov_hc0, TOL, "poisson HC0");
});

Deno.test("vcovCL poisson: HC1 clustered matches R", () => {
  const { x1, x2, y, cluster } = ref.sandwich_poisson;
  const fit = glmFit("y ~ x1 + x2", "poisson", "log", { x1, x2, y });
  const result = vcovCL({ result: fit, cluster, type: "HC1", cadjust: true });
  assertMatrixClose(result.matrix, ref.sandwich_poisson.vcov_hc1, TOL, "poisson HC1");
});

Deno.test("vcovCL poisson: HC2 clustered matches R", () => {
  const { x1, x2, y, cluster } = ref.sandwich_poisson;
  const fit = glmFit("y ~ x1 + x2", "poisson", "log", { x1, x2, y });
  const result = vcovCL({ result: fit, cluster, type: "HC2", cadjust: true });
  assertMatrixClose(result.matrix, ref.sandwich_poisson.vcov_hc2, TOL, "poisson HC2");
});

Deno.test("vcovCL poisson: HC3 clustered matches R", () => {
  const { x1, x2, y, cluster } = ref.sandwich_poisson;
  const fit = glmFit("y ~ x1 + x2", "poisson", "log", { x1, x2, y });
  const result = vcovCL({ result: fit, cluster, type: "HC3", cadjust: true });
  assertMatrixClose(result.matrix, ref.sandwich_poisson.vcov_hc3, TOL, "poisson HC3");
});
