import type { DocEntry } from "../mcp-types.ts";

export const correlationDocs: Record<string, DocEntry> = {
  covariance: {
    name: "s.covariance",
    category: "stats",
    signature:
      "s.covariance(x: number[], y: number[], options?: { removeNull?, removeUndefined?, removeNaN? }): number | null",
    description:
      "Calculate the sample covariance between two arrays of values. Arrays must have the same length. Returns null if no valid pairs. Type inference narrows return type based on removal options.",
    imports: ['import { stats as s } from "@tidy-ts/dataframe";'],
    parameters: [
      "x: First array of numbers",
      "y: Second array of numbers (same length as x)",
      "options.removeNull: If true, skips pairs where either value is null",
      "options.removeUndefined: If true, skips pairs where either value is undefined",
      "options.removeNaN: If true, skips pairs where either value is NaN",
    ],
    returns: "number | null",
    examples: [
      "s.covariance([1, 2, 3], [1, 2, 3]) // 1",
      "s.covariance([1, 2, 3], [3, 2, 1]) // -1",
      "s.covariance([1, null, 3], [1, 2, 3]) // null (null present)",
      "s.covariance([1, null, 3], [1, 2, 3], { removeNull: true }) // covariance of pairs (1,1) and (3,3)",
      "s.covariance([1, NaN, 3], [1, 2, 3], { removeNaN: true }) // covariance of pairs (1,1) and (3,3)",
      '// From DataFrame columns\nconst df = createDataFrame([\n  { height: 170, weight: 70 },\n  { height: 180, weight: 85 },\n  { height: 165, weight: 60 },\n]);\nconst cov = s.covariance(\n  df.extract("height"),\n  df.extract("weight")\n);',
    ],
    related: ["s.test.correlation.pearson", "variance", "extract"],
  },

  pearson: {
    name: "s.test.correlation.pearson (coefficient: .correlation)",
    category: "stats",
    signature:
      "s.test.correlation.pearson({ x, y, alternative?, alpha? }): PearsonCorrelationTestResult",
    description:
      "Pearson correlation test: returns a result object with .correlation (the coefficient), .pValue, .alpha, etc. Check result.pValue < (result.alpha ?? 0.05) for significance. To get only the Pearson coefficient between two columns, use the result's .correlation property. Throws if x and y differ in length or have fewer than 3 finite values (no null return).",
    imports: [
      'import { stats as s, createDataFrame } from "@tidy-ts/dataframe";',
    ],
    parameters: [
      "x: number[] - First array (e.g. df.extract('colA'))",
      "y: number[] - Second array (same length as x)",
      "alternative?: 'two-sided' | 'less' | 'greater'",
      "alpha?: number - Significance level (default 0.05)",
    ],
    returns:
      "PearsonCorrelationTestResult with .correlation (number), .pValue, .testStatistic, .alpha; significant when pValue < alpha",
    examples: [
      "// Coefficient only: use .correlation from the test result\nconst result = s.test.correlation.pearson({\n  x: [1, 2, 3, 4, 5],\n  y: [2, 4, 6, 8, 10],\n});\nconsole.log(result.correlation);  // 1.0\nconsole.log(result.pValue);       // p-value for H0: r = 0",
      '// From DataFrame columns - COMMON PATTERN\nconst df = createDataFrame([\n  { height: 170, weight: 70, age: 25 },\n  { height: 180, weight: 85, age: 30 },\n  { height: 165, weight: 60, age: 22 },\n  { height: 175, weight: 75, age: 28 },\n  { height: 185, weight: 90, age: 35 },\n]);\n\nconst result = s.test.correlation.pearson({\n  x: df.extract("height"),\n  y: df.extract("weight"),\n});\nconsole.log(`Correlation: ${result.correlation.toFixed(3)}`);\nconsole.log(`Significant: ${result.pValue < (result.alpha ?? 0.05)}`);',
      `// Error handling: the test throws (does not return null) for invalid input
try {
  const result = s.test.correlation.pearson({
    x: df.extract("col_a"),
    y: df.extract("col_b"),
  });
  console.log(result.correlation);
} catch (e) {
  // e.g. "Pearson correlation test requires at least 3 observations" or length mismatch
  console.warn("Pearson correlation not available:", e instanceof Error ? e.message : e);
}`,
    ],
    related: [
      "s.test.correlation.spearman",
      "s.test.correlation.kendall",
      "s.covariance",
      "extract",
    ],
    bestPractices: [
      "✓ GOOD: Use df.extract('column') for x and y from a DataFrame",
      "✓ GOOD: Use result.correlation when you only need the coefficient",
      "✓ GOOD: Use try/catch when data may have fewer than 3 valid pairs or length mismatch (API throws, does not return null)",
    ],
    antiPatterns: [
      "❌ BAD: Using Pearson on non-linear relationships",
      "❌ BAD: Interpreting correlation as causation",
    ],
  },

  spearman: {
    name: "s.test.correlation.spearman (coefficient: .correlation)",
    category: "stats",
    signature:
      "s.test.correlation.spearman({ x, y, alternative?, alpha? }): SpearmanCorrelationTestResult",
    description:
      "Spearman rank correlation test. Returns a result object with .correlation (Spearman's rho), .pValue, .alpha. Check result.pValue < (result.alpha ?? 0.05) for significance. Use .correlation for the coefficient only. Throws if length mismatch or fewer than 2 observations.",
    imports: [
      'import { stats as s, createDataFrame } from "@tidy-ts/dataframe";',
    ],
    parameters: [
      "x: number[] - First array",
      "y: number[] - Second array (same length as x)",
      "alternative?: 'two-sided' | 'less' | 'greater'",
      "alpha?: number",
    ],
    returns: "SpearmanCorrelationTestResult with .correlation (rho), .pValue, .alpha; significant when pValue < alpha",
    examples: [
      "const result = s.test.correlation.spearman({ x: [1,2,3,4,5], y: [10,20,30,40,50] });\nconsole.log(result.correlation);  // Spearman's rho",
      'const result = s.test.correlation.spearman({\n  x: df.extract("satisfaction_rank"),\n  y: df.extract("loyalty_score"),\n});\nconsole.log(result.correlation);',
    ],
    related: ["s.test.correlation.pearson", "s.test.correlation.kendall", "extract"],
    bestPractices: [
      "✓ GOOD: Use for monotonic relationships",
      "✓ GOOD: Use when data has outliers or ordinal data",
      "✓ GOOD: Use result.correlation for the coefficient only",
    ],
  },
};
