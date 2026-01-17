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
    name: "s.pearson",
    category: "stats",
    signature: "s.pearson(x: number[], y: number[]): number | null",
    description:
      "Calculate the Pearson correlation coefficient between two numeric arrays. Returns a value between -1 (perfect negative correlation) and 1 (perfect positive correlation). Returns null if calculation is not possible.",
    imports: [
      'import { stats as s, createDataFrame } from "@tidy-ts/dataframe";',
    ],
    parameters: [
      "x: First array of numbers",
      "y: Second array of numbers (same length as x)",
    ],
    returns: "number | null - Pearson correlation coefficient",
    examples: [
      "// Perfect positive correlation\ns.pearson([1, 2, 3, 4, 5], [2, 4, 6, 8, 10]) // 1.0",
      "// Perfect negative correlation\ns.pearson([1, 2, 3, 4, 5], [10, 8, 6, 4, 2]) // -1.0",
      "// No correlation\ns.pearson([1, 2, 3, 4, 5], [3, 1, 4, 1, 5]) // ~0",
      '// From DataFrame columns - COMMON PATTERN\nconst df = createDataFrame([\n  { height: 170, weight: 70, age: 25 },\n  { height: 180, weight: 85, age: 30 },\n  { height: 165, weight: 60, age: 22 },\n  { height: 175, weight: 75, age: 28 },\n  { height: 185, weight: 90, age: 35 },\n]);\n\n// Extract columns and calculate correlation\nconst r = s.pearson(\n  df.extract("height"),\n  df.extract("weight")\n);\nconsole.log(`Height-Weight correlation: ${r}`); // ~0.98',
      '// Multiple correlations from same DataFrame\nconst heightWeight = s.pearson(df.extract("height"), df.extract("weight"));\nconst heightAge = s.pearson(df.extract("height"), df.extract("age"));\nconst weightAge = s.pearson(df.extract("weight"), df.extract("age"));',
    ],
    related: [
      "s.test.correlation.pearson",
      "s.spearman",
      "s.covariance",
      "extract",
    ],
    bestPractices: [
      "✓ GOOD: Use df.extract('column') to get numeric arrays from DataFrame",
      "✓ GOOD: Use s.pearson for quick correlation coefficient only",
      "✓ GOOD: Use s.test.correlation.pearson for full hypothesis test with p-value",
      "✓ GOOD: Check for at least 3 observations",
    ],
    antiPatterns: [
      "❌ BAD: Using Pearson on non-linear relationships",
      "❌ BAD: Interpreting correlation as causation",
      "❌ BAD: Using on ranked/ordinal data (use Spearman instead)",
    ],
  },

  spearman: {
    name: "s.spearman",
    category: "stats",
    signature: "s.spearman(x: number[], y: number[]): number | null",
    description:
      "Calculate Spearman's rank correlation coefficient. Measures monotonic (not necessarily linear) relationships. More robust to outliers than Pearson.",
    imports: [
      'import { stats as s, createDataFrame } from "@tidy-ts/dataframe";',
    ],
    parameters: [
      "x: First array of numbers",
      "y: Second array of numbers (same length as x)",
    ],
    returns: "number | null - Spearman's rho",
    examples: [
      "s.spearman([1, 2, 3, 4, 5], [2, 4, 6, 8, 10]) // 1.0",
      '// From DataFrame columns\nconst rho = s.spearman(\n  df.extract("satisfaction_rank"),\n  df.extract("loyalty_score")\n);',
    ],
    related: ["s.test.correlation.spearman", "s.pearson", "extract"],
    bestPractices: [
      "✓ GOOD: Use for monotonic relationships",
      "✓ GOOD: Use when data has outliers",
      "✓ GOOD: Use for ordinal data",
    ],
  },
};
