import type { TukeyHsdTestResult } from "../types.ts";
import type { PrettifyDeep } from "../../../dataframe/types/utility-types.ts";
/**
 * Tukey's Honestly Significant Difference (HSD) test
 *
 * Post-hoc test for pairwise comparisons after significant one-way ANOVA.
 * Assumes equal variances across groups and uses the studentized range distribution.
 *
 * Best used when:
 * - Following a significant one-way ANOVA
 * - Groups have approximately equal variances
 * - Sample sizes are reasonably balanced
 * - Automatically corrects for multiple comparisons using studentized range distribution
 *
 * @param groups Array of groups, where each group is an array of numbers
 * @param alpha Significance level (default: 0.05)
 * @returns Post-hoc test results with pairwise comparisons
 */
export declare function tukeyHSD(groups: number[][], alpha?: number): PrettifyDeep<TukeyHsdTestResult>;
