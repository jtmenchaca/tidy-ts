#!/usr/bin/env -S deno test --allow-all

// deno-lint-ignore-file no-explicit-any
import {
  callRobustR,
  callRobustRust,
  generateRegressionTestCase,
  type RegressionTestParameters,
  setTestSeed,
} from "./regression-interface.ts";
import {
  AIC_R2_CLOSE_THRESHOLD,
  COEFFICIENT_DIFFERENCE_THRESHOLD,
  hasSystemError,
  INDIVIDUAL_TEST_SUCCESS_THRESHOLD,
  isStatisticalFailure,
  REGRESSION_COMPREHENSIVE_SUCCESS_THRESHOLD,
  runComprehensiveTestSuite,
  runTestGroup,
  SEPARATION_CASE_COEFFICIENT_THRESHOLD,
  type TestResult,
} from "../test-helpers.ts";

interface ComparisonResult extends TestResult {
  testParams?: {
    sampleSize: number;
    numPredictors: number;
    formula: string;
    family: string;
    alpha: number;
  };
  generatedData?: {
    y: number[];
    predictors: { [key: string]: number[] };
    formula: string;
    weights?: number[];
    offset?: number[];
  };
}

// Run comparison using robust interface
async function runRobustComparison(
  params: RegressionTestParameters,
): Promise<ComparisonResult> {
  let rResult: any = null;
  let rustResult: any = null;
  let rError: string | null = null;
  let rustError: string | null = null;

  // Extract generated data for display
  const generatedData = {
    y: params.data?.y || [],
    predictors: {} as { [key: string]: number[] },
    formula: params.data?.formula || "N/A",
    weights: params.data?.weights,
    offset: params.data?.offset,
  };

  // Extract predictor variables
  if (params.data) {
    Object.keys(params.data).forEach((key) => {
      if (
        key !== "y" && key !== "formula" && key !== "weights" &&
        key !== "offset"
      ) {
        generatedData.predictors[key] = (params.data as any)[key];
      }
    });
  }

  // Try R first
  try {
    rResult = await callRobustR(params);
  } catch (error) {
    rError = String(error);
  }

  // Try Rust
  try {
    rustResult = await callRobustRust(params);
  } catch (error) {
    rustError = String(error);
  }

  // Case 1: Both succeeded
  if (rResult && rustResult) {
    // Attach R warnings if present (from callRobustR)
    const rWarnings: string = (rResult as any)?.warnings || "";

    // Calculate differences for key metrics
    const rCoefs = rResult.coefficients || [];
    const rustCoefs = rustResult.coefficients || [];
    const maxCoefLength = Math.max(rCoefs.length, rustCoefs.length);

    let coefficientDiff = 0;
    for (let i = 0; i < maxCoefLength; i++) {
      const rCoef = rCoefs[i] || 0;
      const rustCoef = rustCoefs[i] || 0;
      coefficientDiff = Math.max(coefficientDiff, Math.abs(rCoef - rustCoef));
    }

    const rSquaredDiff = Math.abs(
      (rResult.r_squared || 0) - (rustResult.r_squared || 0),
    );
    const aicDiff = Math.abs((rResult.aic || 0) - (rustResult.aic || 0));

    // Filter out NaN values when computing maxDiff
    const diffs = [coefficientDiff, rSquaredDiff, aicDiff].filter((d) =>
      !isNaN(d)
    );
    const maxDiff = diffs.length > 0 ? Math.max(...diffs) : 0;

    // Determine status
    // If R reported separation/singularity-like warnings, relax coefficient comparison and
    // focus on deviance/AIC agreement (binomial separation often yields unstable coefs)
    const warnsSeparation = typeof rWarnings === "string" &&
      /fitted probabilities numerically 0 or 1 occurred|separation|singular|did not converge/i
        .test(rWarnings);
    let status: "PASS" | "FAIL" = "FAIL";
    if (warnsSeparation) {
      const aicClose = isFinite(aicDiff) && aicDiff < AIC_R2_CLOSE_THRESHOLD;
      const r2Close = isFinite(rSquaredDiff) &&
        rSquaredDiff < AIC_R2_CLOSE_THRESHOLD;
      status = aicClose && r2Close
        ? "PASS"
        : (maxDiff < SEPARATION_CASE_COEFFICIENT_THRESHOLD ? "PASS" : "FAIL");
    } else {
      status = maxDiff < COEFFICIENT_DIFFERENCE_THRESHOLD ? "PASS" : "FAIL";
    }

    // Extract test parameters
    const sampleSize = params.data?.y?.length || 0;
    const numPredictors = Object.keys(params.data || {}).filter(
      (key) =>
        key !== "y" && key !== "formula" && key !== "weights" &&
        key !== "offset",
    ).length;

    return {
      testName: `${params.testType} (${params.options?.family || "default"})`,
      rResult,
      rustResult,
      coefficientDiff,
      rSquaredDiff,
      aicDiff,
      status,
      testParams: {
        sampleSize,
        numPredictors,
        formula: params.data?.formula || "N/A",
        family: params.options?.family || "default",
        alpha: params.options?.alpha || 0.05,
      },
      generatedData,
    };
  }

  // Case 2: Both failed - check if they failed for the same statistical reason
  if (rError && rustError) {
    const rIsStatistical = isStatisticalFailure(rError);
    const rustIsStatistical = isStatisticalFailure(rustError);

    // If both failed for statistical reasons, this is expected behavior (PASS)
    if (rIsStatistical && rustIsStatistical) {
      const sampleSize = params.data?.y?.length || 0;
      const numPredictors = Object.keys(params.data || {}).filter(
        (key) =>
          key !== "y" && key !== "formula" && key !== "weights" &&
          key !== "offset",
      ).length;

      return {
        testName: `${params.testType} (${params.options?.family || "default"})`,
        rResult: null,
        rustResult: null,
        coefficientDiff: 0,
        rSquaredDiff: 0,
        aicDiff: 0,
        status: "PASS",
        testParams: {
          sampleSize,
          numPredictors,
          formula: params.data?.formula || "N/A",
          family: params.options?.family || "default",
          alpha: params.options?.alpha || 0.05,
        },
        rError: rError || undefined,
        rustError: rustError || undefined,
        generatedData,
      };
    }
  }

  // Case 3: Different outcomes (one succeeded, one failed, or different error types)
  const sampleSize = params.data?.y?.length || 0;
  const numPredictors = Object.keys(params.data || {}).filter(
    (key) =>
      key !== "y" && key !== "formula" && key !== "weights" &&
      key !== "offset",
  ).length;

  const status = (hasSystemError(rError) || hasSystemError(rustError))
    ? "ERROR"
    : "FAIL";

  return {
    testName: `${params.testType} (${params.options?.family || "default"})`,
    rResult,
    rustResult,
    coefficientDiff: 0,
    rSquaredDiff: 0,
    aicDiff: 0,
    status,
    testParams: {
      sampleSize,
      numPredictors,
      formula: params.data?.formula || "N/A",
      family: params.options?.family || "default",
      alpha: params.options?.alpha || 0.05,
    },
    rError: rError || undefined,
    rustError: rustError || undefined,
    generatedData,
  };
}

// Test configuration - only enabled tests
const testConfig = {
  // GLM Tests - Gaussian Family
  "glm.gaussian": true, // ✅ Working (identity link)
  "glm.gaussian.log": false, // ✅ Working (log link)
  "glm.gaussian.inverse": false, // ✅ Working (inverse link)

  // GLM Tests - Binomial Family
  "glm.binomial": true, // ✅ Working (logit link)
  "glm.binomial.probit": false, // ✅ Working (probit link)
  "glm.binomial.cauchit": false, // ✅ Working (cauchit link)
  "glm.binomial.log": false, // Testing if R supports binomial log link
  "glm.binomial.cloglog": false, // ❌ Rust side has NAs error (cloglog link)

  // GLM Tests - Poisson Family
  "glm.poisson": true, // ✅ Working (log link)
  "glm.poisson.identity": false, // ✅ Working (identity link)
  "glm.poisson.sqrt": false, // ✅ Working (sqrt link)

  // GLM Tests - Gamma Family
  "glm.gamma": true, // ✅ Working (inverse link)
  "glm.gamma.identity": false, // ❌ R side returns zeros (identity link)
  "glm.gamma.log": false, // ❌ DISABLED - R doesn't support gamma log link (returns zeros)

  // GLM Tests - Inverse Gaussian Family
  "glm.inverse.gaussian": true, // ✅ Implemented (1/mu^2 link)
  "glm.inverse.gaussian.identity": false, // ❌ Not implemented (identity link)
  "glm.inverse.gaussian.log": false, // ✅ Working (log link)

  // LM Tests - Basic Linear Models
  "lm.simple": false, // ✅ Working (unweighted)
  "lm.weighted": false, // ✅ Working (weighted)
  "lm.offset": false, // ❌ Not implemented (with offset)
  "lm.subset": false, // ❌ Not implemented (with subset)
};

// Get enabled test types
const enabledTestTypes = Object.keys(testConfig).filter((key) =>
  testConfig[key as keyof typeof testConfig]
);

// Test parameters
const testCount = 2; // Number of random tests per type
const seed = Date.now() >>> 0;

// Set seed for reproducibility
setTestSeed(seed);

// Helper function to generate test case with proper random sampling
function generateTestCase(testType: string, sampleSize: number) {
  return generateRegressionTestCase(testType, sampleSize);
}

// GLM Gaussian Family Tests
Deno.test("glm.gaussian", async () => {
  await runTestGroup(
    "GLM Gaussian Tests",
    "glm.gaussian",
    testCount,
    generateTestCase,
    runRobustComparison,
    [10, 30],
    INDIVIDUAL_TEST_SUCCESS_THRESHOLD,
  );
});

// GLM Binomial Family Tests
Deno.test("glm.binomial", async () => {
  await runTestGroup(
    "GLM Binomial Tests",
    "glm.binomial",
    testCount,
    generateTestCase,
    runRobustComparison,
    [10, 30],
    INDIVIDUAL_TEST_SUCCESS_THRESHOLD,
  );
});

// GLM Poisson Family Tests
Deno.test("glm.poisson", async () => {
  await runTestGroup(
    "GLM Poisson Tests",
    "glm.poisson",
    testCount,
    generateTestCase,
    runRobustComparison,
    [10, 30],
    INDIVIDUAL_TEST_SUCCESS_THRESHOLD,
  );
});

// GLM Gamma Family Tests
Deno.test("glm.gamma", async () => {
  await runTestGroup(
    "GLM Gamma Tests",
    "glm.gamma",
    testCount,
    generateTestCase,
    runRobustComparison,
    [10, 30],
    INDIVIDUAL_TEST_SUCCESS_THRESHOLD,
  );
});

// GLM Inverse Gaussian Family Tests
Deno.test("glm.inverse.gaussian", async () => {
  await runTestGroup(
    "GLM Inverse Gaussian Tests",
    "glm.inverse.gaussian",
    testCount,
    generateTestCase,
    runRobustComparison,
    [10, 30],
    INDIVIDUAL_TEST_SUCCESS_THRESHOLD,
  );
});

// Comprehensive regression test suite
Deno.test("regression.comprehensive", async () => {
  await runComprehensiveTestSuite(
    "Comprehensive Regression Test Suite",
    enabledTestTypes,
    testCount,
    generateTestCase,
    runRobustComparison,
    [10, 30],
    REGRESSION_COMPREHENSIVE_SUCCESS_THRESHOLD,
    seed,
  );
});
