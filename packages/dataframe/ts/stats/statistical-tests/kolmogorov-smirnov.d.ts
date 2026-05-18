import type { KolmogorovSmirnovTestResult } from "./types.ts";
import type { PrettifyDeep } from "../../dataframe/types/utility-types.ts";
/**
 * Two-sample Kolmogorov-Smirnov test
 *
 * Tests whether two samples come from the same distribution by comparing
 * their empirical cumulative distribution functions (ECDFs).
 *
 * @param x - First sample
 * @param y - Second sample
 * @param alternative - Type of alternative hypothesis:
 *   - "two-sided": distributions differ (default)
 *   - "less": CDF of x is less than CDF of y (x is stochastically smaller)
 *   - "greater": CDF of x is greater than CDF of y (x is stochastically larger)
 * @param alpha - Significance level (default: 0.05)
 * @returns Test result with D statistic, p-value, and critical value
 */
export declare function kolmogorovSmirnovTest({ x, y, alternative, alpha, }: {
    x: number[];
    y: number[];
    alternative?: "two-sided" | "less" | "greater";
    alpha?: number;
}): PrettifyDeep<KolmogorovSmirnovTestResult>;
/**
 * One-sample Kolmogorov-Smirnov test against uniform distribution
 *
 * Tests whether a sample comes from a uniform distribution on [min, max].
 *
 * @param x - Sample data
 * @param min - Minimum value of uniform distribution (default: 0)
 * @param max - Maximum value of uniform distribution (default: 1)
 * @param alternative - Type of alternative hypothesis
 * @param alpha - Significance level (default: 0.05)
 * @returns Test result with D statistic, p-value, and critical value
 */
export declare function kolmogorovSmirnovUniformTest({ x, min, max, alternative, alpha, }: {
    x: number[];
    min?: number;
    max?: number;
    alternative?: "two-sided" | "less" | "greater";
    alpha?: number;
}): PrettifyDeep<KolmogorovSmirnovTestResult>;
export declare const ksTestUniform: typeof kolmogorovSmirnovUniformTest;
