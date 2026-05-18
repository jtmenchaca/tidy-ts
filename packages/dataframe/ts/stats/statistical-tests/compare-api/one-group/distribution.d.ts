import type { ShapiroWilkTestResult } from "../../types.ts";
import type { NumberIterable, NumbersWithNullable, NumbersWithNullableIterable } from "../../../helpers.ts";
import type { PrettifyDeep } from "../../../../dataframe/types/utility-types.ts";
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
export declare function distributionToNormal({ data, alpha, }: {
    data: readonly number[] | NumberIterable | NumbersWithNullable | NumbersWithNullableIterable;
    alpha?: number;
}): PrettifyDeep<ShapiroWilkTestResult>;
