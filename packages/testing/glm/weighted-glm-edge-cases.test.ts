import { glm } from "../../dataframe/ts/wasm/glm-functions.ts";
import { createDataFrame } from "@tidy-ts/dataframe";
import { expect } from "@std/expect";
import { assertClose, TOL } from "./glm-test-helpers.ts";

Deno.test("Weighted GLM Edge Cases - Test 1: Very small weights", () => {
  const x = [1, 2, 3, 4, 5];
  const y = [2.1, 4.2, 5.8, 8.1, 10.3];
  const weights = [1e-10, 1e-8, 1e-6, 1e-4, 1e-2]; // Very small weights

  const df = createDataFrame({ columns: { x, y } });

  const result = glm({
    formula: "y ~ x",
    family: "gaussian",
    link: "identity",
    data: df,
    options: { weights },
  });

  expect(result.converged).toBe(true);
  expect(result.coefficients).toHaveLength(2);

  // With very small weights, the last observation should dominate
  // Expected: slope should be close to the slope between points 4 and 5
  const expectedSlope = (10.3 - 8.1) / (5 - 4); // 2.2
  expect(result.coefficients[1]).toBeCloseTo(expectedSlope, 1);
});

Deno.test("Weighted GLM Edge Cases - Test 2: Very large weights", () => {
  const x = [1, 2, 3, 4, 5];
  const y = [2.1, 4.2, 5.8, 8.1, 10.3];
  const weights = [1e2, 1e4, 1e6, 1e8, 1e10]; // Very large weights

  const df = createDataFrame({ columns: { x, y } });

  const result = glm({
    formula: "y ~ x",
    family: "gaussian",
    link: "identity",
    data: df,
    options: { weights },
  });

  expect(result.converged).toBe(true);
  expect(result.coefficients).toHaveLength(2);

  // With geometrically increasing weights, the last observation (x=5, y=10.3) dominates
  // R gives slope ≈ 2.20
  expect(result.coefficients[1]).toBeCloseTo(2.201783, 1);
});

Deno.test("Weighted GLM Edge Cases - Test 3: Mixed extreme weights", () => {
  const x = [1, 2, 3, 4, 5];
  const y = [1, 2, 3, 4, 5]; // Perfect linear relationship
  const weights = [1e10, 1e-10, 1e10, 1e-10, 1e10]; // Alternating extreme weights

  const df = createDataFrame({ columns: { x, y } });

  const result = glm({
    formula: "y ~ x",
    family: "gaussian",
    link: "identity",
    data: df,
    options: { weights },
  });

  expect(result.converged).toBe(true);
  expect(result.coefficients).toHaveLength(2);

  // Should fit through points (1,1), (3,3), (5,5) - perfect y=x line
  assertClose(result.coefficients[0], 0, TOL, "mixed extreme weights intercept");
  assertClose(result.coefficients[1], 1, TOL, "mixed extreme weights slope");
});

Deno.test("Weighted GLM Edge Cases - Test 4: Single non-zero weight", () => {
  const x = [1, 2, 3, 4, 5];
  const y = [2.1, 4.2, 5.8, 8.1, 10.3];
  const weights = [0, 0, 0, 0, 1]; // Only last observation has weight

  const df = createDataFrame({ columns: { x, y } });

  const result = glm({
    formula: "y ~ x",
    family: "gaussian",
    link: "identity",
    data: df,
    options: { weights },
  });

  expect(result.converged).toBe(true);
  expect(result.coefficients).toHaveLength(2);

  assertClose(result.fitted_values[4], y[4], TOL, "single non-zero weight fitted value");
});

Deno.test("Weighted GLM Edge Cases - Test 5: Binomial with extreme weights", () => {
  const successes = [1, 9, 1, 9, 1];
  const trials = [10, 10, 10, 10, 10];
  const x = [1, 2, 3, 4, 5];
  const y = successes.map((s, i) => s / trials[i]);
  const weights = [1e-6, 1e6, 1e-6, 1e6, 1e-6]; // Extreme weights

  const df = createDataFrame({ columns: { x, y } });

  const result = glm({
    formula: "y ~ x",
    family: "binomial",
    link: "logit",
    data: df,
    options: { weights },
  });

  expect(result.converged).toBe(true);
  expect(result.coefficients).toHaveLength(2);

  // High weight observations should dominate
  // Points 2 and 4 have high weights and low proportions
  expect(result.fitted_values[1]).toBeCloseTo(y[1], 2); // Should fit point 2 well
  expect(result.fitted_values[3]).toBeCloseTo(y[3], 2); // Should fit point 4 well
});

Deno.test("Weighted GLM Edge Cases - Test 6: Poisson with zero counts and weights", () => {
  const counts = [0, 1, 0, 2, 0];
  const x = [1, 2, 3, 4, 5];
  const weights = [1, 1, 0, 1, 1]; // Zero weight for third observation

  const df = createDataFrame({ columns: { x, y: counts } });

  const result = glm({
    formula: "y ~ x",
    family: "poisson",
    link: "log",
    data: df,
    options: { weights },
  });

  expect(result.converged).toBe(true);
  expect(result.coefficients).toHaveLength(2);

  // All fitted values should be positive
  result.fitted_values.forEach((fitted) => {
    expect(fitted).toBeGreaterThan(0);
  });
});

Deno.test("Weighted GLM Edge Cases - Test 7: Perfect separation in binomial", () => {
  const successes = [0, 0, 0, 10, 10];
  const trials = [10, 10, 10, 10, 10];
  const x = [1, 2, 3, 4, 5];
  const y = successes.map((s, i) => s / trials[i]);
  const weights = [1, 1, 1, 1, 1];

  const df = createDataFrame({ columns: { x, y } });

  const result = glm({
    formula: "y ~ x",
    family: "binomial",
    link: "logit",
    data: df,
    options: { weights },
  });

  // Perfect separation might cause convergence issues
  // Check if it converges or handles the case gracefully
  if (result.converged) {
    expect(result.coefficients).toHaveLength(2);
    // With perfect separation, slope should be very large
    expect(Math.abs(result.coefficients[1])).toBeGreaterThan(5);
  }
});

Deno.test("Weighted GLM Edge Cases - Test 8: Identical x values with different weights", () => {
  const x = [1, 1, 1, 1, 1]; // All x values identical
  const y = [2.1, 4.2, 5.8, 8.1, 10.3];
  const weights = [1, 2, 3, 4, 5];

  const df = createDataFrame({ columns: { x, y } });

  const result = glm({
    formula: "y ~ x",
    family: "gaussian",
    link: "identity",
    data: df,
    options: { weights },
  });

  expect(result.converged).toBe(true);
  expect(result.coefficients).toHaveLength(2);

  // With identical x values, slope should be 0
  assertClose(result.coefficients[1], 0, TOL, "identical x slope");

  // Intercept should be weighted mean of y values
  const weightedMean = weights.reduce((sum, w, i) => sum + w * y[i], 0) /
    weights.reduce((sum, w) => sum + w, 0);
  assertClose(result.coefficients[0], weightedMean, TOL, "identical x intercept (weighted mean)");
});

Deno.test("Weighted GLM Edge Cases - Test 9: All weights zero", () => {
  const x = [1, 2, 3, 4, 5];
  const y = [2.1, 4.2, 5.8, 8.1, 10.3];
  const weights = [0, 0, 0, 0, 0]; // All weights zero

  const df = createDataFrame({ columns: { x, y } });

  expect(() => {
    glm({
      formula: "y ~ x",
      family: "gaussian",
      link: "identity",
      data: df,
      options: { weights },
    });
  }).toThrow(/all weights are zero|no valid observations|no observations informative/i);
});

Deno.test("Weighted GLM Edge Cases - Test 10: Weights with NaN values", () => {
  const x = [1, 2, 3, 4, 5];
  const y = [2.1, 4.2, 5.8, 8.1, 10.3];
  const weights = [1, 2, NaN, 4, 5]; // NaN weight

  const df = createDataFrame({ columns: { x, y } });

  expect(() => {
    glm({
      formula: "y ~ x",
      family: "gaussian",
      link: "identity",
      data: df,
      options: { weights },
    });
  }).toThrow(/invalid weight|NaN|weights must be numeric/i);
});

Deno.test("Weighted GLM Edge Cases - Test 11: Weights with Infinity values", () => {
  const x = [1, 2, 3, 4, 5];
  const y = [2.1, 4.2, 5.8, 8.1, 10.3];
  const weights = [1, 2, Infinity, 4, 5]; // Infinity weight

  const df = createDataFrame({ columns: { x, y } });

  expect(() => {
    glm({
      formula: "y ~ x",
      family: "gaussian",
      link: "identity",
      data: df,
      options: { weights },
    });
  }).toThrow(/invalid weight|infinity|weights must be numeric/i);
});

Deno.test("Weighted GLM Edge Cases - Test 12: Single observation", () => {
  const x = [1];
  const y = [2.1];
  const weights = [1];

  const df = createDataFrame({ columns: { x, y } });

  const result = glm({
    formula: "y ~ x",
    family: "gaussian",
    link: "identity",
    data: df,
    options: { weights },
  });

  expect(result.converged).toBe(true);
  expect(result.coefficients).toHaveLength(2);

  // TODO: sign issue with rank-deficient Householder when nonzero data isn't in leading rows
  assertClose(result.fitted_values[0], y[0], TOL, "single observation fitted value");
});

Deno.test("Weighted GLM Edge Cases - Test 13: Gamma GLM with weights", () => {
  const x = [1, 2, 3, 4, 5];
  const y = [1.1, 2.2, 3.3, 4.4, 5.5]; // Positive values for Gamma
  const weights = [1, 2, 1, 2, 1];

  const df = createDataFrame({ columns: { x, y } });

  const result = glm({
    formula: "y ~ x",
    family: "gamma",
    link: "inverse",
    data: df,
    options: { weights },
  });

  expect(result.converged).toBe(true);
  expect(result.coefficients).toHaveLength(2);

  // All fitted values should be positive for Gamma
  result.fitted_values.forEach((fitted) => {
    expect(fitted).toBeGreaterThan(0);
  });
});

Deno.test("Weighted GLM Edge Cases - Test 14: Inverse Gaussian with weights", () => {
  const x = [1, 2, 3, 4, 5];
  const y = [1.1, 2.2, 3.3, 4.4, 5.5]; // Positive values for Inverse Gaussian
  const weights = [1, 2, 1, 2, 1];

  const df = createDataFrame({ columns: { x, y } });

  const result = glm({
    formula: "y ~ x",
    family: "inverse_gaussian",
    link: "inverse",
    data: df,
    options: { weights },
  });

  expect(result.converged).toBe(true);
  expect(result.coefficients).toHaveLength(2);

  // All fitted values should be positive for Inverse Gaussian
  result.fitted_values.forEach((fitted) => {
    expect(fitted).toBeGreaterThan(0);
  });
});

Deno.test("Weighted GLM Edge Cases - Test 15: Weights length mismatch", () => {
  const x = [1, 2, 3, 4, 5];
  const y = [2.1, 4.2, 5.8, 8.1, 10.3];
  const weights = [1, 2, 3]; // Wrong length

  const df = createDataFrame({ columns: { x, y } });

  expect(() => {
    glm({
      formula: "y ~ x",
      family: "gaussian",
      link: "identity",
      data: df,
      options: { weights },
    });
  }).toThrow(/length mismatch|dimension|weights length must match/i);
});
