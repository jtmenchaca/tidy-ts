import { expect } from "@std/expect";
import { createDataFrame } from "../../dataframe/ts/dataframe/index.ts";
import { glm } from "../../dataframe/ts/wasm/glm-functions.ts";
import { TOL, assertClose } from "./glm-test-helpers.ts";

// Test vcov(), confint(), and residuals() methods for GLM
// Validates against R output from glm-vcov-confint.test.R

const TOL_PROFILE = TOL;

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
  assertClose(model.coefficients[0], 37.22727012, TOL, "gaussian coef intercept");
  assertClose(model.coefficients[1], -3.87783074, TOL, "gaussian coef wt");
  assertClose(model.coefficients[2], -0.03177295, TOL, "gaussian coef hp");

  // Check vcov matrix
  const vcov = model.vcov();
  assertClose(vcov[0][0], 2.5561215917, TOL, "vcov[0][0] intercept variance");
  assertClose(vcov[0][1], -0.73594515, TOL, "vcov[0][1] intercept-wt covariance");
  assertClose(vcov[0][2], 0.0001484701, TOL, "vcov[0][2] intercept-hp covariance");
  assertClose(vcov[1][0], -0.7359451464, TOL, "vcov[1][0] wt-intercept covariance");
  assertClose(vcov[1][1], 0.40035167, TOL, "vcov[1][1] wt variance");
  assertClose(vcov[1][2], -0.003763690, TOL, "vcov[1][2] wt-hp covariance");
  assertClose(vcov[2][0], 0.0001484701, TOL, "vcov[2][0] hp-intercept covariance");
  assertClose(vcov[2][1], -0.00376369, TOL, "vcov[2][1] hp-wt covariance");
  assertClose(vcov[2][2], 0.00008153566, TOL, "vcov[2][2] hp variance");

  // Check confidence intervals (95%, Wald CIs for Gaussian)
  const ci = model.confint({ level: 0.95 });
  assertClose(ci.lower[0], 34.09370412, TOL, "gaussian 95% CI lower intercept");
  assertClose(ci.upper[0], 40.36083611, TOL, "gaussian 95% CI upper intercept");
  assertClose(ci.lower[1], -5.11796560, TOL, "gaussian 95% CI lower wt");
  assertClose(ci.upper[1], -2.63769588, TOL, "gaussian 95% CI upper wt");
  assertClose(ci.lower[2], -0.04947085, TOL, "gaussian 95% CI lower hp");
  assertClose(ci.upper[2], -0.01407504, TOL, "gaussian 95% CI upper hp");
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
  assertClose(model.coefficients[0], -12.5412218, TOL, "binomial coef intercept");
  assertClose(model.coefficients[1], 0.5240640, TOL, "binomial coef mpg");
  assertClose(model.coefficients[2], 0.5828598, TOL, "binomial coef wt");

  // Check vcov matrix
  const vcov = model.vcov();
  assertClose(vcov[0][0], 71.673713, TOL, "binomial vcov[0][0] intercept variance");
  assertClose(vcov[0][1], -2.11427173, TOL, "binomial vcov[0][1] intercept-mpg covariance");
  assertClose(vcov[0][2], -9.2870188, TOL, "binomial vcov[0][2] intercept-wt covariance");
  assertClose(vcov[1][1], 0.06781794, TOL, "binomial vcov[1][1] mpg variance");
  assertClose(vcov[2][2], 1.4029573, TOL, "binomial vcov[2][2] wt variance");

  // Check confidence intervals (profile likelihood, matches R 4.x confint.glm)
  const ci = model.confint({ level: 0.95 });
  assertClose(ci.lower[0], -31.90842474, TOL_PROFILE, "binomial profile CI lower intercept");
  assertClose(ci.upper[0], 2.921046, TOL_PROFILE, "binomial profile CI upper intercept");
  assertClose(ci.lower[1], 0.09326514, TOL_PROFILE, "binomial profile CI lower mpg");
  assertClose(ci.upper[1], 1.165436, TOL_PROFILE, "binomial profile CI upper mpg");
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
  assertClose(model.coefficients[0], 0.138788291, TOL, "poisson coef intercept");
  assertClose(model.coefficients[1], 0.004481936, TOL, "poisson coef wt");
  assertClose(model.coefficients[2], 0.005487240, TOL, "poisson coef hp");

  // Check vcov matrix
  const vcov = model.vcov();
  assertClose(vcov[0][0], 0.1589345071, TOL, "poisson vcov[0][0] intercept variance");
  assertClose(vcov[1][1], 0.0171536296, TOL, "poisson vcov[1][1] wt variance");
  assertClose(vcov[2][2], 0.000002703216, TOL, "poisson vcov[2][2] hp variance");

  // Check confidence intervals (profile likelihood, matches R 4.x confint.glm)
  const ci = model.confint({ level: 0.95 });
  assertClose(ci.lower[0], -0.659863166, TOL_PROFILE, "poisson profile CI lower intercept");
  assertClose(ci.upper[0], 0.904767995, TOL_PROFILE, "poisson profile CI upper intercept");
  assertClose(ci.lower[2], 0.002123691, TOL, "poisson profile CI lower hp");
  assertClose(ci.upper[2], 0.008589864, TOL, "poisson profile CI upper hp");
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
  assertClose(ci90.lower[0], 34.1967040315934, TOL, "gaussian 90% CI lower intercept");
  assertClose(ci90.upper[0], 40.3735483030906, TOL, "gaussian 90% CI upper intercept");
  assertClose(ci90.lower[1], -6.26411095458666, TOL, "gaussian 90% CI lower wt");
  assertClose(ci90.upper[1], -4.42483219085870, TOL, "gaussian 90% CI upper wt");

  // Check 99% CI
  const ci99 = model.confint({ level: 0.99 });
  assertClose(ci99.lower[0], 32.4486786508938, TOL, "gaussian 99% CI lower intercept");
  assertClose(ci99.upper[0], 42.1215736837903, TOL, "gaussian 99% CI upper intercept");
  assertClose(ci99.lower[1], -6.78462042833433, TOL, "gaussian 99% CI lower wt");
  assertClose(ci99.upper[1], -3.90432271711103, TOL, "gaussian 99% CI upper wt");
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
  assertClose(deviance[0], -1.1736815, TOL, "deviance residual obs 1");
  assertClose(deviance[1], -1.2373452, TOL, "deviance residual obs 2");
  assertClose(deviance[2], 0.8761030, TOL, "deviance residual obs 3");
  assertClose(deviance[3], 0.9553595, TOL, "deviance residual obs 4");
  assertClose(deviance[4], -0.8846730, TOL, "deviance residual obs 5");

  // Check Pearson residuals (first 5)
  const pearson = model.residuals({ type: "pearson" });
  assertClose(pearson[0], -0.9956169, TOL, "pearson residual obs 1");
  assertClose(pearson[1], -1.0724244, TOL, "pearson residual obs 2");
  assertClose(pearson[2], 0.6839736, TOL, "pearson residual obs 3");
  assertClose(pearson[3], 0.7604683, TOL, "pearson residual obs 4");
  assertClose(pearson[4], -0.6920523, TOL, "pearson residual obs 5");

  // Check working residuals (first 5)
  const working = model.residuals({ type: "working" });
  assertClose(working[0], -1.991253, TOL, "working residual obs 1");
  assertClose(working[1], -2.150094, TOL, "working residual obs 2");
  assertClose(working[2], 1.467820, TOL, "working residual obs 3");
  assertClose(working[3], 1.578312, TOL, "working residual obs 4");
  assertClose(working[4], -1.478936, TOL, "working residual obs 5");

  // Check response residuals (first 5)
  const response = model.residuals({ type: "response" });
  assertClose(response[0], -0.4978037, TOL, "response residual obs 1");
  assertClose(response[1], -0.5349041, TOL, "response residual obs 2");
  assertClose(response[2], 0.3187175, TOL, "response residual obs 3");
  assertClose(response[3], 0.3664117, TOL, "response residual obs 4");
  assertClose(response[4], -0.3238384, TOL, "response residual obs 5");
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
  assertClose(ci.lower[wtIdx], -5.83406286, TOL, "subset CI lower wt");
  assertClose(ci.upper[wtIdx], -2.88353154, TOL, "subset CI upper wt");
  assertClose(ci.lower[hpIdx], -0.04718482, TOL, "subset CI lower hp");
  assertClose(ci.upper[hpIdx], 0.01154028, TOL, "subset CI upper hp");
});
