import type { DocEntry } from "../mcp-types.ts";

export const postHocDocs: Record<string, DocEntry> = {
  "s.compare.postHoc.tukey": {
    name: "s.compare.postHoc.tukey",
    category: "stats-tests",
    description:
      "Tukey's Honestly Significant Difference (HSD) test for pairwise comparisons after significant one-way ANOVA.",
    signature:
      "s.compare.postHoc.tukey(groups: number[][], alpha?: number): TukeyHsdTestResult",
    imports: ['import { stats as s } from "@tidy-ts/dataframe";'],
    parameters: [
      "`groups: number[][]` - Array of groups, where each group is an array of numbers",
      "`alpha?: number` - Significance level (default: 0.05)",
    ],
    returns:
      "TukeyHsdTestResult with pairwise comparisons, adjusted p-values, and confidence intervals",
    examples: [
      "const group1 = [10, 12, 11, 13, 12];",
      "const group2 = [15, 16, 14, 17, 15];",
      "const group3 = [20, 21, 19, 22, 20];",
      "// First perform ANOVA",
      "const anovaResult = s.test.anova.oneWay([group1, group2, group3]);",
      "if (anovaResult.pValue < (anovaResult.alpha ?? 0.05)) {",
      "  // If ANOVA is significant, perform post-hoc",
      "  const postHoc = s.compare.postHoc.tukey([group1, group2, group3]);",
      "  console.log(postHoc.comparisons);  // See which pairs differ",
      "}",
    ],
    bestPractices: [
      "Use after significant one-way ANOVA",
      "Assumes equal variances across groups",
      "Automatically corrects for multiple comparisons using studentized range distribution",
      "Best for balanced sample sizes",
    ],
    antiPatterns: [
      "Using Tukey HSD when variances are unequal (use Games-Howell instead)",
      "Using Tukey HSD without first performing ANOVA",
      "Using Tukey HSD for non-parametric data (use Dunn's test instead)",
    ],
    related: [
      "s.test.anova.oneWay",
      "s.compare.postHoc.gamesHowell",
      "s.compare.postHoc.dunn",
    ],
  },

  "s.compare.postHoc.gamesHowell": {
    name: "s.compare.postHoc.gamesHowell",
    category: "stats-tests",
    description:
      "Games-Howell test for pairwise comparisons after significant ANOVA when variances are unequal.",
    signature:
      "s.compare.postHoc.gamesHowell(groups: number[][], alpha?: number): GamesHowellTestResult",
    imports: ['import { stats as s } from "@tidy-ts/dataframe";'],
    parameters: [
      "`groups: number[][]` - Array of groups, where each group is an array of numbers",
      "`alpha?: number` - Significance level (default: 0.05)",
    ],
    returns:
      "GamesHowellTestResult with pairwise comparisons, adjusted p-values, and confidence intervals",
    examples: [
      "const group1 = [10, 12, 11, 13, 12];",
      "const group2 = [15, 16, 14, 17, 15];",
      "const group3 = [20, 21, 19, 22, 20];",
      "// Use when variances are unequal",
      "const postHoc = s.compare.postHoc.gamesHowell([group1, group2, group3]);",
      "console.log(postHoc.comparisons);  // See which pairs differ",
    ],
    bestPractices: [
      "Use after significant ANOVA when variances are unequal",
      "More robust than Tukey HSD for heterogeneous data",
      "Uses Welch's t-test for pairwise comparisons with adjusted degrees of freedom",
      "Automatically corrects for multiple comparisons",
      "Good for unequal sample sizes",
    ],
    antiPatterns: [
      "Using Games-Howell when variances are equal (Tukey HSD is more powerful)",
      "Using Games-Howell without first performing ANOVA",
    ],
    related: [
      "s.test.anova.oneWay",
      "s.compare.postHoc.tukey",
      "s.compare.postHoc.dunn",
    ],
  },

  "s.compare.postHoc.dunn": {
    name: "s.compare.postHoc.dunn",
    category: "stats-tests",
    description:
      "Dunn's test for pairwise comparisons after significant Kruskal-Wallis test (non-parametric post-hoc).",
    signature:
      "s.compare.postHoc.dunn(groups: number[][], alpha?: number): DunnTestResult",
    imports: ['import { stats as s } from "@tidy-ts/dataframe";'],
    parameters: [
      "`groups: number[][]` - Array of groups, where each group is an array of numbers",
      "`alpha?: number` - Significance level (default: 0.05)",
    ],
    returns:
      "DunnTestResult with pairwise comparisons, adjusted p-values (Bonferroni correction)",
    examples: [
      "const group1 = [10, 12, 11, 13, 12];",
      "const group2 = [15, 16, 14, 17, 15];",
      "const group3 = [20, 21, 19, 22, 20];",
      "// First perform Kruskal-Wallis",
      "const kwResult = s.test.nonparametric.kruskalWallis([group1, group2, group3]);",
      "if (kwResult.pValue < (kwResult.alpha ?? 0.05)) {",
      "  // If Kruskal-Wallis is significant, perform post-hoc",
      "  const postHoc = s.compare.postHoc.dunn([group1, group2, group3]);",
      "  console.log(postHoc.comparisons);  // See which pairs differ",
      "}",
    ],
    bestPractices: [
      "Use after significant Kruskal-Wallis test",
      "Non-parametric alternative to parametric post-hoc tests",
      "Uses rank-based comparisons",
      "Corrects for multiple comparisons using Bonferroni adjustment",
    ],
    antiPatterns: [
      "Using Dunn's test after parametric ANOVA (use Tukey or Games-Howell instead)",
      "Using Dunn's test without first performing Kruskal-Wallis",
    ],
    related: [
      "s.test.nonparametric.kruskalWallis",
      "s.compare.postHoc.tukey",
      "s.compare.postHoc.gamesHowell",
    ],
  },
};
