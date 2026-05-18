/**
 * Kruskal-Wallis test implementation
 * Non-parametric alternative to one-way ANOVA
 */
import type { KruskalWallisTestResult } from "./types.ts";
import type { PrettifyDeep } from "../../dataframe/types/utility-types.ts";
export type { KruskalWallisTestResult } from "./types.ts";
/**
 * Perform Kruskal-Wallis test using Rust WASM implementation
 * @param groups Array of groups, each group is an array of numbers
 * @param alpha Significance level (default: 0.05)
 * @returns Test result with statistic, p-value, and degrees of freedom
 */
export declare function kruskalWallisTest(groups: number[][], alpha?: number): PrettifyDeep<KruskalWallisTestResult>;
/**
 * Alternative interface that accepts data and group labels
 */
export declare function kruskalWallisTestByGroup({ data, groups, alpha, }: {
    data: number[];
    groups: (string | number)[];
    alpha?: number;
}): PrettifyDeep<KruskalWallisTestResult>;
