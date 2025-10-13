import { expect } from "@std/expect";
import { createDataFrame } from "../../src/dataframe/ts/dataframe/index.ts";
import { glm } from "../../src/dataframe/ts/wasm/glm-functions.ts";

Deno.test("GLM diagnostics - Test 1: Simple Gaussian GLM leverage", () => {
  const x = [1, 2, 3, 4, 5];
  const y = [2, 4, 6, 8, 10];

  const df = createDataFrame({ columns: { x, y } });

  const model = glm({
    formula: "y ~ x",
    family: "gaussian",
    link: "identity",
    data: df,
  });

  // Expected leverage values from R
  const expectedLeverage = [0.6, 0.3, 0.2, 0.3, 0.6];

  expect(model.leverage).toHaveLength(5);
  for (let i = 0; i < 5; i++) {
    expect(model.leverage[i]).toBeCloseTo(expectedLeverage[i], 5);
  }

  // Cook's distance is NaN for perfect fit (no residuals)
  // Just check that it exists and has correct length
  expect(model.cooks_distance).toHaveLength(5);
});

Deno.test("GLM diagnostics - Test 2: Weighted Gaussian GLM", () => {
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

  // Expected leverage values from R
  const expectedLeverage = [
    0.5657895,
    0.2631579,
    0.2894737,
    0.4210526,
    0.4605263,
  ];

  expect(model.leverage).toHaveLength(5);
  for (let i = 0; i < 5; i++) {
    expect(model.leverage[i]).toBeCloseTo(expectedLeverage[i], 5);
  }

  // Expected Cook's distance from R
  const expectedCooks = [
    0.266528926,
    0.112843607,
    0.532123961,
    0.004553888,
    0.390392623,
  ];

  expect(model.cooks_distance).toHaveLength(5);
  for (let i = 0; i < 5; i++) {
    expect(model.cooks_distance[i]).toBeCloseTo(expectedCooks[i], 5);
  }
});

Deno.test("GLM diagnostics - Test 3: Binomial GLM", () => {
  const x = [1, 2, 3, 4, 5];
  const successes = [1, 2, 3, 4, 5];
  const trials = [10, 10, 10, 10, 10];
  const y = successes.map((s, i) => s / trials[i]);

  const df = createDataFrame({ columns: { x, y } });

  const model = glm({
    formula: "y ~ x",
    family: "binomial",
    link: "logit",
    data: df,
    options: { weights: trials },
  });

  // Expected leverage values from R
  const expectedLeverage = [
    0.4781323,
    0.3376781,
    0.2304563,
    0.3041860,
    0.6495472,
  ];

  expect(model.leverage).toHaveLength(5);
  for (let i = 0; i < 5; i++) {
    expect(model.leverage[i]).toBeCloseTo(expectedLeverage[i], 4);
  }

  // Expected Cook's distance from R
  const expectedCooks = [
    0.0382390539,
    0.0037207055,
    0.0043430362,
    0.0007352337,
    0.0391790034,
  ];

  expect(model.cooks_distance).toHaveLength(5);
  for (let i = 0; i < 5; i++) {
    expect(model.cooks_distance[i]).toBeCloseTo(expectedCooks[i], 4);
  }
});

Deno.test("GLM diagnostics - Test 4: Poisson GLM", () => {
  const x = [1, 2, 3, 4, 5];
  const y = [2, 5, 8, 12, 18];

  const df = createDataFrame({ columns: { x, y } });

  const model = glm({
    formula: "y ~ x",
    family: "poisson",
    link: "log",
    data: df,
  });

  // Expected leverage values from R
  const expectedLeverage = [
    0.3995329,
    0.3300098,
    0.2408600,
    0.2622503,
    0.7673470,
  ];

  expect(model.leverage).toHaveLength(5);
  for (let i = 0; i < 5; i++) {
    expect(model.leverage[i]).toBeCloseTo(expectedLeverage[i], 4);
  }

  // Expected Cook's distance from R
  const expectedCooks = [
    0.130276873,
    0.018759247,
    0.015712684,
    0.002314624,
    0.207454032,
  ];

  expect(model.cooks_distance).toHaveLength(5);
  for (let i = 0; i < 5; i++) {
    expect(model.cooks_distance[i]).toBeCloseTo(expectedCooks[i], 4);
  }
});

Deno.test("GLM diagnostics - Test 5: GLM with outlier (high Cook's distance)", () => {
  const x = [1, 2, 3, 4, 5, 6];
  const y = [2, 4, 6, 8, 10, 100]; // Last point is an outlier

  const df = createDataFrame({ columns: { x, y } });

  const model = glm({
    formula: "y ~ x",
    family: "gaussian",
    link: "identity",
    data: df,
  });

  // Expected leverage values from R
  const expectedLeverage = [
    0.5238095,
    0.2952381,
    0.1809524,
    0.1809524,
    0.2952381,
    0.5238095,
  ];

  expect(model.leverage).toHaveLength(6);
  for (let i = 0; i < 6; i++) {
    expect(model.leverage[i]).toBeCloseTo(expectedLeverage[i], 5);
  }

  // Expected Cook's distance from R
  const expectedCooks = [
    0.352000000,
    0.005661066,
    0.010275825,
    0.064223905,
    0.362308254,
    2.200000000,
  ];

  expect(model.cooks_distance).toHaveLength(6);
  for (let i = 0; i < 6; i++) {
    expect(model.cooks_distance[i]).toBeCloseTo(expectedCooks[i], 4);
  }

  // Last observation should have very high Cook's distance (> 1.0)
  expect(model.cooks_distance[5]).toBeGreaterThan(1.0);
});
