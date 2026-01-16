import type { DocEntry } from "../mcp-types.ts";

export const descriptiveDocs: Record<string, DocEntry> = {
  mean: {
    name: "s.mean",
    category: "stats",
    signature: "s.mean(values: number[], removeNA?: boolean): number | null",
    description:
      "Calculate the arithmetic mean (average) of numeric values. Returns null if no valid values. Can be chained with s.round() without assertions.",
    imports: ['import { stats as s } from "@tidy-ts/dataframe";'],
    parameters: [
      "values: A single number or array of numbers",
      "removeNA: Whether to exclude null/undefined values (when using mixed arrays)",
    ],
    returns: "number | null - The arithmetic mean of all numeric values",
    examples: [
      "s.mean(5) // 5",
      "s.mean([1, 2, 3, 4]) // 2.5",
      "s.mean([1, 2, null, 4], true) // 2.33",
      'df.groupBy("region").summarize({ avg: group => s.mean(group.sales) })',
      "// Chain with s.round() - no assertions needed!",
      'df.groupBy("region").summarize({ avg: group => s.round(s.mean(group.sales), 2) })',
    ],
    related: ["median", "mode", "sd", "round"],
    antiPatterns: [
      "❌ BAD: values.reduce((a, b) => a + b, 0) / values.length",
      "❌ BAD: s.round(s.mean(values)!, 2) // Unnecessary - s.round() handles null at runtime",
    ],
    bestPractices: [
      "✓ GOOD: s.mean(values) - built-in, faster, handles edge cases",
      "✓ GOOD: Use with df.columnName for direct access: s.mean(df.age)",
      "✓ GOOD: Chain with s.round() directly: s.round(s.mean(values), 2) - no assertions needed",
      "✓ GOOD: s.round() handles null at runtime, so no need for s.round(s.mean(values)!, 2)",
    ],
  },

  median: {
    name: "s.median",
    category: "stats",
    signature:
      "s.median(values: number[]): number | s.median(values: (number | null)[], removeNA?: boolean): number | null",
    description:
      "Calculate the median (50th percentile). Returns number for clean arrays, or number | null for arrays with nulls/mixed types (when removeNA=false, the default).",
    imports: ['import { stats as s } from "@tidy-ts/dataframe";'],
    parameters: [
      "values: Array of numbers (or array with nulls)",
      "removeNA: If true, guarantees number return; if false (default), may return null",
    ],
    returns: "number for clean arrays, number | null for arrays with nulls",
    examples: [
      "s.median([1, 2, 3, 4, 5]) // 3 (number)",
      "s.median(df.sales) // number (if df.sales is clean)",
      "s.median([1, null, 3, 4]) // 2.5 (number | null - may be null if no valid values)",
      'df.groupBy("region").summarize({ median_price: group => s.median(group.price) })',
    ],
    related: ["mean", "quantile"],
    antiPatterns: [
      "❌ BAD: [...values].sort((a, b) => a - b)[Math.floor(values.length / 2)]",
      "❌ BAD: s.median(values)! // May be unnecessary - check if array has nulls first",
    ],
    bestPractices: [
      "✓ GOOD: s.median(values) - handles even/odd lengths correctly",
      "✓ GOOD: For clean arrays, returns number - no assertions needed",
      "✓ GOOD: For arrays with nulls, returns number | null - handle null appropriately",
    ],
  },

  sum: {
    name: "s.sum",
    category: "stats",
    signature: "s.sum(values: number[]): number",
    description: "Calculate the sum of all values.",
    imports: ['import { stats as s } from "@tidy-ts/dataframe";'],
    parameters: ["values: Array of numbers"],
    returns: "number",
    examples: [
      "s.sum([1, 2, 3, 4, 5]) // 15",
      "s.sum(df.revenue)",
      'df.groupBy("region").summarize({ total: group => s.sum(group.sales) })',
    ],
    related: ["mean", "cumsum"],
    antiPatterns: [
      "❌ BAD: values.reduce((a, b) => a + b, 0)",
    ],
    bestPractices: [
      "✓ GOOD: s.sum(values) - clearer intent, handles edge cases",
    ],
  },

  max: {
    name: "s.max",
    category: "stats",
    signature:
      "s.max(values: number[]): number | s.max(values: (number | null)[], removeNA?: boolean): number | null",
    description:
      "Find the maximum value. Returns number for clean arrays, or number | null for arrays with nulls/mixed types (when removeNA=false, the default).",
    imports: ['import { stats as s } from "@tidy-ts/dataframe";'],
    parameters: [
      "values: Array of numbers (or array with nulls)",
      "removeNA: If true, guarantees number return; if false (default), may return null",
    ],
    returns: "number for clean arrays, number | null for arrays with nulls",
    examples: [
      "s.max([1, 2, 3, 4, 5]) // 5 (number)",
      "s.max(df.price) // number (if df.price is clean)",
      "s.max([1, null, 3]) // 3 (number | null - may be null if no valid values)",
      'df.groupBy("region").summarize({ max_price: group => s.max(group.price) })',
    ],
    bestPractices: [
      "✓ GOOD: For clean number arrays, returns number - no assertions needed",
      "✓ GOOD: For arrays with nulls, returns number | null - handle null appropriately",
      "✓ GOOD: Use removeNA: true if you want guaranteed number return",
    ],
    related: ["min", "cummax"],
  },

  min: {
    name: "s.min",
    category: "stats",
    signature:
      "s.min(values: number[]): number | s.min(values: (number | null)[], removeNA?: boolean): number | null",
    description:
      "Find the minimum value. Returns number for clean arrays, or number | null for arrays with nulls/mixed types (when removeNA=false, the default).",
    imports: ['import { stats as s } from "@tidy-ts/dataframe";'],
    parameters: [
      "values: Array of numbers (or array with nulls)",
      "removeNA: If true, guarantees number return; if false (default), may return null",
    ],
    returns: "number for clean arrays, number | null for arrays with nulls",
    examples: [
      "s.min([1, 2, 3, 4, 5]) // 1 (number)",
      "s.min(df.price) // number (if df.price is clean)",
      "s.min([1, null, 3]) // 1 (number | null - may be null if no valid values)",
      'df.groupBy("region").summarize({ min_price: group => s.min(group.price) })',
    ],
    bestPractices: [
      "✓ GOOD: For clean number arrays, returns number - no assertions needed",
      "✓ GOOD: For arrays with nulls, returns number | null - handle null appropriately",
      "✓ GOOD: Use removeNA: true if you want guaranteed number return",
    ],
    related: ["max", "cummin", "first", "last"],
  },

  first: {
    name: "s.first",
    category: "stats",
    signature: "s.first(values: T[] | T, removeNA?: boolean): T | null",
    description:
      "Get the first value from an array. Returns the first element, or null if array is empty. Supports single values, dates, and arrays with nulls (when removeNA=true).",
    imports: ['import { stats as s } from "@tidy-ts/dataframe";'],
    parameters: [
      "values: Array of values, single value, or Date",
      "removeNA: If true, returns first non-null value; if false (default), returns first element (may be null)",
    ],
    returns: "T | null - First value or null if empty",
    examples: [
      "s.first([1, 2, 3, 4, 5]) // 1",
      "s.first([null, 2, 3], false) // null",
      "s.first([null, 2, 3], true) // 2",
      "s.first(42) // 42",
      "s.first([new Date('2023-01-01'), new Date('2023-01-02')]) // Date('2023-01-01')",
      "df.summarize({ first_price: group => s.first(group.price) })",
    ],
    related: ["last", "min", "max"],
    bestPractices: [
      "✓ GOOD: Use for time-series data to get opening values (e.g., OHLC pattern)",
      "✓ GOOD: Use removeNA=true to skip nulls at the start",
      "✓ GOOD: Works with dates, numbers, and other types",
    ],
  },

  last: {
    name: "s.last",
    category: "stats",
    signature: "s.last(values: T[] | T, removeNA?: boolean): T | null",
    description:
      "Get the last value from an array. Returns the last element, or null if array is empty. Supports single values, dates, and arrays with nulls (when removeNA=true).",
    imports: ['import { stats as s } from "@tidy-ts/dataframe";'],
    parameters: [
      "values: Array of values, single value, or Date",
      "removeNA: If true, returns last non-null value; if false (default), returns last element (may be null)",
    ],
    returns: "T | null - Last value or null if empty",
    examples: [
      "s.last([1, 2, 3, 4, 5]) // 5",
      "s.last([1, 2, null], false) // null",
      "s.last([1, 2, null], true) // 2",
      "s.last(42) // 42",
      "s.last([new Date('2023-01-01'), new Date('2023-01-02')]) // Date('2023-01-02')",
      "df.summarize({ last_price: group => s.last(group.price) })",
    ],
    related: ["first", "min", "max"],
    bestPractices: [
      "✓ GOOD: Use for time-series data to get closing values (e.g., OHLC pattern)",
      "✓ GOOD: Use removeNA=true to skip nulls at the end",
      "✓ GOOD: Works with dates, numbers, and other types",
    ],
  },

  mode: {
    name: "s.mode",
    category: "stats",
    signature: "s.mode(values: number[], removeNA?: boolean): number | null",
    description:
      "Calculate the mode (most frequent value) of an array. Returns null if no valid values and removeNA=false.",
    imports: ['import { stats as s } from "@tidy-ts/dataframe";'],
    parameters: [
      "values: Array of numbers or single number",
      "removeNA: If true, guarantees a number return (throws if no valid values)",
    ],
    returns: "number | null",
    examples: [
      "s.mode(42) // Always returns the single value",
      "s.mode([1, 1, 2, 3, 3, 3]) // 3 (always number for clean array)",
      "s.mode([null, 2, 3], false) // 3 (or null if no valid values)",
      "s.mode([null, 2, 3], true) // 3 (guaranteed number or throws)",
    ],
    related: ["mean", "median", "unique"],
  },

  product: {
    name: "s.product",
    category: "stats",
    signature: "s.product(values: number[], removeNA?: boolean): number | null",
    description:
      "Calculate the product (multiplication) of all values. Returns null if no valid values.",
    imports: ['import { stats as s } from "@tidy-ts/dataframe";'],
    parameters: [
      "values: Array of numbers or single number",
      "removeNA: If true, guarantees a number return (throws if no valid values)",
    ],
    returns: "number | null",
    examples: [
      "s.product(5) // 5",
      "s.product([1, 2, 3, 4]) // 24",
      "s.product([2, null, 3], false) // null (due to null)",
      "s.product([2, null, 3], true) // 6 (ignoring null)",
    ],
    related: ["sum", "cumprod"],
  },
};
