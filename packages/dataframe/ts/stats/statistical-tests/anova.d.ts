import type { OneWayAnovaTestResult, TwoWayAnovaTestResult, WelchAnovaTestResult } from "./types.ts";
import type { PrettifyDeep } from "../../dataframe/types/utility-types.ts";
/**
 * One-way ANOVA (WASM implementation)
 * @param groups Array of groups, where each group is an array of numbers
 * @param alpha Significance level (default: 0.05)
 * @returns ANOVA test results
 */
export declare function anovaOneWay(groups: number[][], alpha?: number): PrettifyDeep<OneWayAnovaTestResult>;
/**
 * Welch's one-way ANOVA (for unequal variances)
 * @param groups Array of groups, where each group is an array of numbers
 * @param alpha Significance level (default: 0.05)
 * @returns ANOVA test results using Welch's method that doesn't assume equal variances
 */
export declare function welchAnovaOneWay(groups: number[][], alpha?: number): PrettifyDeep<WelchAnovaTestResult>;
/**
 * Two-way ANOVA (complete analysis)
 *
 * @param data - 3D array where data[i][j] contains observations for level i of factor A and level j of factor B
 * @param alpha - Significance level (default: 0.05)
 * @returns Complete two-way ANOVA results including main effects and interaction
 */
export declare function twoWayAnova({ data, alpha, }: {
    data: number[][][];
    alpha?: number;
}): PrettifyDeep<TwoWayAnovaTestResult>;
