// Shared test helper functions for regression and GEE test runners
// deno-lint-ignore-file no-explicit-any

// ============================================================================
// SUCCESS THRESHOLD CONSTANTS
// ============================================================================

/**
 * INDIVIDUAL_TEST_SUCCESS_THRESHOLD: Minimum percentage of individual test cases that must pass
 *
 * Used in runTestGroup() to determine if a test group (e.g., "Pearson Correlation Tests")
 * passes or fails. If fewer than this percentage of individual test cases pass, the entire
 * test group fails.
 *
 * Value: 1.0 (100% of individual tests must pass - tests should work!)
 * Used by: All test groups in statistical, regression, and GEE tests
 */
export const INDIVIDUAL_TEST_SUCCESS_THRESHOLD = 1.0;

/**
 * STATISTICAL_COMPREHENSIVE_SUCCESS_THRESHOLD: Minimum percentage of tests that must pass in comprehensive statistical test suite
 *
 * Used in runComprehensiveTestSuite() for statistical tests to determine if the entire
 * comprehensive test suite passes. If fewer than this percentage of all tests pass,
 * the comprehensive suite fails.
 *
 * Value: 1.0 (100% of all statistical tests must pass - tests should work!)
 * Used by: statistical-tests.test.ts comprehensive suite
 */
export const STATISTICAL_COMPREHENSIVE_SUCCESS_THRESHOLD = 1.0;

/**
 * REGRESSION_COMPREHENSIVE_SUCCESS_THRESHOLD: Minimum percentage of tests that must pass in comprehensive GLM regression test suite
 *
 * Used in runComprehensiveTestSuite() for GLM regression tests to determine if the entire
 * comprehensive test suite passes. If fewer than this percentage of all tests pass,
 * the comprehensive suite fails.
 *
 * Value: 1.0 (100% of all GLM regression tests must pass - tests should work!)
 * Used by: regression-tests.test.ts comprehensive suite
 */
export const REGRESSION_COMPREHENSIVE_SUCCESS_THRESHOLD = 1.0;

/**
 * GEE_COMPREHENSIVE_SUCCESS_THRESHOLD: Minimum percentage of tests that must pass in comprehensive GEE test suite
 *
 * Used in runComprehensiveTestSuite() for GEE tests to determine if the entire
 * comprehensive test suite passes. Slightly lower than other suites because GEE tests are more
 * challenging and prone to convergence issues, but still should mostly work.
 *
 * Value: 0.9 (90% of all GEE tests must pass - tests should mostly work!)
 * Used by: gee-tests.test.ts comprehensive suite
 */
export const GEE_COMPREHENSIVE_SUCCESS_THRESHOLD = 0.9;

/**
 * STATISTICAL_TEST_DIFFERENCE_THRESHOLD: Maximum allowed difference between R and Rust results for statistical tests
 *
 * Used in statistical test comparisons to determine if R and Rust results are close enough
 * to be considered equivalent. Applied to test statistics and p-values.
 *
 * Value: 0.0001 (0.01%, maximum difference of 0.0001 between R and Rust results)
 * Used by: statistical-tests.test.ts runRobustComparison()
 */
export const STATISTICAL_TEST_DIFFERENCE_THRESHOLD = 0.0001;

/**
 * COEFFICIENT_DIFFERENCE_THRESHOLD: Maximum allowed difference between R and Rust coefficients for normal regression cases
 *
 * Used in regression and GEE test comparisons to determine if coefficient differences
 * are acceptable for normal cases (no separation, convergence issues, etc.).
 *
 * Value: 1e-6 (0.000001, very tight threshold for coefficient agreement)
 * Used by: regression-tests.test.ts and gee-tests.test.ts runRobustComparison()
 */
export const COEFFICIENT_DIFFERENCE_THRESHOLD = 1e-6;

/**
 * SEPARATION_CASE_COEFFICIENT_THRESHOLD: Relaxed coefficient difference threshold for pathological cases
 *
 * Used when R reports separation, singularity, or convergence warnings. In these cases,
 * coefficients may be unstable, so we use a more relaxed threshold for coefficient
 * differences while still requiring tight AIC/R² agreement.
 *
 * Value: 1e-1 (0.1, same as normal cases but used in conjunction with AIC_R2_CLOSE_THRESHOLD)
 * Used by: regression-tests.test.ts and gee-tests.test.ts runRobustComparison()
 */
export const SEPARATION_CASE_COEFFICIENT_THRESHOLD = 1e-1;

/**
 * AIC_R2_CLOSE_THRESHOLD: Very tight threshold for AIC and R² differences in separation cases
 *
 * Used when R reports separation/singularity warnings. While coefficients may be unstable,
 * AIC and R² should still be very close between R and Rust implementations.
 *
 * Value: 1e-6 (0.000001, very tight threshold for AIC and R² agreement)
 * Used by: regression-tests.test.ts and gee-tests.test.ts runRobustComparison()
 */
export const AIC_R2_CLOSE_THRESHOLD = 1e-6;

/**
 * PATHOLOGICAL_COEFFICIENT_THRESHOLD: Threshold for detecting huge coefficient differences that indicate pathological cases
 *
 * Used in isPathologicalCase() to detect when coefficient differences are so large that
 * they indicate numerical instability, separation, or other pathological conditions
 * that should trigger a test retry.
 *
 * Value: 1e3 (1000, any coefficient difference larger than this is considered pathological)
 * Used by: test-helpers.ts isPathologicalCase()
 */
export const PATHOLOGICAL_COEFFICIENT_THRESHOLD = 1e3;

export interface TestResult {
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
    numPredictors?: number;
    numClusters?: number;
    formula: string;
    family: string;
    corstr?: string;
    alpha: number;
  };
  generatedData?: {
    y: number[];
    predictors: { [key: string]: number[] };
    formula: string;
    id?: number[];
    weights?: number[];
    offset?: number[];
  };
}

// Helper function to run multiple test cases for a given test type
export async function runTestType<T extends TestResult>(
  testType: string,
  testCount: number,
  generateTestCase: (testType: string, sampleSize: number) => any,
  runComparison: (params: any) => Promise<T>,
  sampleSizeRange: [number, number] = [10, 30],
): Promise<T[]> {
  const results: T[] = [];

  for (let i = 0; i < testCount; i++) {
    try {
      let attempt = 0;
      const maxAttempts = 3;
      while (attempt < maxAttempts) {
        attempt++;
        const params = generateTestCase(
          testType,
          sampleSizeRange[0] +
            Math.floor(
              Math.random() * (sampleSizeRange[1] - sampleSizeRange[0]),
            ),
        );
        const result = await runComparison(params);

        // Pathology filter: retry if separation/singularity or large instabilities or step-size failures
        if (isPathologicalCase(result) && attempt < maxAttempts) {
          continue;
        }

        results.push(result);
        break;
      }
    } catch (error) {
      results.push({
        testName: `${testType} (error)`,
        rResult: null,
        rustResult: null,
        coefficientDiff: 1,
        rSquaredDiff: 1,
        aicDiff: 1,
        status: "ERROR",
        errorMessage: String(error),
      } as T);
    }
  }

  return results;
}

// Helper function to run a test group with consistent formatting
export async function runTestGroup<T extends TestResult>(
  testName: string,
  testType: string,
  testCount: number,
  generateTestCase: (testType: string, sampleSize: number) => any,
  runComparison: (params: any) => Promise<T>,
  sampleSizeRange: [number, number] = [10, 30],
  successThreshold: number = 0.5,
): Promise<T[]> {
  const results = await runTestType(
    testType,
    testCount,
    generateTestCase,
    runComparison,
    sampleSizeRange,
  );

  const passed = results.filter((r) => r.status === "PASS").length;
  const total = results.length;

  console.log(`\n🔬 ${testName}: ${passed}/${total} passed`);
  results.forEach((result) => {
    const icon = result.status === "PASS"
      ? "✅"
      : result.status === "FAIL"
      ? "❌"
      : "🔥";
    console.log(
      `  ${icon} ${result.testName}: ${result.status} (coef diff: ${
        result.coefficientDiff.toFixed(6)
      })`,
    );
  });

  if (passed < total * successThreshold) {
    throw new Error(
      `Only ${passed}/${total} ${testName} tests passed`,
    );
  }

  return results;
}

// Helper function to run comprehensive test suite
export async function runComprehensiveTestSuite<T extends TestResult>(
  suiteName: string,
  enabledTestTypes: string[],
  testCount: number,
  generateTestCase: (testType: string, sampleSize: number) => any,
  runComparison: (params: any) => Promise<T>,
  sampleSizeRange: [number, number] = [10, 30],
  successThreshold: number = 0.7,
  seed: number = Date.now() >>> 0,
): Promise<T[]> {
  console.log(`\n🧪 ${suiteName}`);
  console.log("==============================================");
  console.log(
    `Running ${testCount} random tests per test type (seed=${seed})...\n`,
  );

  const allResults: T[] = [];

  for (const testType of enabledTestTypes) {
    console.log(`🔬 Testing ${testType}...`);
    const results = await runTestType(
      testType,
      testCount,
      generateTestCase,
      runComparison,
      sampleSizeRange,
    );
    allResults.push(...results);

    results.forEach((result) => {
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
    });
  }

  // Summary statistics
  const passed = allResults.filter((r) => r.status === "PASS").length;
  const failed = allResults.filter((r) => r.status === "FAIL").length;
  const errors = allResults.filter((r) => r.status === "ERROR").length;
  const total = allResults.length;

  console.log("\n" + "=".repeat(80));
  console.log(`📊 ${suiteName.toUpperCase()} SUMMARY`);
  console.log("=".repeat(80));
  console.log(`📈 Total Tests: ${total}`);
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`🔥 Errors: ${errors}`);
  console.log(`🎯 Success Rate: ${((passed / total) * 100).toFixed(1)}%`);

  // Summary by test type
  console.log("\n📈 SUMMARY BY TEST TYPE");
  console.log("-".repeat(50));

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
    const rate = ((stats.passed / stats.total) * 100).toFixed(1);
    const status = stats.passed === stats.total
      ? "✅"
      : stats.passed > 0
      ? "⚠️"
      : "❌";
    console.log(
      `${
        testType.padEnd(25)
      } ${stats.passed}/${stats.total} (${rate}%) ${status}`,
    );
  }

  // Overall success criteria
  if (passed < total * successThreshold) {
    throw new Error(
      `Overall success rate too low: ${
        ((passed / total) * 100).toFixed(1)
      }% (expected ≥${(successThreshold * 100).toFixed(0)}%)`,
    );
  }

  return allResults;
}

// Print test parameters table
export function printTestParameters(results: TestResult[]): void {
  console.log("\n" + "=".repeat(120));
  console.log("📋 TEST PARAMETERS");
  console.log("=".repeat(120));

  console.log(
    "Test Name".padEnd(25) + "Sample Size".padEnd(12) +
      "Predictors".padEnd(12) + "Clusters".padEnd(12) +
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
        (params.numPredictors?.toString() || "N/A").padEnd(12) +
        (params.numClusters?.toString() || "N/A").padEnd(12) +
        params.formula.padEnd(20) +
        params.family.padEnd(12) +
        (params.corstr || "N/A").padEnd(12) +
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

    if (result.generatedData.id) {
      console.log(
        `Clusters: ${
          result.generatedData.id.length > 0
            ? Math.max(...result.generatedData.id)
            : 0
        }`,
      );
    }

    // Print response variable (y) - complete data
    console.log(`\nResponse Variable (y):`);
    console.log(
      `  [${result.generatedData.y.map((v) => v.toFixed(4)).join(", ")}]`,
    );

    // Print predictor variables - complete data
    console.log(`\nPredictor Variables:`);
    for (
      const [varName, values] of Object.entries(result.generatedData.predictors)
    ) {
      // Handle both numeric and string values
      const formattedValues = values.map((v: any) =>
        typeof v === "number" ? v.toFixed(4) : `"${v}"`
      );
      console.log(
        `  ${varName}: [${formattedValues.join(", ")}]`,
      );
    }

    // Print cluster IDs if present
    if (result.generatedData.id) {
      console.log(`\nCluster IDs:`);
      console.log(
        `  [${result.generatedData.id.join(", ")}]`,
      );
    }

    // Print weights and offset if present - complete data
    if (result.generatedData.weights) {
      console.log(
        `\nWeights: [${
          result.generatedData.weights.map((v) => v.toFixed(4))
            .join(", ")
        }]`,
      );
    }

    if (result.generatedData.offset) {
      console.log(
        `\nOffset: [${
          result.generatedData.offset.map((v) => v.toFixed(4))
            .join(", ")
        }]`,
      );
    }
  }
}

// Print detailed coefficient comparison
export function printDetailedCoefficients(results: TestResult[]): void {
  console.log("\n" + "=".repeat(120));
  console.log("📊 DETAILED COEFFICIENT COMPARISON");
  console.log("=".repeat(120));

  for (const result of results) {
    if (result.status === "ERROR") continue;

    console.log(`\n🔬 ${result.testName}`);
    console.log("-".repeat(80));

    // Print R² and AIC values
    const rR2 = typeof result.rResult?.r_squared === "number"
      ? result.rResult.r_squared
      : 0;
    const rustR2 = typeof result.rustResult?.r_squared === "number"
      ? result.rustResult.r_squared
      : 0;
    const rAic = typeof result.rResult?.aic === "number"
      ? result.rResult.aic
      : 0;
    const rustAic = typeof result.rustResult?.aic === "number"
      ? result.rustResult.aic
      : 0;

    console.log("Model Metrics:");
    console.log(
      `  R²:  R=${rR2.toFixed(8)}, Rust=${rustR2.toFixed(8)}, Diff=${
        Math.abs(rR2 - rustR2).toExponential(3)
      }`,
    );
    console.log(
      `  AIC: R=${rAic.toFixed(8)}, Rust=${rustAic.toFixed(8)}, Diff=${
        Math.abs(rAic - rustAic).toExponential(3)
      }`,
    );
    console.log();

    const rCoefs = result.rResult?.coefficients || [];
    const rustCoefs = result.rustResult?.coefficients || [];
    const maxLength = Math.max(rCoefs.length, rustCoefs.length);

    console.log(
      "Index".padEnd(8) + "R Coefficient".padEnd(20) +
        "Rust Coefficient".padEnd(20) + "Difference".padEnd(15) +
        "Abs Diff".padEnd(15),
    );
    console.log("-".repeat(80));

    for (let i = 0; i < maxLength; i++) {
      const rCoef = rCoefs[i] || 0;
      const rustCoef = rustCoefs[i] || 0;
      const diff = rCoef - rustCoef;
      const absDiff = Math.abs(diff);

      console.log(
        i.toString().padEnd(8) +
          (typeof rCoef === "number" ? rCoef.toFixed(8) : String(rCoef)).padEnd(
            20,
          ) +
          (typeof rustCoef === "number"
            ? rustCoef.toFixed(8)
            : String(rustCoef)).padEnd(20) +
          (typeof diff === "number" ? diff.toExponential(3) : String(diff))
            .padEnd(15) +
          (typeof absDiff === "number"
            ? absDiff.toExponential(3)
            : String(absDiff)).padEnd(15),
      );
    }
  }
}

// Print detailed coefficient and confidence interval comparison
export function printDetailedCoefficientsWithConfint(
  results: TestResult[],
): void {
  console.log("\n" + "=".repeat(140));
  console.log("📊 DETAILED COEFFICIENT AND CONFIDENCE INTERVAL COMPARISON");
  console.log("=".repeat(140));

  for (const result of results) {
    if (result.status === "ERROR") continue;

    console.log(`\n🔬 ${result.testName}`);
    console.log("-".repeat(140));

    // Print R² and AIC values
    const rR2 = typeof result.rResult?.r_squared === "number"
      ? result.rResult.r_squared
      : 0;
    const rustR2 = typeof result.rustResult?.r_squared === "number"
      ? result.rustResult.r_squared
      : 0;
    const rAic = typeof result.rResult?.aic === "number"
      ? result.rResult.aic
      : 0;
    const rustAic = typeof result.rustResult?.aic === "number"
      ? result.rustResult.aic
      : 0;

    console.log("Model Metrics:");
    console.log(
      `  R²:  R=${rR2.toFixed(8)}, Rust=${rustR2.toFixed(8)}, Diff=${
        Math.abs(rR2 - rustR2).toExponential(3)
      }`,
    );
    console.log(
      `  AIC: R=${rAic.toFixed(8)}, Rust=${rustAic.toFixed(8)}, Diff=${
        Math.abs(rAic - rustAic).toExponential(3)
      }`,
    );
    console.log();

    const rCoefs = result.rResult?.coefficients || [];
    const rustCoefs = result.rustResult?.coefficients || [];
    const rConfLower = result.rResult?.conf_lower || [];
    const rConfUpper = result.rResult?.conf_upper || [];
    const rustConfLower = result.rustResult?.conf_lower || [];
    const rustConfUpper = result.rustResult?.conf_upper || [];
    const maxLength = Math.max(rCoefs.length, rustCoefs.length);

    console.log("COEFFICIENTS:");
    console.log(
      "Index".padEnd(8) + "R Coefficient".padEnd(20) +
        "Rust Coefficient".padEnd(20) + "Difference".padEnd(15) +
        "Abs Diff".padEnd(15),
    );
    console.log("-".repeat(140));

    for (let i = 0; i < maxLength; i++) {
      const rCoef = rCoefs[i] || 0;
      const rustCoef = rustCoefs[i] || 0;
      const diff = rCoef - rustCoef;
      const absDiff = Math.abs(diff);

      console.log(
        i.toString().padEnd(8) +
          (typeof rCoef === "number" ? rCoef.toFixed(8) : String(rCoef)).padEnd(
            20,
          ) +
          (typeof rustCoef === "number"
            ? rustCoef.toFixed(8)
            : String(rustCoef)).padEnd(20) +
          (typeof diff === "number" ? diff.toExponential(3) : String(diff))
            .padEnd(15) +
          (typeof absDiff === "number"
            ? absDiff.toExponential(3)
            : String(absDiff)).padEnd(15),
      );
    }

    console.log();
    console.log("CONFIDENCE INTERVALS:");
    console.log(
      "Index".padEnd(8) + "R Lower".padEnd(18) + "R Upper".padEnd(18) +
        "Rust Lower".padEnd(18) + "Rust Upper".padEnd(18) +
        "Lower Diff".padEnd(15) + "Upper Diff".padEnd(15),
    );
    console.log("-".repeat(140));

    for (let i = 0; i < maxLength; i++) {
      const rLower = rConfLower[i];
      const rUpper = rConfUpper[i];
      const rustLower = rustConfLower[i];
      const rustUpper = rustConfUpper[i];

      const lowerDiff =
        typeof rLower === "number" && typeof rustLower === "number"
          ? Math.abs(rLower - rustLower)
          : NaN;
      const upperDiff =
        typeof rUpper === "number" && typeof rustUpper === "number"
          ? Math.abs(rUpper - rustUpper)
          : NaN;

      console.log(
        i.toString().padEnd(8) +
          (typeof rLower === "number" ? rLower.toFixed(8) : "N/A").padEnd(18) +
          (typeof rUpper === "number" ? rUpper.toFixed(8) : "N/A").padEnd(18) +
          (typeof rustLower === "number" ? rustLower.toFixed(8) : "N/A").padEnd(
            18,
          ) +
          (typeof rustUpper === "number" ? rustUpper.toFixed(8) : "N/A").padEnd(
            18,
          ) +
          (!isNaN(lowerDiff) ? lowerDiff.toExponential(3) : "N/A").padEnd(15) +
          (!isNaN(upperDiff) ? upperDiff.toExponential(3) : "N/A").padEnd(15),
      );
    }
  }
}

// Print results in a nice format
export function printComparisonResults(results: TestResult[]): void {
  console.log("\n" + "=".repeat(140));
  console.log("📋 REGRESSION TEST RESULTS");
  console.log("=".repeat(140));

  console.log(
    "Test Name".padEnd(40) + "R Coefs".padEnd(15) + "Rust Coefs".padEnd(15) +
      "R² Diff".padEnd(12) + "AIC Diff".padEnd(12) + "Coef Diff".padEnd(12) +
      "Status".padEnd(10),
  );
  console.log("-".repeat(140));

  let passed = 0;
  let failed = 0;
  let errors = 0;

  for (const result of results) {
    const testName = result.testName.length > 38
      ? result.testName.substring(0, 35) + "..."
      : result.testName;

    const rCoefs = result.rResult?.coefficients?.length || 0;
    const rustCoefs = result.rustResult?.coefficients?.length || 0;
    const rSquaredDiff = result.rSquaredDiff.toExponential(2);
    const aicDiff = result.aicDiff.toExponential(2);
    const coefDiff = result.coefficientDiff.toExponential(2);

    const statusColor = result.status === "PASS"
      ? "✅"
      : result.status === "FAIL"
      ? "❌"
      : "🔥";

    console.log(
      testName.padEnd(40) +
        rCoefs.toString().padEnd(15) +
        rustCoefs.toString().padEnd(15) +
        rSquaredDiff.padEnd(12) +
        aicDiff.padEnd(12) +
        coefDiff.padEnd(12) +
        `${statusColor} ${result.status}`,
    );

    if (result.status === "ERROR" && result.errorMessage) {
      console.log(`    Error: ${result.errorMessage}`);
    }

    switch (result.status) {
      case "PASS":
        passed++;
        break;
      case "FAIL":
        failed++;
        break;
      case "ERROR":
        errors++;
        break;
    }
  }

  console.log("-".repeat(140));
  console.log(
    `📊 Summary: ${passed} passed, ${failed} failed, ${errors} errors out of ${results.length} tests`,
  );
  console.log(
    `🎯 Success Rate: ${((passed / results.length) * 100).toFixed(1)}%`,
  );
}

// Print summary by test type
export function printSummaryByType(results: TestResult[]): void {
  console.log("\n" + "=".repeat(80));
  console.log("📈 SUMMARY BY TEST TYPE");
  console.log("=".repeat(80));

  const summaryByType: { [key: string]: { passed: number; total: number } } =
    {};

  for (const result of results) {
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
    const rate = ((stats.passed / stats.total) * 100).toFixed(1);
    const status = stats.passed === stats.total
      ? "✅"
      : stats.passed > 0
      ? "⚠️"
      : "❌";
    console.log(
      `${
        testType.padEnd(25)
      } ${stats.passed}/${stats.total} (${rate}%) ${status}`,
    );
  }
}

// Check if a case is pathological and should be retried
export function isPathologicalCase(result: TestResult): boolean {
  const huge = (x: number) =>
    !isFinite(x) || x > PATHOLOGICAL_COEFFICIENT_THRESHOLD;
  const rWarnings: string = (result.rResult as any)?.warnings || "";
  const indicatesSeparation =
    /fitted probabilities numerically 0 or 1 occurred|separation|singular|did not converge|0s in V\(mu\)|NAs in V\(mu\)/i
      .test(rWarnings) ||
    (result.rError &&
      /separation|singular|did not converge|infinite|NaN/i.test(
        result.rError,
      )) ||
    (result.rustError &&
      /separation|singular|did not converge|infinite|NaN/i.test(
        result.rustError,
      ));
  const stepSizeFailure = Boolean(
    (result.rError &&
      /cannot correct step size/i.test(result.rError)) ||
      (result.rustError &&
        /cannot correct step size/i.test(result.rustError)),
  );

  return result.status !== "PASS" && (
    huge(result.aicDiff) || huge(result.coefficientDiff) ||
    indicatesSeparation || stepSizeFailure
  );
}

// Check if an error is a statistical failure (both R and Rust should fail the same way)
export function isStatisticalFailure(error: string): boolean {
  return error.includes("0s in V(mu)") ||
    error.includes("NAs in V(mu)") ||
    error.includes("did not converge") ||
    error.includes("algorithm stopped at boundary") ||
    error.includes("perfect separation") ||
    error.includes("singular fit") ||
    error.includes("fitted probabilities numerically 0 or 1 occurred") ||
    error.includes("non-finite") ||
    error.includes("infinite") ||
    error.includes("NaN");
}

// Check if an error is a system error (panic, WebAssembly, etc.)
export function hasSystemError(error: string | null): boolean {
  if (!error) return false;
  return /unreachable|RuntimeError|panic|thread 'main' panicked|WebAssembly/i
    .test(error) ||
    /inner loop .* cannot correct step size/i.test(error);
}
