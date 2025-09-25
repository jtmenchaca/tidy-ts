import {
  dunn_test_wasm,
  serializeTestResult,
} from "../../../wasm/statistical-tests.ts";
import type { DunnTestResult } from "../../../../lib/tidy_ts_dataframe.d.ts";

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
 *
 * @param groups Array of groups, where each group is an array of numbers
 * @param alpha Significance level (default: 0.05)
 * @returns Post-hoc test results with pairwise comparisons (rank-based)
 */
export function dunnTest(
  groups: number[][],
  alpha = 0.05,
): DunnTestResult {
  // Clean data and check group sizes
  const cleanGroups = groups.map((group) =>
    group.filter((x) => Number.isFinite(x))
  );
  const groupSizes = cleanGroups.map((group) => group.length);

  // Use WASM for the test - it will handle error cases
  const flatData = cleanGroups.flat();
  const result = dunn_test_wasm(
    new Float64Array(flatData),
    new Uint32Array(groupSizes),
    alpha,
  );

  return serializeTestResult(result) as DunnTestResult;
}
