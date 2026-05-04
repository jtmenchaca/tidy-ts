import { expect } from "@std/expect";
import { createDataFrame } from "../../dataframe/ts/dataframe/index.ts";
import { glm } from "../../dataframe/ts/wasm/glm-functions.ts";
import { TOL, assertClose } from "./glm-test-helpers.ts";

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
  assertClose(summary.coefficients.estimate[0], -12.5412218, TOL, "binomial intercept");
  assertClose(summary.coefficients.estimate[1], 0.5240640, TOL, "binomial coef[1] mpg");
  assertClose(summary.coefficients.estimate[2], 0.5828598, TOL, "binomial coef[2] wt");

  // Check standard errors
  assertClose(summary.coefficients.std_error[0], 8.4660329, TOL, "binomial se[0]");
  assertClose(summary.coefficients.std_error[1], 0.2604188, TOL, "binomial se[1]");
  assertClose(summary.coefficients.std_error[2], 1.1844650, TOL, "binomial se[2]");

  // Check z-values
  assertClose(summary.coefficients.statistic[0], -1.481358, TOL, "binomial z[0]");
  assertClose(summary.coefficients.statistic[1], 2.012389, TOL, "binomial z[1]");
  assertClose(summary.coefficients.statistic[2], 0.492087, TOL, "binomial z[2]");

  // Check p-values
  assertClose(summary.coefficients.p_value[0], 0.1385113, TOL, "binomial p[0]");
  assertClose(summary.coefficients.p_value[1], 0.0441789, TOL, "binomial p[1]");
  assertClose(summary.coefficients.p_value[2], 0.6226579, TOL, "binomial p[2]");

  // Check other summary stats
  expect(summary.dispersion).toBe(1.0);
  assertClose(summary.null_deviance, 43.8601092656933, TOL, "binomial null deviance");
  assertClose(summary.residual_deviance, 25.2978755411394, TOL, "binomial residual deviance");
  assertClose(summary.aic, 31.2978755411394, TOL, "binomial AIC");
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
  assertClose(summary.coefficients.estimate[0], 37.22727012, TOL, "gaussian intercept");
  assertClose(summary.coefficients.estimate[1], -3.87783074, TOL, "gaussian coef[1] wt");
  assertClose(summary.coefficients.estimate[2], -0.03177295, TOL, "gaussian coef[2] hp");

  // Check t-values (not z-values, since gaussian uses t-test)
  assertClose(summary.coefficients.statistic[0], 23.284689, TOL, "gaussian t[0]");
  assertClose(summary.coefficients.statistic[1], -6.128695, TOL, "gaussian t[1]");
  assertClose(summary.coefficients.statistic[2], -3.518712, TOL, "gaussian t[2]");

  // Check dispersion (not 1.0 for gaussian)
  assertClose(summary.dispersion, 6.725785, TOL, "gaussian dispersion");
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

  assertClose(rs[0], -1.2505782, TOL, "rstandard deviance[0]");
  assertClose(rs[1], -1.2876088, TOL, "rstandard deviance[1]");
  assertClose(rs[2], 0.9481600, TOL, "rstandard deviance[2]");
  assertClose(rs[3], 1.0094881, TOL, "rstandard deviance[3]");
  assertClose(rs[4], -0.9123216, TOL, "rstandard deviance[4]");
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

  assertClose(rs[0], -1.0608472, TOL, "rstandard pearson[0]");
  assertClose(rs[1], -1.1159886, TOL, "rstandard pearson[1]");
  assertClose(rs[2], 0.7402285, TOL, "rstandard pearson[2]");
  assertClose(rs[3], 0.8035547, TOL, "rstandard pearson[3]");
  assertClose(rs[4], -0.7136809, TOL, "rstandard pearson[4]");
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

  assertClose(rst[0], -1.2295007, TOL, "rstudent[0]");
  assertClose(rst[1], -1.2752880, TOL, "rstudent[1]");
  assertClose(rst[2], 0.9206926, TOL, "rstudent[2]");
  assertClose(rst[3], 0.9900000, TOL, "rstudent[3]");
  assertClose(rst[4], -0.9016931, TOL, "rstudent[4]");
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
  assertClose(infl.dffits[0], -0.4996871, TOL, "dffits[0]");
  assertClose(infl.dffits[1], -0.4034616, TOL, "dffits[1]");
  assertClose(infl.dffits[2], 0.4203414, TOL, "dffits[2]");
  assertClose(infl.dffits[3], 0.3700643, TOL, "dffits[3]");
  assertClose(infl.dffits[4], -0.2459103, TOL, "dffits[4]");

  // Check covratio
  assertClose(infl.covratio[0], 1.0415926, TOL, "covratio[0]");
  assertClose(infl.covratio[1], 0.9817319, TOL, "covratio[1]");
  assertClose(infl.covratio[2], 1.1674268, TOL, "covratio[2]");
  assertClose(infl.covratio[3], 1.0965251, TOL, "covratio[3]");
  assertClose(infl.covratio[4], 1.0687172, TOL, "covratio[4]");

  // Check cooks_distance
  assertClose(infl.cooksDistance[0], 0.05076573, TOL, "cooks distance[0]");
  assertClose(infl.cooksDistance[1], 0.03441305, TOL, "cooks distance[1]");

  // Check hat
  assertClose(infl.hat[0], 0.11919691, TOL, "hat[0]");
  assertClose(infl.hat[1], 0.07654888, TOL, "hat[1]");
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
  assertClose(summary.coefficients.estimate[0], 0.138788291, TOL, "poisson intercept");
  assertClose(summary.coefficients.estimate[1], 0.004481936, TOL, "poisson coef[1] wt");
  assertClose(summary.coefficients.estimate[2], 0.005487240, TOL, "poisson coef[2] hp");

  // Check z-values
  assertClose(summary.coefficients.statistic[0], 0.3481318, TOL, "poisson z[0]");
  assertClose(summary.coefficients.statistic[1], 0.0342206, TOL, "poisson z[1]");
  assertClose(summary.coefficients.statistic[2], 3.3374412, TOL, "poisson z[2]");

  // Check rstandard
  const rs = model.rstandard();
  assertClose(rs[0], 1.1717237, TOL, "poisson rstandard[0]");
  assertClose(rs[1], 1.1668362, TOL, "poisson rstandard[1]");
  assertClose(rs[2], -0.7630870, TOL, "poisson rstandard[2]");
  assertClose(rs[3], -0.8847124, TOL, "poisson rstandard[3]");
  assertClose(rs[4], -0.6519321, TOL, "poisson rstandard[4]");

  // Check rstudent
  const rst = model.rstudent();
  assertClose(rst[0], 1.1788823, TOL, "poisson rstudent[0]");
  assertClose(rst[1], 1.1732108, TOL, "poisson rstudent[1]");
  assertClose(rst[2], -0.7591497, TOL, "poisson rstudent[2]");
  assertClose(rst[3], -0.8809544, TOL, "poisson rstudent[3]");
  assertClose(rst[4], -0.6505781, TOL, "poisson rstudent[4]");
});
