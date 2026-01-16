import type { DocEntry } from "../mcp-types.ts";

export const correlationTestDocs: Record<string, DocEntry> = {
  "s.test.correlation.pearson": {
    name: "s.test.correlation.pearson",
    category: "stats-tests",
    description:
      "Pearson correlation test to assess linear relationship between two continuous variables.",
    signature:
      "s.test.correlation.pearson({ x, y, alternative?, alpha? }): PearsonCorrelationTestResult",
    imports: ['import { stats as s } from "@tidy-ts/dataframe";'],
    parameters: [
      "`x: number[]` - First variable (must have same length as y)",
      "`y: number[]` - Second variable (must have same length as x)",
      "`alternative?: 'two-sided' | 'less' | 'greater'` - Alternative hypothesis (default: 'two-sided')",
      "`alpha?: number` - Significance level (default: 0.05)",
    ],
    returns:
      "PearsonCorrelationTestResult with `correlation`, `statistic`, `pValue`, `reject`",
    examples: [
      "const x = [1, 2, 3, 4, 5];",
      "const y = [2, 4, 6, 8, 10];",
      "const result = s.test.correlation.pearson({ x, y });",
      "console.log(result.correlation);  // 1.0 (perfect positive correlation)",
      "console.log(result.pValue);  // p-value for test of correlation = 0",
    ],
    bestPractices: [
      "Use for linear relationships between continuous variables",
      "Requires at least 3 observations",
      "Assumes bivariate normality",
      "Use Spearman or Kendall for non-linear or non-normal relationships",
    ],
    antiPatterns: [
      "Using Pearson correlation on non-linear relationships",
      "Using Pearson correlation when data is not normally distributed",
      "Interpreting correlation as causation",
    ],
    related: ["s.test.correlation.spearman", "s.test.correlation.kendall"],
  },

  "s.test.correlation.spearman": {
    name: "s.test.correlation.spearman",
    category: "stats-tests",
    description:
      "Spearman rank correlation test to assess monotonic relationship between two variables.",
    signature:
      "s.test.correlation.spearman({ x, y, alternative?, alpha? }): SpearmanCorrelationTestResult",
    imports: ['import { stats as s } from "@tidy-ts/dataframe";'],
    parameters: [
      "`x: number[]` - First variable (must have same length as y)",
      "`y: number[]` - Second variable (must have same length as x)",
      "`alternative?: 'two-sided' | 'less' | 'greater'` - Alternative hypothesis (default: 'two-sided')",
      "`alpha?: number` - Significance level (default: 0.05)",
    ],
    returns:
      "SpearmanCorrelationTestResult with `correlation`, `statistic`, `pValue`, `reject`",
    examples: [
      "const x = [1, 2, 3, 4, 5];",
      "const y = [10, 20, 30, 40, 50];",
      "const result = s.test.correlation.spearman({ x, y });",
      "console.log(result.correlation);  // Spearman's rho",
      "console.log(result.pValue);  // p-value",
    ],
    bestPractices: [
      "Use for monotonic (not necessarily linear) relationships",
      "Robust to outliers and non-normal distributions",
      "Requires at least 2 observations",
      "Based on ranks, so handles ordinal data well",
    ],
    antiPatterns: [
      "Using Spearman when relationship is clearly linear and data is normal (Pearson is more powerful)",
      "Using Spearman with many ties (consider Kendall instead)",
    ],
    related: ["s.test.correlation.pearson", "s.test.correlation.kendall"],
  },

  "s.test.correlation.kendall": {
    name: "s.test.correlation.kendall",
    category: "stats-tests",
    description:
      "Kendall's tau correlation test to assess ordinal association between two variables.",
    signature:
      "s.test.correlation.kendall({ x, y, alternative?, alpha?, exact? }): KendallCorrelationTestResult",
    imports: ['import { stats as s } from "@tidy-ts/dataframe";'],
    parameters: [
      "`x: number[]` - First variable (must have same length as y)",
      "`y: number[]` - Second variable (must have same length as x)",
      "`alternative?: 'two-sided' | 'less' | 'greater'` - Alternative hypothesis (default: 'two-sided')",
      "`alpha?: number` - Significance level (default: 0.05)",
      "`exact?: boolean` - Use exact p-value calculation (default: auto-determined based on sample size)",
    ],
    returns:
      "KendallCorrelationTestResult with `correlation`, `statistic`, `pValue`, `reject`",
    examples: [
      "const x = [1, 2, 3, 4, 5];",
      "const y = [5, 4, 3, 2, 1];",
      "const result = s.test.correlation.kendall({ x, y });",
      "console.log(result.correlation);  // Kendall's tau (negative for inverse relationship)",
      "console.log(result.pValue);  // p-value",
    ],
    bestPractices: [
      "Use for ordinal data or when there are many ties",
      "More robust than Spearman for small samples with ties",
      "Requires at least 2 observations",
      "Good for non-parametric correlation testing",
    ],
    antiPatterns: [
      "Using Kendall when data has no ties and relationship is linear (Pearson or Spearman may be more appropriate)",
    ],
    related: ["s.test.correlation.pearson", "s.test.correlation.spearman"],
  },
};
