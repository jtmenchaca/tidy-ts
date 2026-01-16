import type { DocEntry } from "../mcp-types.ts";

export const windowDocs: Record<string, DocEntry> = {
  rolling: {
    name: "s.rolling",
    category: "stats",
    signature:
      "s.rolling({ column: string, windowSize: number, fn: (window: T[]) => R }): (row, index, df) => R OR s.rolling({ values: T[], windowSize: number, fn: (window: T[]) => R }): R[]",
    description:
      "Apply a function over a rolling window of values. Supports both array-based usage and DataFrame column usage (for mutate operations). The window includes the current value and the previous (windowSize - 1) values.",
    imports: ['import { stats as s } from "@tidy-ts/dataframe";'],
    parameters: [
      "options: Configuration object",
      "  - column: Column name (for DataFrame operations) OR",
      "  - values: Array of values (for array-based usage)",
      "  - windowSize: Size of the rolling window (number of values to include)",
      "  - fn: Function to apply to each window - receives array of window values, returns single value",
    ],
    returns:
      "Array of results (array-based) OR function for mutate operations (column-based)",
    examples: [
      "// DataFrame column usage",
      'df.mutate({ rolling_mean: s.rolling({ column: "price", windowSize: 3, fn: s.mean }) })',
      'df.mutate({ rolling_sum: s.rolling({ column: "value", windowSize: 2, fn: s.sum }) })',
      "// Array-based usage",
      "s.rolling({ values: [1, 2, 3, 4, 5], windowSize: 3, fn: s.mean }) // [1, 1.5, 2, 3, 4]",
      "// Custom function",
      'df.mutate({ rolling_max: s.rolling({ column: "value", windowSize: 2, fn: (window) => Math.max(...window) }) })',
    ],
    related: ["cumsum", "cummean", "lag", "lead"],
    bestPractices: [
      "✓ GOOD: Use for moving averages, rolling sums, and other window-based calculations",
      "✓ GOOD: Window size determines how many previous values to include",
      "✓ GOOD: First few values use smaller windows (partial windows)",
      "✓ GOOD: Works with any aggregation function (s.mean, s.sum, s.max, s.min, etc.)",
    ],
    antiPatterns: [
      "❌ BAD: Manually slicing arrays and applying functions - use s.rolling() instead",
    ],
  },

  lag: {
    name: "s.lag",
    category: "stats",
    signature:
      "s.lag(values: T[], k?: number, defaultValue?: T): (T | undefined)[] OR s.lag(columnName: string, k?: number, defaultValue?: T): (row, index, df) => T | undefined",
    description:
      "Lag values by k positions (shift forward, filling with default). Supports two usage patterns: array-based and column-based (for use in mutate).",
    imports: ['import { stats as s } from "@tidy-ts/dataframe";'],
    parameters: [
      "valuesOrColumnName: Array of values to lag OR column name for DataFrame operations",
      "k: Number of positions to lag (default: 1)",
      "defaultValue: Value to fill missing positions (default: undefined)",
    ],
    returns:
      "Array with values lagged by k positions OR function for mutate operations",
    examples: [
      "// Array-based usage",
      "s.lag([1, 2, 3, 4, 5])  // [undefined, 1, 2, 3, 4]",
      "s.lag([1, 2, 3, 4, 5], 2)  // [undefined, undefined, 1, 2, 3]",
      "s.lag([1, 2, 3, 4, 5], 1, 0)  // [0, 1, 2, 3, 4]",
      "// Column-based usage in mutate",
      'df.mutate({ prev_sales: s.lag("sales", 1, 0) })',
    ],
    related: ["lead"],
  },

  lead: {
    name: "s.lead",
    category: "stats",
    signature:
      "s.lead(values: T[], k?: number, defaultValue?: T): (T | undefined)[] OR s.lead(columnName: string, k?: number, defaultValue?: T): (row, index, df) => T | undefined",
    description:
      "Lead values by k positions (shift backward, filling with default). Supports two usage patterns: array-based and column-based (for use in mutate).",
    imports: ['import { stats as s } from "@tidy-ts/dataframe";'],
    parameters: [
      "valuesOrColumnName: Array of values to lead OR column name for DataFrame operations",
      "k: Number of positions to lead (default: 1)",
      "defaultValue: Value to fill missing positions (default: undefined)",
    ],
    returns:
      "Array with values led by k positions OR function for mutate operations",
    examples: [
      "// Array-based usage",
      "s.lead([1, 2, 3, 4, 5])  // [2, 3, 4, 5, undefined]",
      "s.lead([1, 2, 3, 4, 5], 2)  // [3, 4, 5, undefined, undefined]",
      "s.lead([1, 2, 3, 4, 5], 1, 0)  // [2, 3, 4, 5, 0]",
      "// Column-based usage in mutate",
      'df.mutate({ next_sales: s.lead("sales", 1, 0) })',
    ],
    related: ["lag", "forwardFill", "backwardFill"],
  },

  forwardFill: {
    name: "s.forwardFill",
    category: "stats",
    signature: "s.forwardFill(values: T[]): T[]",
    description:
      "Forward fill null/undefined values in an array. Replaces null/undefined values with the last non-null value before them. Values at the start that are null/undefined remain null/undefined. Returns a new array with filled values.",
    imports: ['import { stats as s } from "@tidy-ts/dataframe";'],
    parameters: [
      "values: Array of values (may contain null/undefined)",
    ],
    returns: "T[] - Array with forward-filled values",
    examples: [
      "s.forwardFill([10, null, null, 20, null]) // [10, 10, 10, 20, 20]",
      "s.forwardFill([10, undefined, null, 20]) // [10, 10, 10, 20]",
      "s.forwardFill([null, null, 10, 20]) // [null, null, 10, 20]",
      "// Use in upsample for filling",
      'df.upsample({ timeColumn: "timestamp", frequency: "1H", fillMethod: "forward" })',
      "// Use with wrapper in rolling",
      'df.mutate({ filled: s.rolling({ column: "value", windowSize: 2, fn: (window) => s.forwardFill(window)[window.length - 1] }) })',
    ],
    related: ["backwardFill", "lag", "lead"],
    bestPractices: [
      "✓ GOOD: Use for time-series data where you want to carry forward the last known value",
      "✓ GOOD: Only fills null and undefined values - other values remain unchanged",
      "✓ GOOD: Returns a new array - does not modify the original",
      "✓ GOOD: Use with upsample() for filling time-series data",
    ],
    antiPatterns: [
      "❌ BAD: Expecting values at the start to be filled - they remain null/undefined",
    ],
  },

  backwardFill: {
    name: "s.backwardFill",
    category: "stats",
    signature: "s.backwardFill(values: T[]): T[]",
    description:
      "Backward fill null/undefined values in an array. Replaces null/undefined values with the next non-null value after them. Values at the end that are null/undefined remain null/undefined. Returns a new array with filled values.",
    imports: ['import { stats as s } from "@tidy-ts/dataframe";'],
    parameters: [
      "values: Array of values (may contain null/undefined)",
    ],
    returns: "T[] - Array with backward-filled values",
    examples: [
      "s.backwardFill([null, null, 10, null, 20]) // [10, 10, 10, 20, 20]",
      "s.backwardFill([null, undefined, 10, 20]) // [10, 10, 10, 20]",
      "s.backwardFill([10, 20, null, null]) // [10, 20, null, null]",
      "// Use in upsample for filling",
      'df.upsample({ timeColumn: "timestamp", frequency: "1H", fillMethod: "backward" })',
      "// Use with wrapper in downsample",
      'df.downsample({ timeColumn: "timestamp", frequency: "1D", aggregations: { price: (values) => s.backwardFill(values)[values.length - 1] } })',
    ],
    related: ["forwardFill", "lag", "lead"],
    bestPractices: [
      "✓ GOOD: Use when you want to fill missing values from future observations",
      "✓ GOOD: Only fills null and undefined values - other values remain unchanged",
      "✓ GOOD: Returns a new array - does not modify the original",
      "✓ GOOD: Use with upsample() for filling time-series data",
    ],
    antiPatterns: [
      "❌ BAD: Expecting values at the end to be filled - they remain null/undefined",
    ],
  },

  interpolate: {
    name: "s.interpolate",
    category: "stats",
    signature:
      "s.interpolate<T extends number | Date>(values: (T | null | undefined)[], xValues: (number | Date)[], method: 'linear' | 'spline'): T[]",
    description:
      "Interpolate null/undefined values in an array using linear or spline interpolation. Requires an x-axis array to define spacing between points. Interpolates missing values by estimating them based on surrounding known values. Unlike forward/backward fill (which copy values), interpolation calculates intermediate values using mathematical methods.",
    imports: ['import { stats as s } from "@tidy-ts/dataframe";'],
    parameters: [
      "values: Array of values (may contain nulls) - numbers or Dates",
      "xValues: Array of numeric or Date values defining x-axis spacing (required)",
      "method: Interpolation method - 'linear' or 'spline'",
    ],
    returns: "T[] - Array with interpolated values (same length as input)",
    examples: [
      "// Linear interpolation with numbers\ns.interpolate([100, null, null, 200], [1, 2, 3, 4], 'linear')\n// Returns: [100, 133.33, 166.67, 200]",
      "// Spline interpolation\ns.interpolate([100, null, null, 200], [1, 2, 3, 4], 'spline')",
      "// With Dates\nconst dates = [new Date('2023-01-01'), null, null, new Date('2023-01-04')];\ns.interpolate(dates, [1, 2, 3, 4], 'linear')",
      "// Use in mutate for DataFrame operations\ndf.mutate({\n  interpolated: s.rolling({ column: 'value', windowSize: 3, fn: (window) => {\n    return s.interpolate(window, [1, 2, 3], 'linear')[1];\n  } })\n})",
    ],
    related: ["forwardFill", "backwardFill", "lag", "lead"],
    bestPractices: [
      "✓ GOOD: Use for time-series data where you want to estimate missing values based on surrounding data",
      "✓ GOOD: Linear interpolation is faster and works with fewer points",
      "✓ GOOD: Spline interpolation provides smoother curves but requires at least 4 points",
      "✓ GOOD: Only interpolates values that have both previous and next non-null values",
    ],
    antiPatterns: [
      "❌ BAD: Expecting leading/trailing nulls to be interpolated - they remain null (no bounds)",
      "❌ BAD: Using spline with fewer than 4 points - falls back to linear",
      "❌ BAD: Arrays must have same length - values and xValues must match",
    ],
  },
};
