import type { DocEntry } from "../mcp-types.ts";

export const transformationDocs: Record<string, DocEntry> = {
  normalize: {
    name: "s.normalize",
    category: "stats",
    signature: [
      's.normalize(values: number[]): number[]',
      's.normalize(value: number): number',
      's.normalize(values: (number | null | undefined)[], method?: "minmax" | "zscore"): (number | null)[]',
      's.normalize(values: Iterable<number>, method?: "minmax" | "zscore"): number[]',
      's.normalize(values: Iterable<number | null | undefined>, method?: "minmax" | "zscore"): (number | null)[]',
      's.normalize(values: number[], target: number, method?: "minmax" | "zscore"): number',
      's.normalize(values: (number | null | undefined)[], target: number, method?: "minmax" | "zscore"): number | null',
      "// …additional Iterable target overloads — packages/dataframe/ts/stats/transformation/normalize.ts",
    ].join("\n"),
    description:
      "Normalize values to 0-1 range using min-max normalization or z-score standardization. Supports finding normalized value for all values or a specific target value.",
    imports: ['import { stats as s } from "@tidy-ts/dataframe";'],
    parameters: [
      "values: Array of numbers",
      'method: Normalization method: "minmax" (default) or "zscore"',
      "target: Optional - The value to find the normalized value for",
    ],
    returns: "number[] for all values OR number | null for target value",
    examples: [
      "s.normalize([10, 20, 30]) // [0, 0.5, 1] (min-max normalization)",
      's.normalize([10, 20, 30], "zscore") // z-scores with mean=0, std=1',
      "s.normalize([10, 20, 30], 20) // 0.5 (20 is halfway between 10 and 30)",
      's.normalize([10, 20, 30], 20, "zscore") // z-score of 20',
    ],
    related: ["stdev", "mean"],
  },

  round: {
    name: "s.round",
    category: "stats",
    signature:
      "s.round(value: number | number[] | Iterable<number> | null, digits?: number): number | number[] | null",
    description:
      "Round a number or all values in an array to a specified number of decimal places. Accepts null values and returns null when given null (useful for chaining with s.mean(), s.stdev(), s.max(), s.min(), or s.median() which return number | null).",
    imports: ['import { stats as s } from "@tidy-ts/dataframe";'],
    parameters: [
      "value: Number, null, or array of numbers to round",
      "digits: Number of decimal places (default: 0)",
    ],
    returns: "number, null, or number[] (returns null if input is null)",
    examples: [
      "s.round(3.14159) // 3",
      "s.round(3.14159, 2) // 3.14",
      "s.round(123.456, 1) // 123.5",
      "s.round(123.456, -1) // 120",
      "s.round([1.234, 2.567, 3.891], 2) // [1.23, 2.57, 3.89]",
      "s.round(null) // null (returns null when given null)",
      "// Works with nullable stats functions - no assertions needed!",
      "s.round(s.mean([1, 2, 3]), 2) // 2.0",
      "s.round(s.mean([null, null]), 2) // null (mean returns null, round handles it)",
      "s.round(s.stdev([1, 2, 3]), 2) // 1.0",
      "s.round(s.max([1, null, 3]), 2) // 3.0 (or null if max returns null)",
      'df.groupBy("region").summarize({ avg: group => s.round(s.mean(group.sales), 2) })',
    ],
    bestPractices: [
      "✓ GOOD: No need for non-null assertions (!) - s.round() accepts null and returns null",
      "✓ GOOD: Chain directly: s.round(s.mean(values), 2) - no need for s.round(s.mean(values)!, 2)",
      "✓ GOOD: Type-safe chaining: s.round() signature includes null, so TypeScript won't complain",
      "✓ GOOD: Works seamlessly with s.mean(), s.stdev(), s.max(), s.min(), s.median() which return number | null",
    ],
    related: ["mean", "stdev", "max", "min", "median"],
  },

  percent: {
    name: "s.percent",
    category: "stats",
    signature:
      "s.percent(numerator: number | null | undefined, denominator: number | null | undefined, decimals?: number): number | null",
    description:
      "Calculate a percentage from a numerator and denominator, rounded to a given number of decimals. Returns 0 when denominator is 0 to handle division-by-zero gracefully. Returns null if either numerator or denominator is null/undefined.",
    imports: ['import { stats as s } from "@tidy-ts/dataframe";'],
    parameters: [
      "numerator: The portion value",
      "denominator: The total value",
      "decimals: Number of decimal places to round to (default: 1)",
    ],
    returns:
      "number | null - Percentage (0–100 scale), rounded, or null if inputs are null/undefined",
    examples: [
      "s.percent(25, 100) // 25.0",
      "s.percent(1, 3) // 33.3",
      "s.percent(2, 3, 2) // 66.67",
      "s.percent(5, 0) // 0 (handles division by zero)",
      "s.percent(0, 100) // 0.0",
      "s.percent(null, 100) // null",
    ],
    related: ["round"],
  },
};
