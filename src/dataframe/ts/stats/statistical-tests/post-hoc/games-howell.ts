import {
  games_howell_wasm,
  serializeTestResult,
} from "../../../wasm/statistical-tests.ts";
import type { GamesHowellTestResult } from "../../../../lib/tidy_ts_dataframe.d.ts";

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
export function gamesHowellTest(
  groups: number[][],
  alpha = 0.05,
): GamesHowellTestResult {
  // Clean data and check group sizes
  const cleanGroups = groups.map((group) =>
    group.filter((x) => Number.isFinite(x))
  );
  const groupSizes = cleanGroups.map((group) => group.length);

  // Use WASM for the test - it will handle error cases
  const flatData = cleanGroups.flat();
  const result = games_howell_wasm(
    new Float64Array(flatData),
    new Uint32Array(groupSizes),
    alpha,
  );

  return serializeTestResult(result) as GamesHowellTestResult;
}
