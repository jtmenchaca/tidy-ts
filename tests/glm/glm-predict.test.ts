import { glm } from "../../src/dataframe/ts/wasm/glm-functions.ts";
import { createDataFrame } from "../../src/dataframe/mod.ts";
import { expect } from "@std/expect";

Deno.test("GLM predict() - returns fitted values for response type", () => {
  const x = [1, 2, 3, 4, 5];
  const y = [2.1, 4.2, 5.8, 8.1, 10.3];

  const df = createDataFrame({ columns: { x, y } });

  const model = glm({
    formula: "y ~ x",
    family: "gaussian",
    link: "identity",
    data: df,
  });

  // predict() without newdata should return fitted values
  const predictions = model.predict();

  expect(predictions).toEqual(model.fitted_values);
});

Deno.test("GLM predict() - returns linear predictors for link type", () => {
  const x = [1, 2, 3, 4, 5];
  const y = [2.1, 4.2, 5.8, 8.1, 10.3];

  const df = createDataFrame({ columns: { x, y } });

  const model = glm({
    formula: "y ~ x",
    family: "gaussian",
    link: "identity",
    data: df,
  });

  // predict with type="link" should return linear predictors
  const predictions = model.predict(undefined, { type: "link" });

  expect(predictions).toEqual(model.linear_predictors);
});

Deno.test("GLM predict() - Binomial model predictions", () => {
  const successes = [8, 12, 15, 18, 20];
  const trials = [10, 15, 20, 25, 30];
  const x = [1, 2, 3, 4, 5];
  const y = successes.map((s, i) => s / trials[i]);

  const df = createDataFrame({ columns: { x, y } });

  const model = glm({
    formula: "y ~ x",
    family: "binomial",
    link: "logit",
    data: df,
    options: { weights: trials },
  });

  // Response predictions should be probabilities
  const responsePred = model.predict();
  responsePred.forEach((p) => {
    expect(p).toBeGreaterThanOrEqual(0);
    expect(p).toBeLessThanOrEqual(1);
  });

  // Link predictions should be log-odds
  const linkPred = model.predict(undefined, { type: "link" });
  // Log-odds can be any real number
  expect(linkPred.length).toBe(5);
});

Deno.test("GLM class - accessor methods work", () => {
  const x = [1, 2, 3, 4, 5];
  const y = [2, 4, 6, 8, 10];

  const df = createDataFrame({ columns: { x, y } });

  const model = glm({
    formula: "y ~ x",
    family: "gaussian",
    link: "identity",
    data: df,
  });

  // Test all getters
  expect(model.coefficients).toHaveLength(2);
  expect(model.residuals).toHaveLength(5);
  expect(model.fitted_values).toHaveLength(5);
  expect(model.linear_predictors).toHaveLength(5);
  expect(typeof model.deviance).toBe("number");
  expect(typeof model.aic).toBe("number");
  expect(typeof model.null_deviance).toBe("number");
  expect(typeof model.df_residual).toBe("number");
  expect(typeof model.df_null).toBe("number");
  expect(typeof model.converged).toBe("boolean");
  expect(typeof model.iter).toBe("number");
  expect(model.family).toBeDefined();
  // weights and prior_weights may be undefined if not specified
  expect(typeof model.rank).toBe("number");

  // Test getRawResult()
  const rawResult = model.getRawResult();
  expect(rawResult.coefficients).toEqual(model.coefficients);
});

Deno.test("GLM predict() - throws error for terms type without newdata", () => {
  const x = [1, 2, 3, 4, 5];
  const y = [2, 4, 6, 8, 10];

  const df = createDataFrame({ columns: { x, y } });

  const model = glm({
    formula: "y ~ x",
    family: "gaussian",
    link: "identity",
    data: df,
  });

  // Test that invalid type throws error
  expect(() => {
    model.predict(undefined, { type: "invalid" as "link" });
  }).toThrow();
});

Deno.test("GLM predict() - predicts on new data (Gaussian)", () => {
  const x = [1, 2, 3, 4, 5];
  const y = [2, 4, 6, 8, 10];

  const df = createDataFrame({ columns: { x, y } });

  const model = glm({
    formula: "y ~ x",
    family: "gaussian",
    link: "identity",
    data: df,
  });

  const newData = createDataFrame({ columns: { x: [6, 7, 8] } });

  const predictions = model.predict(newData);

  // For y = 2x (approximately), predictions should be [12, 14, 16]
  expect(predictions).toHaveLength(3);
  expect(predictions[0]).toBeCloseTo(12, 5);
  expect(predictions[1]).toBeCloseTo(14, 5);
  expect(predictions[2]).toBeCloseTo(16, 5);
});

Deno.test("GLM predict() - predicts on new data (Binomial)", () => {
  const x = [1, 2, 3, 4, 5];
  const y = [0.2, 0.4, 0.6, 0.8, 0.9];

  const df = createDataFrame({ columns: { x, y } });

  const model = glm({
    formula: "y ~ x",
    family: "binomial",
    link: "logit",
    data: df,
  });

  const newData = createDataFrame({ columns: { x: [0, 3, 6] } });

  const predictions = model.predict(newData);

  // All predictions should be probabilities between 0 and 1
  expect(predictions).toHaveLength(3);
  predictions.forEach((p) => {
    expect(p).toBeGreaterThanOrEqual(0);
    expect(p).toBeLessThanOrEqual(1);
  });

  // x=0 should give low probability, x=6 should give high probability
  expect(predictions[0]).toBeLessThan(predictions[2]);
});

Deno.test("GLM predict() - predicts with type='link' on new data", () => {
  const x = [1, 2, 3, 4, 5];
  const y = [2, 4, 6, 8, 10];

  const df = createDataFrame({ columns: { x, y } });

  const model = glm({
    formula: "y ~ x",
    family: "gaussian",
    link: "identity",
    data: df,
  });

  const newData = createDataFrame({ columns: { x: [6, 7, 8] } });

  const linkPreds = model.predict(newData, { type: "link" });
  const responsePreds = model.predict(newData, { type: "response" });

  // For gaussian with identity link, they should be the same
  expect(linkPreds).toHaveLength(3);
  expect(responsePreds).toHaveLength(3);
  linkPreds.forEach((lp, i) => {
    expect(lp).toBeCloseTo(responsePreds[i], 10);
  });
});

Deno.test("GLM predict() - predicts on object data", () => {
  const x = [1, 2, 3, 4, 5];
  const y = [2, 4, 6, 8, 10];

  const df = createDataFrame({ columns: { x, y } });

  const model = glm({
    formula: "y ~ x",
    family: "gaussian",
    link: "identity",
    data: df,
  });

  // Pass DataFrame for prediction
  const newData = createDataFrame({ columns: { x: [6, 7, 8] } });

  const predictions = model.predict(newData);

  expect(predictions).toHaveLength(3);
  expect(predictions[0]).toBeCloseTo(12, 5);
  expect(predictions[1]).toBeCloseTo(14, 5);
  expect(predictions[2]).toBeCloseTo(16, 5);
});
