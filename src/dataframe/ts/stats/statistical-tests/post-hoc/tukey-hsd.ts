import { tukey_hsd_wasm } from "../../../wasm/wasm-loader.ts";

export interface PairwiseComparison {
  group1: string;
  group2: string;
  mean_difference?: number;
  std_error?: number;
  test_statistic?: number;
  p_value?: number;
  ci_lower?: number;
  ci_upper?: number;
  significant?: boolean;
  adjusted_p_value?: number;
}

export interface PostHocTestResult {
  test_name: string;
  correction_method?: string;
  alpha?: number;
  n_groups?: number;
  n_total?: number;
  error_message?: string;
  comparisons: PairwiseComparison[];
}

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
): PostHocTestResult {
  if (groups.length < 2) {
    return {
      test_name: "Tukey HSD",
      error_message: "Tukey HSD requires at least 2 groups",
      comparisons: [],
    };
  }

  // Clean data and check group sizes
  const cleanGroups = groups.map((group) =>
    group.filter((x) => Number.isFinite(x))
  );
  const groupSizes = cleanGroups.map((group) => group.length);

  if (groupSizes.some((size) => size < 2)) {
    return {
      test_name: "Tukey HSD",
      error_message: "Each group must have at least 2 observations",
      comparisons: [],
    };
  }

  // Use WASM for the test
  const flatData = cleanGroups.flat();
  const resultJson = tukey_hsd_wasm(
    new Float64Array(flatData),
    new Uint32Array(groupSizes),
    alpha,
  );

  try {
    const [postHocResult, comparisons] = JSON.parse(resultJson as string);
    return {
      ...postHocResult,
      comparisons,
    };
  } catch (e) {
    return {
      test_name: "Tukey HSD",
      error_message: `Failed to parse WASM result: ${e}`,
      comparisons: [],
    };
  }
}
