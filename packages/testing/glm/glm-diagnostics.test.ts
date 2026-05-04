import { expect } from "@std/expect";
import { createDataFrame } from "../../dataframe/ts/dataframe/index.ts";
import { glm } from "../../dataframe/ts/wasm/glm-functions.ts";
import { TOL, assertClose } from "./glm-test-helpers.ts";

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
    assertClose(model.leverage[i], expectedLeverage[i], TOL, `gaussian leverage[${i}]`);
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
    assertClose(model.leverage[i], expectedLeverage[i], TOL, `weighted leverage[${i}]`);
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
    assertClose(model.cooks_distance[i], expectedCooks[i], TOL, `weighted cooks[${i}]`);
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
    assertClose(model.leverage[i], expectedLeverage[i], TOL, `binomial leverage[${i}]`);
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
    assertClose(model.cooks_distance[i], expectedCooks[i], TOL, `binomial cooks[${i}]`);
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
    assertClose(model.leverage[i], expectedLeverage[i], TOL, `poisson leverage[${i}]`);
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
    assertClose(model.cooks_distance[i], expectedCooks[i], TOL, `poisson cooks[${i}]`);
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
    assertClose(model.leverage[i], expectedLeverage[i], TOL, `outlier leverage[${i}]`);
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
    assertClose(model.cooks_distance[i], expectedCooks[i], TOL, `outlier cooks[${i}]`);
  }

  // Last observation should have very high Cook's distance (> 1.0)
  expect(model.cooks_distance[5]).toBeGreaterThan(1.0);
});

Deno.test("GLM diagnostics - Test 6: Gamma GLM leverage and Cook's distance", () => {
  const x = [1, 2, 3, 4, 5, 6, 7, 8];
  const y = [1.2, 2.5, 3.1, 4.8, 6.2, 7.1, 8.9, 10.5];

  const df = createDataFrame({ columns: { x, y } });

  const model = glm({
    formula: "y ~ x",
    family: "gamma",
    link: "inverse",
    data: df,
  });

  // Expected leverage values from R
  const expectedLeverage = [0.226624, 0.206001, 0.182658, 0.157340, 0.133745, 0.126629, 0.201166, 0.765837];

  expect(model.leverage).toHaveLength(8);
  for (let i = 0; i < 8; i++) {
    assertClose(model.leverage[i], expectedLeverage[i], TOL, `gamma leverage[${i}]`);
  }

  // Expected Cook's distance from R
  const expectedCooks = [0.554959, 0.022722, 0.002912, 0.079603, 0.109023, 0.035720, 0.013543, 3.157673];

  expect(model.cooks_distance).toHaveLength(8);
  for (let i = 0; i < 8; i++) {
    assertClose(model.cooks_distance[i], expectedCooks[i], TOL, `gamma cooks[${i}]`);
  }

});

Deno.test("GLM diagnostics - Test 7: Poisson GLM leverage and Cook's distance (8 obs)", () => {
  const x = [1, 2, 3, 4, 5, 6, 7, 8];
  const y = [1, 3, 5, 8, 12, 18, 25, 35];

  const df = createDataFrame({ columns: { x, y } });

  const model = glm({
    formula: "y ~ x",
    family: "poisson",
    link: "log",
    data: df,
  });

  // Expected leverage values from R
  const expectedLeverage = [0.194621, 0.203078, 0.198846, 0.180960, 0.157626, 0.159139, 0.263180, 0.642549];

  expect(model.leverage).toHaveLength(8);
  for (let i = 0; i < 8; i++) {
    assertClose(model.leverage[i], expectedLeverage[i], TOL, `poisson8 leverage[${i}]`);
  }

  // Expected Cook's distance from R
  const expectedCooks = [0.093960, 0.003042, 0.000486, 0.008533, 0.010376, 0.015523, 0.000589, 0.315102];

  expect(model.cooks_distance).toHaveLength(8);
  for (let i = 0; i < 8; i++) {
    assertClose(model.cooks_distance[i], expectedCooks[i], TOL, `poisson8 cooks[${i}]`);
  }
});
