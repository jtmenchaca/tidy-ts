import { expect } from "@std/expect";
import { createDataFrame } from "../../src/dataframe/ts/dataframe/index.ts";
import { glm } from "../../src/dataframe/ts/wasm/glm-functions.ts";

// Test vcov(), confint(), and residuals() methods for GLM
// Validates against R output from glm-vcov-confint.test.R

Deno.test("GLM vcov/confint/residuals - Test 1: Gaussian GLM - vcov and confint", () => {
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

  // Check coefficients
  expect(model.coefficients[0]).toBeCloseTo(37.22727012, 6);
  expect(model.coefficients[1]).toBeCloseTo(-3.87783074, 6);
  expect(model.coefficients[2]).toBeCloseTo(-0.03177295, 6);

  // Check vcov matrix
  const vcov = model.vcov();
  expect(vcov[0][0]).toBeCloseTo(2.5561215917, 8);
  expect(vcov[0][1]).toBeCloseTo(-0.73594515, 8);
  expect(vcov[0][2]).toBeCloseTo(0.0001484701, 8);
  expect(vcov[1][0]).toBeCloseTo(-0.7359451464, 8);
  expect(vcov[1][1]).toBeCloseTo(0.40035167, 8);
  expect(vcov[1][2]).toBeCloseTo(-0.003763690, 8);
  expect(vcov[2][0]).toBeCloseTo(0.0001484701, 8);
  expect(vcov[2][1]).toBeCloseTo(-0.00376369, 8);
  expect(vcov[2][2]).toBeCloseTo(0.00008153566, 8);

  // Check confidence intervals (95%)
  const ci = model.confint({ level: 0.95 });
  expect(ci.lower[0]).toBeCloseTo(34.09370412, 5);
  expect(ci.upper[0]).toBeCloseTo(40.36083611, 5);
  expect(ci.lower[1]).toBeCloseTo(-5.11796560, 5);
  expect(ci.upper[1]).toBeCloseTo(-2.63769588, 5);
  expect(ci.lower[2]).toBeCloseTo(-0.04947085, 5);
  expect(ci.upper[2]).toBeCloseTo(-0.01407504, 5);
});

Deno.test("GLM vcov/confint/residuals - Test 2: Binomial GLM - vcov and confint", () => {
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

  // Check coefficients
  expect(model.coefficients[0]).toBeCloseTo(-12.5412218, 4);
  expect(model.coefficients[1]).toBeCloseTo(0.5240640, 4);
  expect(model.coefficients[2]).toBeCloseTo(0.5828598, 4);

  // Check vcov matrix
  const vcov = model.vcov();
  expect(vcov[0][0]).toBeCloseTo(71.673713, 4);
  expect(vcov[0][1]).toBeCloseTo(-2.11427173, 4);
  expect(vcov[0][2]).toBeCloseTo(-9.2870188, 4);
  expect(vcov[1][1]).toBeCloseTo(0.06781794, 4);
  expect(vcov[2][2]).toBeCloseTo(1.4029573, 4);

  // Check confidence intervals
  const ci = model.confint({ level: 0.95 });
  expect(ci.lower[0]).toBeCloseTo(-29.13434142, 3);
  expect(ci.upper[0]).toBeCloseTo(4.051898, 3);
  expect(ci.lower[1]).toBeCloseTo(0.01365257, 3);
  expect(ci.upper[1]).toBeCloseTo(1.034475, 3);
});

Deno.test("GLM vcov/confint/residuals - Test 3: Poisson GLM - vcov and confint", () => {
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

  // Check coefficients
  expect(model.coefficients[0]).toBeCloseTo(0.138788291, 5);
  expect(model.coefficients[1]).toBeCloseTo(0.004481936, 5);
  expect(model.coefficients[2]).toBeCloseTo(0.005487240, 5);

  // Check vcov matrix
  const vcov = model.vcov();
  expect(vcov[0][0]).toBeCloseTo(0.1589345071, 5);
  expect(vcov[1][1]).toBeCloseTo(0.0171536296, 5);
  expect(vcov[2][2]).toBeCloseTo(0.000002703216, 5);

  // Check confidence intervals
  const ci = model.confint({ level: 0.95 });
  expect(ci.lower[0]).toBeCloseTo(-0.642582533, 3);
  expect(ci.upper[0]).toBeCloseTo(0.920159115, 3);
  expect(ci.lower[2]).toBeCloseTo(0.002264774, 4);
  expect(ci.upper[2]).toBeCloseTo(0.008709707, 4);
});

Deno.test("GLM vcov/confint/residuals - Test 4: Different confidence levels", () => {
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
    },
  });

  const model = glm({
    formula: "mpg ~ wt",
    family: "gaussian",
    link: "identity",
    data: df,
  });

  // Check 90% CI
  const ci90 = model.confint({ level: 0.90 });
  expect(ci90.lower[0]).toBeCloseTo(34.196704, 4);
  expect(ci90.upper[0]).toBeCloseTo(40.373548, 4);
  expect(ci90.lower[1]).toBeCloseTo(-6.264111, 4);
  expect(ci90.upper[1]).toBeCloseTo(-4.424832, 4);

  // Check 99% CI
  const ci99 = model.confint({ level: 0.99 });
  expect(ci99.lower[0]).toBeCloseTo(32.44868, 4);
  expect(ci99.upper[0]).toBeCloseTo(42.121574, 4);
  expect(ci99.lower[1]).toBeCloseTo(-6.78462, 4);
  expect(ci99.upper[1]).toBeCloseTo(-3.904323, 4);
});

Deno.test("GLM vcov/confint/residuals - Test 5: Residuals - all types", () => {
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

  // Check deviance residuals (first 5)
  const deviance = model.residuals({ type: "deviance" });
  expect(deviance[0]).toBeCloseTo(-1.1736815, 4);
  expect(deviance[1]).toBeCloseTo(-1.2373452, 4);
  expect(deviance[2]).toBeCloseTo(0.8761030, 4);
  expect(deviance[3]).toBeCloseTo(0.9553595, 4);
  expect(deviance[4]).toBeCloseTo(-0.8846730, 4);

  // Check Pearson residuals (first 5)
  const pearson = model.residuals({ type: "pearson" });
  expect(pearson[0]).toBeCloseTo(-0.9956169, 4);
  expect(pearson[1]).toBeCloseTo(-1.0724244, 4);
  expect(pearson[2]).toBeCloseTo(0.6839736, 4);
  expect(pearson[3]).toBeCloseTo(0.7604683, 4);
  expect(pearson[4]).toBeCloseTo(-0.6920523, 4);

  // Check working residuals (first 5)
  const working = model.residuals({ type: "working" });
  expect(working[0]).toBeCloseTo(-1.991253, 4);
  expect(working[1]).toBeCloseTo(-2.150094, 4);
  expect(working[2]).toBeCloseTo(1.467820, 4);
  expect(working[3]).toBeCloseTo(1.578312, 4);
  expect(working[4]).toBeCloseTo(-1.478936, 4);

  // Check response residuals (first 5)
  const response = model.residuals({ type: "response" });
  expect(response[0]).toBeCloseTo(-0.4978037, 4);
  expect(response[1]).toBeCloseTo(-0.5349041, 4);
  expect(response[2]).toBeCloseTo(0.3187175, 4);
  expect(response[3]).toBeCloseTo(0.3664117, 4);
  expect(response[4]).toBeCloseTo(-0.3238384, 4);
});

Deno.test("GLM vcov/confint/residuals - Test 6: Subset of parameters for confint", () => {
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
      qsec: [
        16.46,
        17.02,
        18.61,
        19.44,
        17.02,
        20.22,
        15.84,
        20.00,
        22.90,
        18.30,
        18.90,
        17.40,
        17.60,
        18.00,
        17.98,
        17.82,
        17.42,
        19.47,
        18.52,
        19.90,
        20.01,
        16.87,
        17.30,
        15.41,
        17.05,
        18.90,
        16.70,
        16.90,
        14.50,
        15.50,
        14.60,
        18.60,
      ],
    },
  });

  const model = glm({
    formula: "mpg ~ wt + hp + qsec",
    family: "gaussian",
    link: "identity",
    data: df,
  });

  // Check full CI (parm parameter not supported, get all coefficients)
  const ci = model.confint({ level: 0.95 });
  // Extract wt and hp from results
  const wtIdx = ci.names.indexOf("wt");
  const hpIdx = ci.names.indexOf("hp");
  expect(ci.lower[wtIdx]).toBeCloseTo(-5.83406286, 4);
  expect(ci.upper[wtIdx]).toBeCloseTo(-2.88353154, 4);
  expect(ci.lower[hpIdx]).toBeCloseTo(-0.04718482, 4);
  expect(ci.upper[hpIdx]).toBeCloseTo(0.01154028, 4);
});
