import type { DocEntry } from "../mcp-types.ts";

export const tTestDocs: Record<string, DocEntry> = {
  "s.test.t.oneSample": {
    name: "s.test.t.oneSample",
    category: "stats-tests",
    description: "One-sample t-test to compare a sample mean to a known value.",
    signature:
      "s.test.t.oneSample({ data, mu?, alternative?, alpha? }): OneSampleTTestResult",
    imports: ['import { s } from "@tidy-ts/dataframe";'],
    parameters: [
      "`data: number[]` - Array of numeric values",
      "`mu?: number` - Hypothesized population mean (default: 0)",
      "`alternative?: 'two-sided' | 'less' | 'greater'` - Alternative hypothesis (default: 'two-sided')",
      "`alpha?: number` - Significance level (default: 0.05)",
    ],
    returns:
      "OneSampleTTestResult with `testStatistic`, `pValue`, `degreesOfFreedom`, `confidenceInterval`, `rejectNull`",
    examples: [
      'import { s } from "@tidy-ts/dataframe";',
      "const data = [2.3, 2.5, 2.1, 2.4, 2.2];",
      "const result = s.test.t.oneSample({ data, mu: 2.0 });",
      "console.log(result.pValue);  // p-value",
      "console.log(result.rejectNull);  // true if reject H0",
    ],
    bestPractices: [
      "Check normality with s.test.normality.shapiroWilk before using",
      "Use `alternative: 'less'` or `'greater'` for one-tailed tests",
      "Requires at least 2 observations",
    ],
    antiPatterns: [
      "Using t-test on non-normal data with small sample sizes",
      "Using t-test when population standard deviation is known (use z-test instead)",
    ],
    related: [
      "s.test.t.independent",
      "s.test.t.paired",
      "s.test.z.oneSample",
      "s.test.normality.shapiroWilk",
    ],
  },

  "s.test.t.independent": {
    name: "s.test.t.independent",
    category: "stats-tests",
    description:
      "Independent two-sample t-test to compare means of two unrelated groups.",
    signature:
      "s.test.t.independent({ x, y, equalVar?, alternative?, alpha? }): TwoSampleTTestResult",
    imports: ['import { s } from "@tidy-ts/dataframe";'],
    parameters: [
      "`x: number[]` - First group of values",
      "`y: number[]` - Second group of values",
      "`equalVar?: boolean` - Assume equal variances (default: true, uses pooled variance; false uses Welch's t-test)",
      "`alternative?: 'two-sided' | 'less' | 'greater'` - Alternative hypothesis (default: 'two-sided')",
      "`alpha?: number` - Significance level (default: 0.05)",
    ],
    returns:
      "TwoSampleTTestResult with `testStatistic`, `pValue`, `degreesOfFreedom`, `confidenceInterval`, `rejectNull`",
    examples: [
      'import { s } from "@tidy-ts/dataframe";',
      "const control = [5.2, 4.8, 5.1, 4.9, 5.0];",
      "const treatment = [6.1, 5.9, 6.3, 6.0, 6.2];",
      "const result = s.test.t.independent({ x: control, y: treatment });",
      "console.log(result.pValue);  // compare means",
      "// Use Welch's t-test for unequal variances",
      "const result2 = s.test.t.independent({ x: control, y: treatment, equalVar: false });",
    ],
    bestPractices: [
      "Use Welch's t-test (equalVar: false) unless you've verified equal variances with s.test.variance.levene",
      "Check normality of both groups before using",
      "Each group must have at least 2 observations",
    ],
    antiPatterns: [
      "Assuming equal variances without testing",
      "Using t-test when data is not normally distributed (consider Mann-Whitney U test)",
    ],
    related: [
      "s.test.t.oneSample",
      "s.test.t.paired",
      "s.test.nonparametric.mannWhitney",
      "s.test.variance.levene",
    ],
  },

  "s.test.t.paired": {
    name: "s.test.t.paired",
    category: "stats-tests",
    description:
      "Paired t-test to compare means of two related samples (before/after, matched pairs).",
    signature:
      "s.test.t.paired({ x, y, alternative?, alpha? }): PairedTTestResult",
    imports: ['import { s } from "@tidy-ts/dataframe";'],
    parameters: [
      "`x: number[]` - First measurement (e.g., before treatment)",
      "`y: number[]` - Second measurement (e.g., after treatment)",
      "`alternative?: 'two-sided' | 'less' | 'greater'` - Alternative hypothesis (default: 'two-sided')",
      "`alpha?: number` - Significance level (default: 0.05)",
    ],
    returns:
      "PairedTTestResult with `testStatistic`, `pValue`, `degreesOfFreedom`, `confidenceInterval`, `rejectNull`",
    examples: [
      'import { s } from "@tidy-ts/dataframe";',
      "const before = [120, 125, 118, 130, 122];",
      "const after = [115, 118, 112, 125, 117];",
      "const result = s.test.t.paired({ x: before, y: after });",
      "console.log(result.rejectNull);  // true if significant change",
    ],
    bestPractices: [
      "Use for repeated measures or matched subjects",
      "Arrays must be same length and correspond element-wise",
      "Requires at least 2 paired observations",
    ],
    antiPatterns: [
      "Using paired t-test for independent samples (use independent t-test instead)",
      "Mismatched array lengths",
    ],
    related: [
      "s.test.t.oneSample",
      "s.test.t.independent",
      "s.test.nonparametric.wilcoxon",
    ],
  },
};
