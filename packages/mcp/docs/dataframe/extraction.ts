import type { DocEntry } from "../mcp-types.ts";

export const extractionDocs: Record<string, DocEntry> = {
  extract: {
    name: "extract",
    category: "dataframe",
    signature: "extract<K extends keyof T>(column: K): T[K][]",
    description:
      "Extract a single column as an array. Similar to R's pull() function.",
    imports: ['import { createDataFrame } from "@tidy-ts/dataframe";'],
    parameters: ["column: Column name to extract"],
    returns: "Array of values from the specified column",
    examples: [
      "const ages = df.extract('age') // [25, 30, 35]",
      "const names = df.extract('name')",
    ],
    related: ["extractHead", "extractTail", "extractNth", "select"],
    bestPractices: [
      "✓ GOOD: Use df.columnName for direct property access in most cases",
      "✓ GOOD: Use extract() when you need the values as a standalone array",
    ],
  },

  extractHead: {
    name: "extractHead",
    category: "dataframe",
    signature:
      "extractHead<K extends keyof T>(column: K, n: number): T[K] | T[K][]",
    description:
      "Extract first value(s) from a column. Returns single value if n=1, array if n>1.",
    imports: ['import { createDataFrame } from "@tidy-ts/dataframe";'],
    parameters: [
      "column: Column name to extract from",
      "n: Number of values (1 returns single value, >1 returns array)",
    ],
    returns: "Single value (n=1) or array (n>1)",
    examples: [
      'const topName = df.sliceMax("score", 1).extractHead("name", 1) // "Alice"',
      'const topNames = df.arrange("score", "desc").extractHead("name", 3) // ["Alice", "Bob", "Carol"]',
    ],
    related: ["extractTail", "extract", "sliceHead"],
  },

  extractTail: {
    name: "extractTail",
    category: "dataframe",
    signature:
      "extractTail<K extends keyof T>(column: K, n: number): T[K] | T[K][]",
    description:
      "Extract last value(s) from a column. Returns single value if n=1, array if n>1.",
    imports: ['import { createDataFrame } from "@tidy-ts/dataframe";'],
    parameters: [
      "column: Column name to extract from",
      "n: Number of values (1 returns single value, >1 returns array)",
    ],
    returns: "Single value (n=1) or array (n>1)",
    examples: [
      'const lastName = df.arrange("date").extractTail("name", 1) // "Eve"',
      'const recentNames = df.arrange("date").extractTail("name", 2) // ["David", "Eve"]',
    ],
    related: ["extractHead", "extract", "sliceTail"],
  },

  extractNth: {
    name: "extractNth",
    category: "dataframe",
    signature:
      "extractNth<K extends keyof T>(column: K, index: number): T[K] | undefined",
    description:
      "Extract value at specific index from a column (0-based). Returns undefined if out of bounds.",
    imports: ['import { createDataFrame } from "@tidy-ts/dataframe";'],
    parameters: [
      "column: Column name to extract from",
      "index: 0-based index",
    ],
    returns: "Value at index or undefined",
    examples: [
      'const topScore = df.sliceMax("score", 1).extractNth("name", 0) // "Alice"',
    ],
    related: ["extract", "extractHead"],
  },

  extractSample: {
    name: "extractSample",
    category: "dataframe",
    signature: "extractSample<K extends keyof T>(column: K, n: number): T[K][]",
    description:
      "Extract n random values from a column. Sampling without replacement.",
    imports: ['import { createDataFrame } from "@tidy-ts/dataframe";'],
    parameters: [
      "column: Column name to extract from",
      "n: Number of random values to extract",
    ],
    returns: "Array of n random values",
    examples: [
      'const randomNames = df.extractSample("name", 3) // ["Bob", "Alice", "David"]',
    ],
    related: ["sliceSample", "extract"],
  },

  extractUnique: {
    name: "extractUnique",
    category: "dataframe",
    signature: "extractUnique<K extends keyof T>(column: K): T[K][]",
    description:
      "Extract unique values from a column. Equivalent to [...new Set(df.extract(column))].",
    imports: ['import { createDataFrame } from "@tidy-ts/dataframe";'],
    parameters: ["column: Column name to extract unique values from"],
    returns: "Array of unique values",
    examples: [
      'const uniqueCategories = df.extractUnique("category") // ["A", "B", "C"]',
      'const uniqueAges = df.extractUnique("age") // [25, 30, 35]',
    ],
    related: ["extract", "distinct"],
  },

  sliceHead: {
    name: "sliceHead",
    category: "dataframe",
    signature: "sliceHead(n: number): DataFrame<T>",
    description:
      "Select first n rows. For grouped data, selects first n rows from each group.",
    imports: ['import { createDataFrame } from "@tidy-ts/dataframe";'],
    parameters: ["n: Number of rows to select from the beginning"],
    returns: "DataFrame<T>",
    examples: [
      "df.sliceHead(3) // First 3 rows",
      'df.groupBy("cyl").sliceHead(2) // First 2 rows per group',
    ],
    related: ["sliceTail", "slice", "sliceMax", "sliceMin"],
  },

  sliceTail: {
    name: "sliceTail",
    category: "dataframe",
    signature: "sliceTail(n: number): DataFrame<T>",
    description:
      "Select last n rows. For grouped data, selects last n rows from each group.",
    imports: ['import { createDataFrame } from "@tidy-ts/dataframe";'],
    parameters: ["n: Number of rows to select from the end"],
    returns: "DataFrame<T>",
    examples: [
      "df.sliceTail(2) // Last 2 rows",
      'df.groupBy("cyl").sliceTail(1) // Last row per group',
    ],
    related: ["sliceHead", "slice", "sliceMax", "sliceMin"],
  },

  sliceMax: {
    name: "sliceMax",
    category: "dataframe",
    signature: "sliceMax(column: keyof T, n: number): DataFrame<T>",
    description:
      "Select n rows with highest values in specified column. Sorts descending by column.",
    imports: ['import { createDataFrame } from "@tidy-ts/dataframe";'],
    parameters: [
      "column: Column to sort by",
      "n: Number of rows to select",
    ],
    returns: "DataFrame<T>",
    examples: [
      'df.sliceMax("hp", 3) // 3 rows with highest hp',
      'df.groupBy("cyl").sliceMax("hp", 1) // Highest hp per group',
    ],
    related: ["sliceMin", "sliceHead", "arrange"],
  },

  sliceMin: {
    name: "sliceMin",
    category: "dataframe",
    signature: "sliceMin(column: keyof T, n: number): DataFrame<T>",
    description:
      "Select n rows with lowest values in specified column. Sorts ascending by column.",
    imports: ['import { createDataFrame } from "@tidy-ts/dataframe";'],
    parameters: [
      "column: Column to sort by",
      "n: Number of rows to select",
    ],
    returns: "DataFrame<T>",
    examples: [
      'df.sliceMin("mpg", 2) // 2 rows with lowest mpg',
      'df.groupBy("cyl").sliceMin("mpg", 1) // Lowest mpg per group',
    ],
    related: ["sliceMax", "sliceHead", "arrange"],
  },

  sliceSample: {
    name: "sliceSample",
    category: "dataframe",
    signature: "sliceSample(n: number, seed?: number): DataFrame<T>",
    description:
      "Select n random rows. Uses Fisher-Yates shuffle. For grouped data, samples within each group.",
    imports: ['import { createDataFrame } from "@tidy-ts/dataframe";'],
    parameters: [
      "n: Number of random rows to select",
      "seed: Optional seed for reproducibility",
    ],
    returns: "DataFrame<T>",
    examples: [
      "df.sliceSample(3) // 3 random rows",
      "df.sliceSample(5, 42) // 5 random rows with seed",
      'df.groupBy("cyl").sliceSample(2) // 2 random rows per group',
    ],
    related: ["sliceHead", "shuffle"],
  },
};
