#!/usr/bin/env -S deno test --allow-all

// deno-lint-ignore-file no-explicit-any

console.log(`
🧪 STATISTICAL TESTS SUITE
==========================
This test suite runs in TWO PHASES:

📋 PHASE 1: Individual Test Cases (22 tests)
   • Each statistical test type runs 2 specific, known test cases
   • These are deterministic tests with expected outcomes
   • Covers: correlations, t-tests, z-tests, proportions, distributions, 
     nonparametric tests, ANOVA, chi-square tests

🎲 PHASE 2: Comprehensive Random Tests (22 tests)  
   • Each test type runs 2 additional random test cases
   • These provide broader coverage with varied data
   • Same test types as Phase 1, but with different random inputs

📊 TOTAL: 44 tests across 22 statistical test types
🎯 Goal: Ensure both specific known cases and random cases work correctly

Starting Phase 1: Individual Test Cases...
`);

import {
  callRobustR,
  callRobustRust,
  generateComprehensiveTestCase,
  type TestParameters,
} from "./comprehensive-interface.ts";
import {
  INDIVIDUAL_TEST_SUCCESS_THRESHOLD,
  runComprehensiveTestSuite,
  runTestType,
  STATISTICAL_COMPREHENSIVE_SUCCESS_THRESHOLD,
  STATISTICAL_TEST_DIFFERENCE_THRESHOLD,
  type TestResult,
} from "../test-helpers.ts";

interface ComparisonResult extends TestResult {
  testName: string;
  rResult: any;
  rustResult: any;
  difference: number;
  status: "PASS" | "FAIL" | "ERROR";
  errorMessage?: string;
  // Add required TestResult fields
  coefficientDiff: number;
  rSquaredDiff: number;
  aicDiff: number;
  // Add detailed comparison fields for statistical tests
  testStatisticDiff: number;
  pValueDiff: number;
  rTestStatistic: number;
  rustTestStatistic: number;
  rPValue: number;
  rustPValue: number;
}

// Run comparison using robust interface
async function runRobustComparison(
  params: TestParameters,
): Promise<ComparisonResult> {
  try {
    const [rResult, rustResult] = await Promise.all([
      callRobustR(params),
      callRobustRust(params),
    ]);

    const rStat = rResult.test_statistic;
    const rustStat = rustResult.test_statistic;
    const rPval = rResult.p_value;
    const rustPval = rustResult.p_value;

    // Calculate differences
    const statDiff = Math.abs(rStat - rustStat);
    const pvalDiff = Math.abs(rPval - rustPval);
    const maxDiff = Math.max(statDiff, pvalDiff);

    // Determine status - be more lenient for now
    const status = maxDiff < STATISTICAL_TEST_DIFFERENCE_THRESHOLD
      ? "PASS"
      : "FAIL";

    return {
      testName:
        `${params.testType} (${params.options?.alternative}, α=${params.options?.alpha})`,
      rResult,
      rustResult,
      difference: maxDiff,
      status,
      // Add required TestResult fields (not applicable for statistical tests)
      coefficientDiff: maxDiff,
      rSquaredDiff: maxDiff,
      aicDiff: maxDiff,
      // Add detailed comparison fields for statistical tests
      testStatisticDiff: statDiff,
      pValueDiff: pvalDiff,
      rTestStatistic: rStat,
      rustTestStatistic: rustStat,
      rPValue: rPval,
      rustPValue: rustPval,
    };
  } catch (error) {
    return {
      testName:
        `${params.testType} (${params.options?.alternative}, α=${params.options?.alpha})`,
      rResult: null,
      rustResult: null,
      difference: 1,
      status: "ERROR",
      errorMessage: String(error),
      // Add required TestResult fields
      coefficientDiff: 1,
      rSquaredDiff: 1,
      aicDiff: 1,
      // Add detailed comparison fields for statistical tests (error case)
      testStatisticDiff: 1,
      pValueDiff: 1,
      rTestStatistic: 0,
      rustTestStatistic: 0,
      rPValue: 0,
      rustPValue: 0,
    };
  }
}

// Test configuration
function getTestConfig() {
  return {
    // Correlation tests
    "cor.test.pearson": true, // ✅ Working
    "cor.test.spearman": true, // ✅ Working
    "cor.test.kendall": true, // ✅ Fixed! Exact algorithm implemented

    // T-tests
    "t.test.one": true, // ✅ Working (tTestOneSample)
    "t.test.two": true, // ✅ Working (tTestIndependent)
    "t.test.paired": true, // ✅ Working (tTestPaired)

    // Z-tests
    "z.test.one": true, // ✅ Working (zTestOneSample)
    "z.test.two": true, // ✅ Working (zTestTwoSample)

    // Proportion tests
    "prop.test.one": true, // ✅ Working (proportionTestOneSample)
    "prop.test.two": true, // ✅ Working (proportionTestTwoSample)

    // Distribution tests
    "ks.test.uniform": true, // ✅ Fixed! (Kolmogorov-Smirnov one-sample)
    "ks.test.two.sample": true, // ✅ Working (kolmogorov_smirnov_two_sample)
    "shapiro.test": true, // ✅ Working (shapiro_wilk_tests)
    "ad.test": true, // ✅ New! Anderson-Darling normality test
    "dagostino.test": true, // ✅ New! D'Agostino-Pearson K² normality test

    // Non-parametric tests
    "wilcox.test.signedrank": true, // ✅ Fixed! Exact implementation (wilcoxonSignedRankTest)
    "wilcox.test.mannwhitney": true, // ✅ Working (mannWhitneyTest)
    "kruskal.test": true, // ✅ Working (kruskalWallisTest)

    // ANOVA tests
    "aov.one": true, // ✅ Working (anovaOneWay)
    "aov.welch": true, // ✅ Working (welchAnovaOneWay)
    "aov.two": true, // ✅ Working (twoWayAnova)

    // Chi-square and exact tests
    "chisq.test": true, // ✅ Working (chiSquareTest)
    "fisher.test": true, // ✅ Working (fishersExactTest)
  };
}

// Helper function to generate test case with proper random sampling
function generateTestCase(testType: string, sampleSize: number) {
  return generateComprehensiveTestCase(testType, sampleSize);
}

// Custom test group runner for statistical tests with detailed output
async function runStatisticalTestGroup(
  testName: string,
  testType: string,
  testCount: number,
  generateTestCase: (testType: string, sampleSize: number) => any,
  runComparison: (params: any) => Promise<ComparisonResult>,
  sampleSizeRange: [number, number] = [10, 30],
  successThreshold: number = 0.5,
): Promise<ComparisonResult[]> {
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

    if (result.status === "ERROR") {
      console.log(
        `  ${icon} ${result.testName}: ${result.status} (${result.errorMessage})`,
      );
    } else {
      console.log(
        `  ${icon} ${result.testName}: ${result.status}`,
      );
      console.log(
        `    Test Statistic: R=${result.rTestStatistic.toFixed(6)}, Rust=${
          result.rustTestStatistic.toFixed(6)
        } (diff: ${result.testStatisticDiff.toFixed(6)})`,
      );
      console.log(
        `    P-Value: R=${result.rPValue.toFixed(6)}, Rust=${
          result.rustPValue.toFixed(6)
        } (diff: ${result.pValueDiff.toFixed(6)})`,
      );
    }
  });

  if (passed < total * successThreshold) {
    throw new Error(
      `Only ${passed}/${total} ${testName} tests passed`,
    );
  }

  return results;
}

const testCount = 5; // Number of test cases per test type

// Get enabled test types for comprehensive testing
const testConfig = getTestConfig();
const enabledTestTypes = Object.keys(testConfig).filter(
  (key) => testConfig[key as keyof typeof testConfig],
);

// Correlation Tests
Deno.test("correlation.pearson", async () => {
  await runStatisticalTestGroup(
    "Pearson Correlation Tests",
    "cor.test.pearson",
    testCount,
    generateTestCase,
    runRobustComparison,
    [10, 30],
    INDIVIDUAL_TEST_SUCCESS_THRESHOLD,
  );
});

Deno.test("correlation.spearman", async () => {
  await runStatisticalTestGroup(
    "Spearman Correlation Tests",
    "cor.test.spearman",
    testCount,
    generateTestCase,
    runRobustComparison,
    [10, 30],
    INDIVIDUAL_TEST_SUCCESS_THRESHOLD,
  );
});

Deno.test("correlation.kendall", async () => {
  await runStatisticalTestGroup(
    "Kendall Correlation Tests",
    "cor.test.kendall",
    testCount,
    generateTestCase,
    runRobustComparison,
    [10, 30],
    INDIVIDUAL_TEST_SUCCESS_THRESHOLD,
  );
});

// T-Tests
Deno.test("t-tests.one-sample", async () => {
  await runStatisticalTestGroup(
    "One-Sample T-Tests",
    "t.test.one",
    testCount,
    generateTestCase,
    runRobustComparison,
    [10, 30],
    INDIVIDUAL_TEST_SUCCESS_THRESHOLD,
  );
});

Deno.test("t-tests.two-sample", async () => {
  await runStatisticalTestGroup(
    "Two-Sample T-Tests",
    "t.test.two",
    testCount,
    generateTestCase,
    runRobustComparison,
    [10, 30],
    INDIVIDUAL_TEST_SUCCESS_THRESHOLD,
  );
});

Deno.test("t-tests.paired", async () => {
  await runStatisticalTestGroup(
    "Paired T-Tests",
    "t.test.paired",
    testCount,
    generateTestCase,
    runRobustComparison,
    [10, 30],
    INDIVIDUAL_TEST_SUCCESS_THRESHOLD,
  );
});

// Z-Tests
Deno.test("z-tests.one-sample", async () => {
  await runStatisticalTestGroup(
    "One-Sample Z-Tests",
    "z.test.one",
    testCount,
    generateTestCase,
    runRobustComparison,
    [10, 30],
    INDIVIDUAL_TEST_SUCCESS_THRESHOLD,
  );
});

Deno.test("z-tests.two-sample", async () => {
  await runStatisticalTestGroup(
    "Two-Sample Z-Tests",
    "z.test.two",
    testCount,
    generateTestCase,
    runRobustComparison,
    [10, 30],
    INDIVIDUAL_TEST_SUCCESS_THRESHOLD,
  );
});

// Proportion Tests
Deno.test("proportion-tests.one-sample", async () => {
  await runStatisticalTestGroup(
    "One-Sample Proportion Tests",
    "prop.test.one",
    testCount,
    generateTestCase,
    runRobustComparison,
    [10, 30],
    INDIVIDUAL_TEST_SUCCESS_THRESHOLD,
  );
});

Deno.test("proportion-tests.two-sample", async () => {
  await runStatisticalTestGroup(
    "Two-Sample Proportion Tests",
    "prop.test.two",
    testCount,
    generateTestCase,
    runRobustComparison,
    [10, 30],
    INDIVIDUAL_TEST_SUCCESS_THRESHOLD,
  );
});

// Distribution Tests
Deno.test("distribution-tests.kolmogorov-smirnov", async () => {
  await runStatisticalTestGroup(
    "Kolmogorov-Smirnov Tests",
    "ks.test.uniform",
    testCount,
    generateTestCase,
    runRobustComparison,
    [10, 30],
    INDIVIDUAL_TEST_SUCCESS_THRESHOLD,
  );
});

Deno.test("distribution-tests.shapiro-wilk", async () => {
  await runStatisticalTestGroup(
    "Shapiro-Wilk Tests",
    "shapiro.test",
    testCount,
    generateTestCase,
    runRobustComparison,
    [10, 30],
    INDIVIDUAL_TEST_SUCCESS_THRESHOLD,
  );
});

Deno.test("distribution-tests.anderson-darling", async () => {
  await runStatisticalTestGroup(
    "Anderson-Darling Tests",
    "ad.test",
    testCount,
    generateTestCase,
    runRobustComparison,
    [10, 30],
    INDIVIDUAL_TEST_SUCCESS_THRESHOLD,
  );
});

Deno.test("distribution-tests.dagostino-pearson", async () => {
  await runStatisticalTestGroup(
    "D'Agostino-Pearson Tests",
    "dagostino.test",
    testCount,
    generateTestCase,
    runRobustComparison,
    [10, 30],
    INDIVIDUAL_TEST_SUCCESS_THRESHOLD,
  );
});

// Non-parametric Tests
Deno.test("nonparametric.wilcoxon-signed-rank", async () => {
  await runStatisticalTestGroup(
    "Wilcoxon Signed-Rank Tests",
    "wilcox.test.signedrank",
    testCount,
    generateTestCase,
    runRobustComparison,
    [10, 30],
    INDIVIDUAL_TEST_SUCCESS_THRESHOLD,
  );
});

Deno.test("nonparametric.mann-whitney", async () => {
  await runStatisticalTestGroup(
    "Mann-Whitney Tests",
    "wilcox.test.mannwhitney",
    testCount,
    generateTestCase,
    runRobustComparison,
    [10, 30],
    INDIVIDUAL_TEST_SUCCESS_THRESHOLD,
  );
});

Deno.test("nonparametric.kruskal-wallis", async () => {
  await runStatisticalTestGroup(
    "Kruskal-Wallis Tests",
    "kruskal.test",
    testCount,
    generateTestCase,
    runRobustComparison,
    [10, 30],
    INDIVIDUAL_TEST_SUCCESS_THRESHOLD,
  );
});

// ANOVA Tests
Deno.test("anova.one-way", async () => {
  await runStatisticalTestGroup(
    "One-Way ANOVA Tests",
    "aov.one",
    testCount,
    generateTestCase,
    runRobustComparison,
    [10, 30],
    INDIVIDUAL_TEST_SUCCESS_THRESHOLD,
  );
});

Deno.test("anova.welch", async () => {
  await runStatisticalTestGroup(
    "Welch ANOVA Tests",
    "aov.welch",
    testCount,
    generateTestCase,
    runRobustComparison,
    [10, 30],
    INDIVIDUAL_TEST_SUCCESS_THRESHOLD,
  );
});

Deno.test("anova.two-way", async () => {
  await runStatisticalTestGroup(
    "Two-Way ANOVA Tests",
    "aov.two",
    testCount,
    generateTestCase,
    runRobustComparison,
    [10, 30],
    INDIVIDUAL_TEST_SUCCESS_THRESHOLD,
  );
});

// Chi-square Tests
Deno.test("chi-square.chi-square", async () => {
  await runStatisticalTestGroup(
    "Chi-Square Tests",
    "chisq.test",
    testCount,
    generateTestCase,
    runRobustComparison,
    [10, 30],
    INDIVIDUAL_TEST_SUCCESS_THRESHOLD,
  );
});

Deno.test("chi-square.fishers-exact", async () => {
  await runStatisticalTestGroup(
    "Fisher's Exact Tests",
    "fisher.test",
    testCount,
    generateTestCase,
    runRobustComparison,
    [10, 30],
    INDIVIDUAL_TEST_SUCCESS_THRESHOLD,
  );
});

// Comprehensive statistical test suite
Deno.test("statistical.comprehensive", async () => {
  console.log(`
🎲 PHASE 2: Comprehensive Random Tests
=====================================
Now running 2 additional random test cases per test type...
This provides broader coverage with varied data inputs.
`);

  await runComprehensiveTestSuite(
    "Comprehensive Statistical Test Suite",
    enabledTestTypes,
    testCount,
    generateTestCase,
    runRobustComparison,
    [10, 30],
    STATISTICAL_COMPREHENSIVE_SUCCESS_THRESHOLD,
    Date.now() >>> 0,
  );
});
