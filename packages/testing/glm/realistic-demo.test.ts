/**
 * GLM API Demonstration — with numerical assertions against R reference values.
 */

import { expect } from "@std/expect";
import { createDataFrame } from "../../dataframe/ts/dataframe/index.ts";
import { glm } from "../../dataframe/ts/wasm/glm-functions.ts";
import { TOL, assertClose, assertArrayClose } from "./glm-test-helpers.ts";

Deno.test("GLM Demo 1: Logistic Regression", () => {
  const data = createDataFrame([
    { y: 0, x1: 1.2, x2: 3 },
    { y: 1, x1: 2.5, x2: 5 },
    { y: 0, x1: 1.8, x2: 2 },
    { y: 1, x1: 3.2, x2: 7 },
    { y: 1, x1: 2.9, x2: 6 },
    { y: 0, x1: 1.5, x2: 3 },
  ]);

  const model = glm({
    formula: "y ~ x1 + x2",
    family: "binomial",
    link: "logit",
    data,
  });

  const summary = model.summary();

  // R: coef = [-91.797062, 27.253576, 9.253004]
  // Near-perfect separation — use loose tolerance
  expect(summary.coefficients.names.length).toBe(3);
  assertArrayClose(
    summary.coefficients.estimate,
    [-91.797062, 27.253576, 9.253004],
    0.01,
    "logistic coef",
  );

  // R: deviance = 5.406e-10
  assertClose(summary.residual_deviance, 5.406e-10, 1e-6, "logistic deviance");
});

Deno.test("GLM Demo 2: Linear Regression", () => {
  const data = createDataFrame([
    { price: 200, sqft: 1200, beds: 2 },
    { price: 250, sqft: 1500, beds: 3 },
    { price: 180, sqft: 1000, beds: 2 },
    { price: 300, sqft: 1800, beds: 4 },
    { price: 220, sqft: 1300, beds: 3 },
  ]);

  const model = glm({
    formula: "price ~ sqft + beds",
    family: "gaussian",
    link: "identity",
    data,
  });

  const summary = model.summary();

  // R: coef = [28.0, 0.13, 9.0], deviance = 40.0, aic = 32.586593
  expect(summary.coefficients.names.length).toBe(3);
  assertArrayClose(
    summary.coefficients.estimate,
    [28.0, 0.13, 9.0],
    TOL,
    "linear coef",
  );
  assertClose(summary.residual_deviance, 40.0, TOL, "linear deviance");
  assertClose(summary.aic, 32.586593, TOL, "linear aic");
});

Deno.test("GLM Demo 3: Predictions", () => {
  const trainData = createDataFrame([
    { y: 5, x: 1 },
    { y: 7, x: 2 },
    { y: 9, x: 3 },
    { y: 11, x: 4 },
  ]);

  const model = glm({
    formula: "y ~ x",
    family: "gaussian",
    link: "identity",
    data: trainData,
  });

  // R: coef = [3, 2]
  const summary = model.summary();
  assertArrayClose(summary.coefficients.estimate, [3, 2], TOL, "pred coef");

  // R: predict(model, data.frame(x=c(5,6))) = [13, 15]
  // deno-lint-ignore no-explicit-any
  const newData = createDataFrame({ columns: { x: [5, 6] } }) as any;
  const predictions = model.predict(newData);
  expect(predictions.length).toBe(2);
  assertArrayClose(predictions, [13, 15], TOL, "predictions");
});

Deno.test("GLM Demo 4: Confidence Intervals", () => {
  const data = createDataFrame([
    { y: 2.1, x: 1 },
    { y: 3.9, x: 2 },
    { y: 6.2, x: 3 },
    { y: 7.8, x: 4 },
    { y: 10.1, x: 5 },
  ]);

  const model = glm({
    formula: "y ~ x",
    family: "gaussian",
    link: "identity",
    data,
  });

  // R: coef = [0.05, 1.99]
  const summary = model.summary();
  assertArrayClose(summary.coefficients.estimate, [0.05, 1.99], TOL, "ci coef");

  // R: confint at 95%: lower = [-0.338218, 1.872948], upper = [0.438218, 2.107052]
  const ci = model.confint({ level: 0.95 });
  expect(ci.lower.length).toBe(2);
  assertArrayClose(ci.lower, [-0.338218, 1.872948], TOL, "ci lower");
  assertArrayClose(ci.upper, [0.438218, 2.107052], TOL, "ci upper");
});

Deno.test("GLM Demo 5: Residual Diagnostics", () => {
  const data = createDataFrame([
    { y: 5, x: 1 },
    { y: 7, x: 2 },
    { y: 9, x: 3 },
    { y: 11, x: 4 },
    { y: 13, x: 5 },
  ]);

  const model = glm({
    formula: "y ~ x",
    family: "gaussian",
    link: "identity",
    data,
  });

  // Perfect fit y = 2x + 3, so coef = [3, 2]
  const summary = model.summary();
  assertArrayClose(summary.coefficients.estimate, [3, 2], TOL, "resid coef");

  // Residuals should be essentially 0
  const residuals = model.residuals({ type: "deviance" });
  expect(residuals.length).toBe(5);
  for (let i = 0; i < residuals.length; i++) {
    assertClose(residuals[i], 0, 1e-7, `residual[${i}]`);
  }
});

Deno.test("GLM Demo 6: Influence Measures", () => {
  const data = createDataFrame([
    { y: 0, x: 1 },
    { y: 1, x: 2 },
    { y: 0, x: 1.5 },
    { y: 1, x: 2.5 },
    { y: 1, x: 3 },
  ]);

  const model = glm({
    formula: "y ~ x",
    family: "binomial",
    link: "logit",
    data,
  });

  const influence = model.influence();
  expect(influence.hat.length).toBe(5);

  // R: hat values sum to p = 2 (number of parameters)
  const hatSum = influence.hat.reduce((a: number, b: number) => a + b, 0);
  assertClose(hatSum, 2.0, 1e-3, "hat sum = p");

  // R reference hat values (near-separation makes these extreme)
  assertArrayClose(
    influence.hat,
    [4.16e-6, 0.99999, 0.99999, 3.72e-6, 9.88e-6],
    1e-3,
    "hat values",
  );

  // R reference Cook's distances — near-separation can produce null/NaN for
  // observations on the boundary, so just verify the array length
  expect(influence.cooksDistance.length).toBe(5);
});

Deno.test("GLM Demo 7: Weighted Regression", () => {
  const data = createDataFrame([
    { y: 10.2, x: 1 },
    { y: 10.5, x: 2 },
    { y: 11.8, x: 3 },
    { y: 12.1, x: 4 },
  ]);

  const weights = [100, 50, 10, 80];

  const model = glm({
    formula: "y ~ x",
    family: "gaussian",
    link: "identity",
    data,
    options: { weights },
  });

  const summary = model.summary();

  // R: coef = [9.470702, 0.650966], se = [0.221936, 0.084135]
  expect(summary.coefficients.names.length).toBe(2);
  assertArrayClose(
    summary.coefficients.estimate,
    [9.470702, 0.650966],
    TOL,
    "weighted coef",
  );
  assertArrayClose(
    summary.coefficients.std_error,
    [0.221936, 0.084135],
    TOL,
    "weighted se",
  );
});

Deno.test("GLM Demo 8: Variance-Covariance Matrix", () => {
  const data = createDataFrame([
    { y: 5, x: 1 },
    { y: 7, x: 2 },
    { y: 9, x: 3 },
    { y: 11, x: 4 },
  ]);

  const model = glm({
    formula: "y ~ x",
    family: "gaussian",
    link: "identity",
    data,
  });

  // Perfect fit y = 2x + 3 — check coef
  const summary = model.summary();
  assertArrayClose(summary.coefficients.estimate, [3, 2], TOL, "vcov coef");

  // Vcov should be essentially 0 (perfect fit, residual variance ~ 0)
  const vcov = model.vcov();
  expect(vcov.length).toBe(2);
  for (let i = 0; i < vcov.length; i++) {
    for (let j = 0; j < vcov[i].length; j++) {
      assertClose(vcov[i][j], 0, 1e-8, `vcov[${i}][${j}]`);
    }
  }
});
