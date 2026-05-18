import type { NumberIterable, NumbersWithNullable, NumbersWithNullableIterable } from "../../helpers.ts";
/**
 * Clean numeric data by filtering out null, undefined, and infinite values
 */
export declare function cleanNumeric(data: readonly number[] | NumberIterable | NumbersWithNullable | NumbersWithNullableIterable): number[];
/**
 * Convert data to binary (0/1) format
 */
export declare function to01(value: unknown): 0 | 1;
/**
 * Check if data has many ties (for choosing between tests)
 */
export declare function hasManyTies(x: number[], y: number[]): boolean;
/**
 * Check if sample size is small for two-group tests
 */
export declare function smallSample2(x: number[], y: number[]): boolean;
/**
 * Test if data is non-normal using appropriate test based on sample size
 *
 * Based on the evidence-based approach:
 * - n < 7: Cannot test, assume normal (conservative)
 * - 7 ≤ n ≤ 50: Use Shapiro-Wilk (best power for small samples)
 * - 50 < n ≤ 300: Use D'Agostino-Pearson K² (omnibus test for skewness + kurtosis)
 * - n > 300: Use Anderson-Darling (tail-sensitive, good for large samples)
 *
 * Note: For n > 200, normality tests become oversensitive; consider using
 * robust methods (Welch t-test) by default for large samples.
 */
export declare function isNonNormal(data: number[], alpha?: number): boolean;
/**
 * Check if group variances are approximately equal using Brown-Forsythe test
 *
 * Uses the Brown-Forsythe modification of Levene's test (deviations from medians)
 * which is more robust to non-normality than the original Levene's test.
 */
export declare function hasEqualVariances(groups: number[][], alpha?: number): boolean;
/**
 * Check if group sizes are reasonably balanced
 */
export declare function hasBalancedSizes(groups: number[][]): boolean;
/**
 * Compute residuals for one-sample test (data minus hypothesized value)
 */
export declare function residuals_oneSample(data: number[], value: number): number[];
/**
 * Compute residuals for two-sample test (each group's deviations from their own mean)
 */
export declare function residuals_twoSample(x: number[], y: number[]): {
    rx: number[];
    ry: number[];
};
/**
 * Test normality using appropriate method based on sample size (evidence-based approach)
 */
export declare function normalityOK(vec: number[], alpha?: number): boolean;
/**
 * Check if all groups pass normality test on their residuals
 */
export declare function allGroupsNormal(groups: number[][], alpha?: number): boolean;
