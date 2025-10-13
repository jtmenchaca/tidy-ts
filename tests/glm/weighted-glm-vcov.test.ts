import { glm } from "../../src/dataframe/ts/wasm/glm-functions.ts";
import { createDataFrame } from "../../src/dataframe/mod.ts";
import { expect } from "@std/expect";

// Test weighted GLM with vcov() and confint()
// This checks if edge cases affect variance-covariance and confidence intervals

Deno.test("Weighted GLM vcov/confint - Test 1: Normal weighted GLM - baseline", () => {
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

  // Check coefficients
  expect(result.coefficients[0]).toBeCloseTo(-0.04210526, 6);
  expect(result.coefficients[1]).toBeCloseTo(2.03157895, 6);

  // Check vcov matrix
  const vcov = result.vcov();
  expect(vcov[0][0]).toBeCloseTo(0.07239151, 6);
  expect(vcov[0][1]).toBeCloseTo(-0.019907664, 6);
  expect(vcov[1][0]).toBeCloseTo(-0.01990766, 6);
  expect(vcov[1][1]).toBeCloseTo(0.006334257, 6);

  // Check confidence intervals
  const ci = result.confint({ level: 0.95 });
  expect(ci.lower[0]).toBeCloseTo(-0.5694467, 5);
  expect(ci.upper[0]).toBeCloseTo(0.4852362, 5);
  expect(ci.lower[1]).toBeCloseTo(1.8755892, 5);
  expect(ci.upper[1]).toBeCloseTo(2.1875686, 5);
});

Deno.test("Weighted GLM vcov/confint - Test 2: Single non-zero weight - edge case", () => {
  const x = [1, 2, 3, 4, 5];
  const y = [2.1, 4.2, 5.8, 8.1, 10.3];
  const weights2 = [0, 0, 0, 0, 1];

  const df = createDataFrame({ columns: { x, y } });

  const result = glm({
    formula: "y ~ x",
    family: "gaussian",
    link: "identity",
    data: df,
    options: { weights: weights2 },
  });

  // R gives: Intercept=10.3, Slope=NA
  // TS currently gives: Intercept=-10.3, Slope=0
  console.log("Single non-zero weight:");
  console.log("  TS Intercept:", result.coefficients[0], "R: 10.3");
  console.log("  TS Slope:", result.coefficients[1], "R: NA");

  // Check vcov - R gives NaN for intercept, NA for others
  const vcov = result.vcov();
  console.log("  TS vcov[0][0]:", vcov[0][0], "R: NaN");
  console.log("  TS vcov[1][1]:", vcov[1][1], "R: NA");
});

Deno.test("Weighted GLM vcov/confint - Test 3: Identical x values - edge case", () => {
  const x3 = [1, 1, 1, 1, 1];
  const y3 = [2.1, 4.2, 5.8, 8.1, 10.3];
  const weights3 = [1, 2, 3, 4, 5];

  const df = createDataFrame({ columns: { x: x3, y: y3 } });

  const result = glm({
    formula: "y ~ x",
    family: "gaussian",
    link: "identity",
    data: df,
    options: { weights: weights3 },
  });

  // R gives: Intercept=7.453333, Slope=NA
  // TS currently gives: Intercept=0, Slope=0
  console.log("Identical x values:");
  console.log("  TS Intercept:", result.coefficients[0], "R: 7.453333");
  console.log("  TS Slope:", result.coefficients[1], "R: NA");

  // Check vcov - R gives 1.670289 for intercept variance, NA for slope
  const vcov = result.vcov();
  console.log("  TS vcov[0][0]:", vcov[0][0], "R: 1.670289");
  console.log("  TS vcov[1][1]:", vcov[1][1], "R: NA");
});

Deno.test("Weighted GLM vcov/confint - Test 4: Single observation", () => {
  const x4 = [1];
  const y4 = [2.1];
  const weights4 = [1];

  const df = createDataFrame({ columns: { x: x4, y: y4 } });

  const result = glm({
    formula: "y ~ x",
    family: "gaussian",
    link: "identity",
    data: df,
    options: { weights: weights4 },
  });

  // R gives: Intercept=2.1, Slope=NA
  // TS currently gives: Intercept=-2.1, Slope=0
  console.log("Single observation:");
  console.log("  TS Intercept:", result.coefficients[0], "R: 2.1");
  console.log("  TS Slope:", result.coefficients[1], "R: NA");

  // Check vcov - R gives NaN for intercept, NA for slope
  const vcov = result.vcov();
  console.log("  TS vcov[0][0]:", vcov[0][0], "R: NaN");
  console.log("  TS vcov[1][1]:", vcov[1][1], "R: NA");
});

Deno.test("Weighted GLM vcov/confint - Test 5: Very small weights", () => {
  const x = [1, 2, 3, 4, 5];
  const y = [2.1, 4.2, 5.8, 8.1, 10.3];
  const weights5 = [1e-10, 1e-8, 1e-6, 1e-4, 1e-2];

  const df = createDataFrame({ columns: { x, y } });

  const result = glm({
    formula: "y ~ x",
    family: "gaussian",
    link: "identity",
    data: df,
    options: { weights: weights5 },
  });

  // Check coefficients
  expect(result.coefficients[0]).toBeCloseTo(-0.7089085, 6);
  expect(result.coefficients[1]).toBeCloseTo(2.2017834, 6);

  // Check vcov matrix
  const vcov = result.vcov();
  expect(vcov[0][0]).toBeCloseTo(0.0009834810, 7);
  expect(vcov[0][1]).toBeCloseTo(-1.970136e-04, 7);
  expect(vcov[1][0]).toBeCloseTo(-0.0001970136, 7);
  expect(vcov[1][1]).toBeCloseTo(3.948249e-05, 8);

  // Check confidence intervals
  const ci = result.confint({ level: 0.95 });
  expect(ci.lower[0]).toBeCloseTo(-0.7703739, 5);
  expect(ci.upper[0]).toBeCloseTo(-0.647443, 5);
  expect(ci.lower[1]).toBeCloseTo(2.1894680, 5);
  expect(ci.upper[1]).toBeCloseTo(2.214099, 5);
});

Deno.test("Weighted GLM vcov/confint - Test 6: Binomial with weights and vcov", () => {
  const successes = [8, 12, 15, 18, 20];
  const trials = [10, 15, 20, 25, 30];
  const x6 = [1, 2, 3, 4, 5];
  const y6 = successes.map((s, i) => s / trials[i]);

  const df = createDataFrame({ columns: { x: x6, y: y6 } });

  const result = glm({
    formula: "y ~ x",
    family: "binomial",
    link: "logit",
    data: df,
    options: { weights: trials },
  });

  // Check coefficients
  expect(result.coefficients[0]).toBeCloseTo(1.6953808, 5);
  expect(result.coefficients[1]).toBeCloseTo(-0.1957673, 5);

  // Check vcov matrix
  const vcov = result.vcov();
  expect(vcov[0][0]).toBeCloseTo(0.4752707, 5);
  expect(vcov[0][1]).toBeCloseTo(-0.11584094, 5);
  expect(vcov[1][0]).toBeCloseTo(-0.1158409, 5);
  expect(vcov[1][1]).toBeCloseTo(0.03165606, 5);

  // Check confidence intervals
  const ci = result.confint({ level: 0.95 });
  expect(ci.lower[0]).toBeCloseTo(0.344184, 4);
  expect(ci.upper[0]).toBeCloseTo(3.0465776, 4);
  expect(ci.lower[1]).toBeCloseTo(-0.544487, 4);
  expect(ci.upper[1]).toBeCloseTo(0.1529524, 4);
});
