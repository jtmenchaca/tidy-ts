import type { DocEntry } from "../mcp-types.ts";

export const spreadDocs: Record<string, DocEntry> = {
  stdev: {
    name: "s.stdev",
    category: "stats",
    signature: "s.stdev(values: number[], removeNA?: boolean): number | null",
    description:
      "Calculate the sample standard deviation of an array of values. Returns null if insufficient data or removeNA=false with mixed types. Can be chained with s.round() without assertions.",
    imports: ['import { stats as s } from "@tidy-ts/dataframe";'],
    parameters: [
      "values: Array of numbers or single number",
      "removeNA: If true, processes valid numbers from mixed arrays; if false, returns null for mixed arrays",
    ],
    returns: "number | null",
    examples: [
      "s.stdev(42) // Always returns 0 for single value",
      "s.stdev([1, 2, 3, 4, 5]) // sample standard deviation (default)",
      's.stdev([1, "2", 3], true) // 1.41... (std dev of [1, 3] with removeNA=true)',
      's.stdev([1, "2", 3], false) // null (mixed types, removeNA=false)',
      "// Chain with s.round() - no assertions needed!",
      'df.groupBy("region").summarize({ std: group => s.round(s.stdev(group.sales), 2) })',
    ],
    antiPatterns: [
      "❌ BAD: s.round(s.stdev(values)!, 2) // Unnecessary - s.round() handles null at runtime",
    ],
    bestPractices: [
      "✓ GOOD: Chain with s.round() directly: s.round(s.stdev(values), 2) - no assertions needed",
      "✓ GOOD: s.round() handles null at runtime, so no need for s.round(s.stdev(values)!, 2)",
    ],
    related: ["variance", "mean", "round"],
  },

  variance: {
    name: "s.variance",
    category: "stats",
    signature:
      "s.variance(values: number[], removeNA?: boolean): number | null",
    description:
      "Calculate the sample variance of an array of values (uses N-1 denominator). Returns null if insufficient data.",
    imports: ['import { stats as s } from "@tidy-ts/dataframe";'],
    parameters: [
      "values: Array of numbers or single number",
      "removeNA: If true, processes valid numbers from mixed arrays; if false, returns null for mixed arrays",
    ],
    returns: "number | null",
    examples: [
      "s.variance(42) // Always returns 0 for single value",
      "s.variance([1, 2, 3, 4, 5]) // sample variance (default)",
      's.variance([1, "2", 3], true) // 1 (variance of [1, 3] with removeNA=true)',
      's.variance([1, "2", 3], false) // null (mixed types, removeNA=false)',
    ],
    related: ["sd", "mean"],
  },

  range: {
    name: "s.range",
    category: "stats",
    signature: "s.range(values: number[], removeNA?: boolean): number | null",
    description:
      "Calculate the range of values (max - min). Returns null if no valid values.",
    imports: ['import { stats as s } from "@tidy-ts/dataframe";'],
    parameters: [
      "values: Array of numbers, or single number",
      "removeNA: If true, removes non-numeric values; if false, returns null for mixed types",
    ],
    returns: "number | null",
    examples: [
      "s.range(42) // Always returns 0 for single value",
      "const r = s.range([1, 5, 3, 9, 2]) // 8 (9 - 1)",
    ],
    related: ["max", "min", "iqr"],
  },

  iqr: {
    name: "s.iqr",
    category: "stats",
    signature: "s.iqr(values: number[], removeNA?: boolean): number | null",
    description:
      "Calculate the interquartile range (IQR) of values (Q75 - Q25). Returns null if no valid values.",
    imports: ['import { stats as s } from "@tidy-ts/dataframe";'],
    parameters: [
      "values: Array of numbers or single number",
      "removeNA: If true, removes non-numeric values; if false, returns null for mixed types",
    ],
    returns: "number | null",
    examples: [
      "s.iqr(42) // Always returns 0 for single value",
      "const iqr_val = s.iqr([1, 2, 3, 4, 5]) // 2 (4 - 2)",
    ],
    related: ["quartiles", "quantile", "range"],
  },
};
