#!/usr/bin/env -S deno test --allow-all

// deno-lint-ignore-file no-explicit-any
import {
  callRobustR,
  callRobustRust,
  generateComprehensiveTestCase,
  type TestParameters,
} from "./comprehensive-interface.ts";
import {
  INDIVIDUAL_TEST_SUCCESS_THRESHOLD,
  runComprehensiveTestSuite,
  runTestGroup,
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

    // Chi-square and exact tests
    "chisq.test": true, // ✅ Working (chiSquareTest)
    "fisher.test": true, // ✅ Working (fishersExactTest)
  };
}

// Helper function to generate test case with proper random sampling
function generateTestCase(testType: string, sampleSize: number) {
  return generateComprehensiveTestCase(testType, sampleSize);
}

const testCount = 2; // Number of test cases per test type

// Get enabled test types for comprehensive testing
const testConfig = getTestConfig();
const enabledTestTypes = Object.keys(testConfig).filter(
  (key) => testConfig[key as keyof typeof testConfig],
);

// Correlation Tests
Deno.test("correlation.pearson", async () => {
  await runTestGroup(
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
  await runTestGroup(
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
  await runTestGroup(
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
  await runTestGroup(
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
  await runTestGroup(
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
  await runTestGroup(
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
  await runTestGroup(
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
  await runTestGroup(
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
  await runTestGroup(
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
  await runTestGroup(
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
  await runTestGroup(
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
  await runTestGroup(
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
  await runTestGroup(
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
  await runTestGroup(
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
  await runTestGroup(
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
  await runTestGroup(
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
  await runTestGroup(
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
  await runTestGroup(
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
  await runTestGroup(
    "Welch ANOVA Tests",
    "aov.welch",
    testCount,
    generateTestCase,
    runRobustComparison,
    [10, 30],
    INDIVIDUAL_TEST_SUCCESS_THRESHOLD,
  );
});

// Chi-square Tests
Deno.test("chi-square.chi-square", async () => {
  await runTestGroup(
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
  await runTestGroup(
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
