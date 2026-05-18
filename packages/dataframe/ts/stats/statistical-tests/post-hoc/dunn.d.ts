import type { DunnTestResult } from "../types.ts";
import type { PrettifyDeep } from "../../../dataframe/types/utility-types.ts";
/**
 * Dunn's test for pairwise comparisons
 *
 * Non-parametric post-hoc test for pairwise comparisons after significant Kruskal-Wallis test.
 * Uses rank sums and the standard normal distribution.
 *
 * Best used when:
 * - Following a significant Kruskal-Wallis test
 * - Data is not normally distributed
 * - Comparing rank-based differences rather than means
 * - Non-parametric alternative to parametric post-hoc tests
 * - Corrects for multiple comparisons using Bonferroni adjustment
 *
 * @param groups Array of groups, where each group is an array of numbers
 * @param alpha Significance level (default: 0.05)
 * @returns Post-hoc test results with pairwise comparisons (rank-based)
 */
export declare function dunnTest(groups: number[][], alpha?: number): PrettifyDeep<DunnTestResult>;
