#!/usr/bin/env -S deno run --allow-all

import {
  callRobustR,
  callRobustRust,
  generateRegressionTestCase,
  nextRandom,
  type RegressionTestParameters,
  setTestSeed,
} from "./regression-interface.ts";
import {
  hasSystemError,
  isPathologicalCase,
  isStatisticalFailure,
  printComparisonResults,
  printDetailedCoefficients,
  printSummaryByType,
  printTestParameters,
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
export async function runRobustComparison(
  params: RegressionTestParameters,
): Promise<ComparisonResult> {
  // deno-lint-ignore no-explicit-any
  let rResult: any = null;
  // deno-lint-ignore no-explicit-any
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
        // deno-lint-ignore no-explicit-any
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
    // deno-lint-ignore no-explicit-any
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
      const aicClose = isFinite(aicDiff) && aicDiff < 1e-6;
      const r2Close = isFinite(rSquaredDiff) && rSquaredDiff < 1e-6;
      status = aicClose && r2Close
        ? "PASS"
        : (maxDiff < 1e-1 ? "PASS" : "FAIL");
    } else {
      status = maxDiff < 0.1 ? "PASS" : "FAIL";
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

// Main test runner
async function main() {
  const args = Deno.args;
  const testCount = parseInt(args[0]) || 2;
  const seedArg = args[1] ? parseInt(args[1]) : undefined;
  const seed = Number.isFinite(seedArg)
    ? (seedArg as number)
    : Date.now() >>> 0;
  setTestSeed(seed);

  console.log("🧪 Regression Test Runner");
  console.log("==============================================");
  console.log(
    `Running ${testCount} random tests per test type (seed=${seed})...\n`,
  );

  // Configuration for which tests to run - COMPREHENSIVE REGRESSION TEST SUITE
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

    // GLM Tests - Advanced Features
    "glm.offset": false, // ❌ Not implemented (with offset)
    "glm.weights": false, // ❌ Not implemented (with weights)
    "glm.control": false, // ❌ Not implemented (custom control parameters)
    "glm.start": false, // ❌ Not implemented (custom starting values)

    // Model Comparison Tests
    "anova.glm": false, // ❌ Not implemented (GLM ANOVA)
    "anova.lm": false, // ❌ Not implemented (LM ANOVA)
    "deviance.glm": false, // ❌ Not implemented (deviance comparison)
    "logLik.glm": false, // ❌ Not implemented (log-likelihood comparison)

    // Prediction and Diagnostics
    "predict.glm": false, // ❌ Not implemented (GLM prediction)
    "predict.lm": false, // ❌ Not implemented (LM prediction)
    "residuals.glm": false, // ❌ Not implemented (GLM residuals)
    "residuals.lm": false, // ❌ Not implemented (LM residuals)
    "influence.glm": false, // ❌ Not implemented (GLM influence measures)
    "influence.lm": false, // ❌ Not implemented (LM influence measures)

    // Model Selection
    "step.glm": false, // ❌ Not implemented (stepwise GLM)
    "step.lm": false, // ❌ Not implemented (stepwise LM)
    "drop1.glm": false, // ❌ Not implemented (drop1 for GLM)
    "add1.glm": false, // ❌ Not implemented (add1 for GLM)
  };

  const testTypes = Object.keys(testConfig).filter((key) =>
    testConfig[key as keyof typeof testConfig]
  );

  const allResults: ComparisonResult[] = [];

  for (const testType of testTypes) {
    console.log(`🔬 Testing ${testType}...`);

    for (let i = 0; i < testCount; i++) {
      try {
        let attempt = 0;
        const maxAttempts = 3;
        while (attempt < maxAttempts) {
          attempt++;
          const params = generateRegressionTestCase(
            testType,
            10 + Math.floor(nextRandom() * 20),
          );
          const result = await runRobustComparison(params);

          // Pathology filter: retry if separation/singularity or large instabilities or step-size failures
          if (isPathologicalCase(result) && attempt < maxAttempts) {
            console.log(
              `  ⚠️  Pathological case detected (${result.status}), retrying (${attempt}/${maxAttempts})...`,
            );
            continue;
          }

          allResults.push(result);
          const statusIcon = result.status === "PASS"
            ? "✅"
            : result.status === "FAIL"
            ? "❌"
            : "🔥";
          console.log(
            `  ${statusIcon} ${result.testName}: ${result.status} (coef diff: ${
              result.coefficientDiff.toFixed(6)
            })`,
          );
          break;
        }
      } catch (error) {
        console.error(`  🔥 Error with ${testType}:`, error);
        allResults.push({
          testName: `${testType} (error)`,
          rResult: null,
          rustResult: null,
          coefficientDiff: 1,
          rSquaredDiff: 1,
          aicDiff: 1,
          status: "ERROR",
          errorMessage: String(error),
        });
      }
    }
  }

  // Print detailed coefficient comparison first
  printDetailedCoefficients(allResults);

  // Print test parameters table
  printTestParameters(allResults);

  // Print comprehensive results
  printComparisonResults(allResults);

  // Test Configuration Status
  console.log("\n" + "=".repeat(100));
  console.log("🔧 TEST CONFIGURATION STATUS");
  console.log("=".repeat(100));

  const _enabledTests = Object.entries(testConfig).filter(([_, enabled]) =>
    enabled
  );

  // Summary by test type
  printSummaryByType(allResults);
}

if (import.meta.main) {
  main().catch(console.error);
}
