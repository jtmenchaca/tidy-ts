import type { OneSampleTTestResult, WilcoxonSignedRankTestResult } from "../../types.ts";
import type { PrettifyDeep } from "../../../../dataframe/types/utility-types.ts";
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
 * @param comparator - Direction of the test ("not equal to", "less than", "greater than")
 * @param alpha - Significance level (default: 0.05)
 * @param parametric - Test type selection (true, false, or "auto")
 * @returns Test results with statistic, p-value, and confidence intervals
 */
export declare function centralTendencyToValue({ data, hypothesizedValue, comparator, alpha, parametric, }: {
    data: readonly number[] | number[];
    hypothesizedValue: number;
    comparator?: "not equal to" | "less than" | "greater than";
    alpha?: number;
    parametric: "parametric";
}): PrettifyDeep<OneSampleTTestResult>;
export declare function centralTendencyToValue({ data, hypothesizedValue, comparator, alpha, parametric, }: {
    data: readonly number[] | number[];
    hypothesizedValue: number;
    comparator?: "not equal to" | "less than" | "greater than";
    alpha?: number;
    parametric: "nonparametric";
}): PrettifyDeep<WilcoxonSignedRankTestResult>;
export declare function centralTendencyToValue({ data, hypothesizedValue, comparator, alpha, parametric, }: {
    data: readonly number[] | number[];
    hypothesizedValue: number;
    comparator?: "not equal to" | "less than" | "greater than";
    alpha?: number;
    parametric?: "parametric" | "nonparametric" | "auto";
}): PrettifyDeep<OneSampleTTestResult | WilcoxonSignedRankTestResult>;
