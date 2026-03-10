import type { DocEntry } from "../mcp-types.ts";

export const correlationTestDocs: Record<string, DocEntry> = {
  "s.test.correlation.pearson": {
    name: "s.test.correlation.pearson",
    category: "stats-tests",
    description:
      "Pearson correlation test to assess linear relationship between two continuous variables. Returns correlation coefficient with statistical significance test.",
    signature:
      "s.test.correlation.pearson({ x, y, alternative?, alpha? }): PearsonCorrelationTestResult",
    imports: [
      'import { s, createDataFrame } from "@tidy-ts/dataframe";',
    ],
    parameters: [
      "`x: number[]` - First variable (must have same length as y)",
      "`y: number[]` - Second variable (must have same length as x)",
      "`alternative?: 'two-sided' | 'less' | 'greater'` - Alternative hypothesis (default: 'two-sided')",
      "`alpha?: number` - Significance level (default: 0.05)",
    ],
    returns:
      "PearsonCorrelationTestResult with `correlation`, `testStatistic`, `pValue`, `alpha`; significant when pValue < alpha",
    examples: [
      'import { stats as s } from "@tidy-ts/dataframe";\n// Basic usage with arrays\nconst x = [1, 2, 3, 4, 5];\nconst y = [2, 4, 6, 8, 10];\nconst result = s.test.correlation.pearson({ x, y });\nconsole.log(result.correlation);  // 1.0 (perfect positive)\nconsole.log(result.pValue);       // p-value for H0: r = 0\n// significant when result.pValue < (result.alpha ?? 0.05)",
      'import { s, createDataFrame } from "@tidy-ts/dataframe";\n// FROM DATAFRAME COLUMNS - Common pattern\nconst df = createDataFrame([\n  { height: 170, weight: 70 },\n  { height: 180, weight: 85 },\n  { height: 165, weight: 60 },\n  { height: 175, weight: 75 },\n  { height: 185, weight: 90 },\n]);\n\n// Extract columns using df.extract()\nconst result = s.test.correlation.pearson({\n  x: df.extract("height"),\n  y: df.extract("weight"),\n});\n\nconsole.log(`Correlation: ${result.correlation.toFixed(3)}`);\nconsole.log(`p-value: ${result.pValue.toFixed(4)}`);\nconsole.log(`Significant: ${result.pValue < (result.alpha ?? 0.05)}`);',
      '// One-tailed test (testing if correlation > 0)\nconst result = s.test.correlation.pearson({\n  x: df.extract("study_hours"),\n  y: df.extract("test_score"),\n  alternative: "greater",\n  alpha: 0.01,\n});',
    ],
    bestPractices: [
      "✓ GOOD: Use df.extract('column') to get arrays from DataFrame",
      "✓ GOOD: Use for linear relationships between continuous variables",
      "✓ GOOD: Requires at least 3 observations",
      "✓ GOOD: Check assumptions: bivariate normality, linearity",
      "✓ GOOD: Use Spearman or Kendall for non-linear or non-normal data",
    ],
    antiPatterns: [
      "❌ BAD: Using Pearson correlation on non-linear relationships",
      "❌ BAD: Using when data is not normally distributed",
      "❌ BAD: Interpreting correlation as causation",
    ],
    related: [
      "s.test.correlation.spearman",
      "s.test.correlation.kendall",
      "s.pearson",
      "extract",
    ],
  },

  "s.test.correlation.spearman": {
    name: "s.test.correlation.spearman",
    category: "stats-tests",
    description:
      "Spearman rank correlation test to assess monotonic relationship between two variables. More robust than Pearson for non-normal data and outliers.",
    signature:
      "s.test.correlation.spearman({ x, y, alternative?, alpha? }): SpearmanCorrelationTestResult",
    imports: [
      'import { s, createDataFrame } from "@tidy-ts/dataframe";',
    ],
    parameters: [
      "`x: number[]` - First variable (must have same length as y)",
      "`y: number[]` - Second variable (must have same length as x)",
      "`alternative?: 'two-sided' | 'less' | 'greater'` - Alternative hypothesis (default: 'two-sided')",
      "`alpha?: number` - Significance level (default: 0.05)",
    ],
    returns:
      "SpearmanCorrelationTestResult with `correlation`, `testStatistic`, `pValue`, `alpha`; significant when pValue < alpha",
    examples: [
      'import { stats as s } from "@tidy-ts/dataframe";\n// Basic usage\nconst x = [1, 2, 3, 4, 5];\nconst y = [10, 20, 30, 40, 50];\nconst result = s.test.correlation.spearman({ x, y });\nconsole.log(result.correlation);  // Spearman\'s rho',
      'import { s, createDataFrame } from "@tidy-ts/dataframe";\n// FROM DATAFRAME COLUMNS\nconst df = createDataFrame([\n  { satisfaction: 4, loyalty: 8 },\n  { satisfaction: 2, loyalty: 3 },\n  { satisfaction: 5, loyalty: 9 },\n  { satisfaction: 3, loyalty: 5 },\n]);\n\nconst result = s.test.correlation.spearman({\n  x: df.extract("satisfaction"),\n  y: df.extract("loyalty"),\n});\nconsole.log(`Spearman rho: ${result.correlation.toFixed(3)}`);',
    ],
    bestPractices: [
      "✓ GOOD: Use df.extract('column') to get arrays from DataFrame",
      "✓ GOOD: Use for monotonic (not necessarily linear) relationships",
      "✓ GOOD: Robust to outliers and non-normal distributions",
      "✓ GOOD: Based on ranks, handles ordinal data well",
    ],
    antiPatterns: [
      "❌ BAD: Using when relationship is clearly linear and data is normal (Pearson is more powerful)",
      "❌ BAD: Using with many ties (consider Kendall instead)",
    ],
    related: [
      "s.test.correlation.pearson",
      "s.test.correlation.kendall",
      "s.spearman",
      "extract",
    ],
  },

  "s.test.correlation.kendall": {
    name: "s.test.correlation.kendall",
    category: "stats-tests",
    description:
      "Kendall's tau correlation test to assess ordinal association between two variables. Best for small samples with ties.",
    signature:
      "s.test.correlation.kendall({ x, y, alternative?, alpha?, exact? }): KendallCorrelationTestResult",
    imports: [
      'import { s, createDataFrame } from "@tidy-ts/dataframe";',
    ],
    parameters: [
      "`x: number[]` - First variable (must have same length as y)",
      "`y: number[]` - Second variable (must have same length as x)",
      "`alternative?: 'two-sided' | 'less' | 'greater'` - Alternative hypothesis (default: 'two-sided')",
      "`alpha?: number` - Significance level (default: 0.05)",
      "`exact?: boolean` - Use exact p-value calculation (default: auto-determined based on sample size)",
    ],
    returns:
      "KendallCorrelationTestResult with `correlation`, `testStatistic`, `pValue`, `alpha`; significant when pValue < alpha",
    examples: [
      'import { stats as s } from "@tidy-ts/dataframe";\n// Basic usage\nconst x = [1, 2, 3, 4, 5];\nconst y = [5, 4, 3, 2, 1];\nconst result = s.test.correlation.kendall({ x, y });\nconsole.log(result.correlation);  // Kendall\'s tau (negative)',
      'import { s, createDataFrame } from "@tidy-ts/dataframe";\n// FROM DATAFRAME COLUMNS\nconst df = createDataFrame([\n  { rank_A: 1, rank_B: 2 },\n  { rank_A: 2, rank_B: 1 },\n  { rank_A: 3, rank_B: 3 },\n  { rank_A: 4, rank_B: 5 },\n]);\n\nconst result = s.test.correlation.kendall({\n  x: df.extract("rank_A"),\n  y: df.extract("rank_B"),\n});\nconsole.log(`Kendall tau: ${result.correlation.toFixed(3)}`);',
    ],
    bestPractices: [
      "✓ GOOD: Use df.extract('column') to get arrays from DataFrame",
      "✓ GOOD: Use for ordinal data or when there are many ties",
      "✓ GOOD: More robust than Spearman for small samples with ties",
      "✓ GOOD: Good for non-parametric correlation testing",
    ],
    antiPatterns: [
      "❌ BAD: Using when data has no ties and relationship is linear (Pearson or Spearman may be better)",
    ],
    related: [
      "s.test.correlation.pearson",
      "s.test.correlation.spearman",
      "extract",
    ],
  },
};
