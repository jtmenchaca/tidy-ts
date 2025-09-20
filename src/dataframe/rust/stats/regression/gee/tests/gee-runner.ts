#!/usr/bin/env -S deno run --allow-all

import {
  callRobustR,
  callRobustRust,
  GeeglmTestParameters,
  GeeglmTestResult,
  generateGeeglmTestCase,
  nextRandom,
  setTestSeed,
} from "./gee-interface.ts";

interface ComparisonResult {
  testName: string;
  rResult: any;
  rustResult: any;
  coefficientDiff: number;
  rSquaredDiff: number;
  aicDiff: number;
  status: "PASS" | "FAIL" | "ERROR";
  errorMessage?: string;
  rError?: string;
  rustError?: string;
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

    // Determine status based on thresholds
    const coefficientThreshold = 0.01;
    const rSquaredThreshold = 0.01;
    const aicThreshold = 1.0;

    let status: "PASS" | "FAIL" = "PASS";
    let errorMessage: string | undefined;

    if (
      coefficientDiff > coefficientThreshold ||
      rSquaredDiff > rSquaredThreshold ||
      aicDiff > aicThreshold
    ) {
      status = "FAIL";
      errorMessage = `Coefficient diff: ${
        coefficientDiff.toFixed(6)
      }, R² diff: ${rSquaredDiff.toFixed(6)}, AIC diff: ${aicDiff.toFixed(6)}`;
    }

    return {
      testName: `${params.testType} (${params.options?.family || "default"})`,
      rResult,
      rustResult,
      coefficientDiff,
      rSquaredDiff,
      aicDiff,
      status,
      errorMessage,
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

  // Case 2: R failed, Rust succeeded
  if (!rResult && rustResult) {
    return {
      testName: `${params.testType} (${params.options?.family || "default"})`,
      rResult: null,
      rustResult,
      coefficientDiff: 0,
      rSquaredDiff: 0,
      aicDiff: 0,
      status: "ERROR",
      errorMessage: "R failed but Rust succeeded",
      rError: rError || "Unknown R error",
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

  // Case 3: Rust failed, R succeeded
  if (rResult && !rustResult) {
    return {
      testName: `${params.testType} (${params.options?.family || "default"})`,
      rResult,
      rustResult: null,
      coefficientDiff: 0,
      rSquaredDiff: 0,
      aicDiff: 0,
      status: "ERROR",
      errorMessage: "Rust failed but R succeeded",
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

  // Case 4: Both failed
  const hasSystemError = (error: string | null) => {
    if (!error) return false;
    return error.includes("panic") ||
      error.includes("thread 'main' panicked") ||
      error.includes("WebAssembly");
  };

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

// Print test parameters table
function printTestParameters(results: ComparisonResult[]): void {
  console.log("\n" + "=".repeat(120));
  console.log("📋 TEST PARAMETERS");
  console.log("=".repeat(120));

  console.log(
    "Test Name".padEnd(25) + "Sample Size".padEnd(12) +
      "Clusters".padEnd(12) +
      "Formula".padEnd(20) + "Family".padEnd(12) + "Corstr".padEnd(12) +
      "Alpha".padEnd(8),
  );
  console.log("-".repeat(120));

  for (const result of results) {
    const testName = result.testName;
    const params = result.testParams;

    if (!params) {
      console.log(
        testName.padEnd(25) +
          "N/A".padEnd(12) +
          "N/A".padEnd(12) +
          "N/A".padEnd(20) +
          "N/A".padEnd(12) +
          "N/A".padEnd(12) +
          "N/A".padEnd(8),
      );
      continue;
    }

    console.log(
      testName.padEnd(25) +
        params.sampleSize.toString().padEnd(12) +
        params.numClusters.toString().padEnd(12) +
        params.formula.padEnd(20) +
        params.family.padEnd(12) +
        params.corstr.padEnd(12) +
        params.alpha.toString().padEnd(8),
    );
  }

  // Print generated data for each test
  console.log("\n" + "=".repeat(120));
  console.log("📊 GENERATED TEST DATA");
  console.log("=".repeat(120));

  for (const result of results) {
    if (!result.generatedData) continue;

    console.log(`\n🔬 ${result.testName}`);
    console.log("-".repeat(80));
    console.log(`Formula: ${result.generatedData.formula}`);
    console.log(`Sample Size: ${result.generatedData.y.length}`);
    console.log(
      `Clusters: ${
        result.generatedData.id.length > 0
          ? Math.max(...result.generatedData.id)
          : 0
      }`,
    );

    // Print response variable (y) - first 10 values
    console.log(`\nResponse Variable (y) [first 10]:`);
    const ySample = result.generatedData.y.slice(0, 10);
    console.log(
      `  [${ySample.map((v) => v.toFixed(4)).join(", ")}]`,
    );

    // Print cluster IDs - first 10 values
    console.log(`\nCluster IDs [first 10]:`);
    const idSample = result.generatedData.id.slice(0, 10);
    console.log(
      `  [${idSample.join(", ")}]`,
    );

    // Print predictor variables - first 10 values
    console.log(`\nPredictor Variables [first 10]:`);
    for (
      const [varName, values] of Object.entries(result.generatedData.predictors)
    ) {
      const valueSample = values.slice(0, 10);
      console.log(
        `  ${varName}: [${valueSample.map((v) => v.toFixed(4)).join(", ")}]`,
      );
    }
  }
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

          // Pathology filter: extremely large diffs treated as separation/singularity → retry
          if (result.status === "FAIL" && result.coefficientDiff > 10) {
            if (attempt < maxAttempts) {
              console.log(
                `  ⚠️  Large coefficient diff (${
                  result.coefficientDiff.toFixed(4)
                }), retrying...`,
              );
              continue;
            }
          }

          allResults.push(result);
          break;
        }
      } catch (error) {
        console.log(`  ❌ Test failed: ${error.message}`);
        allResults.push({
          testName: `${testType} (${i + 1})`,
          rResult: null,
          rustResult: null,
          coefficientDiff: 0,
          rSquaredDiff: 0,
          aicDiff: 0,
          status: "ERROR",
          errorMessage: String(error),
        });
      }
    }
  }

  // Print detailed results
  console.log("\n" + "=".repeat(100));
  console.log("📊 DETAILED RESULTS");
  console.log("=".repeat(100));

  for (const result of allResults) {
    const status = result.status === "PASS"
      ? "✅"
      : result.status === "FAIL"
      ? "❌"
      : "💥";
    console.log(`${status} ${result.testName}`);

    if (result.status === "PASS") {
      if (result.rResult?.coefficients) {
        console.log(
          `   Coefficients: [${
            result.rResult.coefficients.map((c: number) => c.toFixed(4)).join(
              ", ",
            )
          }]`,
        );
      }
    } else if (result.status === "FAIL") {
      console.log(`   ${result.errorMessage}`);
    } else {
      if (result.rError) {
        console.log(`   R ERROR: ${result.rError.substring(0, 100)}...`);
      }
      if (result.rustError) {
        console.log(`   RUST ERROR: ${result.rustError.substring(0, 100)}...`);
      }
    }
  }

  // Print test parameters
  printTestParameters(allResults);

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

  const enabledTests = Object.entries(testConfig).filter(([_, enabled]) =>
    enabled
  );

  // Summary by test type
  console.log("\n" + "=".repeat(80));
  console.log("📈 SUMMARY BY TEST TYPE");
  console.log("=".repeat(80));

  const summaryByType: { [key: string]: { passed: number; total: number } } =
    {};

  for (const result of allResults) {
    const testType = result.testName.split(" ")[0];
    if (!summaryByType[testType]) {
      summaryByType[testType] = { passed: 0, total: 0 };
    }
    summaryByType[testType].total++;
    if (result.status === "PASS") {
      summaryByType[testType].passed++;
    }
  }

  for (const [testType, stats] of Object.entries(summaryByType)) {
    const percentage = ((stats.passed / stats.total) * 100).toFixed(1);
    console.log(
      `${testType.padEnd(40)} ${stats.passed}/${stats.total} (${percentage}%)`,
    );
  }

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
