import { levene_test_wasm } from "../../wasm/statistical-tests.ts";
import type { OneWayAnovaTestResult } from "../../../lib/tidy_ts_dataframe.js";

/**
 * Levene's test for equality of variances
 *
 * Tests the null hypothesis that all groups have equal variances.
 * Uses the Brown-Forsythe modification (deviations from medians) which
 * is more robust to non-normality than the original Levene's test.
 *
 * Use this test to:
 * - Check the equal variances assumption for ANOVA
 * - Decide between regular ANOVA and Welch's ANOVA
 * - Validate assumptions for pooled t-tests
 *
 * Interpretation:
 * - p < alpha: Reject null hypothesis → variances are significantly different
 * - p ≥ alpha: Fail to reject null → no evidence of unequal variances
 *
 * @param groups Array of groups, where each group is an array of numbers
 * @param alpha Significance level (default: 0.05)
 * @returns Test result with F-statistic, p-value, and effect size
 *
 * @example
 * ```typescript
 * const group1 = [1, 2, 3, 4, 5];
 * const group2 = [6, 7, 8, 9, 10];  // similar variance
 * const group3 = [1, 5, 10, 15, 20]; // different variance
 *
 * const result = leveneTest([group1, group2, group3]);
 * console.log(`p-value: ${result.p_value}`);
 *
 * if (result.p_value < 0.05) {
 *   console.log("Use Welch ANOVA (unequal variances)");
 * } else {
 *   console.log("Use regular ANOVA (equal variances)");
 * }
 * ```
 */
export function leveneTest(
  groups: number[][],
  alpha = 0.05,
): OneWayAnovaTestResult {
  if (groups.length < 2) {
    throw new Error("Levene's test requires at least 2 groups");
  }

  // Validate and clean data
  const cleanGroups = groups.map((group, i) => {
    const cleaned = group.filter((x) => Number.isFinite(x));
    if (cleaned.length < 2) {
      throw new Error(`Group ${i + 1} must have at least 2 finite values`);
    }
    return cleaned;
  });

  // Flatten data for WASM
  const flatData = cleanGroups.flat();
  const groupSizes = cleanGroups.map((group) => group.length);

  // Call WASM function
  return levene_test_wasm(
    new Float64Array(flatData),
    new Uint32Array(groupSizes),
    alpha,
  );
}

/**
 * Check if groups have equal variances using Levene's test
 *
 * Convenience function that returns a boolean result.
 *
 * @param groups Array of groups to test
 * @param alpha Significance level (default: 0.05)
 * @returns true if variances appear equal, false if significantly different
 */
export function hasEqualVariances(
  groups: number[][],
  alpha = 0.05,
): boolean {
  try {
    const result = leveneTest(groups, alpha);
    return result.p_value >= alpha;
  } catch {
    // If test fails, assume unequal variances (conservative approach)
    return false;
  }
}
