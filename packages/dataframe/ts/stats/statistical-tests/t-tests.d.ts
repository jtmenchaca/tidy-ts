import type { OneSampleTTestResult, PairedTTestResult, TwoSampleTTestResult } from "./types.ts";
import type { PrettifyDeep } from "../../dataframe/types/utility-types.ts";
/**
 * One-sample t-test for comparing sample mean to hypothesized population mean
 * @param data - Sample data
 * @param mu - Hypothesized population mean (default: 0)
 * @param alternative - Alternative hypothesis: 'two-sided', 'less', or 'greater' (default: 'two-sided')
 * @param alpha - Significance level (default: 0.05)
 * @returns Test statistic, p-value, and confidence interval
 */
export declare function tTestOneSample({ data, mu, alternative, alpha, }: {
    data: number[];
    mu?: number;
    alternative?: "two-sided" | "less" | "greater";
    alpha?: number;
}): PrettifyDeep<OneSampleTTestResult>;
/**
 * Independent t-test for comparing means of two independent groups
 * @param x - First group data
 * @param y - Second group data
 * @param equalVar - Assume equal variances (default: true)
 * @param alternative - Alternative hypothesis: 'two-sided', 'less', or 'greater' (default: 'two-sided')
 * @param alpha - Significance level (default: 0.05)
 * @returns Test statistic, p-value, and confidence interval
 */
export declare function tTestIndependent({ x, y, equalVar, alternative, alpha, }: {
    x: number[];
    y: number[];
    equalVar?: boolean;
    alternative?: "two-sided" | "less" | "greater";
    alpha?: number;
}): PrettifyDeep<TwoSampleTTestResult>;
/**
 * Paired t-test for comparing means of two related samples
 * @param x - First sample data
 * @param y - Second sample data
 * @param alternative - Alternative hypothesis: 'two-sided', 'less', or 'greater' (default: 'two-sided')
 * @param alpha - Significance level (default: 0.05)
 * @returns Test statistic, p-value, and confidence interval
 */
export declare function tTestPaired({ x, y, alternative, alpha, }: {
    x: number[];
    y: number[];
    alternative?: "two-sided" | "less" | "greater";
    alpha?: number;
}): PrettifyDeep<PairedTTestResult>;
