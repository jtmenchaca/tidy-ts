import type { OneWayAnovaTestResult } from "./types.ts";
import type { PrettifyDeep } from "../../dataframe/types/utility-types.ts";
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
 * console.log(`p-value: ${result.pValue}`);
 *
 * if (result.pValue < 0.05) {
 *   console.log("Use Welch ANOVA (unequal variances)");
 * } else {
 *   console.log("Use regular ANOVA (equal variances)");
 * }
 * ```
 */
export declare function leveneTest(groups: number[][], alpha?: number): PrettifyDeep<OneWayAnovaTestResult>;
