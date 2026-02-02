// Test GLMM WASM round-trip functionality

import { expect } from "@std/expect";
import { createDataFrame } from "@tidy-ts/dataframe";
import { glmm, glmmFit } from "../../dataframe/ts/wasm/glmm-functions.ts";

Deno.test("GLMM WASM - basic Gaussian random intercept model", () => {
  // Create simple test data with known structure
  // 4 groups, 5 observations per group = 20 total
  const n_groups = 4;
  const n_per_group = 5;
  const n = n_groups * n_per_group;

  const group: number[] = [];
  const x: number[] = [];
  const y: number[] = [];

  // True parameters: intercept = 2.0, slope = 0.5, RE SD ~ 0.5
  const true_intercept = 2.0;
  const true_slope = 0.5;
  const group_effects = [-0.5, -0.2, 0.3, 0.4]; // Sum ≈ 0

  for (let g = 0; g < n_groups; g++) {
    for (let i = 0; i < n_per_group; i++) {
      group.push(g);
      const x_val = i / (n_per_group - 1); // 0 to 1
      x.push(x_val);
      // y = intercept + slope*x + group_effect + small noise
      const noise = 0.1 * ((g * n_per_group + i) - n / 2) / n;
      y.push(true_intercept + true_slope * x_val + group_effects[g] + noise);
    }
  }

  const data = createDataFrame({ columns: { y, x, group } });

  // Fit GLMM using the high-level API
  const model = glmm({
    formula: "y ~ x",
    randomEffects: [{ grouping_var: "group", terms: ["1"] }],
    family: "gaussian",
    link: "identity",
    data,
    options: { reml: false, max_iter: 100, tolerance: 1e-4 },
  });

  // Validate convergence
  expect(model.converged).toBe(true);

  // Validate fixed effects are reasonable
  const coefs = model.coefficients;
  expect(coefs.length).toBe(2); // intercept + x

  // Intercept should be close to true value
  expect(Math.abs(coefs[0] - true_intercept)).toBeLessThan(0.5);

  // Slope should be close to true value
  expect(Math.abs(coefs[1] - true_slope)).toBeLessThan(0.3);

  // Validate variance components
  expect(model.variance_components.length).toBe(1);
  const vc = model.variance_components[0];
  expect(vc.group_name).toBe("group");
  expect(vc.std_dev[0]).toBeGreaterThan(0);

  // Validate BLUPs
  expect(model.blups.length).toBe(1);
  const blups = model.blups[0];
  expect(blups.group_ids.length).toBe(n_groups);
  expect(blups.estimates.length).toBe(n_groups);

  // Validate fit statistics
  expect(Number.isFinite(model.loglik)).toBe(true);
  expect(Number.isFinite(model.aic)).toBe(true);
  expect(Number.isFinite(model.bic)).toBe(true);
});

Deno.test("GLMM WASM - low-level glmmFit function", () => {
  // Test the low-level function directly
  const data = {
    y: [1, 2, 3, 4, 5, 6, 7, 8],
    x: [0, 0, 0, 0, 1, 1, 1, 1],
    group: [1, 1, 2, 2, 1, 1, 2, 2],
  };

  const result = glmmFit(
    "y ~ x",
    [{ grouping_var: "group", terms: ["1"] }],
    "gaussian",
    "identity",
    data,
    { reml: false, max_iter: 50 },
  );

  expect(result.converged).toBe(true);
  expect(result.glm_result.coefficients.length).toBe(2);
  expect(result.variance_components.length).toBe(1);
  expect(result.blups.length).toBe(1);
  expect(Number.isFinite(result.log_likelihood)).toBe(true);
});

Deno.test("GLMM WASM - model print method", () => {
  const data = createDataFrame({
    columns: {
      y: [1, 2, 1.5, 2.5, 3, 4, 3.5, 4.5],
      x: [0, 0, 0, 0, 1, 1, 1, 1],
      group: [1, 1, 2, 2, 1, 1, 2, 2],
    },
  });

  const model = glmm({
    formula: "y ~ x",
    randomEffects: [{ grouping_var: "group", terms: ["1"] }],
    family: "gaussian",
    link: "identity",
    data,
  });

  // print() should not throw
  model.print();

  // Verify getter methods
  expect(model.formula).toBe("y ~ x");
  expect(model.randomEffects.length).toBe(1);
  expect(model.iterations).toBeGreaterThanOrEqual(0);
});
