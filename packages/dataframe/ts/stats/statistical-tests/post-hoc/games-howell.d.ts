import type { GamesHowellTestResult } from "../types.ts";
import type { PrettifyDeep } from "../../../dataframe/types/utility-types.ts";
/**
 * Games-Howell test for pairwise comparisons
 *
 * Non-parametric alternative to Tukey HSD that does not assume equal variances.
 * Uses Welch's t-test for pairwise comparisons with adjusted degrees of freedom.
 *
 * Best used when:
 * - Following a significant one-way ANOVA
 * - Groups have unequal variances (violates ANOVA assumption)
 * - Sample sizes are unequal
 * - More robust than Tukey HSD for heterogeneous data
 * - Automatically corrects for multiple comparisons using Welch's t-test with adjusted degrees of freedom
 *
 * @param groups Array of groups, where each group is an array of numbers
 * @param alpha Significance level (default: 0.05)
 * @returns Post-hoc test results with pairwise comparisons
 */
export declare function gamesHowellTest(groups: number[][], alpha?: number): PrettifyDeep<GamesHowellTestResult>;
