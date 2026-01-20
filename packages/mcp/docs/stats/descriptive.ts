import type { DocEntry } from "../mcp-types.ts";

export const descriptiveDocs: Record<string, DocEntry> = {
  mean: {
    name: "s.mean",
    category: "stats",
    signature:
      "s.mean(values: number[], options?: { removeNull?, removeUndefined?, removeNaN? }): number | null",
    description:
      "Calculate the arithmetic mean (average) of numeric values. Returns null if no valid values. Type inference narrows return type based on input array type and removal options.",
    imports: ['import { stats as s } from "@tidy-ts/dataframe";'],
    parameters: [
      "values: A single number or array of numbers (or array with nulls/undefined)",
      "options.removeNull: If true, skips null values",
      "options.removeUndefined: If true, skips undefined values",
      "options.removeNaN: If true, skips NaN values",
    ],
    returns: "number | null - The arithmetic mean of all numeric values",
    examples: [
      "s.mean(5) // 5",
      "s.mean([1, 2, 3, 4]) // 2.5",
      "s.mean([1, 2, null, 4], { removeNull: true }) // 2.33",
      "s.mean([1, NaN, 3], { removeNaN: true }) // 2",
      'df.groupBy("region").summarize({ avg: group => s.mean(group.sales) })',
    ],
    related: ["median", "mode", "sd", "round"],
    antiPatterns: [
      "❌ BAD: values.reduce((a, b) => a + b, 0) / values.length",
    ],
    bestPractices: [
      "✓ GOOD: s.mean(values) - built-in, faster, handles edge cases",
      "✓ GOOD: Use with df.columnName for direct access: s.mean(df.age)",
      "✓ GOOD: s.mean(values, { removeNull: true }) - for (number | null)[], returns number",
    ],
  },

  median: {
    name: "s.median",
    category: "stats",
    signature:
      "s.median(values: number[], options?: { removeNull?, removeUndefined?, removeNaN? }): number | null",
    description:
      "Calculate the median (50th percentile). Returns number for clean arrays, or number | null for arrays with nulls/undefined. Type inference narrows return type based on removal options.",
    imports: ['import { stats as s } from "@tidy-ts/dataframe";'],
    parameters: [
      "values: Array of numbers (or array with nulls/undefined)",
      "options.removeNull: If true, skips null values",
      "options.removeUndefined: If true, skips undefined values",
      "options.removeNaN: If true, skips NaN values",
    ],
    returns: "number for clean arrays, number | null for arrays with nulls",
    examples: [
      "s.median([1, 2, 3, 4, 5]) // 3 (number)",
      "s.median(df.sales) // number (if df.sales is clean)",
      "s.median([1, null, 3, 4]) // null (null present)",
      "s.median([1, null, 3, 4], { removeNull: true }) // 2.5",
      'df.groupBy("region").summarize({ median_price: group => s.median(group.price) })',
    ],
    related: ["mean", "quantile"],
    antiPatterns: [
      "❌ BAD: [...values].sort((a, b) => a - b)[Math.floor(values.length / 2)]",
    ],
    bestPractices: [
      "✓ GOOD: s.median(values) - handles even/odd lengths correctly",
      "✓ GOOD: For clean arrays, returns number - no assertions needed",
      "✓ GOOD: s.median(values, { removeNull: true }) - for (number | null)[], returns number",
    ],
  },

  sum: {
    name: "s.sum",
    category: "stats",
    signature:
      "s.sum(values: number[], options?: { removeNull?, removeUndefined?, removeNaN? }): number | null",
    description:
      "Calculate the sum of all values. Returns number for clean arrays, number | null for arrays with nulls/undefined. Type inference narrows return type based on input array type and removal options.",
    imports: ['import { stats as s } from "@tidy-ts/dataframe";'],
    parameters: [
      "values: Array of numbers (or array with nulls/undefined)",
      "options.removeNull: If true and array type is (number | null)[], returns number instead of number | null",
      "options.removeUndefined: If true and array type is (number | undefined)[], returns number instead of number | null",
      "options.removeNaN: If true, filters out NaN values (otherwise NaN propagates)",
    ],
    returns:
      "number for clean arrays or when appropriate removal flags are set; number | null otherwise",
    examples: [
      "// Clean arrays always return number",
      "s.sum([1, 2, 3, 4, 5]) // 15 (type: number)",
      "",
      "// Arrays with null/undefined return number | null by default",
      "const mixed: (number | null)[] = [1, 2, null, 4];",
      "s.sum(mixed) // null at runtime (type: number | null) - early return on null",
      "",
      "// Type inference: removeNull narrows (number | null)[] → number",
      "s.sum(mixed, { removeNull: true }) // 7 (type: number)",
      "",
      "// Type inference: both flags needed for (number | null | undefined)[]",
      "const full: (number | null | undefined)[] = [1, null, undefined, 4];",
      "s.sum(full, { removeNull: true, removeUndefined: true }) // 5 (type: number)",
      "",
      "// NaN handling (separate from type inference)",
      "s.sum([1, NaN, 3]) // NaN (NaN propagates by default)",
      "s.sum([1, NaN, 3], { removeNaN: true }) // 4",
      "",
      "// DataFrame usage",
      "s.sum(df.revenue) // number (if df.revenue is number[])",
      'df.groupBy("region").summarize({ total: group => s.sum(group.sales) })',
    ],
    related: ["mean", "cumsum", "product"],
    antiPatterns: [
      "❌ BAD: values.reduce((a, b) => a + b, 0) - doesn't handle null/undefined/NaN",
      "❌ BAD: s.sum(mixedArray)! - use { removeNull: true } for type safety instead of assertion",
    ],
    bestPractices: [
      "✓ GOOD: s.sum(values) - for clean number arrays, returns number",
      "✓ GOOD: s.sum(values, { removeNull: true }) - for (number | null)[], returns number",
      "✓ GOOD: Match removal flags to your array's nullable types for proper type inference",
    ],
  },

  max: {
    name: "s.max",
    category: "stats",
    signature:
      "s.max(values: number[], options?: { removeNull?, removeUndefined?, removeNaN? }): number | null",
    description:
      "Find the maximum value. Returns number for clean arrays, or number | null for arrays with nulls/undefined. Type inference narrows return type based on removal options.",
    imports: ['import { stats as s } from "@tidy-ts/dataframe";'],
    parameters: [
      "values: Array of numbers (or array with nulls/undefined)",
      "options.removeNull: If true, skips null values",
      "options.removeUndefined: If true, skips undefined values",
      "options.removeNaN: If true, skips NaN values (otherwise NaN propagates)",
    ],
    returns: "number for clean arrays, number | null for arrays with nulls",
    examples: [
      "s.max([1, 2, 3, 4, 5]) // 5 (number)",
      "s.max(df.price) // number (if df.price is clean)",
      "s.max([1, null, 3]) // null (null present)",
      "s.max([1, null, 3], { removeNull: true }) // 3",
      "s.max([1, NaN, 3], { removeNaN: true }) // 3",
      'df.groupBy("region").summarize({ max_price: group => s.max(group.price) })',
    ],
    bestPractices: [
      "✓ GOOD: For clean number arrays, returns number - no assertions needed",
      "✓ GOOD: s.max(values, { removeNull: true }) - for (number | null)[], returns number",
    ],
    related: ["min", "cummax"],
  },

  min: {
    name: "s.min",
    category: "stats",
    signature:
      "s.min(values: number[], options?: { removeNull?, removeUndefined?, removeNaN? }): number | null",
    description:
      "Find the minimum value. Returns number for clean arrays, or number | null for arrays with nulls/undefined. Type inference narrows return type based on removal options.",
    imports: ['import { stats as s } from "@tidy-ts/dataframe";'],
    parameters: [
      "values: Array of numbers (or array with nulls/undefined)",
      "options.removeNull: If true, skips null values",
      "options.removeUndefined: If true, skips undefined values",
      "options.removeNaN: If true, skips NaN values (otherwise NaN propagates)",
    ],
    returns: "number for clean arrays, number | null for arrays with nulls",
    examples: [
      "s.min([1, 2, 3, 4, 5]) // 1 (number)",
      "s.min(df.price) // number (if df.price is clean)",
      "s.min([1, null, 3]) // null (null present)",
      "s.min([1, null, 3], { removeNull: true }) // 1",
      "s.min([1, NaN, 3], { removeNaN: true }) // 1",
      'df.groupBy("region").summarize({ min_price: group => s.min(group.price) })',
    ],
    bestPractices: [
      "✓ GOOD: For clean number arrays, returns number - no assertions needed",
      "✓ GOOD: s.min(values, { removeNull: true }) - for (number | null)[], returns number",
    ],
    related: ["max", "cummin", "first", "last"],
  },

  first: {
    name: "s.first",
    category: "stats",
    signature:
      "s.first(values: T[], options?: { removeNull?, removeUndefined? }): T | null",
    description:
      "Get the first value from an array. Returns the first element, or null if array is empty. Type inference narrows return type based on removal options.",
    imports: ['import { stats as s } from "@tidy-ts/dataframe";'],
    parameters: [
      "values: Array of values, single value, or Date",
      "options.removeNull: If true, skips null values to find first valid",
      "options.removeUndefined: If true, skips undefined values",
    ],
    returns: "T | null - First value or null if empty",
    examples: [
      "s.first([1, 2, 3, 4, 5]) // 1",
      "s.first([null, 2, 3]) // null (first is null)",
      "s.first([null, 2, 3], { removeNull: true }) // 2",
      "s.first(42) // 42",
      "s.first([new Date('2023-01-01'), new Date('2023-01-02')]) // Date('2023-01-01')",
      "df.summarize({ first_price: group => s.first(group.price) })",
    ],
    related: ["last", "min", "max"],
    bestPractices: [
      "✓ GOOD: Use for time-series data to get opening values (e.g., OHLC pattern)",
      "✓ GOOD: Use { removeNull: true } to skip nulls at the start",
      "✓ GOOD: Works with dates, numbers, and other types",
    ],
  },

  last: {
    name: "s.last",
    category: "stats",
    signature:
      "s.last(values: T[], options?: { removeNull?, removeUndefined? }): T | null",
    description:
      "Get the last value from an array. Returns the last element, or null if array is empty. Type inference narrows return type based on removal options.",
    imports: ['import { stats as s } from "@tidy-ts/dataframe";'],
    parameters: [
      "values: Array of values, single value, or Date",
      "options.removeNull: If true, skips null values to find last valid",
      "options.removeUndefined: If true, skips undefined values",
    ],
    returns: "T | null - Last value or null if empty",
    examples: [
      "s.last([1, 2, 3, 4, 5]) // 5",
      "s.last([1, 2, null]) // null (last is null)",
      "s.last([1, 2, null], { removeNull: true }) // 2",
      "s.last(42) // 42",
      "s.last([new Date('2023-01-01'), new Date('2023-01-02')]) // Date('2023-01-02')",
      "df.summarize({ last_price: group => s.last(group.price) })",
    ],
    related: ["first", "min", "max"],
    bestPractices: [
      "✓ GOOD: Use for time-series data to get closing values (e.g., OHLC pattern)",
      "✓ GOOD: Use { removeNull: true } to skip nulls at the end",
      "✓ GOOD: Works with dates, numbers, and other types",
    ],
  },

  mode: {
    name: "s.mode",
    category: "stats",
    signature:
      "s.mode(values: number[], options?: { removeNull?, removeUndefined?, removeNaN? }): number | null",
    description:
      "Calculate the mode (most frequent value) of an array. Returns null if no valid values. Type inference narrows return type based on removal options.",
    imports: ['import { stats as s } from "@tidy-ts/dataframe";'],
    parameters: [
      "values: Array of numbers or single number",
      "options.removeNull: If true, skips null values",
      "options.removeUndefined: If true, skips undefined values",
      "options.removeNaN: If true, skips NaN values",
    ],
    returns: "number | null",
    examples: [
      "s.mode(42) // 42",
      "s.mode([1, 1, 2, 3, 3, 3]) // 3",
      "s.mode([null, 2, 3]) // null (null present)",
      "s.mode([null, 2, 3], { removeNull: true }) // 2 or 3",
    ],
    related: ["mean", "median", "unique"],
  },

  product: {
    name: "s.product",
    category: "stats",
    signature:
      "s.product(values: number[], options?: { removeNull?, removeUndefined?, removeNaN? }): number | null",
    description:
      "Calculate the product (multiplication) of all values. Returns null if no valid values. Type inference narrows return type based on removal options.",
    imports: ['import { stats as s } from "@tidy-ts/dataframe";'],
    parameters: [
      "values: Array of numbers or single number",
      "options.removeNull: If true, skips null values",
      "options.removeUndefined: If true, skips undefined values",
      "options.removeNaN: If true, skips NaN values",
    ],
    returns: "number | null",
    examples: [
      "s.product(5) // 5",
      "s.product([1, 2, 3, 4]) // 24",
      "s.product([2, null, 3]) // null (null present)",
      "s.product([2, null, 3], { removeNull: true }) // 6",
    ],
    related: ["sum", "cumprod"],
  },
};
