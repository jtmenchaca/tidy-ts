import { expect } from "@std/expect";
import { createDataFrame } from "../../dataframe/ts/dataframe/index.ts";
import { glm } from "../../dataframe/ts/wasm/glm-functions.ts";
import { TOL, assertClose } from "./glm-test-helpers.ts";

/**
 * Comprehensive validation test for all the fixes made to influence() and related methods.
 *
 * This test validates:
 * 1. QR matrix column-major indexing fix (glm_fit_core.rs:304)
 * 2. Sigma calculation using sum(devRes^2) not dispersion approximation (glm-functions.ts:1130)
 * 3. Covratio formula correction (glm-functions.ts:1059)
 * 4. Q matrix extraction from packed Householder format (glm-functions.ts:699)
 * 5. All influence measures match R exactly
 */

Deno.test("Comprehensive Fix Validation - All influence measures", () => {
  // Use mtcars dataset
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

  // Test 1: Verify QR matrix is correctly extracted (proves fix #1)
  // deno-lint-ignore no-explicit-any
  const qrData = (model as any).result.qr;
  assertClose(qrData.qr[0][0], -2.022667, TOL, "qr[0][0]");
  assertClose(qrData.qr[0][1], -39.754399, TOL, "qr[0][1]");
  assertClose(qrData.qraux[0], 1.247196, TOL, "qraux[0]");

  // Test 2: Verify all influence measures match R exactly
  // (sigma and Q matrix extraction are now computed in Rust's influence())
  const infl = model.influence();

  // dfbeta (tests Q*R^-1 calculation) - raw change in coefficients
  assertClose(infl.dfbeta[0][0], -1.9601193, TOL, "dfbeta[0][0]");
  assertClose(infl.dfbeta[0][1], 0.0357822, TOL, "dfbeta[0][1]");
  assertClose(infl.dfbeta[0][2], 0.3400869, TOL, "dfbeta[0][2]");

  // dfbetas (tests standardization) - standardized dfbeta
  assertClose(infl.dfbetas[0][0], -0.2514761, TOL, "dfbetas[0][0]");
  assertClose(infl.dfbetas[0][1], 0.1492412, TOL, "dfbetas[0][1]");
  assertClose(infl.dfbetas[0][2], 0.3118616, TOL, "dfbetas[0][2]");

  // dffits (tests sigma calculation - fix #2)
  assertClose(infl.dffits[0], -0.4996871, TOL, "dffits[0]");
  assertClose(infl.dffits[1], -0.4034616, TOL, "dffits[1]");
  assertClose(infl.dffits[2], 0.4203414, TOL, "dffits[2]");

  // covratio (tests formula fix #3)
  assertClose(infl.covratio[0], 1.0415926, TOL, "covratio[0]");
  assertClose(infl.covratio[1], 0.9817319, TOL, "covratio[1]");
  assertClose(infl.covratio[2], 1.1674268, TOL, "covratio[2]");

  // hat values (should be from Rust)
  assertClose(infl.hat[0], 0.11919691, TOL, "hat[0]");
  assertClose(infl.hat[1], 0.07654888, TOL, "hat[1]");

  // cook's distance (should be from Rust)
  assertClose(infl.cooksDistance[0], 0.05076573, TOL, "cooks[0]");
  assertClose(infl.cooksDistance[1], 0.03441305, TOL, "cooks[1]");
});

Deno.test("Comprehensive Fix Validation - Gaussian family", () => {
  // Test with Gaussian family to ensure fixes work across families
  const df = createDataFrame({
    columns: {
      mpg: [21.0, 21.0, 22.8, 21.4, 18.7, 18.1, 14.3, 24.4, 22.8, 19.2],
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
      ],
      hp: [110, 110, 93, 110, 175, 105, 245, 62, 95, 123],
    },
  });

  const model = glm({
    formula: "mpg ~ wt + hp",
    family: "gaussian",
    link: "identity",
    data: df,
  });

  // Verify influence measures work (sigma now computed in Rust)
  const infl = model.influence();
  expect(infl.dffits.length).toBe(10);
  expect(infl.dfbeta.length).toBe(10);
  expect(infl.dfbetas.length).toBe(10);
  expect(infl.covratio.length).toBe(10);

  // All values should be finite
  for (let i = 0; i < 10; i++) {
    expect(isFinite(infl.dffits[i])).toBe(true);
    expect(isFinite(infl.covratio[i])).toBe(true);
    for (let j = 0; j < infl.dfbeta[i].length; j++) {
      expect(isFinite(infl.dfbeta[i][j])).toBe(true);
    }
  }
});

Deno.test("Comprehensive Fix Validation - Edge cases", () => {
  const df = createDataFrame({
    columns: {
      y: [0, 1, 0, 1, 0],
      x: [1, 2, 3, 4, 5],
    },
  });

  const model = glm({
    formula: "y ~ x",
    family: "binomial",
    link: "logit",
    data: df,
  });

  // Test that methods don't crash with small datasets
  const summary = model.summary();
  expect(summary.coefficients.estimate.length).toBe(2);

  const rs = model.rstandard();
  expect(rs.length).toBe(5);

  const rst = model.rstudent();
  expect(rst.length).toBe(5);

  const infl = model.influence();
  expect(infl.dffits.length).toBe(5);
  expect(infl.dfbeta.length).toBe(5);
});
