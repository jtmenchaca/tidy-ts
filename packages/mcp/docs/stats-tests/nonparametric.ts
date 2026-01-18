import type { DocEntry } from "../mcp-types.ts";

export const nonparametricDocs: Record<string, DocEntry> = {
  "s.test.nonparametric.mannWhitney": {
    name: "s.test.nonparametric.mannWhitney",
    category: "stats-tests",
    description:
      "Mann-Whitney U test (Wilcoxon rank-sum test) for comparing two independent groups without assuming normality.",
    signature:
      "mannWhitneyTest({ x, y, exact?, continuityCorrection?, alternative?, alpha? }): MannWhitneyTestResult",
    imports: ['import { mannWhitneyTest } from "@tidy-ts/dataframe";'],
    parameters: [
      "`x: number[]` - First group of values",
      "`y: number[]` - Second group of values",
      "`exact?: boolean` - Use exact p-value calculation (default: true)",
      "`continuityCorrection?: boolean` - Apply continuity correction (default: true)",
      "`alternative?: 'two-sided' | 'less' | 'greater'` - Alternative hypothesis (default: 'two-sided')",
      "`alpha?: number` - Significance level (default: 0.05)",
    ],
    returns: "MannWhitneyTestResult with `test_statistic`, `p_value`, `reject_null`",
    examples: [
      "const group1 = [10, 12, 11, 13, 12];",
      "const group2 = [15, 16, 14, 17, 15];",
      "const result = mannWhitneyTest({ x: group1, y: group2 });",
      "console.log(result.p_value);  // p-value",
      "console.log(result.reject_null);  // true if reject H0",
    ],
    bestPractices: [
      "Use when data is not normally distributed",
      "Non-parametric alternative to independent t-test",
      "Tests if one distribution is stochastically larger than the other",
      "Each group must have at least 1 observation",
    ],
    antiPatterns: [
      "Using Mann-Whitney when data is normally distributed (t-test is more powerful)",
      "Using for paired data (use Wilcoxon signed-rank test instead)",
    ],
    related: [
      "s.test.t.independent",
      "s.test.nonparametric.wilcoxon",
      "s.test.nonparametric.kruskalWallis",
    ],
  },

  "s.test.nonparametric.wilcoxon": {
    name: "s.test.nonparametric.wilcoxon",
    category: "stats-tests",
    description:
      "Wilcoxon signed-rank test for comparing two related/paired samples without assuming normality.",
    signature:
      "wilcoxonSignedRankTest({ x, y, alternative?, alpha? }): WilcoxonSignedRankTestResult",
    imports: ['import { wilcoxonSignedRankTest } from "@tidy-ts/dataframe";'],
    parameters: [
      "`x: number[]` - First paired measurement",
      "`y: number[]` - Second paired measurement (must have same length as x)",
      "`alternative?: 'two-sided' | 'less' | 'greater'` - Alternative hypothesis (default: 'two-sided')",
      "`alpha?: number` - Significance level (default: 0.05)",
    ],
    returns:
      "WilcoxonSignedRankTestResult with `test_statistic`, `p_value`, `reject_null`",
    examples: [
      "const before = [120, 125, 118, 130, 122];",
      "const after = [115, 118, 112, 125, 117];",
      "const result = wilcoxonSignedRankTest({ x: before, y: after });",
      "console.log(result.p_value);  // p-value",
      "console.log(result.reject_null);  // true if significant change",
    ],
    bestPractices: [
      "Use for paired/repeated measures when data is not normally distributed",
      "Non-parametric alternative to paired t-test",
      "Arrays must be same length and correspond element-wise",
      "Requires at least 1 paired observation",
    ],
    antiPatterns: [
      "Using Wilcoxon for independent samples (use Mann-Whitney U test instead)",
      "Mismatched array lengths",
    ],
    related: ["s.test.t.paired", "s.test.nonparametric.mannWhitney"],
  },

  "s.test.nonparametric.kruskalWallis": {
    name: "s.test.nonparametric.kruskalWallis",
    category: "stats-tests",
    description:
      "Kruskal-Wallis test for comparing multiple independent groups without assuming normality (non-parametric alternative to one-way ANOVA).",
    signature:
      "kruskalWallisTest(groups: number[][], alpha?: number): KruskalWallisTestResult",
    imports: ['import { kruskalWallisTest } from "@tidy-ts/dataframe";'],
    parameters: [
      "`groups: number[][]` - Array of groups, where each group is an array of numbers",
      "`alpha?: number` - Significance level (default: 0.05)",
    ],
    returns:
      "KruskalWallisTestResult with `test_statistic`, `p_value`, `degrees_of_freedom`, `reject_null`",
    examples: [
      "const group1 = [10, 12, 11, 13, 12];",
      "const group2 = [15, 16, 14, 17, 15];",
      "const group3 = [20, 21, 19, 22, 20];",
      "const result = kruskalWallisTest([group1, group2, group3]);",
      "console.log(result.p_value);  // p-value",
      "if (result.reject_null) {",
      "  // If significant, use post-hoc tests",
      "  const postHoc = dunnTest([group1, group2, group3]);",
      "}",
    ],
    bestPractices: [
      "Use when data is not normally distributed or variances are unequal",
      "Non-parametric alternative to one-way ANOVA",
      "Requires at least 2 groups, each with at least 1 observation",
      "If significant, follow up with Dunn's test for pairwise comparisons",
    ],
    antiPatterns: [
      "Using Kruskal-Wallis when data is normally distributed (ANOVA is more powerful)",
      "Not performing post-hoc tests after significant result",
    ],
    related: ["s.test.anova.oneWay", "s.compare.postHoc.dunn"],
  },
};
