import type { DocEntry } from "../mcp-types.ts";

export const anovaDocs: Record<string, DocEntry> = {
  "s.test.anova.oneWay": {
    name: "s.test.anova.oneWay",
    category: "stats-tests",
    description:
      "One-way Analysis of Variance (ANOVA) to compare means across multiple groups.",
    signature:
      "s.test.anova.oneWay(groups: number[][], alpha?: number): OneWayAnovaTestResult",
    imports: ['import { stats as s } from "@tidy-ts/dataframe";'],
    parameters: [
      "`groups: number[][]` - Array of groups, where each group is an array of numbers",
      "`alpha?: number` - Significance level (default: 0.05)",
    ],
    returns:
      "OneWayAnovaTestResult with `testStatistic`, `pValue`, `degreesOfFreedom`, `rejectNull`",
    examples: [
      'import { stats as s } from "@tidy-ts/dataframe";',
      "const group1 = [10, 12, 11, 13, 12];",
      "const group2 = [15, 16, 14, 17, 15];",
      "const group3 = [20, 21, 19, 22, 20];",
      "const result = s.test.anova.oneWay([group1, group2, group3]);",
      "console.log(result.pValue);  // p-value",
      "if (result.rejectNull) {",
      "  // If significant, use post-hoc tests",
      "  const postHoc = s.compare.postHoc.tukey([group1, group2, group3]);",
      "}",
    ],
    bestPractices: [
      "Check normality of each group before using",
      "Check equal variances with s.test.variance.levene (consider Welch ANOVA if violated)",
      "Requires at least 2 groups, each with at least 2 observations",
      "If significant, follow up with post-hoc tests (Tukey, Games-Howell, etc.)",
    ],
    antiPatterns: [
      "Using ANOVA on non-normal data (consider Kruskal-Wallis test)",
      "Using ANOVA when variances are unequal (use Welch ANOVA or Kruskal-Wallis)",
      "Not performing post-hoc tests after significant result",
    ],
    related: [
      "s.test.anova.welch",
      "s.test.anova.twoWay",
      "s.test.variance.levene",
      "s.test.nonparametric.kruskalWallis",
    ],
  },

  "s.test.anova.welch": {
    name: "s.test.anova.welch",
    category: "stats-tests",
    description:
      "Welch's one-way ANOVA for comparing means across multiple groups when equal variances cannot be assumed.",
    signature:
      "s.test.anova.welch(groups: number[][], alpha?: number): WelchAnovaTestResult",
    imports: ['import { stats as s } from "@tidy-ts/dataframe";'],
    parameters: [
      "`groups: number[][]` - Array of groups, where each group is an array of numbers",
      "`alpha?: number` - Significance level (default: 0.05)",
    ],
    returns:
      "WelchAnovaTestResult with `testStatistic`, `pValue`, `degreesOfFreedom`, `rejectNull`",
    examples: [
      'import { stats as s } from "@tidy-ts/dataframe";',
      "const group1 = [10, 12, 11, 13, 12];",
      "const group2 = [15, 16, 14, 17, 15];",
      "const group3 = [20, 21, 19, 22, 20];",
      "const result = s.test.anova.welch([group1, group2, group3]);",
      "console.log(result.pValue);  // p-value",
    ],
    bestPractices: [
      "Use when groups have unequal variances (check with s.test.variance.levene)",
      "More robust than regular ANOVA when equal variance assumption is violated",
      "Requires at least 2 groups, each with at least 2 observations",
    ],
    antiPatterns: [
      "Using when variances are clearly equal (regular ANOVA is more powerful)",
    ],
    related: [
      "s.test.anova.oneWay",
      "s.test.variance.levene",
    ],
  },

  "s.test.anova.twoWay": {
    name: "s.test.anova.twoWay",
    category: "stats-tests",
    description:
      "Two-way Analysis of Variance (ANOVA) to test main effects and interaction in a factorial design.",
    signature: "s.test.anova.twoWay({ data, alpha? }): TwoWayAnovaTestResult",
    imports: ['import { stats as s } from "@tidy-ts/dataframe";'],
    parameters: [
      "`data: number[][][]` - 3D array where data[i][j] contains observations for level i of factor A and level j of factor B",
      "`alpha?: number` - Significance level (default: 0.05)",
    ],
    returns:
      "TwoWayAnovaTestResult with results for factor A, factor B, and A×B interaction",
    examples: [
      "// Example: 2x3 factorial design",
      "// Factor A: 2 levels (treatment, control)",
      "// Factor B: 3 levels (low, medium, high)",
      'import { stats as s } from "@tidy-ts/dataframe";',
      "const data = [",
      "  [[10, 11, 12], [15, 16, 17], [20, 21, 22]],  // Treatment group",
      "  [[8, 9, 10], [12, 13, 14], [18, 19, 20]]     // Control group",
      "];",
      "const result = s.test.anova.twoWay({ data });",
      "console.log(result.factorA.pValue);  // Main effect of factor A",
      "console.log(result.factorB.pValue);  // Main effect of factor B",
      "console.log(result.interaction.pValue);  // Interaction effect",
    ],
    bestPractices: [
      "Use for factorial designs with two factors",
      "Check normality and equal variances assumptions",
      "Requires at least 2 levels for each factor",
      "Each cell must have at least 1 observation",
      "Interpret interaction before main effects if interaction is significant",
    ],
    antiPatterns: [
      "Using two-way ANOVA on non-normal data",
      "Ignoring interaction effects when they are significant",
      "Using unbalanced designs without appropriate adjustments",
    ],
    related: ["s.test.anova.oneWay", "s.test.anova.welch"],
  },

  "s.test.variance.levene": {
    name: "s.test.variance.levene",
    category: "stats-tests",
    description:
      "Levene's test for equality of variances across groups. Uses Brown-Forsythe modification (deviations from medians) which is more robust to non-normality.",
    signature:
      "s.test.variance.levene(groups: number[][], alpha?: number): OneWayAnovaTestResult",
    imports: ['import { stats as s } from "@tidy-ts/dataframe";'],
    parameters: [
      "`groups: number[][]` - Array of groups to test for equal variances",
      "`alpha?: number` - Significance level (default: 0.05)",
    ],
    returns: "OneWayAnovaTestResult with F-statistic, `pValue`, `rejectNull`",
    examples: [
      'import { stats as s } from "@tidy-ts/dataframe";',
      "const group1 = [1, 2, 3, 4, 5];",
      "const group2 = [6, 7, 8, 9, 10];  // similar variance",
      "const group3 = [1, 5, 10, 15, 20]; // different variance",
      "",
      "const result = s.test.variance.levene([group1, group2, group3]);",
      "console.log(`p-value: ${result.pValue}`);",
      "",
      "if (result.rejectNull) {",
      "  console.log('Use Welch ANOVA (unequal variances)');",
      "} else {",
      "  console.log('Use regular ANOVA (equal variances)');",
      "}",
    ],
    bestPractices: [
      "Use before ANOVA to check equal variances assumption",
      "Requires at least 2 groups, each with at least 2 observations",
      "More robust than Bartlett's test for non-normal data",
      "p < alpha means variances are significantly different",
    ],
    antiPatterns: [
      "Ignoring Levene test results when choosing between ANOVA and Welch ANOVA",
    ],
    related: [
      "s.test.anova.oneWay",
      "s.test.anova.welch",
    ],
  },
};
