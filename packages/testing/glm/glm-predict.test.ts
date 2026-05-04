import { glm } from "../../dataframe/ts/wasm/glm-functions.ts";
import { createDataFrame } from "@tidy-ts/dataframe";
import { expect } from "@std/expect";
import { assertClose, TOL } from "./glm-test-helpers.ts";

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
  expect(model.residuals()).toHaveLength(5);
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
  assertClose(predictions[0], 12, TOL, "predict newdata[0]");
  assertClose(predictions[1], 14, TOL, "predict newdata[1]");
  assertClose(predictions[2], 16, TOL, "predict newdata[2]");
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
  assertClose(predictions[0], 12, TOL, "predict object[0]");
  assertClose(predictions[1], 14, TOL, "predict object[1]");
  assertClose(predictions[2], 16, TOL, "predict object[2]");
});

Deno.test("GLM predict() - multi-predictor Gaussian prediction on new data", () => {
  const x1 = [1.3709584471466685, -0.56469817139608869, 0.3631284113373392, 0.63286260496104041, 0.40426832314099903, -0.10612451609148403, 1.5115219974389389, -0.094659038413097557, 2.0184237138770418, -0.062714099052420993, 1.3048696542234852, 2.2866453927011068, -1.3888607011123393, -0.27878876681737136, -0.13332133639365804, 0.63595039807007436, -0.28425292141607239, -2.6564554209047757, -2.4404669285755194, 1.3201133457301921];
  const x2 = [-0.30663859407847455, -1.78130843398, -0.17191735575962136, 1.2146746991725987, 1.8951934612649652, -0.43046913160619965, -0.25726938276892963, -1.7631630851947802, 0.4600973548312714, -0.63999487596011917, 0.45545012324121936, 0.70483733722881914, 1.0351035219699223, -0.60892637540721106, 0.50495512329797032, -1.7170086790733425, -0.784459008379496, -0.85090759417651829, -2.4142076499466318, 0.036122606892255632];
  const x3 = [0.20599860020025385, -0.36105729854866631, 0.75816323569951694, -0.72670482707657524, -1.3682810444192945, 0.43281802588871715, -0.81139317618667162, 1.4441012617212527, -0.43144620261334543, 0.65564788340220681, 0.32192526520394654, -0.78383894088037542, 1.5757275197919773, 0.64289930571731635, 0.08976064659960567, 0.27655074729146301, 0.67928881605527081, 0.0898328865790817, -2.9930900831529348, 0.2848829535306594];
  const y = [6.4922152112873572, 2.8899547699402057, 4.0172547491839614, 2.4130917662322746, -0.67777177442133074, 3.195010478101278, 6.6826975382529135, 5.6020711927623141, 7.6097662922228695, 3.46011303991745, 4.8708369411266723, 7.3656675085145498, -2.619614545396141, 1.9217112366311886, 0.61606922188494506, 6.9121378353068099, 3.0476635252659579, -4.4162046338899259, -3.6395225010879173, 5.4987071542935952];

  const df = createDataFrame({ columns: { x1, x2, x3, y } });

  const model = glm({
    formula: "y ~ x1 + x2 + x3",
    family: "gaussian",
    link: "identity",
    data: df,
  });

  // R coef: [2.075085, 2.992469, -1.525029, 0.633725]
  assertClose(model.coefficients[0], 2.075085, TOL, "intercept");
  assertClose(model.coefficients[1], 2.992469, TOL, "x1 coef");
  assertClose(model.coefficients[2], -1.525029, TOL, "x2 coef");
  assertClose(model.coefficients[3], 0.633725, TOL, "x3 coef");

  const newData = createDataFrame({ columns: { x1: [0, 1, -1], x2: [0, 0.5, -0.5], x3: [0, 1, 2] } });

  const predictions = model.predict(newData);

  // R predictions (response): [2.075085, 4.938764, 1.112581]
  expect(predictions).toHaveLength(3);
  assertClose(predictions[0], 2.075085, TOL, "multi-pred newdata[0]");
  assertClose(predictions[1], 4.938764, TOL, "multi-pred newdata[1]");
  assertClose(predictions[2], 1.112581, TOL, "multi-pred newdata[2]");
});

Deno.test("GLM predict() - Gamma prediction on new data", () => {
  const x = [1, 2, 3, 4, 5, 6, 7, 8];
  const y = [1.2, 2.5, 3.1, 4.8, 6.2, 7.1, 8.9, 10.5];

  const df = createDataFrame({ columns: { x, y } });

  const model = glm({
    formula: "y ~ x",
    family: "gamma",
    link: "inverse",
    data: df,
  });

  // R coef: [0.447807, -0.046496]
  assertClose(model.coefficients[0], 0.447807, TOL, "gamma intercept");
  assertClose(model.coefficients[1], -0.046496, TOL, "gamma x coef");

  const newData = createDataFrame({ columns: { x: [9, 10] } });

  // R predictions (response): [34.078664, -58.301979]
  const responsePreds = model.predict(newData, { type: "response" });
  expect(responsePreds).toHaveLength(2);
  assertClose(responsePreds[0], 34.078664, TOL, "gamma response[0]");
  assertClose(responsePreds[1], -58.301979, TOL, "gamma response[1]");

  // R predictions (link): [0.029344, -0.017152]
  const linkPreds = model.predict(newData, { type: "link" });
  expect(linkPreds).toHaveLength(2);
  assertClose(linkPreds[0], 0.029344, TOL, "gamma link[0]");
  assertClose(linkPreds[1], -0.017152, TOL, "gamma link[1]");
});

Deno.test("GLM predict() - Poisson prediction on new data", () => {
  const x = [1, 2, 3, 4, 5, 6, 7, 8];
  const y = [1, 3, 5, 8, 12, 18, 25, 35];

  const df = createDataFrame({ columns: { x, y } });

  const model = glm({
    formula: "y ~ x",
    family: "poisson",
    link: "log",
    data: df,
  });

  // R coef: [0.365914, 0.406158]
  assertClose(model.coefficients[0], 0.365914, TOL, "poisson intercept");
  assertClose(model.coefficients[1], 0.406158, TOL, "poisson x coef");

  const newData = createDataFrame({ columns: { x: [9, 10] } });

  // R predictions (response): [55.775450, 83.721142]
  const responsePreds = model.predict(newData, { type: "response" });
  expect(responsePreds).toHaveLength(2);
  assertClose(responsePreds[0], 55.775450, TOL, "poisson response[0]");
  assertClose(responsePreds[1], 83.721142, TOL, "poisson response[1]");

  // R predictions (link): [4.021334, 4.427492]
  const linkPreds = model.predict(newData, { type: "link" });
  expect(linkPreds).toHaveLength(2);
  assertClose(linkPreds[0], 4.021334, TOL, "poisson link[0]");
  assertClose(linkPreds[1], 4.427492, TOL, "poisson link[1]");
});

Deno.test("GLM predict() - weighted Gaussian prediction on new data", () => {
  const x = [1, 2, 3, 4, 5];
  const y = [2.1, 4.2, 5.8, 8.1, 10.3];
  const weights = [1, 1, 2, 2, 1];

  const df = createDataFrame({ columns: { x, y } });

  const model = glm({
    formula: "y ~ x",
    family: "gaussian",
    link: "identity",
    data: df,
    options: { weights },
  });

  // R coef: [-0.042105, 2.031579]
  assertClose(model.coefficients[0], -0.042105, TOL, "weighted gaussian intercept");
  assertClose(model.coefficients[1], 2.031579, TOL, "weighted gaussian x coef");

  const newData = createDataFrame({ columns: { x: [6, 7, 8] } });

  // R predictions: [12.147368, 14.178947, 16.210526]
  const predictions = model.predict(newData);
  expect(predictions).toHaveLength(3);
  assertClose(predictions[0], 12.147368, TOL, "weighted gaussian pred[0]");
  assertClose(predictions[1], 14.178947, TOL, "weighted gaussian pred[1]");
  assertClose(predictions[2], 16.210526, TOL, "weighted gaussian pred[2]");
});

Deno.test("GLM predict() - weighted Binomial prediction on new data", () => {
  const x = [1, 2, 3, 4, 5];
  const y = [0.8, 0.6, 0.5, 0.3, 0.2];
  const weights = [10, 15, 20, 25, 30];

  const df = createDataFrame({ columns: { x, y } });

  const model = glm({
    formula: "y ~ x",
    family: "binomial",
    link: "logit",
    data: df,
    options: { weights },
  });

  // R coef: [1.890196, -0.664086]
  assertClose(model.coefficients[0], 1.890196, TOL, "weighted binomial intercept");
  assertClose(model.coefficients[1], -0.664086, TOL, "weighted binomial x coef");

  const newData = createDataFrame({ columns: { x: [0, 3, 6] } });

  // R predictions (response): [0.868778, 0.474507, 0.109650]
  const responsePreds = model.predict(newData, { type: "response" });
  expect(responsePreds).toHaveLength(3);
  assertClose(responsePreds[0], 0.868778, TOL, "weighted binomial response[0]");
  assertClose(responsePreds[1], 0.474507, TOL, "weighted binomial response[1]");
  assertClose(responsePreds[2], 0.109650, TOL, "weighted binomial response[2]");

  // R predictions (link): [1.890196, -0.102062, -2.094321]
  const linkPreds = model.predict(newData, { type: "link" });
  expect(linkPreds).toHaveLength(3);
  assertClose(linkPreds[0], 1.890196, TOL, "weighted binomial link[0]");
  assertClose(linkPreds[1], -0.102062, TOL, "weighted binomial link[1]");
  assertClose(linkPreds[2], -2.094321, TOL, "weighted binomial link[2]");
});
