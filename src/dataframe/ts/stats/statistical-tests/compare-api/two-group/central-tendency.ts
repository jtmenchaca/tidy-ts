import { tTestIndependent } from "../../t-tests.ts";
import { mannWhitneyTest } from "../../mann-whitney.ts";
import type {
  MannWhitneyTestResult,
  TwoSampleTTestResult,
} from "../../../../../lib/tidy_ts_dataframe.js";
import type {
  NumberIterable,
  NumbersWithNullable,
  NumbersWithNullableIterable,
} from "../../../helpers.ts";
import {
  cleanNumeric,
  hasManyTies,
  isNonNormal,
  smallSample2,
} from "../helpers.ts";
import { hasEqualVariances } from "../../levene.ts";

/**
 * Compare the central tendencies of two independent groups.
 *
 * Tests whether two groups differ in their central tendency using either
 * parametric (t-test) or non-parametric (Mann-Whitney U) methods.
 *
 * Assumptions:
 * - Samples are independent and randomly drawn
 * - For parametric: Data in each group is approximately normally distributed
 * - For parametric: Automatically detects equal/unequal variances using Levene's test (unless `assumeEqualVariances` is provided)
 * - For non-parametric: Tests stochastic dominance (whether one distribution tends to have larger values)
 *   Note: Only tests medians specifically when distributions have the same shape
 * - Auto mode: Defaults to t-test; switches to Mann-Whitney only if both groups show clear non-normality (p < 0.05)
 *
 * @param x - First group's values
 * @param y - Second group's values
 * @param parametric - Use t-test (true), Mann-Whitney U test (false), or "auto" (default: "auto")
 * @param assumeEqualVariances - Assume equal variances for t-test (optional: if not provided, uses Levene's test to auto-detect)
 * @param alternative - Direction of the test ("two-sided", "less", "greater"), where "greater" means x > y
 * @param alpha - Significance level (default: 0.05)
 * @returns Test results with statistic, p-value, and effect size
 */
export function centralTendencyToEachOther({
  x,
  y,
  parametric,
  assumeEqualVariances,
  alternative,
  alpha,
}: {
  x: readonly number[];
  y: readonly number[];
  parametric: "parametric";
  assumeEqualVariances?: boolean;
  alternative?: "two-sided" | "less" | "greater";
  alpha?: number;
}): TwoSampleTTestResult;

export function centralTendencyToEachOther({
  x,
  y,
  parametric,
  assumeEqualVariances,
  alternative,
  alpha,
}: {
  x: readonly number[];
  y: readonly number[];
  parametric: "nonparametric";
  assumeEqualVariances?: boolean;
  alternative?: "two-sided" | "less" | "greater";
  alpha?: number;
}): MannWhitneyTestResult;

export function centralTendencyToEachOther({
  x,
  y,
  parametric,
  assumeEqualVariances,
  alternative,
  alpha,
}: {
  x: readonly number[];
  y: readonly number[];
  parametric?: "parametric" | "nonparametric" | "auto";
  assumeEqualVariances?: boolean;
  alternative?: "two-sided" | "less" | "greater";
  alpha?: number;
}): TwoSampleTTestResult | MannWhitneyTestResult;

export function centralTendencyToEachOther({
  x,
  y,
  parametric = "auto",
  assumeEqualVariances,
  alternative = "two-sided",
  alpha = 0.05,
}: {
  x:
    | readonly number[]
    | NumberIterable
    | NumbersWithNullable
    | NumbersWithNullableIterable;
  y:
    | readonly number[]
    | NumberIterable
    | NumbersWithNullable
    | NumbersWithNullableIterable;
  parametric?: "parametric" | "nonparametric" | "auto";
  assumeEqualVariances?: boolean;
  alternative?: "two-sided" | "less" | "greater";
  alpha?: number;
}): TwoSampleTTestResult | MannWhitneyTestResult {
  // Convert data to regular arrays and filter out null/undefined/infinite values
  const cleanX = cleanNumeric(x);
  const cleanY = cleanNumeric(y);

  // ============================================================================
  // DECISION TREE: Two Groups Central Tendency to Each Other
  // ============================================================================
  // Decision logic from pseudocode:
  // 1. If parametric = "auto" (default):
  //    a. Can we test normality for both groups? (n >= 3 && n <= 5000)
  //       - YES: Run Shapiro-Wilk on both groups
  //         - Both groups normal (p > 0.05) → Use t-test with auto variance detection
  //         - Both groups non-normal (p ≤ 0.05) → Use Mann-Whitney U
  //         - Mixed results → Use t-test (robust to mild non-normality)
  //       - NO: Default to t-test (t-tests are robust to mild non-normality)
  // 2. If parametric = "parametric": Use t-test with auto variance detection
  // 3. If parametric = "nonparametric": Use Mann-Whitney U
  // 4. For t-test: Auto-detect equal/unequal variances using Levene's test (unless assumeEqualVariances provided)
  // 5. For Mann-Whitney: Use exact test if small samples (n ≤ 8) and no ties
  // ============================================================================

  // Determine whether to use parametric test
  let useParametric: boolean;
  if (parametric === "auto") {
    // Default to t-test; switch to Mann-Whitney only if both groups show non-normality
    // T-tests are robust to mild non-normality
    const normalityThreshold = 0.05; // Standard threshold for normality testing
    const xNonNormal = isNonNormal(cleanX, normalityThreshold);
    const yNonNormal = isNonNormal(cleanY, normalityThreshold);

    useParametric = !(xNonNormal && yNonNormal);
  } else {
    useParametric = parametric === "parametric";
  }

  if (useParametric) {
    // Auto-detect variance equality if not explicitly specified
    let useEqualVar = assumeEqualVariances;
    if (useEqualVar === undefined) {
      // Use Levene's test to determine variance equality
      useEqualVar = hasEqualVariances([cleanX, cleanY], 0.05);
    }

    // Use independent samples t-test for parametric data
    return tTestIndependent({
      x: cleanX,
      y: cleanY,
      equalVar: useEqualVar,
      alternative,
      alpha,
    });
  } else {
    // Use Mann-Whitney U test for non-parametric data
    // Use exact test for small samples without ties
    const useExact = smallSample2(cleanX, cleanY) &&
      !hasManyTies(cleanX, cleanY);

    return mannWhitneyTest({
      x: cleanX,
      y: cleanY,
      exact: useExact,
      continuityCorrection: true,
      alternative,
      alpha,
    });
  }
}
