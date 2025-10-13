import { glm } from "../../src/dataframe/ts/wasm/glm-functions.ts";
import { createDataFrame } from "../../src/dataframe/mod.ts";
import { expect } from "@std/expect";

Deno.test("Weighted GLM - Test 1: Gaussian GLM with weights", () => {
  const x = [1, 2, 3, 4, 5];
  const y = [2.1, 4.2, 5.8, 8.1, 10.3];
  const weights = [1, 1, 2, 2, 1];

  const df = createDataFrame({ columns: { x, y } });

  const result = glm({
    formula: "y ~ x",
    family: "gaussian",
    link: "identity",
    data: df,
    options: { weights },
  });

  // Expected values from R
  const expectedIntercept = -0.04210526;
  const expectedSlope = 2.03157895;

  expect(result.coefficients[0]).toBeCloseTo(expectedIntercept, 5);
  expect(result.coefficients[1]).toBeCloseTo(expectedSlope, 5);

  // Check deviance and AIC match R
  expect(result.deviance).toBeCloseTo(0.2063158, 5);
  expect(result.aic).toBeCloseTo(2.864165, 5);

  expect(result.null_deviance).toBeCloseTo(45.01714, 4);
});

Deno.test("Weighted GLM - Test 2: Binomial GLM with weights (aggregated data)", () => {
  const successes = [8, 12, 15, 18, 20];
  const trials = [10, 15, 20, 25, 30];
  const x2 = [1, 2, 3, 4, 5];
  const y2 = successes.map((s, i) => s / trials[i]); // Proportions

  const df = createDataFrame({ columns: { x: x2, y: y2 } });

  const result = glm({
    formula: "y ~ x",
    family: "binomial",
    link: "logit",
    data: df,
    options: { weights: trials },
  });

  // Check that the model converged
  expect(result.converged).toBe(true);
  expect(result.coefficients).toHaveLength(2);

  // Expected values from R
  const expectedIntercept = 1.6953808;
  const expectedSlope = -0.1957673; // Negative because proportion decreases with x

  expect(result.coefficients[0]).toBeCloseTo(expectedIntercept, 5);
  expect(result.coefficients[1]).toBeCloseTo(expectedSlope, 5);

  // Check fitted values are proportions (between 0 and 1)
  result.fitted_values.forEach((fitted) => {
    expect(fitted).toBeGreaterThanOrEqual(0);
    expect(fitted).toBeLessThanOrEqual(1);
  });
});

Deno.test("Weighted GLM - Test 3: Poisson GLM with weights", () => {
  const counts = [5, 8, 12, 15, 20];
  const x3 = [1, 2, 3, 4, 5];
  const weights3 = [1, 1.5, 1, 2, 1.2];

  const df = createDataFrame({ columns: { x: x3, y: counts } });

  const result = glm({
    formula: "y ~ x",
    family: "poisson",
    link: "log",
    data: df,
    options: { weights: weights3 },
  });

  expect(result.converged).toBe(true);
  expect(result.coefficients).toHaveLength(2);

  // For Poisson with positive counts and positive x, slope should be positive
  expect(result.coefficients[1]).toBeGreaterThan(0);

  // Check fitted values are positive
  result.fitted_values.forEach((fitted) => {
    expect(fitted).toBeGreaterThan(0);
  });
});

Deno.test("Weighted GLM - Test 4: Gaussian GLM with zero weights", () => {
  const x4 = [1, 2, 3, 4, 5];
  const y4 = [2, 4, 6, 8, 10];
  const weights4 = [1, 1, 0, 1, 1]; // Zero weight for third observation

  const df = createDataFrame({ columns: { x: x4, y: y4 } });

  const result = glm({
    formula: "y ~ x",
    family: "gaussian",
    link: "identity",
    data: df,
    options: { weights: weights4 },
  });

  expect(result.converged).toBe(true);
  expect(result.coefficients).toHaveLength(2);

  // The observation with zero weight should not affect the fit
  // With data (1,2), (2,4), (4,8), (5,10) - perfect linear relationship y = 2x
  expect(result.coefficients[0]).toBeCloseTo(0, 5); // Intercept near 0
  expect(result.coefficients[1]).toBeCloseTo(2, 5); // Slope near 2
});

Deno.test("Weighted GLM - Test 5: Uniform weights should match unweighted", () => {
  const x = [1, 2, 3, 4, 5];
  const y = [2.1, 4.2, 5.8, 8.1, 10.3];

  const df = createDataFrame({ columns: { x, y } });

  const resultWeighted = glm({
    formula: "y ~ x",
    family: "gaussian",
    link: "identity",
    data: df,
    options: { weights: [1, 1, 1, 1, 1] },
  });

  const resultUnweighted = glm({
    formula: "y ~ x",
    family: "gaussian",
    link: "identity",
    data: df,
  });

  // Coefficients should be identical
  expect(resultWeighted.coefficients[0]).toBeCloseTo(
    resultUnweighted.coefficients[0],
    10,
  );
  expect(resultWeighted.coefficients[1]).toBeCloseTo(
    resultUnweighted.coefficients[1],
    10,
  );

  // Deviance should be identical
  expect(resultWeighted.deviance).toBeCloseTo(resultUnweighted.deviance, 10);
  expect(resultWeighted.aic).toBeCloseTo(resultUnweighted.aic, 10);
});

Deno.test("Weighted GLM - Test 6: Negative weights should throw error", () => {
  const x = [1, 2, 3, 4, 5];
  const y = [2.1, 4.2, 5.8, 8.1, 10.3];
  const weights = [1, 1, -1, 1, 1]; // Negative weight

  const df = createDataFrame({ columns: { x, y } });

  expect(() => {
    glm({
      formula: "y ~ x",
      family: "gaussian",
      link: "identity",
      data: df,
      options: { weights },
    });
  }).toThrow(/negative weights not allowed/i);
});
