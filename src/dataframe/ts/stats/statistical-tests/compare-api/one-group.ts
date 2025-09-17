import { 
  t_test_one_sample,
  wilcoxon_w_test,
  proportion_test_one_sample,
  shapiro_wilk_test,
} from "../../../wasm/statistical-tests.ts";
import type {
  ParametricChoice,
} from "../types.ts";
import type {
  OneSampleTTestResult,
  OneSampleProportionTestResult,
  ShapiroWilkTestResult,
  WilcoxonSignedRankTestResult,
} from "../../../../lib/tidy_ts_dataframe.internal.js";
import type {
  NumberIterable,
  NumbersWithNullable,
  NumbersWithNullableIterable,
} from "../../helpers.ts";
import { cleanNumeric, isNonNormal, to01 } from "./helpers.ts";

// Legacy helper - use helpers.ts versions for new code

/**
 * Test if a single group's central tendency differs from a hypothesized value.
 *
 * Compares the center of a single sample against a known or expected value,
 * using either parametric (one-sample t-test) or non-parametric (Wilcoxon signed-rank) methods.
 *
 * Assumptions:
 * - For parametric: Data is approximately normally distributed
 * - For non-parametric: Data is continuous and symmetric around the median
 * - Auto mode: Defaults to t-test when normality can't be tested; uses Shapiro-Wilk (p > 0.05) when possible
 *
 * @param data - Sample values to test
 * @param hypothesizedValue - The value to compare against (population mean/median)
 * @param alternative - Direction of the test ("two-sided", "less", "greater")
 * @param alpha - Significance level (default: 0.05)
 * @param parametric - Test type selection (true, false, or "auto")
 * @returns Test results with statistic, p-value, and confidence intervals
 */
export function centralTendencyToValue({
  data,
  hypothesizedValue,
  alternative,
  alpha,
  parametric,
}: {
  data: readonly number[];
  hypothesizedValue: number;
  alternative?: "two-sided" | "less" | "greater";
  alpha?: number;
  parametric: "parametric";
}): OneSampleTTestResult;

export function centralTendencyToValue({
  data,
  hypothesizedValue,
  alternative,
  alpha,
  parametric,
}: {
  data: readonly number[];
  hypothesizedValue: number;
  alternative?: "two-sided" | "less" | "greater";
  alpha?: number;
  parametric: "nonparametric";
}): WilcoxonSignedRankTestResult;

export function centralTendencyToValue({
  data,
  hypothesizedValue,
  alternative,
  alpha,
  parametric,
}: {
  data: readonly number[];
  hypothesizedValue: number;
  alternative?: "two-sided" | "less" | "greater";
  alpha?: number;
  parametric?: ParametricChoice;
}): OneSampleTTestResult | WilcoxonSignedRankTestResult;

export function centralTendencyToValue({
  data,
  hypothesizedValue,
  alternative = "two-sided",
  alpha = 0.05,
  parametric = "auto",
}: {
  data:
    | readonly number[]
    | NumberIterable
    | NumbersWithNullable
    | NumbersWithNullableIterable;
  hypothesizedValue: number;
  alternative?: "two-sided" | "less" | "greater";
  alpha?: number;
  parametric?: ParametricChoice;
}): OneSampleTTestResult | WilcoxonSignedRankTestResult {
  // Convert data to a regular array for processing and filter out null/undefined values
  const cleanData = cleanNumeric(data);

  // ============================================================================
  // DECISION TREE: One Group Central Tendency vs Value
  // ============================================================================
  // Decision logic from pseudocode:
  // 1. If parametric = "auto" (default):
  //    a. Can we test normality? (n >= 3 && n <= 5000)
  //       - YES: Run Shapiro-Wilk test
  //         - p > 0.05 (normal) → Use t-test
  //         - p ≤ 0.05 (non-normal) → Use Wilcoxon signed-rank
  //       - NO: Default to t-test (t-tests are robust to mild non-normality)
  // 2. If parametric = "parametric": Use t-test
  // 3. If parametric = "nonparametric": Use Wilcoxon signed-rank
  // ============================================================================

  // Determine whether to use parametric test
  let useParametric: boolean;
  if (parametric === "auto") {
    // Default to t-test when we can't test normality; t-tests are robust to mild non-normality
    useParametric = !isNonNormal(cleanData);
  } else {
    useParametric = parametric === "parametric";
  }

  if (useParametric) {
    // Use one-sample t-test for parametric data
    return t_test_one_sample(
      new Float64Array(cleanData),
      hypothesizedValue,
      alpha,
      alternative,
    );
  } else {
    // Use Wilcoxon signed-rank test for non-parametric data
    return wilcoxon_w_test(
      new Float64Array(cleanData),
      new Float64Array(cleanData.map(() => hypothesizedValue)),
      alpha,
      alternative,
    );
  }
}

/**
 * Test if a sample proportion differs from a hypothesized population proportion.
 *
 * Compares the proportion of successes in a binary sample against an expected proportion,
 * using the one-sample proportion z-test.
 *
 * Assumptions:
 * - Sample is randomly drawn from the population
 * - Observations are independent
 * - Sample size is large enough (np ≥ 5 and n(1-p) ≥ 5)
 *
 * @param data - Binary data (0/1 or boolean values)
 * @param p - Hypothesized population proportion (default: 0.5)
 * @param alternative - Direction of the test ("two-sided", "less", "greater")
 * @param alpha - Significance level (default: 0.05)
 * @returns Test results with z-statistic, p-value, and confidence intervals
 */
export function proportionsToValue({
  data,
  p = 0.5,
  alternative = "two-sided",
  alpha = 0.05,
}: {
  data: boolean[] | readonly boolean[];
  p?: number;
  alternative?: "two-sided" | "less" | "greater";
  alpha?: number;
}): OneSampleProportionTestResult {
  // ============================================================================
  // DECISION TREE: One Group Proportions vs Value
  // ============================================================================
  // Decision logic from pseudocode:
  // 1. Convert data to binary (0/1 or boolean)
  // 2. Validate binary data (throw error if not binary)
  // 3. Use one-sample proportion z-test (no decision needed - single method)
  // 4. Assumes: np ≥ 5 and n(1-p) ≥ 5 (handled by underlying function)
  // ============================================================================

  // Convert boolean data to counts for the WASM function
  const successes = data.filter((x) => Boolean(to01(x))).length;
  const n = data.length;
  
  return proportion_test_one_sample(
    successes,
    n,
    p,
    alpha,
    alternative,
  );
}

/**
 * Test if data follows a normal distribution (Shapiro-Wilk test).
 *
 * Assesses whether a sample comes from a normally distributed population.
 * Most reliable for small to medium sample sizes (n < 5000).
 *
 * Assumptions:
 * - Data is continuous
 * - Observations are independent and identically distributed
 * - Null hypothesis: Data is normally distributed
 *
 * @param data - Sample values to test for normality
 * @param alpha - Significance level (default: 0.05)
 * @returns Test results with W statistic and p-value (reject null if p < alpha)
 */
export function distributionToNormal({
  data,
  alpha = 0.05,
}: {
  data:
    | readonly number[]
    | NumberIterable
    | NumbersWithNullable
    | NumbersWithNullableIterable;
  alpha?: number;
}): ShapiroWilkTestResult {
  // ============================================================================
  // DECISION TREE: One Group Distribution to Normal
  // ============================================================================
  // Decision logic from pseudocode:
  // 1. Clean data (remove null/undefined/infinite values)
  // 2. Use Shapiro-Wilk test (no decision needed - single method)
  // 3. Most reliable for small to medium samples (n < 5000)
  // 4. Null hypothesis: Data is normally distributed
  // 5. Reject null if p < alpha (data is non-normal)
  // ============================================================================

  // Convert data to a regular array for processing and filter out null/undefined values
  const cleanData = cleanNumeric(data);
  return shapiro_wilk_test(new Float64Array(cleanData), alpha);
}

// ============================================================================
// TODO: MISSING FEATURES FROM PSEUDOCODE
// ============================================================================
// 1. UTILITY HELPER FUNCTIONS
//    - Add cleanNumeric() function for data cleaning
//    - Add isBinaryArray() function for binary data detection
//    - Add to01() function for binary data conversion
//    - Add chooseAlt() and chooseAlpha() functions for parameter defaults
//    - Add canShapiro() function (already exists but could be exported)
//
// 2. AUTO-SELECTION THRESHOLD CONSISTENCY
//    - Current uses p < 0.01 for switching to non-parametric
//    - Pseudocode uses p < 0.05 (more conservative)
//    - Consider making threshold configurable
// ============================================================================

// Export the one-group test functions as a namespace
export const oneGroup = {
  centralTendency: {
    toValue: centralTendencyToValue,
  },
  proportions: {
    toValue: proportionsToValue,
  },
  distribution: {
    toNormal: distributionToNormal,
  },
};
