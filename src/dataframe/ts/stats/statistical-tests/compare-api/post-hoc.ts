import { dunnTest, gamesHowellTest, tukeyHSD } from "../post-hoc/index.ts";
import type {
  DunnTestResult,
  GamesHowellTestResult,
  TukeyHsdTestResult,
} from "../../../../lib/tidy_ts_dataframe.js";
import {
  cleanNumeric,
  hasBalancedSizes,
  hasEqualVariances,
} from "./helpers.ts";

/**
 * Post-hoc test selection based on the previous test type and data characteristics
 */
export type PostHocTestType = "tukey" | "games-howell" | "dunn" | "auto";

/**
 * Post-hoc analysis for multiple group comparisons
 *
 * This function provides intelligent selection of post-hoc tests based on:
 * - The type of original test performed (ANOVA vs Kruskal-Wallis)
 * - Data characteristics (equal/unequal variances, normality)
 * - User preferences
 *
 * @param groups - Array of groups, where each group is an array of numbers
 * @param testType - Type of post-hoc test to perform or "auto" for automatic selection
 * @param originalTest - The original test that was significant ("anova" | "kruskal-wallis")
 * @param alpha - Significance level (default: 0.05)
 * @returns Post-hoc test results with pairwise comparisons
 */
export function postHocFor({
  groups,
  testType = "auto",
  originalTest,
  alpha = 0.05,
}: {
  groups: number[][];
  testType?: PostHocTestType;
  originalTest?: "anova" | "kruskal-wallis";
  alpha?: number;
}): TukeyHsdTestResult | GamesHowellTestResult | DunnTestResult {
  // Clean data
  const cleanGroups = groups.map((group) => cleanNumeric(group));

  // Auto-select test type if requested
  let selectedTestType = testType;
  if (testType === "auto") {
    selectedTestType = selectPostHocTest(cleanGroups, originalTest);
  }

  // Perform the selected test - WASM functions will handle error cases
  switch (selectedTestType) {
    case "tukey":
      return tukeyHSD(cleanGroups, alpha);

    case "games-howell":
      return gamesHowellTest(cleanGroups, alpha);

    case "dunn":
      return dunnTest(cleanGroups, alpha);

    default:
      // For unknown test types, default to Tukey HSD which will handle errors
      return tukeyHSD(cleanGroups, alpha);
  }
}

/**
 * Intelligent selection of post-hoc test based on data characteristics
 */
function selectPostHocTest(
  groups: number[][],
  originalTest?: "anova" | "kruskal-wallis",
): PostHocTestType {
  // If original test was Kruskal-Wallis, use Dunn's test
  if (originalTest === "kruskal-wallis") {
    return "dunn";
  }

  // If original test was ANOVA, check variance homogeneity
  if (originalTest === "anova") {
    const equalVariances = hasEqualVariances(groups);
    const balancedSizes = hasBalancedSizes(groups);

    // Use Tukey HSD if variances are equal and sizes are balanced
    if (equalVariances && balancedSizes) {
      return "tukey";
    } else {
      // Use Games-Howell for unequal variances or unbalanced designs
      return "games-howell";
    }
  }

  // Default case: check data characteristics
  const equalVariances = hasEqualVariances(groups);
  const balancedSizes = hasBalancedSizes(groups);

  if (equalVariances && balancedSizes) {
    return "tukey";
  } else {
    return "games-howell";
  }
}
