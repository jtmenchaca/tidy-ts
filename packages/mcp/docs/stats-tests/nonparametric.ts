import type { DocEntry } from "../mcp-types.ts";

export const nonparametricDocs: Record<string, DocEntry> = {
  "s.test.nonparametric.mannWhitney": {
    name: "s.test.nonparametric.mannWhitney",
    category: "stats-tests",
    description:
      "Mann-Whitney U test (Wilcoxon rank-sum test) for comparing two independent groups without assuming normality.",
    signature:
      "s.test.nonparametric.mannWhitney({ x, y, exact?, continuityCorrection?, alternative?, alpha? }): MannWhitneyTestResult",
    imports: ['import { stats as s } from "@tidy-ts/dataframe";'],
    parameters: [
      "`x: number[]` - First group of values",
      "`y: number[]` - Second group of values",
      "`exact?: boolean` - Use exact p-value calculation (default: true)",
      "`continuityCorrection?: boolean` - Apply continuity correction (default: true)",
      "`alternative?: 'two-sided' | 'less' | 'greater'` - Alternative hypothesis (default: 'two-sided')",
      "`alpha?: number` - Significance level (default: 0.05)",
    ],
    returns:
      "MannWhitneyTestResult with `testStatistic`, `pValue`, `alpha`; significant when pValue < alpha",
    examples: [
      'import { stats as s } from "@tidy-ts/dataframe";',
      "const group1 = [10, 12, 11, 13, 12];",
      "const group2 = [15, 16, 14, 17, 15];",
      "const result = s.test.nonparametric.mannWhitney({ x: group1, y: group2 });",
      "console.log(result.pValue);  // p-value",
      "// significant when result.pValue < (result.alpha ?? 0.05)",
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
      "s.test.nonparametric.wilcoxon({ x, y, alternative?, alpha? }): WilcoxonSignedRankTestResult",
    imports: ['import { stats as s } from "@tidy-ts/dataframe";'],
    parameters: [
      "`x: number[]` - First paired measurement",
      "`y: number[]` - Second paired measurement (must have same length as x)",
      "`alternative?: 'two-sided' | 'less' | 'greater'` - Alternative hypothesis (default: 'two-sided')",
      "`alpha?: number` - Significance level (default: 0.05)",
    ],
    returns:
      "WilcoxonSignedRankTestResult with `testStatistic`, `pValue`, `alpha`; significant when pValue < alpha",
    examples: [
      'import { stats as s } from "@tidy-ts/dataframe";',
      "const before = [120, 125, 118, 130, 122];",
      "const after = [115, 118, 112, 125, 117];",
      "const result = s.test.nonparametric.wilcoxon({ x: before, y: after });",
      "console.log(result.pValue);  // p-value",
      "// significant when result.pValue < (result.alpha ?? 0.05)",
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
      "s.test.nonparametric.kruskalWallis(groups: number[][], alpha?: number): KruskalWallisTestResult",
    imports: ['import { stats as s } from "@tidy-ts/dataframe";'],
    parameters: [
      "`groups: number[][]` - Array of groups, where each group is an array of numbers",
      "`alpha?: number` - Significance level (default: 0.05)",
    ],
    returns:
      "KruskalWallisTestResult with `testStatistic`, `pValue`, `degreesOfFreedom`, `alpha`; significant when pValue < alpha",
    examples: [
      'import { stats as s } from "@tidy-ts/dataframe";',
      "const group1 = [10, 12, 11, 13, 12];",
      "const group2 = [15, 16, 14, 17, 15];",
      "const group3 = [20, 21, 19, 22, 20];",
      "const result = s.test.nonparametric.kruskalWallis([group1, group2, group3]);",
      "console.log(result.pValue);  // p-value",
      "if (result.pValue < (result.alpha ?? 0.05)) {",
      "  // If significant, use post-hoc tests",
      "  const postHoc = s.compare.postHoc.dunn([group1, group2, group3]);",
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
