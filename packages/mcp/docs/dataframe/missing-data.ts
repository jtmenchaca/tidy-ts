import type { DocEntry } from "../mcp-types.ts";

export const missingDataDocs: Record<string, DocEntry> = {
  replaceNA: {
    name: "replaceNA",
    category: "dataframe",
    signature:
      "replaceNA(mapping: Partial<{ [K in keyof T]: T[K] }>): DataFrame<T>",
    description:
      "Replace null/undefined values with fixed values in specified columns.",
    imports: ['import { createDataFrame } from "@tidy-ts/dataframe";'],
    parameters: ["mapping: Object mapping column names to replacement values"],
    returns: "DataFrame with replaced values",
    examples: [
      'df.replaceNA({ name: "Unknown", age: 0, score: -1 })',
      "df.replaceNA({ salary: 0 }) // Only replace salary nulls",
    ],
    related: ["removeNA", "removeNull", "removeUndefined"],
    bestPractices: [
      "✓ GOOD: Only replaces null and undefined, not other falsy values like 0 or ''",
      "✓ GOOD: Can specify different replacements for different columns",
    ],
  },

  removeNA: {
    name: "removeNA",
    category: "dataframe",
    signature:
      "removeNA(field: keyof T, ...fields: (keyof T)[]): DataFrame<...>",
    description:
      "Remove rows where specified field(s) are null or undefined. Automatically narrows types.",
    imports: ['import { createDataFrame } from "@tidy-ts/dataframe";'],
    parameters: [
      "field: First field to check",
      "...fields: Additional fields to check (all must be non-null)",
    ],
    returns: "DataFrame with narrowed types excluding null/undefined",
    examples: [
      'df.removeNA("age") // Remove rows with null/undefined age',
      'df.removeNA("age", "name") // Remove rows with null/undefined in either field',
    ],
    related: ["removeNull", "removeUndefined", "replaceNA", "filter"],
    bestPractices: [
      "✓ GOOD: Type-safe - automatically narrows the type to exclude null/undefined",
      "✓ GOOD: Can check multiple fields at once",
    ],
  },

  removeNull: {
    name: "removeNull",
    category: "dataframe",
    signature:
      "removeNull(field: keyof T, ...fields: (keyof T)[]): DataFrame<...>",
    description:
      "Remove rows where specified field(s) are null. Automatically narrows types to exclude null.",
    imports: ['import { createDataFrame } from "@tidy-ts/dataframe";'],
    parameters: [
      "field: First field to check",
      "...fields: Additional fields to check",
    ],
    returns: "DataFrame with type narrowed to exclude null",
    examples: [
      'df.removeNull("score") // Remove rows with null score',
    ],
    related: ["removeNA", "removeUndefined", "replaceNA"],
  },

  removeUndefined: {
    name: "removeUndefined",
    category: "dataframe",
    signature:
      "removeUndefined(field: keyof T, ...fields: (keyof T)[]): DataFrame<...>",
    description:
      "Remove rows where specified field(s) are undefined. Automatically narrows types to exclude undefined.",
    imports: ['import { createDataFrame } from "@tidy-ts/dataframe";'],
    parameters: [
      "field: First field to check",
      "...fields: Additional fields to check",
    ],
    returns: "DataFrame with type narrowed to exclude undefined",
    examples: [
      'df.removeUndefined("email") // Remove rows with undefined email',
    ],
    related: ["removeNA", "removeNull", "replaceNA"],
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
    related: ["fillBackward", "replaceNA", "removeNA"],
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
    related: ["fillForward", "replaceNA", "removeNA"],
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
