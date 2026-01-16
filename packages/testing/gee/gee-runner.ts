#!/usr/bin/env -S deno run --allow-all

// deno-lint-ignore-file no-explicit-any
import {
  callRobustR,
  callRobustRust,
  type GeeglmTestParameters,
  generateGeeglmTestCase,
  nextRandom,
  setTestSeed,
} from "./gee-interface.ts";
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
export async function runRobustComparison(
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
      const aicClose = isFinite(aicDiff) && aicDiff < 1e-6;
      const r2Close = isFinite(rSquaredDiff) && rSquaredDiff < 1e-6;
      status = aicClose && r2Close
        ? "PASS"
        : (maxDiff < 1e-1 ? "PASS" : "FAIL");
    } else {
      status = maxDiff < 0.1 ? "PASS" : "FAIL";
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

// Main test suite
export async function runGeeglmTestSuite(): Promise<ComparisonResult[]> {
  console.log("🚀 Starting GEE Test Suite");
  console.log("=".repeat(50));

  const seed = 12345;
  setTestSeed(seed);
  const testCount = 2; // Number of random tests per test type

  console.log(
    `Running ${testCount} random tests per test type (seed=${seed})...\n`,
  );

  // Configuration for which tests to run - GEE TEST SUITE
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
          const params = generateGeeglmTestCase(
            testType,
            20 + Math.floor(nextRandom() * 30), // 20-50 sample size
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

  // Summary
  console.log("\n" + "=".repeat(100));
  console.log("📈 GEE TEST SUITE SUMMARY");
  console.log("=".repeat(100));

  const passCount = allResults.filter((r) => r.status === "PASS").length;
  const failCount = allResults.filter((r) => r.status === "FAIL").length;
  const errorCount = allResults.filter((r) => r.status === "ERROR").length;

  console.log(`✅ PASS: ${passCount}`);
  console.log(`❌ FAIL: ${failCount}`);
  console.log(`💥 ERROR: ${errorCount}`);
  console.log(`📊 Total: ${allResults.length}`);

  // Test Configuration Status
  console.log("\n" + "=".repeat(100));
  console.log("🔧 TEST CONFIGURATION STATUS");
  console.log("=".repeat(100));

  // Summary by test type
  printSummaryByType(allResults);

  if (passCount === allResults.length) {
    console.log("\n🎉 All tests passed!");
  } else {
    console.log("\n⚠️  Some tests failed or errored");
  }

  return allResults;
}

// Main execution
if (import.meta.main) {
  try {
    const results = await runGeeglmTestSuite();

    // Exit with error code if any tests failed
    const hasFailures = results.some((r) =>
      r.status === "FAIL" || r.status === "ERROR"
    );
    if (hasFailures) {
      Deno.exit(1);
    }
  } catch (error) {
    console.error("Test suite failed:", error);
    Deno.exit(1);
  }
}
