import {
  serializeTestResult,
  tukey_hsd_wasm,
} from "../../../wasm/statistical-tests.ts";
import type { TukeyHsdTestResult } from "../../../../lib/tidy_ts_dataframe.js";

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
 *
 * @param groups Array of groups, where each group is an array of numbers
 * @param alpha Significance level (default: 0.05)
 * @returns Post-hoc test results with pairwise comparisons
 */
export function tukeyHSD(
  groups: number[][],
  alpha = 0.05,
): TukeyHsdTestResult {
  // Clean data and check group sizes
  const cleanGroups = groups.map((group) =>
    group.filter((x) => Number.isFinite(x))
  );
  const groupSizes = cleanGroups.map((group) => group.length);

  // Use WASM for the test - it will handle error cases
  const flatData = cleanGroups.flat();
  const result = tukey_hsd_wasm(
    new Float64Array(flatData),
    new Uint32Array(groupSizes),
    alpha,
  );

  return serializeTestResult(result) as TukeyHsdTestResult;
}
