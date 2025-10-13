/**
 * GLM API Demonstration
 *
 * Simple examples showing all GLM functionality.
 */

import { expect } from "@std/expect";
import { createDataFrame } from "../../src/dataframe/ts/dataframe/index.ts";
import { glm } from "../../src/dataframe/ts/wasm/glm-functions.ts";

Deno.test("GLM Demo 1: Logistic Regression", () => {
  console.log("\n=== Logistic Regression ===\n");

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
  console.log("Coefficients:", summary.coefficients.names);
  console.log(
    "Estimates:",
    summary.coefficients.estimate.map((e: number) => e.toFixed(3)),
  );
  console.log("AIC:", summary.aic.toFixed(2));

  expect(summary.coefficients.names.length).toBe(3);
});

Deno.test("GLM Demo 2: Linear Regression", () => {
  console.log("\n=== Linear Regression ===\n");

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
  console.log("Coefficients:");
  summary.coefficients.names.forEach((name: string, i: number) => {
    console.log(`  ${name}: ${summary.coefficients.estimate[i].toFixed(3)}`);
  });

  expect(summary.coefficients.names.length).toBe(3);
});

Deno.test("GLM Demo 3: Predictions", () => {
  console.log("\n=== Making Predictions ===\n");

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

  // deno-lint-ignore no-explicit-any
  const newData = createDataFrame({ columns: { x: [5, 6] } }) as any;
  const predictions = model.predict(newData);
  console.log("Predictions:", predictions.map((p: number) => p.toFixed(2)));

  expect(predictions.length).toBe(2);
});

Deno.test("GLM Demo 4: Confidence Intervals", () => {
  console.log("\n=== Confidence Intervals ===\n");

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

  const ci = model.confint({ level: 0.95 });
  console.log("95% Confidence Intervals:");
  console.log("Lower:", ci.lower.map((l: number) => l.toFixed(2)));
  console.log("Upper:", ci.upper.map((u: number) => u.toFixed(2)));

  expect(ci.lower.length).toBe(2);
});

Deno.test("GLM Demo 5: Residual Diagnostics", () => {
  console.log("\n=== Residual Diagnostics ===\n");

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

  const residuals = model.residuals({ type: "deviance" });
  const rstandard = model.rstandard({ type: "deviance" });
  const rstudent = model.rstudent();

  console.log("Residuals:", residuals.map((r: number) => r.toFixed(3)));
  console.log(
    "Standardized:",
    rstandard.map((r: number) =>
      (r == null || Number.isNaN(r)) ? "NaN" : r.toFixed(3)
    ),
  );
  console.log(
    "Studentized:",
    rstudent.map((r: number) =>
      (r == null || Number.isNaN(r)) ? "NaN" : r.toFixed(3)
    ),
  );

  expect(residuals.length).toBe(5);
});

Deno.test("GLM Demo 6: Influence Measures", () => {
  console.log("\n=== Influence Measures ===\n");

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

  console.log(
    "Hat values:",
    influence.hat.map((h: number) =>
      (h == null || Number.isNaN(h)) ? "NaN" : h.toFixed(3)
    ),
  );
  console.log(
    "Cook's D:",
    influence.cooks_distance.map((d: number) =>
      (d == null || Number.isNaN(d)) ? "NaN" : d.toFixed(3)
    ),
  );
  console.log(
    "DFFITS:",
    influence.dffits.map((d: number) =>
      (d == null || Number.isNaN(d)) ? "NaN" : d.toFixed(3)
    ),
  );
  console.log(
    "Covratio:",
    influence.covratio.map((c: number) =>
      (c == null || Number.isNaN(c)) ? "NaN" : c.toFixed(3)
    ),
  );

  expect(influence.hat.length).toBe(5);
});

Deno.test("GLM Demo 7: Weighted Regression", () => {
  console.log("\n=== Weighted Regression ===\n");

  const data = createDataFrame([
    { y: 10.2, x: 1 },
    { y: 10.5, x: 2 },
    { y: 11.8, x: 3 },
    { y: 12.1, x: 4 },
  ]);

  const weights = [100, 50, 10, 80]; // Different precision

  const model = glm({
    formula: "y ~ x",
    family: "gaussian",
    link: "identity",
    data,
    options: { weights },
  });

  const summary = model.summary();
  console.log("Weighted coefficients:");
  summary.coefficients.names.forEach((name: string, i: number) => {
    console.log(`  ${name}: ${summary.coefficients.estimate[i].toFixed(3)}`);
  });

  expect(summary.coefficients.names.length).toBe(2);
});

Deno.test("GLM Demo 8: Variance-Covariance Matrix", () => {
  console.log("\n=== Variance-Covariance Matrix ===\n");

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

  const vcov = model.vcov();
  console.log("Variance-Covariance Matrix:");
  vcov.forEach((row: number[]) => {
    console.log("  ", row.map((v: number) => v.toFixed(6)));
  });

  expect(vcov.length).toBe(2);
});
