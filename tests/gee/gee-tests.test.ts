#!/usr/bin/env -S deno test --allow-all

// deno-lint-ignore-file no-explicit-any
import {
  callRobustR,
  callRobustRust,
  type GeeglmTestParameters,
  generateGeeglmTestCase,
  setTestSeed,
} from "./gee-interface.ts";
import {
  AIC_R2_CLOSE_THRESHOLD,
  COEFFICIENT_DIFFERENCE_THRESHOLD,
  GEE_COMPREHENSIVE_SUCCESS_THRESHOLD,
  hasSystemError,
  INDIVIDUAL_TEST_SUCCESS_THRESHOLD,
  isStatisticalFailure,
  runComprehensiveTestSuite,
  runTestGroup,
  SEPARATION_CASE_COEFFICIENT_THRESHOLD,
  type TestResult,
} from "../test-helpers.ts";

interface ComparisonResult extends TestResult {
  testParams?: {
    sampleSize: number;
    numClusters: number;
    formula: string;
    family: string;
    corstr: string;
    alpha: number;
  };
  generatedData?: {
    y: number[];
    predictors: { [key: string]: number[] };
    formula: string;
    id: number[];
    weights?: number[];
    offset?: number[];
  };
}

// Run comparison using robust interface
async function runRobustComparison(
  params: GeeglmTestParameters,
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
    id: params.data?.id || [],
    weights: params.data?.weights,
    offset: params.data?.offset,
  };

  // Extract predictor variables
  if (params.data) {
    Object.keys(params.data).forEach((key) => {
      if (
        key !== "y" && key !== "id" && key !== "waves" && key !== "formula" &&
        key !== "weights" && key !== "offset"
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

    return {
      testName: `${params.testType} (${params.options?.family || "default"})`,
      rResult,
      rustResult,
      coefficientDiff,
      rSquaredDiff,
      aicDiff,
      status,
      testParams: {
        sampleSize: generatedData.y.length,
        numClusters: generatedData.id.length > 0
          ? Math.max(...generatedData.id)
          : 0,
        formula: generatedData.formula,
        family: params.options?.family || "default",
        corstr: params.options?.corstr || "independence",
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
      return {
        testName: `${params.testType} (${params.options?.family || "default"})`,
        rResult: null,
        rustResult: null,
        coefficientDiff: 0,
        rSquaredDiff: 0,
        aicDiff: 0,
        status: "PASS",
        testParams: {
          sampleSize: generatedData.y.length,
          numClusters: generatedData.id.length > 0
            ? Math.max(...generatedData.id)
            : 0,
          formula: generatedData.formula,
          family: params.options?.family || "default",
          corstr: params.options?.corstr || "independence",
          alpha: params.options?.alpha || 0.05,
        },
        rError: rError || undefined,
        rustError: rustError || undefined,
        generatedData,
      };
    }
  }

  // Case 3: Different outcomes (one succeeded, one failed, or different error types)
  const status = (hasSystemError(rError) || hasSystemError(rustError))
    ? "ERROR"
    : "FAIL";

  return {
    testName: `${params.testType} (${params.options?.family || "default"})`,
    rResult: null,
    rustResult: null,
    coefficientDiff: 0,
    rSquaredDiff: 0,
    aicDiff: 0,
    status,
    errorMessage: "Both R and Rust failed",
    rError: rError || "Unknown R error",
    rustError: rustError || "Unknown Rust error",
    testParams: {
      sampleSize: generatedData.y.length,
      numClusters: generatedData.id.length > 0
        ? Math.max(...generatedData.id)
        : 0,
      formula: generatedData.formula,
      family: params.options?.family || "default",
      corstr: params.options?.corstr || "independence",
      alpha: params.options?.alpha || 0.05,
    },
    generatedData,
  };
}

// Test configuration - only enabled tests
const testConfig = {
  // GEE Tests - Gaussian Family
  "geeglm.gaussian.identity.independence": true,
  "geeglm.gaussian.identity.exchangeable": true,
  "geeglm.gaussian.log.independence": true,

  // GEE Tests - Binomial Family
  "geeglm.binomial.logit.independence": true,
  "geeglm.binomial.probit.independence": true,
  "geeglm.binomial.logit.exchangeable": true,

  // GEE Tests - Poisson Family
  "geeglm.poisson.log.independence": true,
  "geeglm.poisson.log.ar1": true,
  "geeglm.poisson.identity.independence": true,
};

// Get enabled test types
const enabledTestTypes = Object.keys(testConfig).filter((key) =>
  testConfig[key as keyof typeof testConfig]
);

// Test parameters
const testCount = 2; // Number of random tests per type
const seed = 12345;

// Set seed for reproducibility
setTestSeed(seed);

// Helper function to generate test case with proper random sampling
function generateTestCase(testType: string, sampleSize: number) {
  return generateGeeglmTestCase(testType, sampleSize);
}

// GEE Gaussian Family Tests
Deno.test("gee.gaussian.independence", async () => {
  await runTestGroup(
    "GEE Gaussian Independence Tests",
    "geeglm.gaussian.identity.independence",
    testCount,
    generateTestCase,
    runRobustComparison,
    [20, 50],
    INDIVIDUAL_TEST_SUCCESS_THRESHOLD,
  );
});

Deno.test("gee.gaussian.exchangeable", async () => {
  await runTestGroup(
    "GEE Gaussian Exchangeable Tests",
    "geeglm.gaussian.identity.exchangeable",
    testCount,
    generateTestCase,
    runRobustComparison,
    [20, 50],
    INDIVIDUAL_TEST_SUCCESS_THRESHOLD,
  );
});

// GEE Binomial Family Tests
Deno.test("gee.binomial.logit.independence", async () => {
  await runTestGroup(
    "GEE Binomial Logit Independence Tests",
    "geeglm.binomial.logit.independence",
    testCount,
    generateTestCase,
    runRobustComparison,
    [20, 50],
    INDIVIDUAL_TEST_SUCCESS_THRESHOLD,
  );
});

// GEE Poisson Family Tests
Deno.test("gee.poisson.log.independence", async () => {
  await runTestGroup(
    "GEE Poisson Log Independence Tests",
    "geeglm.poisson.log.independence",
    testCount,
    generateTestCase,
    runRobustComparison,
    [20, 50],
    INDIVIDUAL_TEST_SUCCESS_THRESHOLD,
  );
});

// Comprehensive GEE test suite
Deno.test("gee.comprehensive", async () => {
  await runComprehensiveTestSuite(
    "Comprehensive GEE Test Suite",
    enabledTestTypes,
    testCount,
    generateTestCase,
    runRobustComparison,
    [20, 50],
    GEE_COMPREHENSIVE_SUCCESS_THRESHOLD,
    seed,
  );
});
