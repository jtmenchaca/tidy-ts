import { glm } from "../../dataframe/ts/wasm/glm-functions.ts";
import { createDataFrame } from "@tidy-ts/dataframe";
import { assertClose, TOL } from "./glm-test-helpers.ts";

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
  assertClose(result.coefficients[0], -0.04210526, TOL, "weighted coef[0]");
  assertClose(result.coefficients[1], 2.03157895, TOL, "weighted coef[1]");

  // Check vcov matrix
  const vcov = result.vcov();
  assertClose(vcov[0][0], 0.07239151, TOL, "weighted vcov[0][0]");
  assertClose(vcov[0][1], -0.019907664, TOL, "weighted vcov[0][1]");
  assertClose(vcov[1][0], -0.01990766, TOL, "weighted vcov[1][0]");
  assertClose(vcov[1][1], 0.006334257, TOL, "weighted vcov[1][1]");

  // Check confidence intervals
  const ci = result.confint({ level: 0.95 });
  assertClose(ci.lower[0], -0.5694467, TOL, "weighted CI lower[0]");
  assertClose(ci.upper[0], 0.4852362, TOL, "weighted CI upper[0]");
  assertClose(ci.lower[1], 1.8755892, TOL, "weighted CI lower[1]");
  assertClose(ci.upper[1], 2.1875686, TOL, "weighted CI upper[1]");
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
  assertClose(result.coefficients[0], -0.7089085, TOL, "small-weights coef[0]");
  assertClose(result.coefficients[1], 2.2017834, TOL, "small-weights coef[1]");

  // Check vcov matrix
  const vcov = result.vcov();
  assertClose(vcov[0][0], 0.0009834810, TOL, "small-weights vcov[0][0]");
  assertClose(vcov[0][1], -1.970136e-04, TOL, "small-weights vcov[0][1]");
  assertClose(vcov[1][0], -0.0001970136, TOL, "small-weights vcov[1][0]");
  assertClose(vcov[1][1], 3.948249e-05, TOL, "small-weights vcov[1][1]");

  // Check confidence intervals
  const ci = result.confint({ level: 0.95 });
  assertClose(ci.lower[0], -0.7703739, TOL, "small-weights CI lower[0]");
  assertClose(ci.upper[0], -0.647443, TOL, "small-weights CI upper[0]");
  assertClose(ci.lower[1], 2.1894680, TOL, "small-weights CI lower[1]");
  assertClose(ci.upper[1], 2.214099, TOL, "small-weights CI upper[1]");
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
  assertClose(result.coefficients[0], 1.6953808, TOL, "binomial-weighted coef[0]");
  assertClose(result.coefficients[1], -0.1957673, TOL, "binomial-weighted coef[1]");

  // Check vcov matrix
  const vcov = result.vcov();
  assertClose(vcov[0][0], 0.4752707, TOL, "binomial-weighted vcov[0][0]");
  assertClose(vcov[0][1], -0.11584094, TOL, "binomial-weighted vcov[0][1]");
  assertClose(vcov[1][0], -0.1158409, TOL, "binomial-weighted vcov[1][0]");
  assertClose(vcov[1][1], 0.03165606, TOL, "binomial-weighted vcov[1][1]");

  // Check confidence intervals (profile CI - R's confint())
  const ci = result.confint({ level: 0.95 });
  assertClose(ci.lower[0], 0.4183132, 1e-4, "binomial-weighted CI lower[0]");
  assertClose(ci.upper[0], 3.150958, 1e-4, "binomial-weighted CI upper[0]");
  assertClose(ci.lower[1], -0.5601602, 1e-4, "binomial-weighted CI lower[1]");
  assertClose(ci.upper[1], 0.1436985, 1e-4, "binomial-weighted CI upper[1]");
});
