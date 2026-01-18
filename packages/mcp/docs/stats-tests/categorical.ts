import type { DocEntry } from "../mcp-types.ts";

export const categoricalDocs: Record<string, DocEntry> = {
  "s.test.categorical.chiSquare": {
    name: "s.test.categorical.chiSquare",
    category: "stats-tests",
    description:
      "Chi-square test of independence for testing association between categorical variables in a contingency table.",
    signature:
      "chiSquareTest({ contingencyTable, alpha? }): ChiSquareIndependenceTestResult",
    imports: ['import { chiSquareTest } from "@tidy-ts/dataframe";'],
    parameters: [
      "`contingencyTable: number[][]` - 2D array representing contingency table (rows × columns)",
      "`alpha?: number` - Significance level (default: 0.05)",
    ],
    returns:
      "ChiSquareIndependenceTestResult with `test_statistic`, `p_value`, `degrees_of_freedom`, `phi_coefficient`, `residuals`",
    examples: [
      "// Example: 2x2 contingency table",
      "// Rows: Treatment vs Control",
      "// Columns: Success vs Failure",
      "const table = [",
      "  [20, 10],  // Treatment: 20 success, 10 failure",
      "  [15, 15]   // Control: 15 success, 15 failure",
      "];",
      "const result = chiSquareTest({ contingencyTable: table });",
      "console.log(result.p_value);  // p-value",
      "console.log(result.phi_coefficient);  // effect size measure",
    ],
    bestPractices: [
      "Use for testing independence between categorical variables",
      "Table must be at least 2×2",
      "All values must be non-negative integers (counts)",
      "Expected frequencies should be ≥ 5 for reliable results (consider Fisher's exact test for small samples)",
    ],
    antiPatterns: [
      "Using chi-square with small expected frequencies (use Fisher's exact test instead)",
      "Using chi-square for 2×2 tables with small samples (Fisher's exact is more appropriate)",
    ],
    related: ["s.test.categorical.fishersExact", "s.test.proportion.twoSample"],
  },

  "s.test.categorical.fishersExact": {
    name: "s.test.categorical.fishersExact",
    category: "stats-tests",
    description:
      "Fisher's exact test for testing independence in a 2×2 contingency table (exact p-value, no large-sample assumption).",
    signature:
      "fishersExactTest({ contingencyTable, alternative?, oddsRatio?, alpha? }): FishersExactTestResult",
    imports: ['import { fishersExactTest } from "@tidy-ts/dataframe";'],
    parameters: [
      "`contingencyTable: number[][]` - 2×2 contingency table (must be exactly 2 rows × 2 columns)",
      "`alternative?: 'two-sided' | 'less' | 'greater'` - Alternative hypothesis (default: 'two-sided')",
      "`oddsRatio?: number` - Hypothesized odds ratio (default: 1.0)",
      "`alpha?: number` - Significance level (default: 0.05)",
    ],
    returns:
      "FishersExactTestResult with `p_value`, `test_statistic`, `confidence_interval`, `mid_p_value`",
    examples: [
      "// Example: 2x2 contingency table",
      "const table = [",
      "  [8, 2],   // Group 1: 8 success, 2 failure",
      "  [3, 7]    // Group 2: 3 success, 7 failure",
      "];",
      "const result = fishersExactTest({ contingencyTable: table });",
      "console.log(result.p_value);  // exact p-value",
      "console.log(result.test_statistic);  // odds ratio",
    ],
    bestPractices: [
      "Use for 2×2 tables with small sample sizes",
      "Provides exact p-values (no asymptotic approximation)",
      "All values must be non-negative integers",
      "More appropriate than chi-square for small samples",
    ],
    antiPatterns: [
      "Using Fisher's exact test for tables larger than 2×2 (not supported)",
      "Using Fisher's exact test when sample size is large (chi-square is more efficient)",
    ],
    related: ["s.test.categorical.chiSquare"],
  },
};
