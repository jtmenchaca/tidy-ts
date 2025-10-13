import { expect } from "@std/expect";
import { createDataFrame } from "../../src/dataframe/ts/dataframe/index.ts";
import { glm } from "../../src/dataframe/ts/wasm/glm-functions.ts";

// Test summary(), rstandard(), rstudent(), and influence() methods
// Validates against R output from glm-methods.test.R

Deno.test("GLM Methods - Test 1: Binomial GLM - summary", () => {
  const df = createDataFrame({
    columns: {
      vs: [
        0,
        0,
        1,
        1,
        0,
        1,
        0,
        1,
        1,
        1,
        1,
        0,
        0,
        0,
        0,
        0,
        0,
        1,
        1,
        1,
        1,
        0,
        0,
        0,
        0,
        1,
        0,
        1,
        0,
        0,
        0,
        1,
      ],
      mpg: [
        21.0,
        21.0,
        22.8,
        21.4,
        18.7,
        18.1,
        14.3,
        24.4,
        22.8,
        19.2,
        17.8,
        16.4,
        17.3,
        15.2,
        10.4,
        10.4,
        14.7,
        32.4,
        30.4,
        33.9,
        21.5,
        15.5,
        15.2,
        13.3,
        19.2,
        27.3,
        26.0,
        30.4,
        15.8,
        19.7,
        15.0,
        21.4,
      ],
      wt: [
        2.620,
        2.875,
        2.320,
        3.215,
        3.440,
        3.460,
        3.570,
        3.190,
        3.150,
        3.440,
        3.440,
        4.070,
        3.730,
        3.780,
        5.250,
        5.424,
        5.345,
        2.200,
        1.615,
        1.835,
        2.465,
        3.520,
        3.435,
        3.840,
        3.845,
        1.935,
        2.140,
        1.513,
        3.170,
        2.770,
        3.570,
        2.780,
      ],
    },
  });

  const model = glm({
    formula: "vs ~ mpg + wt",
    family: "binomial",
    link: "logit",
    data: df,
  });
  const summary = model.summary();

  console.log("Model:", model);
  console.log("Summary:", summary);

  // Check coefficients
  expect(summary.coefficients.estimate[0]).toBeCloseTo(-12.5412218, 4);
  expect(summary.coefficients.estimate[1]).toBeCloseTo(0.5240640, 4);
  expect(summary.coefficients.estimate[2]).toBeCloseTo(0.5828598, 4);

  // Check standard errors
  expect(summary.coefficients.std_error[0]).toBeCloseTo(8.4660329, 4);
  expect(summary.coefficients.std_error[1]).toBeCloseTo(0.2604188, 4);
  expect(summary.coefficients.std_error[2]).toBeCloseTo(1.1844650, 4);

  // Check z-values
  expect(summary.coefficients.statistic[0]).toBeCloseTo(-1.481358, 3);
  expect(summary.coefficients.statistic[1]).toBeCloseTo(2.012389, 3);
  expect(summary.coefficients.statistic[2]).toBeCloseTo(0.492087, 3);

  // Check p-values
  expect(summary.coefficients.p_value[0]).toBeCloseTo(0.1385113, 3);
  expect(summary.coefficients.p_value[1]).toBeCloseTo(0.0441789, 3);
  expect(summary.coefficients.p_value[2]).toBeCloseTo(0.6226579, 3);

  // Check other summary stats
  expect(summary.dispersion).toBe(1.0);
  expect(summary.null_deviance).toBeCloseTo(43.86011, 3);
  expect(summary.residual_deviance).toBeCloseTo(25.29788, 3);
  expect(summary.aic).toBeCloseTo(31.29788, 3);
});

Deno.test("GLM Methods - Test 2: Gaussian GLM - summary", () => {
  const df = createDataFrame({
    columns: {
      mpg: [
        21.0,
        21.0,
        22.8,
        21.4,
        18.7,
        18.1,
        14.3,
        24.4,
        22.8,
        19.2,
        17.8,
        16.4,
        17.3,
        15.2,
        10.4,
        10.4,
        14.7,
        32.4,
        30.4,
        33.9,
        21.5,
        15.5,
        15.2,
        13.3,
        19.2,
        27.3,
        26.0,
        30.4,
        15.8,
        19.7,
        15.0,
        21.4,
      ],
      wt: [
        2.620,
        2.875,
        2.320,
        3.215,
        3.440,
        3.460,
        3.570,
        3.190,
        3.150,
        3.440,
        3.440,
        4.070,
        3.730,
        3.780,
        5.250,
        5.424,
        5.345,
        2.200,
        1.615,
        1.835,
        2.465,
        3.520,
        3.435,
        3.840,
        3.845,
        1.935,
        2.140,
        1.513,
        3.170,
        2.770,
        3.570,
        2.780,
      ],
      hp: [
        110,
        110,
        93,
        110,
        175,
        105,
        245,
        62,
        95,
        123,
        123,
        180,
        180,
        180,
        205,
        215,
        230,
        66,
        52,
        65,
        97,
        150,
        150,
        245,
        175,
        66,
        91,
        113,
        264,
        175,
        335,
        109,
      ],
    },
  });

  const model = glm({
    formula: "mpg ~ wt + hp",
    family: "gaussian",
    link: "identity",
    data: df,
  });
  const summary = model.summary();

  // Check coefficients
  expect(summary.coefficients.estimate[0]).toBeCloseTo(37.22727012, 4);
  expect(summary.coefficients.estimate[1]).toBeCloseTo(-3.87783074, 4);
  expect(summary.coefficients.estimate[2]).toBeCloseTo(-0.03177295, 4);

  // Check t-values (not z-values, since gaussian uses t-test)
  expect(summary.coefficients.statistic[0]).toBeCloseTo(23.284689, 3);
  expect(summary.coefficients.statistic[1]).toBeCloseTo(-6.128695, 3);
  expect(summary.coefficients.statistic[2]).toBeCloseTo(-3.518712, 3);

  // Check dispersion (not 1.0 for gaussian)
  expect(summary.dispersion).toBeCloseTo(6.725785, 3);
});

Deno.test("GLM Methods - Test 3: rstandard - deviance type", () => {
  const df = createDataFrame({
    columns: {
      vs: [
        0,
        0,
        1,
        1,
        0,
        1,
        0,
        1,
        1,
        1,
        1,
        0,
        0,
        0,
        0,
        0,
        0,
        1,
        1,
        1,
        1,
        0,
        0,
        0,
        0,
        1,
        0,
        1,
        0,
        0,
        0,
        1,
      ],
      mpg: [
        21.0,
        21.0,
        22.8,
        21.4,
        18.7,
        18.1,
        14.3,
        24.4,
        22.8,
        19.2,
        17.8,
        16.4,
        17.3,
        15.2,
        10.4,
        10.4,
        14.7,
        32.4,
        30.4,
        33.9,
        21.5,
        15.5,
        15.2,
        13.3,
        19.2,
        27.3,
        26.0,
        30.4,
        15.8,
        19.7,
        15.0,
        21.4,
      ],
      wt: [
        2.620,
        2.875,
        2.320,
        3.215,
        3.440,
        3.460,
        3.570,
        3.190,
        3.150,
        3.440,
        3.440,
        4.070,
        3.730,
        3.780,
        5.250,
        5.424,
        5.345,
        2.200,
        1.615,
        1.835,
        2.465,
        3.520,
        3.435,
        3.840,
        3.845,
        1.935,
        2.140,
        1.513,
        3.170,
        2.770,
        3.570,
        2.780,
      ],
    },
  });

  const model = glm({
    formula: "vs ~ mpg + wt",
    family: "binomial",
    link: "logit",
    data: df,
  });
  const rs = model.rstandard({ type: "deviance" });

  expect(rs[0]).toBeCloseTo(-1.2505782, 4);
  expect(rs[1]).toBeCloseTo(-1.2876088, 4);
  expect(rs[2]).toBeCloseTo(0.9481600, 4);
  expect(rs[3]).toBeCloseTo(1.0094881, 4);
  expect(rs[4]).toBeCloseTo(-0.9123216, 4);
});

Deno.test("GLM Methods - Test 4: rstandard - pearson type", () => {
  const df = createDataFrame({
    columns: {
      vs: [
        0,
        0,
        1,
        1,
        0,
        1,
        0,
        1,
        1,
        1,
        1,
        0,
        0,
        0,
        0,
        0,
        0,
        1,
        1,
        1,
        1,
        0,
        0,
        0,
        0,
        1,
        0,
        1,
        0,
        0,
        0,
        1,
      ],
      mpg: [
        21.0,
        21.0,
        22.8,
        21.4,
        18.7,
        18.1,
        14.3,
        24.4,
        22.8,
        19.2,
        17.8,
        16.4,
        17.3,
        15.2,
        10.4,
        10.4,
        14.7,
        32.4,
        30.4,
        33.9,
        21.5,
        15.5,
        15.2,
        13.3,
        19.2,
        27.3,
        26.0,
        30.4,
        15.8,
        19.7,
        15.0,
        21.4,
      ],
      wt: [
        2.620,
        2.875,
        2.320,
        3.215,
        3.440,
        3.460,
        3.570,
        3.190,
        3.150,
        3.440,
        3.440,
        4.070,
        3.730,
        3.780,
        5.250,
        5.424,
        5.345,
        2.200,
        1.615,
        1.835,
        2.465,
        3.520,
        3.435,
        3.840,
        3.845,
        1.935,
        2.140,
        1.513,
        3.170,
        2.770,
        3.570,
        2.780,
      ],
    },
  });

  const model = glm({
    formula: "vs ~ mpg + wt",
    family: "binomial",
    link: "logit",
    data: df,
  });
  const rs = model.rstandard({ type: "pearson" });

  expect(rs[0]).toBeCloseTo(-1.0608472, 4);
  expect(rs[1]).toBeCloseTo(-1.1159886, 4);
  expect(rs[2]).toBeCloseTo(0.7402285, 4);
  expect(rs[3]).toBeCloseTo(0.8035547, 4);
  expect(rs[4]).toBeCloseTo(-0.7136809, 4);
});

Deno.test("GLM Methods - Test 5: rstudent", () => {
  const df = createDataFrame({
    columns: {
      vs: [
        0,
        0,
        1,
        1,
        0,
        1,
        0,
        1,
        1,
        1,
        1,
        0,
        0,
        0,
        0,
        0,
        0,
        1,
        1,
        1,
        1,
        0,
        0,
        0,
        0,
        1,
        0,
        1,
        0,
        0,
        0,
        1,
      ],
      mpg: [
        21.0,
        21.0,
        22.8,
        21.4,
        18.7,
        18.1,
        14.3,
        24.4,
        22.8,
        19.2,
        17.8,
        16.4,
        17.3,
        15.2,
        10.4,
        10.4,
        14.7,
        32.4,
        30.4,
        33.9,
        21.5,
        15.5,
        15.2,
        13.3,
        19.2,
        27.3,
        26.0,
        30.4,
        15.8,
        19.7,
        15.0,
        21.4,
      ],
      wt: [
        2.620,
        2.875,
        2.320,
        3.215,
        3.440,
        3.460,
        3.570,
        3.190,
        3.150,
        3.440,
        3.440,
        4.070,
        3.730,
        3.780,
        5.250,
        5.424,
        5.345,
        2.200,
        1.615,
        1.835,
        2.465,
        3.520,
        3.435,
        3.840,
        3.845,
        1.935,
        2.140,
        1.513,
        3.170,
        2.770,
        3.570,
        2.780,
      ],
    },
  });

  const model = glm({
    formula: "vs ~ mpg + wt",
    family: "binomial",
    link: "logit",
    data: df,
  });
  const rst = model.rstudent();

  expect(rst[0]).toBeCloseTo(-1.2295007, 4);
  expect(rst[1]).toBeCloseTo(-1.2752880, 4);
  expect(rst[2]).toBeCloseTo(0.9206926, 4);
  expect(rst[3]).toBeCloseTo(0.9900000, 4);
  expect(rst[4]).toBeCloseTo(-0.9016931, 4);
});

Deno.test("GLM Methods - Test 6: influence - dffits", () => {
  const df = createDataFrame({
    columns: {
      vs: [
        0,
        0,
        1,
        1,
        0,
        1,
        0,
        1,
        1,
        1,
        1,
        0,
        0,
        0,
        0,
        0,
        0,
        1,
        1,
        1,
        1,
        0,
        0,
        0,
        0,
        1,
        0,
        1,
        0,
        0,
        0,
        1,
      ],
      mpg: [
        21.0,
        21.0,
        22.8,
        21.4,
        18.7,
        18.1,
        14.3,
        24.4,
        22.8,
        19.2,
        17.8,
        16.4,
        17.3,
        15.2,
        10.4,
        10.4,
        14.7,
        32.4,
        30.4,
        33.9,
        21.5,
        15.5,
        15.2,
        13.3,
        19.2,
        27.3,
        26.0,
        30.4,
        15.8,
        19.7,
        15.0,
        21.4,
      ],
      wt: [
        2.620,
        2.875,
        2.320,
        3.215,
        3.440,
        3.460,
        3.570,
        3.190,
        3.150,
        3.440,
        3.440,
        4.070,
        3.730,
        3.780,
        5.250,
        5.424,
        5.345,
        2.200,
        1.615,
        1.835,
        2.465,
        3.520,
        3.435,
        3.840,
        3.845,
        1.935,
        2.140,
        1.513,
        3.170,
        2.770,
        3.570,
        2.780,
      ],
    },
  });

  const model = glm({
    formula: "vs ~ mpg + wt",
    family: "binomial",
    link: "logit",
    data: df,
  });
  const infl = model.influence();

  // Check dffits
  expect(infl.dffits[0]).toBeCloseTo(-0.4996871, 3);
  expect(infl.dffits[1]).toBeCloseTo(-0.4034616, 3);
  expect(infl.dffits[2]).toBeCloseTo(0.4203414, 3);
  expect(infl.dffits[3]).toBeCloseTo(0.3700643, 3);
  expect(infl.dffits[4]).toBeCloseTo(-0.2459103, 3);

  // Check covratio
  expect(infl.covratio[0]).toBeCloseTo(1.0415926, 3);
  expect(infl.covratio[1]).toBeCloseTo(0.9817319, 3);
  expect(infl.covratio[2]).toBeCloseTo(1.1674268, 3);
  expect(infl.covratio[3]).toBeCloseTo(1.0965251, 3);
  expect(infl.covratio[4]).toBeCloseTo(1.0687172, 3);

  // Check cooks_distance
  expect(infl.cooks_distance[0]).toBeCloseTo(0.05076573, 4);
  expect(infl.cooks_distance[1]).toBeCloseTo(0.03441305, 4);

  // Check hat
  expect(infl.hat[0]).toBeCloseTo(0.11919691, 4);
  expect(infl.hat[1]).toBeCloseTo(0.07654888, 4);
});

Deno.test("GLM Methods - Test 8: Poisson GLM - summary and diagnostics", () => {
  const df = createDataFrame({
    columns: {
      carb: [
        4,
        4,
        1,
        1,
        2,
        1,
        4,
        2,
        2,
        4,
        4,
        3,
        3,
        3,
        4,
        4,
        4,
        1,
        2,
        1,
        1,
        2,
        2,
        4,
        2,
        1,
        2,
        2,
        4,
        6,
        8,
        2,
      ],
      wt: [
        2.620,
        2.875,
        2.320,
        3.215,
        3.440,
        3.460,
        3.570,
        3.190,
        3.150,
        3.440,
        3.440,
        4.070,
        3.730,
        3.780,
        5.250,
        5.424,
        5.345,
        2.200,
        1.615,
        1.835,
        2.465,
        3.520,
        3.435,
        3.840,
        3.845,
        1.935,
        2.140,
        1.513,
        3.170,
        2.770,
        3.570,
        2.780,
      ],
      hp: [
        110,
        110,
        93,
        110,
        175,
        105,
        245,
        62,
        95,
        123,
        123,
        180,
        180,
        180,
        205,
        215,
        230,
        66,
        52,
        65,
        97,
        150,
        150,
        245,
        175,
        66,
        91,
        113,
        264,
        175,
        335,
        109,
      ],
    },
  });

  const model = glm({
    formula: "carb ~ wt + hp",
    family: "poisson",
    link: "log",
    data: df,
  });
  const summary = model.summary();

  // Check coefficients
  expect(summary.coefficients.estimate[0]).toBeCloseTo(0.138788291, 4);
  expect(summary.coefficients.estimate[1]).toBeCloseTo(0.004481936, 4);
  expect(summary.coefficients.estimate[2]).toBeCloseTo(0.005487240, 4);

  // Check z-values
  expect(summary.coefficients.statistic[0]).toBeCloseTo(0.3481318, 3);
  expect(summary.coefficients.statistic[1]).toBeCloseTo(0.0342206, 3);
  expect(summary.coefficients.statistic[2]).toBeCloseTo(3.3374412, 3);

  // Check rstandard
  const rs = model.rstandard();
  expect(rs[0]).toBeCloseTo(1.1717237, 4);
  expect(rs[1]).toBeCloseTo(1.1668362, 4);
  expect(rs[2]).toBeCloseTo(-0.7630870, 4);
  expect(rs[3]).toBeCloseTo(-0.8847124, 4);
  expect(rs[4]).toBeCloseTo(-0.6519321, 4);

  // Check rstudent
  const rst = model.rstudent();
  expect(rst[0]).toBeCloseTo(1.1788823, 4);
  expect(rst[1]).toBeCloseTo(1.1732108, 4);
  expect(rst[2]).toBeCloseTo(-0.7591497, 4);
  expect(rst[3]).toBeCloseTo(-0.8809544, 4);
  expect(rst[4]).toBeCloseTo(-0.6505781, 4);
});
