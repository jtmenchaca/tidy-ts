import type { MannWhitneyTestResult, TwoSampleTTestResult } from "../../types.ts";
import type { PrettifyDeep } from "../../../../dataframe/types/utility-types.ts";
/**
 * Compare the central tendencies of two independent groups.
 *
 * Tests whether two groups differ in their central tendency using either
 * parametric (t-test) or non-parametric (Mann-Whitney U) methods.
 *
 * Assumptions:
 * - Samples are independent and randomly drawn
 * - For parametric: Data in each group is approximately normally distributed
 * - For parametric: Automatically detects equal/unequal variances using the Brown-Forsythe modification of Levene's test (unless `assumeEqualVariances` is provided)
 * - For non-parametric: Tests stochastic dominance (whether one distribution tends to have larger values)
 *   Note: Only tests medians specifically when distributions have the same shape
 * - Auto mode: Defaults to t-test; switches to Mann-Whitney only if both groups show clear non-normality (p < 0.05)
 *
 * @param x - First group's values
 * @param y - Second group's values
 * @param parametric - Use t-test (true), Mann-Whitney U test (false), or "auto" (default: "auto")
 * @param assumeEqualVariances - Assume equal variances for t-test (optional: if not provided, uses Brown-Forsythe Levene test to auto-detect)
 * @param comparator - Direction of the test ("not equal to", "less than", "greater than"), where "greater than" means x > y
 * @param alpha - Significance level (default: 0.05)
 * @returns Test results with statistic, p-value, and effect size
 */
export declare function centralTendencyToEachOther({ x, y, parametric, assumeEqualVariances, comparator, alpha, }: {
    x: readonly number[];
    y: readonly number[];
    parametric: "parametric";
    assumeEqualVariances?: boolean;
    comparator?: "not equal to" | "less than" | "greater than";
    alpha?: number;
}): PrettifyDeep<TwoSampleTTestResult>;
export declare function centralTendencyToEachOther({ x, y, parametric, assumeEqualVariances, comparator, alpha, }: {
    x: readonly number[];
    y: readonly number[];
    parametric: "nonparametric";
    assumeEqualVariances?: boolean;
    comparator?: "not equal to" | "less than" | "greater than";
    alpha?: number;
}): PrettifyDeep<MannWhitneyTestResult>;
export declare function centralTendencyToEachOther({ x, y, parametric, assumeEqualVariances, comparator, alpha, }: {
    x: readonly number[];
    y: readonly number[];
    parametric?: "parametric" | "nonparametric" | "auto";
    assumeEqualVariances?: boolean;
    comparator?: "not equal to" | "less than" | "greater than";
    alpha?: number;
}): PrettifyDeep<TwoSampleTTestResult> | PrettifyDeep<MannWhitneyTestResult>;
