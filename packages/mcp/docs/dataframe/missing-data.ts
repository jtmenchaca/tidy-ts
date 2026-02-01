import type { DocEntry } from "../mcp-types.ts";

export const missingDataDocs: Record<string, DocEntry> = {
  replaceNull: {
    name: "replaceNull",
    category: "dataframe",
    signature:
      "replaceNull(mapping: Partial<{ [K in keyof T]: T[K] }>): DataFrame<T>",
    description:
      "Replace null values with fixed values in specified columns. Does not replace undefined. Pair with replaceUndefined to replace both; use removeNull/removeUndefined to drop rows instead (and get type narrowing).",
    imports: ['import { createDataFrame } from "@tidy-ts/dataframe";'],
    parameters: ["mapping: Object mapping column names to replacement values"],
    returns: "DataFrame with nulls replaced",
    examples: [
      'df.replaceNull({ name: "Unknown", age: 0 })',
      "df.replaceNull({ score: -1 }) // Only replace null in score",
    ],
    related: ["replaceUndefined", "removeNull", "removeUndefined"],
    bestPractices: [
      "✓ GOOD: Only replaces null, not undefined or other falsy values",
      "✓ GOOD: Chain with replaceUndefined to replace both null and undefined",
      "✓ GOOD: To drop rows with null/undefined instead of replacing, use removeNull/removeUndefined for type inference",
    ],
  },

  replaceUndefined: {
    name: "replaceUndefined",
    category: "dataframe",
    signature:
      "replaceUndefined(mapping: Partial<{ [K in keyof T]: T[K] }>): DataFrame<T>",
    description:
      "Replace undefined values with fixed values in specified columns. Does not replace null. Pair with replaceNull to replace both; use removeNull/removeUndefined to drop rows instead (and get type narrowing).",
    imports: ['import { createDataFrame } from "@tidy-ts/dataframe";'],
    parameters: ["mapping: Object mapping column names to replacement values"],
    returns: "DataFrame with undefined replaced",
    examples: [
      'df.replaceUndefined({ name: "Unknown", age: 0 })',
      "df.replaceUndefined({ email: '' }) // Only replace undefined in email",
    ],
    related: ["replaceNull", "removeNull", "removeUndefined"],
    bestPractices: [
      "✓ GOOD: Only replaces undefined, not null or other falsy values",
      "✓ GOOD: Chain with replaceNull to replace both null and undefined",
      "✓ GOOD: To drop rows with null/undefined instead of replacing, use removeNull/removeUndefined for type inference",
    ],
  },

  replaceNA: {
    name: "replaceNA",
    category: "dataframe",
    signature:
      "replaceNA(mapping: Partial<{ [K in keyof T]: T[K] }>): DataFrame<T>",
    description:
      "Replace null/undefined values with fixed values in specified columns. Deprecated: use replaceNull and replaceUndefined instead.",
    imports: ['import { createDataFrame } from "@tidy-ts/dataframe";'],
    parameters: ["mapping: Object mapping column names to replacement values"],
    returns: "DataFrame with replaced values",
    examples: [
      'df.replaceNA({ name: "Unknown", age: 0, score: -1 })',
      "df.replaceNA({ salary: 0 }) // Only replace salary nulls",
    ],
    related: [
      "replaceNull",
      "replaceUndefined",
      "removeNull",
      "removeUndefined",
    ],
    bestPractices: [
      "✓ GOOD: Prefer replaceNull and replaceUndefined for explicit control",
      "✓ GOOD: Only replaces null and undefined, not other falsy values like 0 or ''",
    ],
  },

  removeNull: {
    name: "removeNull",
    category: "dataframe",
    signature:
      "removeNull(field: keyof T, ...fields: (keyof T)[]): DataFrame<...>",
    description:
      "Remove rows where specified field(s) are null. Automatically narrows the TypeScript type to exclude null from those fields. Prefer over filter() when dropping nulls: filter() cannot narrow types, so removeNull/removeUndefined give correct type inference downstream.",
    imports: ['import { createDataFrame } from "@tidy-ts/dataframe";'],
    parameters: [
      "field: First field to check",
      "...fields: Additional fields to check",
    ],
    returns: "DataFrame with type narrowed to exclude null",
    examples: [
      'df.removeNull("score") // Remove rows with null score',
      'df.removeNull("age", "name") // Remove rows with null in either field',
    ],
    related: ["removeUndefined", "replaceNull", "replaceUndefined"],
    bestPractices: [
      "✓ GOOD: Use removeNull/removeUndefined when dropping NA rows — types narrow so TypeScript knows fields are non-null/non-undefined",
      "✓ GOOD: Prefer over filter(row => row.x != null) when you need type inference; filter alone does not narrow row types",
    ],
  },

  removeUndefined: {
    name: "removeUndefined",
    category: "dataframe",
    signature:
      "removeUndefined(field: keyof T, ...fields: (keyof T)[]): DataFrame<...>",
    description:
      "Remove rows where specified field(s) are undefined. Automatically narrows the TypeScript type to exclude undefined from those fields. Prefer over filter() when dropping undefined: filter() cannot narrow types, so removeNull/removeUndefined give correct type inference downstream.",
    imports: ['import { createDataFrame } from "@tidy-ts/dataframe";'],
    parameters: [
      "field: First field to check",
      "...fields: Additional fields to check",
    ],
    returns: "DataFrame with type narrowed to exclude undefined",
    examples: [
      'df.removeUndefined("email") // Remove rows with undefined email',
      'df.removeUndefined("age", "name") // Remove rows with undefined in either field',
    ],
    related: ["removeNull", "replaceNull", "replaceUndefined"],
    bestPractices: [
      "✓ GOOD: Use removeNull/removeUndefined when dropping NA rows — types narrow so TypeScript knows fields are non-null/non-undefined",
      "✓ GOOD: Prefer over filter(row => row.x !== undefined) when you need type inference; filter alone does not narrow row types",
    ],
  },

  fillForward: {
    name: "fillForward",
    category: "dataframe",
    signature:
      "fillForward(...columnNames: (keyof T & string)[]): DataFrame<T>",
    description:
      "Forward fill null/undefined values in specified columns. Replaces null/undefined values with the last non-null value before them. Values at the start that are null/undefined remain null/undefined.",
    imports: ['import { createDataFrame } from "@tidy-ts/dataframe";'],
    parameters: [
      "...columnNames: Column name(s) to forward fill",
    ],
    returns: "DataFrame with forward-filled values",
    examples: [
      '// Forward fill a single column\nconst df = createDataFrame([\n  { value: 10 },\n  { value: null },\n  { value: null },\n  { value: 20 },\n  { value: null },\n]);\nconst filled = df.fillForward("value")\n// Result:\n// { value: 10 }\n// { value: 10 }  // filled from previous\n// { value: 10 }  // filled from previous\n// { value: 20 }\n// { value: 20 }  // filled from previous',
      '// Forward fill multiple columns\ndf.fillForward("price", "volume")',
      '// Common use case: time series with missing values\nconst timeSeries = createDataFrame([\n  { timestamp: new Date("2023-01-01"), price: 100 },\n  { timestamp: new Date("2023-01-02"), price: null },\n  { timestamp: new Date("2023-01-03"), price: null },\n  { timestamp: new Date("2023-01-04"), price: 110 },\n]);\ntimeSeries.fillForward("price")',
    ],
    related: ["fillBackward", "replaceNull", "replaceUndefined"],
    bestPractices: [
      "✓ GOOD: Use for time-series data where you want to carry forward the last known value",
      "✓ GOOD: Only fills null and undefined values - other values remain unchanged",
      "✓ GOOD: Creates a new DataFrame without modifying the original",
    ],
    antiPatterns: [
      "❌ BAD: Expecting values at the start to be filled - they remain null/undefined",
      "❌ BAD: Using on non-time-series data where backward fill might be more appropriate",
    ],
  },

  fillBackward: {
    name: "fillBackward",
    category: "dataframe",
    signature:
      "fillBackward(...columnNames: (keyof T & string)[]): DataFrame<T>",
    description:
      "Backward fill null/undefined values in specified columns. Replaces null/undefined values with the next non-null value after them. Values at the end that are null/undefined remain null/undefined.",
    imports: ['import { createDataFrame } from "@tidy-ts/dataframe";'],
    parameters: [
      "...columnNames: Column name(s) to backward fill",
    ],
    returns: "DataFrame with backward-filled values",
    examples: [
      '// Backward fill a single column\nconst df = createDataFrame([\n  { value: null },\n  { value: null },\n  { value: 10 },\n  { value: null },\n  { value: 20 },\n]);\nconst filled = df.fillBackward("value")\n// Result:\n// { value: 10 }  // filled from next\n// { value: 10 }  // filled from next\n// { value: 10 }\n// { value: 20 }  // filled from next\n// { value: 20 }',
      '// Backward fill multiple columns\ndf.fillBackward("price", "volume")',
      '// Common use case: time series with missing values\nconst timeSeries = createDataFrame([\n  { timestamp: new Date("2023-01-01"), price: null },\n  { timestamp: new Date("2023-01-02"), price: null },\n  { timestamp: new Date("2023-01-03"), price: 100 },\n  { timestamp: new Date("2023-01-04"), price: null },\n]);\ntimeSeries.fillBackward("price")',
    ],
    related: ["fillForward", "replaceNull", "replaceUndefined"],
    bestPractices: [
      "✓ GOOD: Use when you want to fill missing values from future observations",
      "✓ GOOD: Only fills null and undefined values - other values remain unchanged",
      "✓ GOOD: Creates a new DataFrame without modifying the original",
    ],
    antiPatterns: [
      "❌ BAD: Expecting values at the end to be filled - they remain null/undefined",
      "❌ BAD: Using on non-time-series data where forward fill might be more appropriate",
    ],
  },

  interpolate: {
    name: "interpolate",
    category: "dataframe",
    signature:
      "interpolate<ValueCol extends keyof T & string, XCol extends keyof T & string>(valueColumn: ValueCol, xColumn: XCol, method: 'linear' | 'spline'): DataFrame<T>",
    description:
      "Interpolate null/undefined values in a column using linear or spline interpolation. Requires an x-axis column to define spacing between points. Interpolates missing values by estimating them based on surrounding known values.",
    imports: [
      'import { createDataFrame, stats as s } from "@tidy-ts/dataframe";',
    ],
    parameters: [
      "valueColumn: Column name containing values to interpolate (numbers or Dates)",
      "xColumn: Column name containing x-axis values (numeric or Date, required)",
      "method: Interpolation method - 'linear' or 'spline'",
    ],
    returns: "DataFrame with interpolated values replacing nulls",
    examples: [
      '// Linear interpolation with numeric x-axis\nconst df = createDataFrame([\n  { timestamp: 1, value: 100 },\n  { timestamp: 2, value: null },\n  { timestamp: 3, value: null },\n  { timestamp: 4, value: 200 },\n]);\ndf.interpolate("value", "timestamp", "linear")\n// Results in interpolated values for the null entries',
      '// Linear interpolation with Date x-axis\ndf.interpolate("price", "date", "linear")',
      '// Spline interpolation\ndf.interpolate("temperature", "timestamp", "spline")',
      '// Common use case: time series with missing values\nconst timeSeries = createDataFrame([\n  { timestamp: new Date("2023-01-01"), price: 100 },\n  { timestamp: new Date("2023-01-02"), price: null },\n  { timestamp: new Date("2023-01-03"), price: null },\n  { timestamp: new Date("2023-01-04"), price: 110 },\n]);\ntimeSeries.interpolate("price", "timestamp", "linear")',
    ],
    related: ["fillForward", "fillBackward", "upsample"],
    bestPractices: [
      "✓ GOOD: Use for time-series data where you want to estimate missing values based on surrounding data",
      "✓ GOOD: Linear interpolation is faster and works with fewer points",
      "✓ GOOD: Spline interpolation provides smoother curves but requires at least 4 points",
      "✓ GOOD: Only interpolates values that have both previous and next non-null values",
    ],
    antiPatterns: [
      "❌ BAD: Expecting leading/trailing nulls to be interpolated - they remain null (no bounds)",
      "❌ BAD: Using spline with fewer than 4 points - falls back to linear",
    ],
  },
};
