/**
 * Generalized Linear Models (GLM)
 *
 * Demonstrates fitting GLMs via stats.glm, including:
 * - Gaussian (linear regression)
 * - Logistic regression (binomial)
 * - Predictions, confidence intervals, diagnostics
 */

import { expect } from "@std/expect";
import { createDataFrame, stats as s } from "@tidy-ts/dataframe";
import { test } from "@tidy-ts/shims";

// ── Gaussian GLM (linear regression) ────────────────────────────────────────

test("GLM - Gaussian linear regression", () => {
  const df = createDataFrame({
    columns: {
      sbp: [120, 135, 142, 128, 155, 160, 138, 145, 150, 130],
      age: [30, 45, 50, 35, 60, 65, 40, 52, 58, 33],
      bmi: [22, 28, 30, 24, 32, 34, 26, 29, 31, 23],
    },
  });

  const model = s.glm({
    formula: "sbp ~ age + bmi",
    family: "gaussian",
    link: "identity",
    data: df,
  });

  // Model converged
  expect(model.converged).toBe(true);

  // 3 coefficients: intercept, age, bmi
  expect(model.coefficients.length).toBe(3);

  // R² should be high — age and BMI are strong predictors here
  expect(model.r_squared).toBeGreaterThan(0.9);

  // Residual df = n - p = 10 - 3 = 7
  expect(model.df_residual).toBe(7);
});

test("GLM - Gaussian predictions on new data", () => {
  const df = createDataFrame({
    columns: {
      y: [10, 20, 30, 40, 50],
      x: [1, 2, 3, 4, 5],
    },
  });

  const model = s.glm({
    formula: "y ~ x",
    family: "gaussian",
    link: "identity",
    data: df,
  });

  // Predict on new data
  const newData = createDataFrame({ columns: { x: [6, 7] } });
  const preds = model.predict(newData);

  // Simple linear: y ≈ 10*x, so x=6 → ~60, x=7 → ~70
  expect(preds[0]).toBeCloseTo(60, 0);
  expect(preds[1]).toBeCloseTo(70, 0);
});

// ── Logistic GLM (binomial) ─────────────────────────────────────────────────

test("GLM - Logistic regression", () => {
  const df = createDataFrame({
    columns: {
      outcome: [0, 0, 1, 0, 0, 1, 1, 0, 1, 1, 1, 1],
      dose: [1, 2, 3, 3, 4, 5, 6, 6, 7, 8, 9, 10],
    },
  });

  const model = s.glm({
    formula: "outcome ~ dose",
    family: "binomial",
    link: "logit",
    data: df,
  });

  expect(model.converged).toBe(true);

  // Dose coefficient should be positive (higher dose → higher probability)
  const doseCoef = model.coefficients[1];
  expect(doseCoef).toBeGreaterThan(0);

  // Predictions on link scale
  const linkPreds = model.predict(undefined, { type: "link" });
  // Link predictions should increase with dose
  expect(linkPreds[9]).toBeGreaterThan(linkPreds[0]);

  // Predictions on response scale (probabilities)
  const probPreds = model.predict(undefined, { type: "response" });
  for (const p of probPreds) {
    expect(p).toBeGreaterThanOrEqual(0);
    expect(p).toBeLessThanOrEqual(1);
  }
});

// ── Summary and diagnostics ─────────────────────────────────────────────────

test("GLM - Summary output", () => {
  const df = createDataFrame({
    columns: {
      y: [2.1, 3.5, 4.2, 5.8, 6.1, 7.9, 8.3, 9.5, 10.1, 11.2],
      x: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
    },
  });

  const model = s.glm({
    formula: "y ~ x",
    family: "gaussian",
    link: "identity",
    data: df,
  });

  const summary = model.summary();

  // Summary has coefficient table with matching lengths
  expect(summary.coefficients.estimate.length).toBe(2);
  expect(summary.coefficients.std_error.length).toBe(2);
  expect(summary.coefficients.statistic.length).toBe(2);
  expect(summary.coefficients.p_value.length).toBe(2);
  expect(summary.coefficients.names).toEqual(["(Intercept)", "x"]);

  // Family and link
  expect(summary.family).toBe("gaussian");
  expect(summary.link).toBe("identity");
});

test("GLM - Confidence intervals", () => {
  const df = createDataFrame({
    columns: {
      y: [2.1, 3.5, 4.2, 5.8, 6.1, 7.9, 8.3, 9.5, 10.1, 11.2],
      x: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
    },
  });

  const model = s.glm({
    formula: "y ~ x",
    family: "gaussian",
    link: "identity",
    data: df,
  });

  const ci = model.confint();

  // Lower bounds should be less than upper bounds
  for (let i = 0; i < ci.names.length; i++) {
    expect(ci.lower[i]).toBeLessThan(ci.upper[i]);
  }

  // Point estimates should fall within CIs
  const coefs = model.coefficients;
  for (let i = 0; i < coefs.length; i++) {
    expect(coefs[i]).toBeGreaterThan(ci.lower[i]);
    expect(coefs[i]).toBeLessThan(ci.upper[i]);
  }
});

test("GLM - Residuals", () => {
  const df = createDataFrame({
    columns: {
      y: [2.1, 3.5, 4.2, 5.8, 6.1, 7.9, 8.3, 9.5, 10.1, 11.2],
      x: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
    },
  });

  const model = s.glm({
    formula: "y ~ x",
    family: "gaussian",
    link: "identity",
    data: df,
  });

  const devResid = model.residuals({ type: "deviance" });
  const pearsonResid = model.residuals({ type: "pearson" });
  const responseResid = model.residuals({ type: "response" });

  // Each type should have n residuals
  expect(devResid.length).toBe(10);
  expect(pearsonResid.length).toBe(10);
  expect(responseResid.length).toBe(10);

  // Residuals should sum to approximately zero
  const residSum = responseResid.reduce((a, b) => a + b, 0);
  expect(Math.abs(residSum)).toBeLessThan(1e-8);
});

// ── Poisson GLM ─────────────────────────────────────────────────────────────

test("GLM - Poisson regression (count data)", () => {
  const df = createDataFrame({
    columns: {
      counts: [18, 17, 15, 20, 10, 20, 25, 13, 12, 8],
      x: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
    },
  });

  const model = s.glm({
    formula: "counts ~ x",
    family: "poisson",
    link: "log",
    data: df,
  });

  expect(model.converged).toBe(true);
  expect(model.coefficients.length).toBe(2);

  // Fitted values should be positive (Poisson)
  const fitted = model.fitted_values;
  for (const v of fitted) {
    expect(v).toBeGreaterThan(0);
  }
});
