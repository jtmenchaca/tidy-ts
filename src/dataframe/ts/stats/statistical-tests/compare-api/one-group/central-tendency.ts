import { tTestOneSample } from "../../t-tests.ts";
import { wilcoxonSignedRankTest } from "../../wilcoxon.ts";
import type { ParametricChoice } from "../../types.ts";
import type {
  OneSampleTTestResult,
  WilcoxonSignedRankTestResult,
} from "../../../../../lib/tidy_ts_dataframe.internal.js";
import type {
  NumberIterable,
  NumbersWithNullable,
  NumbersWithNullableIterable,
} from "../../../helpers.ts";
import { cleanNumeric, isNonNormal } from "../helpers.ts";

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
    return tTestOneSample({
      data: cleanData,
      mu: hypothesizedValue,
      alternative,
      alpha,
    });
  } else {
    // Use Wilcoxon signed-rank test for non-parametric data
    return wilcoxonSignedRankTest({
      x: cleanData,
      y: cleanData.map(() => hypothesizedValue),
      alternative,
      alpha,
    });
  }
}
