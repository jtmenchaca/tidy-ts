import type { DocEntry } from "./mcp-types.ts";

export const dataframeDocs: Record<string, DocEntry> = {
  // DataFrame Display & Inspection
  print: {
    name: "print",
    category: "dataframe",
    signature: "print(title?: string): void",
    description:
      "Display the DataFrame in a formatted table. Use this instead of console.log().",
    imports: ['import { createDataFrame } from "@tidy-ts/dataframe";'],
    parameters: [
      "title: Optional title to display above the table",
    ],
    returns: "void",
    examples: [
      "df.print()",
      'df.print("Sales Analysis:")',
      'result.groupBy("region").summarize({ total: g => s.sum(g.sales) }).print("Regional Totals:")',
    ],
    related: ["toString", "toArray", "columns", "nrows"],
    antiPatterns: [
      "❌ BAD: console.log(df.toArray())",
      "❌ BAD: console.log(df)",
    ],
    bestPractices: [
      "✓ GOOD: df.print() - formatted table output",
      "✓ GOOD: df.print('Title') - with descriptive title",
    ],
  },

  toString: {
    name: "toString",
    category: "dataframe",
    signature: "toString(title?: string): string",
    description:
      "Get a string representation of the DataFrame in table format. Returns the same formatted output as print() but as a string.",
    imports: ['import { createDataFrame } from "@tidy-ts/dataframe";'],
    parameters: [
      "title: Optional title to display above the table",
    ],
    returns: "string - formatted table representation",
    examples: [
      "const tableStr = df.toString()",
      'const tableStr = df.toString("Sales Data")',
      "console.log(df.toString()) // Manual printing",
    ],
    related: ["print", "toArray"],
    bestPractices: [
      "✓ GOOD: Use toString() when you need the string for logging or file output",
      "✓ GOOD: Use print() for direct console output (more convenient)",
    ],
  },

  // DataFrame Creation & Basics
  createDataFrame: {
    name: "createDataFrame",
    category: "dataframe",
    signature:
      "createDataFrame<T>(data: T[] | { columns: Record<string, unknown[]> }, options?: DataFrameOptions): DataFrame<T> | DataFrame<any>",
    description:
      "Create a DataFrame from an array of row objects or from column arrays. Use the no_types option to return DataFrame<any> when type safety is not needed.",
    imports: [
      'import { createDataFrame, stats as s } from "@tidy-ts/dataframe";',
    ],
    parameters: [
      "data: Array of row objects OR { columns: { columnName: values[] } }",
      "options: Optional DataFrameOptions object with:",
      "  - schema: Zod schema for validation",
      "  - no_types: boolean (default: false) - when true, returns DataFrame<any>",
      "  - trace: boolean - enable operation tracing",
      "  - concurrency: number - concurrency limit for async operations",
    ],
    returns: "DataFrame<T> (default) or DataFrame<any> (when no_types: true)",
    examples: [
      'const df = createDataFrame([{ name: "Alice", age: 30 }, { name: "Bob", age: 25 }])',
      'const df = createDataFrame({ columns: { name: ["Alice", "Bob"], age: [30, 25] } })',
      "// With Zod schema validation (schema as second parameter)",
      'import { z } from "zod";',
      "const schema = z.object({ name: z.string(), age: z.number() });",
      'const df = createDataFrame([{ name: "Alice", age: 30 }], schema)',
      "// Use no_types for dynamic/unknown schema",
      "const dfAny = createDataFrame(userData, { no_types: true })",
    ],
    related: ["readCSV", "readXLSX", "readJSON"],
    bestPractices: [
      'Always import stats: import { createDataFrame, stats as s } from "@tidy-ts/dataframe"',
      "Use df.print() to display DataFrames, not console.log(df.toArray())",
      "Access columns with df.columnName property (e.g., df.age) instead of manual extraction",
      "Use no_types: true when:",
      "  • Working with dynamic/unknown schema (user-provided data, API responses)",
      "  • Rapid prototyping (follow up with typed implementation)",
      "  • Building generic utilities for arbitrary DataFrame structures",
      "Prefer typed DataFrames when possible - no_types loses compile-time safety",
    ],
    antiPatterns: [
      "❌ BAD: Using no_types when you have not exhausted all other options",
      "❌ BAD: Using no_types when schema is known at compile time",
    ],
  },

  // Selection & Filtering
  select: {
    name: "select",
    category: "dataframe",
    signature:
      "select<K extends keyof T>(...columns: K[]): DataFrame<Pick<T, K>>",
    description: "Select specific columns from the DataFrame.",
    imports: ['import { createDataFrame } from "@tidy-ts/dataframe";'],
    parameters: ["...columns: Column names to keep"],
    returns: "DataFrame with only selected columns",
    examples: [
      'df.select("name", "age")',
      'df.select("region", "revenue")',
    ],
    related: ["drop", "mutate"],
  },

  drop: {
    name: "drop",
    category: "dataframe",
    signature:
      "drop<K extends keyof T>(...columns: K[]): DataFrame<Omit<T, K>>",
    description: "Remove specific columns from the DataFrame.",
    imports: ['import { createDataFrame } from "@tidy-ts/dataframe";'],
    parameters: ["...columns: Column names to remove"],
    returns: "DataFrame without dropped columns",
    examples: [
      'df.drop("id", "temp_field")',
    ],
    related: ["select", "mutate"],
  },

  filter: {
    name: "filter",
    category: "dataframe",
    signature:
      "filter(predicate: (row: T, index: number) => boolean | Promise<boolean>): DataFrame<T> | PromisedDataFrame<T>",
    description:
      "Filter rows based on a condition. Supports both sync and async predicates.",
    imports: ['import { createDataFrame } from "@tidy-ts/dataframe";'],
    parameters: [
      "predicate: Function that returns true to keep the row, false to remove it",
      "predicate receives: (row, index)",
    ],
    returns: "DataFrame (sync) or PromisedDataFrame (async)",
    examples: [
      "df.filter(row => row.age > 25)",
      'df.filter(row => row.region === "North" && row.quantity > 10)',
      "await df.filter(async row => await isValid(row.id))",
    ],
    related: ["slice", "distinct"],
  },

  slice: {
    name: "slice",
    category: "dataframe",
    signature:
      "slice({ start?: number; end?: number; step?: number }): DataFrame<T>",
    description: "Select rows by position (similar to Array.slice).",
    imports: ['import { createDataFrame } from "@tidy-ts/dataframe";'],
    parameters: [
      "start: Starting index (default: 0)",
      "end: Ending index (default: nrows)",
      "step: Step size (default: 1)",
    ],
    returns: "DataFrame<T>",
    examples: [
      "df.slice({ start: 0, end: 10 }) // First 10 rows",
      "df.slice({ start: 10 }) // Skip first 10 rows",
      "df.slice({ step: 2 }) // Every other row",
    ],
    related: ["filter", "extractHead", "extractTail"],
  },

  // Transformation
  mutate: {
    name: "mutate",
    category: "dataframe",
    signature:
      "mutate<NewCols>(columns: MutateSpec<T, NewCols>, opts?: { concurrency?: number }): DataFrame<T & NewCols> | PromisedDataFrame<T & NewCols>",
    description:
      "Add or transform columns. Supports functions, arrays, and scalars. Can be async.",
    imports: [
      'import { createDataFrame, stats as s } from "@tidy-ts/dataframe";',
    ],
    parameters: [
      "columns: Object mapping column names to values",
      "  - Function: (row, index, df) => value",
      "  - Array: Direct values (must match row count)",
      "  - Scalar: Repeated for all rows (wrap in function for type inference)",
      "opts.concurrency: Limit concurrent async operations",
    ],
    returns: "DataFrame (sync) or PromisedDataFrame (async)",
    examples: [
      "df.mutate({ revenue: row => row.price * row.quantity })",
      'df.mutate({ status: ["Active", "Pending", "Active"] })',
      "df.mutate({ tax_rate: () => 0.08 })",
      "await df.mutate({ data: async row => await fetch(row.url) }, { concurrency: 3 })",
    ],
    related: ["select", "drop", "transmute"],
  },

  arrange: {
    name: "arrange",
    category: "dataframe",
    signature:
      'arrange<K extends keyof T>(column: K, direction?: "asc" | "desc"): DataFrame<T>',
    description: "Sort DataFrame by a column.",
    imports: ['import { createDataFrame } from "@tidy-ts/dataframe";'],
    parameters: [
      "column: Column name to sort by",
      'direction: "asc" (default) or "desc"',
    ],
    returns: "DataFrame<T>",
    examples: [
      'df.arrange("age")',
      'df.arrange("revenue", "desc")',
    ],
    related: ["filter", "slice"],
  },

  distinct: {
    name: "distinct",
    category: "dataframe",
    signature:
      "distinct<K extends keyof T>(column1: K, ...moreColumns: K[]): DataFrame<Pick<T, K>>",
    description:
      "Get unique combinations of specified columns (SQL DISTINCT). Returns only the specified columns with unique combinations.",
    imports: ['import { createDataFrame } from "@tidy-ts/dataframe";'],
    parameters: [
      "column1: First column to check for uniqueness (required)",
      "...moreColumns: Additional columns to include in uniqueness check",
    ],
    returns:
      "DataFrame with only the specified columns containing unique combinations",
    examples: [
      'df.distinct("region") // Get unique regions (returns only region column)',
      'df.distinct("region", "product") // Get unique region+product combinations',
      'df.groupBy("year").distinct("product") // Unique products within each year',
    ],
    related: ["filter", "groupBy", "select"],
  },

  rename: {
    name: "rename",
    category: "dataframe",
    signature:
      "rename<RenameMap>(mapping: RenameMap): DataFrame<RenamedColumns<T, RenameMap>>",
    description:
      "Rename columns. Mapping format: { oldName: newName }. Pure rename - old column is removed.",
    imports: ['import { createDataFrame } from "@tidy-ts/dataframe";'],
    parameters: [
      "mapping: Object mapping old column names to new column names { oldName: newName }",
    ],
    returns: "DataFrame with renamed columns",
    examples: [
      'df.rename({ mass: "weight" }) // Rename mass to weight',
      'df.rename({ name: "character_name", mass: "weight" })',
    ],
    related: ["select", "drop", "mutate"],
  },

  // Grouping & Aggregation
  groupBy: {
    name: "groupBy",
    category: "dataframe",
    signature:
      "groupBy<K extends keyof T>(...columns: K[]): GroupedDataFrame<T, K>",
    description: "Group rows by one or more columns.",
    imports: [
      'import { createDataFrame, stats as s } from "@tidy-ts/dataframe";',
    ],
    parameters: ["...columns: Column names to group by"],
    returns: "GroupedDataFrame (use with summarize)",
    examples: [
      'df.groupBy("region")',
      'df.groupBy("region", "product")',
    ],
    related: ["summarize", "count", "ungroup"],
  },

  summarize: {
    name: "summarize",
    category: "dataframe",
    signature:
      "summarize<NewCols>(columns: SummarizeSpec<T, NewCols>): DataFrame<Pick<T, GroupKeys> & NewCols>",
    description: "Aggregate grouped data. Use after groupBy().",
    imports: [
      'import { createDataFrame, stats as s } from "@tidy-ts/dataframe";',
    ],
    parameters: [
      "columns: Object mapping new column names to aggregation functions",
      "Aggregation function receives the grouped DataFrame",
    ],
    returns: "DataFrame with group keys + new columns",
    examples: [
      'df.groupBy("region").summarize({ total: group => s.sum(group.revenue) })',
      'df.groupBy("region").summarize({ count: group => group.nrows(), avg: group => s.mean(group.price) })',
    ],
    related: ["groupBy", "count", "mutate"],
    antiPatterns: [
      "❌ BAD: group.column.reduce((a, b) => a + b, 0) / group.nrows()",
      "❌ BAD: group.column.reduce((a, b) => a + b, 0)",
      "❌ BAD: [...group.column].sort((a,b) => a - b)[Math.floor(group.nrows()/2)]",
    ],
    bestPractices: [
      "✓ GOOD: Use s.mean(group.column) instead of manual reduce for averages",
      "✓ GOOD: Use s.sum(group.column) instead of reduce for sums",
      "✓ GOOD: Use s.median(group.column) instead of manual sorting",
      "✓ GOOD: Use s.max(), s.min(), s.stdev() for other aggregations",
      "Access columns directly: group.revenue not group.extract('revenue')",
    ],
  },

  count: {
    name: "count",
    category: "dataframe",
    signature:
      "count<K extends keyof T>(...columns: K[]): DataFrame<Pick<T, K> & { count: number }>",
    description:
      "Count rows, optionally grouped by columns. Shorthand for groupBy().summarize().",
    imports: ['import { createDataFrame } from "@tidy-ts/dataframe";'],
    parameters: ["...columns: Columns to group by (optional)"],
    returns: "DataFrame with group keys + count column",
    examples: [
      "df.count() // Total row count",
      'df.count("region") // Count by region',
      'df.count("region", "product") // Count by region and product',
    ],
    related: ["groupBy", "summarize"],
  },

  ungroup: {
    name: "ungroup",
    category: "dataframe",
    signature: "ungroup(): DataFrame<T>",
    description:
      "Remove grouping from a grouped DataFrame, returning a regular DataFrame.",
    imports: ['import { createDataFrame } from "@tidy-ts/dataframe";'],
    parameters: [],
    returns: "DataFrame<T>",
    examples: [
      'df.groupBy("region").summarize({ total: g => s.sum(g.sales) }).ungroup()',
    ],
    related: ["groupBy"],
  },

  // Slice Variants
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

  // Extract Methods
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

  // Joins
  innerJoin: {
    name: "innerJoin",
    category: "dataframe",
    signature:
      "innerJoin<U>(other: DataFrame<U>, { on }: { on: JoinKeys }): DataFrame<T & U>",
    description: "Inner join with another DataFrame. Only keeps matching rows.",
    imports: ['import { createDataFrame } from "@tidy-ts/dataframe";'],
    parameters: [
      "other: DataFrame to join with",
      "on: Join key(s) - string, array, or { left: ..., right: ... }",
    ],
    returns: "DataFrame with columns from both DataFrames",
    examples: [
      'df.innerJoin(other, { on: "id" })',
      'df.innerJoin(other, { on: ["region", "product"] })',
      'df.innerJoin(other, { on: { left: "user_id", right: "id" } })',
    ],
    related: ["leftJoin", "rightJoin", "outerJoin"],
  },

  leftJoin: {
    name: "leftJoin",
    category: "dataframe",
    signature:
      "leftJoin<U>(other: DataFrame<U>, { on }: { on: JoinKeys }): DataFrame<T & Partial<U>>",
    description:
      "Left join with another DataFrame. Keeps all rows from left, fills nulls for non-matches.",
    imports: ['import { createDataFrame } from "@tidy-ts/dataframe";'],
    parameters: [
      "other: DataFrame to join with",
      "on: Join key(s)",
    ],
    returns: "DataFrame with all left rows + matched right rows",
    examples: [
      'df.leftJoin(other, { on: "id" })',
    ],
    related: ["innerJoin", "rightJoin", "outerJoin"],
  },

  rightJoin: {
    name: "rightJoin",
    category: "dataframe",
    signature:
      "rightJoin<U>(other: DataFrame<U>, { on }: { on: JoinKeys }): DataFrame<Partial<T> & U>",
    description:
      "Right join with another DataFrame. Keeps all rows from right, fills nulls for non-matches.",
    imports: ['import { createDataFrame } from "@tidy-ts/dataframe";'],
    parameters: [
      "other: DataFrame to join with",
      "on: Join key(s)",
    ],
    returns: "DataFrame with matched left rows + all right rows",
    examples: [
      'df.rightJoin(other, { on: "id" })',
    ],
    related: ["innerJoin", "leftJoin", "outerJoin"],
  },

  outerJoin: {
    name: "outerJoin",
    category: "dataframe",
    signature:
      "outerJoin<U>(other: DataFrame<U>, { on }: { on: JoinKeys }): DataFrame<Partial<T> & Partial<U>>",
    description:
      "Full outer join. Keeps all rows from both DataFrames, fills nulls for non-matches.",
    imports: ['import { createDataFrame } from "@tidy-ts/dataframe";'],
    parameters: [
      "other: DataFrame to join with",
      "on: Join key(s)",
    ],
    returns: "DataFrame with all rows from both sides",
    examples: [
      'df.outerJoin(other, { on: "id" })',
    ],
    related: ["innerJoin", "leftJoin", "rightJoin", "asofJoin"],
  },

  asofJoin: {
    name: "asofJoin",
    category: "dataframe",
    signature:
      "asofJoin<OtherRow extends object, K extends keyof T & keyof OtherRow>(other: DataFrame<OtherRow>, by: K, options?: { direction?: 'backward' | 'forward' | 'nearest', tolerance?: number, group_by?: (keyof T & keyof OtherRow)[] }): DataFrame<...>",
    description:
      "Join DataFrames by nearest key match (as-of join). Joins on a sorted column (typically timestamps), matching each left row with the 'nearest' right row based on direction. Useful for time-series data where exact matches aren't required.",
    imports: [
      'import { createDataFrame, stats as s } from "@tidy-ts/dataframe";',
    ],
    parameters: [
      "other: DataFrame to join with",
      "by: Column name to join on (must exist in both DataFrames)",
      "options.direction: 'backward' (default) - match prior value, 'forward' - match next value, 'nearest' - closest value",
      "options.tolerance: Optional maximum time difference allowed (in milliseconds for Dates)",
      "options.group_by: Optional columns to group by before matching (e.g., by symbol)",
    ],
    returns: "DataFrame with columns from both DataFrames",
    examples: [
      '// Join trades to nearest prior quotes (backward)\nconst trades = createDataFrame([\n  { time: 1, symbol: "AAPL", quantity: 100 },\n  { time: 3, symbol: "AAPL", quantity: 200 },\n]);\nconst quotes = createDataFrame([\n  { time: 0, symbol: "AAPL", price: 150.0 },\n  { time: 2, symbol: "AAPL", price: 151.0 },\n]);\ntrades.asofJoin(quotes, "time", { direction: "backward" })\n// Matches trade at time 1 to quote at time 0, trade at time 3 to quote at time 2',
      '// Forward-looking join\nconst events = createDataFrame([\n  { timestamp: 1, event: "start" },\n]);\nconst logs = createDataFrame([\n  { timestamp: 2, log: "processing" },\n]);\nevents.asofJoin(logs, "timestamp", { direction: "forward" })',
      '// Join with tolerance (within 1000ms)\ntrades.asofJoin(quotes, "time", {\n  direction: "nearest",\n  tolerance: 1000\n})',
      '// Group by symbol before matching\ntrades.asofJoin(quotes, "time", {\n  direction: "backward",\n  group_by: ["symbol"]\n})',
    ],
    related: ["innerJoin", "leftJoin", "resample"],
    bestPractices: [
      "✓ GOOD: Use for time-series data where exact timestamp matches aren't required",
      "✓ GOOD: Backward direction (default) is most common - matches to prior observations",
      "✓ GOOD: Use tolerance to limit how far back/forward to look",
      "✓ GOOD: Use group_by when joining multiple time series (e.g., multiple stocks)",
    ],
    antiPatterns: [
      "❌ BAD: Using on unsorted data - asofJoin requires sorted by column",
      "❌ BAD: Expecting exact matches - this is for nearest matches",
    ],
  },

  // Reshaping
  pivotLonger: {
    name: "pivotLonger",
    category: "dataframe",
    signature:
      "pivotLonger<Cols>({ cols, names_to, values_to }: PivotLongerSpec): DataFrame<...>",
    description: "Convert wide data to long format.",
    imports: ['import { createDataFrame } from "@tidy-ts/dataframe";'],
    parameters: [
      "cols: Column names to pivot",
      "names_to: Name for new column containing old column names",
      "values_to: Name for new column containing values",
    ],
    returns: "DataFrame in long format",
    examples: [
      'df.pivotLonger({ cols: ["math", "science", "english"], names_to: "subject", values_to: "score" })',
    ],
    related: ["pivotWider", "transpose"],
  },

  pivotWider: {
    name: "pivotWider",
    category: "dataframe",
    signature:
      "pivotWider<T>({ names_from, values_from, expected_columns }: PivotWiderSpec): DataFrame<...>",
    description: "Convert long data to wide format.",
    imports: ['import { createDataFrame } from "@tidy-ts/dataframe";'],
    parameters: [
      "names_from: Column containing new column names",
      "values_from: Column containing values to spread",
      "expected_columns: Array of expected column names (for type safety)",
    ],
    returns: "DataFrame in wide format",
    examples: [
      'df.pivotWider({ names_from: "product", values_from: "sales", expected_columns: ["Widget A", "Widget B"] })',
    ],
    related: ["pivotLonger", "transpose"],
  },

  transpose: {
    name: "transpose",
    category: "dataframe",
    signature: "transpose(expectedRows: number): DataFrame<...>",
    description:
      "Transpose rows and columns. Rows become columns and columns become rows.",
    imports: ['import { createDataFrame } from "@tidy-ts/dataframe";'],
    parameters: ["expectedRows: Number of expected rows after transpose"],
    returns: "Transposed DataFrame",
    examples: [
      "df.transpose(3) // Transpose with 3 expected rows",
    ],
    related: ["pivotWider", "pivotLonger"],
  },

  unnest: {
    name: "unnest",
    category: "dataframe",
    signature:
      "unnest<Col extends ArrayColumns<T>>(column: Col): DataFrame<T with Col: ElementType | null>",
    description:
      "Unnest array columns into individual rows. Each array element becomes its own row, with other columns duplicated. Empty arrays become rows with null for the unnested column. Type-safe - only accepts columns containing arrays.",
    imports: ['import { createDataFrame } from "@tidy-ts/dataframe";'],
    parameters: [
      "column: Name of array column to unnest (type-checked at compile time)",
    ],
    returns:
      "DataFrame where array elements are spread into individual rows, array column type becomes ElementType | null",
    examples: [
      '// Basic usage\nconst df = createDataFrame([\n  { id: 1, tags: ["admin", "user"] },\n  { id: 2, tags: ["user"] },\n  { id: 3, tags: [] }\n]);\n\ndf.unnest("tags")\n// Result:\n// { id: 1, tags: "admin" }\n// { id: 1, tags: "user" }\n// { id: 2, tags: "user" }\n// { id: 3, tags: null }',
      '// Unnest with preserved columns\ndf.unnest("vitamins")\n// All other columns are duplicated for each array element',
      '// Sequential unnesting (flatten nested arrays)\nconst nested = createDataFrame([{ id: 1, matrix: [[1, 2], [3, 4]] }]);\nnested.unnest("matrix").unnest("matrix")\n// First: { id: 1, matrix: [1, 2] }, { id: 1, matrix: [3, 4] }\n// Then:  { id: 1, matrix: 1 }, { id: 1, matrix: 2 }, ...',
      '// Type safety - compile error on non-array columns\ndf.unnest("name") // ❌ TypeScript error: name is not an array column',
    ],
    related: ["pivotLonger", "mutate", "filter"],
    antiPatterns: [
      "❌ BAD: Trying to unnest non-array columns - use mutate to extract first",
      "❌ BAD: Unnesting object columns directly - objects aren't arrays",
    ],
    bestPractices: [
      "✓ GOOD: Only works on array columns - TypeScript enforces this at compile time",
      "✓ GOOD: Empty arrays preserve the row with null value (matches R's tidyr behavior)",
      "✓ GOOD: Chain unnest() calls to flatten nested arrays (e.g., number[][])",
      "✓ GOOD: Other columns are automatically duplicated for each array element",
      "✓ GOOD: Return type correctly shows Column: ElementType | null",
      "✓ GOOD: Use mutate first if you need to extract nested arrays from objects",
    ],
  },

  bindRows: {
    name: "bindRows",
    category: "dataframe",
    signature: "bindRows(...dataframes: DataFrame<any>[]): DataFrame<...>",
    description:
      "Bind multiple DataFrames by rows (vertical stacking). Handles different column sets gracefully.",
    imports: ['import { createDataFrame } from "@tidy-ts/dataframe";'],
    parameters: ["...dataframes: DataFrames to stack vertically"],
    returns: "Combined DataFrame",
    examples: [
      "df1.bindRows(df2, df3) // Stack 3 DataFrames",
      "df1.bindRows(df2) // Combine two DataFrames",
    ],
    related: ["concatDataFrames", "append", "prepend"],
    bestPractices: [
      "✓ GOOD: Automatically handles missing columns - fills with undefined",
      "✓ GOOD: Preserves all columns from all DataFrames",
    ],
  },

  concatDataFrames: {
    name: "concatDataFrames",
    category: "dataframe",
    signature: "concatDataFrames(dataframes: DataFrame<any>[]): DataFrame<...>",
    description:
      "Standalone function to concatenate an array of DataFrames by rows (vertical binding). Similar to pandas concat or tidyverse's bind_rows.",
    imports: ['import { concatDataFrames } from "@tidy-ts/dataframe";'],
    parameters: ["dataframes: Array of DataFrames to combine"],
    returns: "Combined DataFrame with all rows stacked vertically",
    examples: [
      "const combined = concatDataFrames([df1, df2, df3])",
      "const dataFrames = [df1, df2, df3]; const result = concatDataFrames(dataFrames)",
    ],
    related: ["bindRows"],
    bestPractices: [
      "✓ GOOD: Use when you have an array of DataFrames to combine",
      "✓ GOOD: Automatically handles different column sets - fills with undefined",
      "✓ GOOD: More convenient than df1.bindRows(...rest) when working with arrays",
    ],
  },

  resample: {
    name: "resample",
    category: "dataframe",
    signature:
      "resample(timeColumn: keyof T, frequency: Frequency, options: ResampleOptions<T>): DataFrame<...>",
    description:
      "Resample time-series data to a different frequency. Supports both downsampling (aggregating) and upsampling (filling). The time column must be of type Date (or Date | null). Downsampling groups rows by time buckets and applies aggregation functions. Upsampling generates a time sequence and fills missing values.",
    imports: [
      'import { createDataFrame, stats } from "@tidy-ts/dataframe";',
    ],
    parameters: [
      "timeColumn: Name of the Date column to use for resampling",
      "frequency: Target frequency string or object:",
      "  - Seconds: '1S', '5S', '15S', '30S'",
      "  - Minutes: '1min', '5min', '15min', '30min'",
      "  - Hours: '1H'",
      "  - Days: '1D'",
      "  - Weeks: '1W'",
      "  - Months: '1M'",
      "  - Quarters: '1Q'",
      "  - Years: '1Y'",
      "  - Custom: number (milliseconds) or { value: number, unit: 'ms' | 's' | 'min' | 'h' | 'd' | 'w' | 'M' | 'Q' | 'Y' }",
      "options: Resampling options object:",
      "  - For downsampling: { columnName: aggregationFunction, ... }",
      "    * Use stats.mean, stats.sum, stats.max, stats.min, stats.first, stats.last",
      "    * Can create new columns (e.g., { open: stats.first, high: stats.max, low: stats.min, close: stats.last })",
      "  - For upsampling: { method: fillFunction } or { columnName: fillFunction, ... }",
      "    * Use stats.forwardFill or stats.backwardFill",
      "    * Or specify per-column: { price: stats.forwardFill, volume: stats.backwardFill }",
    ],
    returns: "DataFrame with resampled data",
    examples: [
      '// Downsample hourly to daily\nconst hourly = createDataFrame([\n  { timestamp: new Date("2023-01-01T10:00:00"), price: 100, volume: 10 },\n  { timestamp: new Date("2023-01-01T11:00:00"), price: 110, volume: 20 },\n  { timestamp: new Date("2023-01-01T12:00:00"), price: 120, volume: 30 },\n  { timestamp: new Date("2023-01-02T10:00:00"), price: 130, volume: 40 },\n]);\nconst daily = hourly.resample("timestamp", "1D", {\n  price: stats.mean,\n  volume: stats.sum\n})\n// Result: 2 rows (one per day)\n// Day 1: price = 110 (mean of 100, 110, 120), volume = 60 (sum of 10, 20, 30)\n// Day 2: price = 130, volume = 40',
      '// Downsample with OHLC pattern (Open, High, Low, Close)\nconst ohlc = df.resample("timestamp", "1D", {\n  open: stats.first,  // First price in period\n  high: stats.max,    // Highest price\n  low: stats.min,     // Lowest price\n  close: stats.last   // Last price\n})',
      '// Upsample daily to hourly with forward fill\nconst daily = createDataFrame([\n  { timestamp: new Date("2023-01-01T10:00:00"), value: 100 },\n  { timestamp: new Date("2023-01-01T12:00:00"), value: 200 },\n]);\nconst hourly = daily.resample("timestamp", "1H", {\n  method: stats.forwardFill\n})\n// Result: 3 rows (10:00, 11:00, 12:00)\n// 10:00: value = 100\n// 11:00: value = 100 (forward filled)\n// 12:00: value = 200',
      '// Upsample with per-column fill methods\nconst hourly = daily.resample("timestamp", "1H", {\n  price: stats.forwardFill,\n  volume: stats.backwardFill\n})',
      '// Works with grouped DataFrames\nconst result = df.groupBy("symbol").resample("timestamp", "1D", {\n  price: stats.mean\n})',
      '// Custom frequency\nconst result = df.resample("timestamp", { value: 30, unit: "min" }, {\n  price: stats.mean\n})',
    ],
    related: ["fillForward", "fillBackward", "groupBy", "summarize"],
    bestPractices: [
      "✓ GOOD: Use downsampling when converting from higher to lower frequency (e.g., hourly → daily)",
      "✓ GOOD: Use upsampling when converting from lower to higher frequency (e.g., daily → hourly)",
      "✓ GOOD: The time column must be of type Date (or Date | null) - TypeScript enforces this",
      "✓ GOOD: For downsampling, use aggregation functions like stats.mean, stats.sum, stats.max, stats.min, stats.first, stats.last",
      "✓ GOOD: For upsampling, use fill methods like stats.forwardFill or stats.backwardFill",
      "✓ GOOD: Preserves grouping when called on grouped DataFrames",
      "✓ GOOD: Can create new columns during downsampling (e.g., OHLC pattern)",
    ],
    antiPatterns: [
      "❌ BAD: Using non-Date column for timeColumn - TypeScript will error",
      "❌ BAD: Using string shortcuts for aggregation/fill methods - use function references (stats.mean, not 'mean')",
      "❌ BAD: Trying to resample empty DataFrame - TypeScript will error",
    ],
  },

  // Missing Data
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
    related: ["fillForward", "fillBackward", "resample"],
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

  // Profiling
  profile: {
    name: "profile",
    category: "dataframe",
    signature: "profile(): DataFrame<ColumnProfile>",
    description:
      "Profile a DataFrame by computing comprehensive statistics for each column. Returns a DataFrame with one row per column.",
    imports: ['import { createDataFrame } from "@tidy-ts/dataframe";'],
    parameters: [],
    returns:
      "DataFrame with columns: column, type, count, nulls, null_pct, mean, median, min, max, sd, q1, q3, iqr, variance (numeric), unique, top_values (categorical)",
    examples: [
      "df.profile().print()",
      "const stats = penguins.profile()",
      "df.profile().filter(p => p.type === 'numeric')",
    ],
    related: ["summarize", "mean", "median", "stdev"],
    bestPractices: [
      "Use profile() for quick exploratory data analysis",
      "Filter the profile result to focus on numeric or categorical columns",
      "Combine with .print() for immediate visual inspection",
    ],
  },

  // Visualization
  graph: {
    name: "graph",
    category: "dataframe",
    signature: "graph(spec: GraphOptions<T>): TidyGraphWidget",
    description:
      "Create an interactive Vega-Lite visualization from the DataFrame. Supports scatter plots, line charts, bar charts, and area charts. The widget can be displayed in Jupyter notebooks, web applications, or saved as SVG/PNG. Automatically infers axis types (temporal for Date, quantitative for numbers, ordinal otherwise).",
    imports: ['import { createDataFrame } from "@tidy-ts/dataframe";'],
    parameters: [
      "spec: Graph specification object with:",
      "  - type: Chart type - 'scatter', 'line', 'bar', or 'area'",
      "  - mappings: Column mappings - { x, y, color?, series?, size?, shape? }",
      "    * x: Column name, accessor function, or array for X-axis (required)",
      "    * y: Column name, accessor function, or array for Y-axis (required)",
      "    * color: Optional column/accessor/array for color encoding (categorical or continuous)",
      "      - If not specified but series is provided, series is used for color",
      "    * series: Optional column/accessor/array for grouping multiple lines/bars/areas",
      "    * size: Optional column/accessor/array for point size encoding (scatter only, numeric)",
      "    * shape: Optional column/accessor/array for point shape encoding (scatter only, categorical)",
      "  - config: Optional styling configuration:",
      "    * layout: { title?, description?, width?: number | 'container', height?: number }",
      "      - width defaults to 'container' (fills parent), height defaults to 400",
      "    * xAxis/yAxis: { label?, domain?: [min, max]?, tickFormat?, hide? }",
      "      - domain filters data to only show points within range and enables clipping",
      "      - For Date axes, tickFormat defaults to '%b %Y'",
      "      - Non-quantitative x-axes get -45° label angle automatically",
      "    * grid: { show?: boolean (default: true), vertical?, horizontal? }",
      "    * color: { scheme?, colors?: string[] }",
      "      - schemes: 'default', 'blue', 'green', 'red', 'purple', 'orange', 'vibrant', 'professional', 'high_contrast'",
      "      - colors: Custom array of hex/rgb/hsl color strings",
      "    * legend: { show?: boolean (default: true when color/series used), position?, fontSize?, titleFontSize? }",
      "      - positions: 'top', 'bottom', 'left', 'right', 'top-left', 'top-right', 'bottom-left', 'bottom-right'",
      "      - fontSize defaults to 12, titleFontSize defaults to 13",
      "    * tooltip: { show?: boolean (default: true) }",
      "    * interactivity: { zoom?: boolean, pan?: boolean }",
      "      - Enables zoom/pan via interval selection bound to scales",
      "    * accessibility: { layer?: boolean } - Adds accessibility layer for screen readers",
      "    * animation: { duration?: number } - Animation duration in milliseconds",
      "    * scatter: { pointSize?: number (default: 60), pointOpacity?: number (default: 0.8) }",
      "    * line: { style?: 'monotone'|'linear'|'step'|'basis'|'cardinal' (default: 'linear'), dots?: boolean (default: false), strokeWidth?: number (default: 2), connectNulls?: boolean (default: false) }",
      "    * bar: { stacked?: boolean (default: false), radius?: number (default: 4) }",
      "    * area: { stacked?: boolean (default: false), style?: 'monotone'|'linear'|'step'|'basis'|'cardinal' (default: 'linear'), strokeWidth?: number (default: 1), opacity?: number (default: 0.7) }",
      "  - tooltip: Optional tooltip customization - { fields?: string[], format?: Record<string, (v: unknown) => string> }",
      "    - fields: Array of column names to show in tooltip (default: all columns)",
      "    - format: Custom formatter functions for specific fields",
    ],
    returns:
      "TidyGraphWidget with display() and save methods:\n  - savePNG({ filename, width?, height?, background?, scale? }): Promise<void>\n    - scale: Resolution multiplier 1-4 (default: 1, clamped to 1-4)\n  - saveSVG({ filename, width?, height?, background? }): Promise<void>\n    - width/height default to 700x400 if not specified in layout or save options",
    examples: [
      '// Scatter plot with color encoding\ndf.graph({\n  type: "scatter",\n  mappings: { x: "age", y: "income", color: "category" }\n})',
      '// Using accessor functions\nconst chart = df.graph({\n  type: "scatter",\n  mappings: {\n    x: (row) => row.age,\n    y: (row) => row.income * 1.1,\n    color: "category"\n  }\n})',
      '// Line chart with custom styling and domain filtering\ndf.graph({\n  type: "line",\n  mappings: { x: "date", y: "value", series: "category" },\n  config: {\n    layout: { title: "Sales Over Time", width: 800, height: 400 },\n    line: { style: "monotone", strokeWidth: 3, dots: true },\n    yAxis: { domain: [0, 1000], label: "Sales ($)" }\n  }\n})',
      '// Bar chart with stacking\nconst chart = df.graph({\n  type: "bar",\n  mappings: { x: "category", y: "count", series: "region" },\n  config: {\n    color: { scheme: "vibrant" },\n    bar: { stacked: true, radius: 8 }\n  }\n})',
      '// Area chart with custom tooltip fields\ndf.graph({\n  type: "area",\n  mappings: { x: "date", y: "value", series: "region" },\n  config: { area: { stacked: true, opacity: 0.7 } },\n  tooltip: { fields: ["date", "value", "region"] }\n})',
      '// Save as PNG with high resolution\nconst chart = df.graph({ type: "scatter", mappings: { x: "x", y: "y" } })\nawait chart.savePNG({ filename: "chart.png", width: 800, height: 600, scale: 2 })\nawait chart.saveSVG({ filename: "chart.svg", width: 800, height: 600 })',
      '// Scatter plot with multiple aesthetics and custom tooltip formatting\nsalesData\n  .mutate({\n    revenue: (r) => r.quantity * r.price,\n    profit: (r) => r.quantity * r.price * 0.2,\n  })\n  .graph({\n    type: "scatter",\n    mappings: {\n      x: "revenue",\n      y: "quantity",\n      color: "region",\n      size: "profit",\n    },\n    config: {\n      layout: { title: "Sales Analysis", width: 700, height: 400 },\n      scatter: { pointSize: 100, pointOpacity: 0.8 },\n      color: { scheme: "professional" },\n      legend: { show: true, position: "right" },\n      xAxis: { domain: [0, 5000], label: "Revenue ($)" },\n    },\n    tooltip: {\n      fields: ["revenue", "quantity", "region", "profit"],\n      format: { revenue: (v) => `$${Number(v).toFixed(2)}` }\n    }\n  })',
      '// Date axis with automatic temporal formatting\ndf.graph({\n  type: "line",\n  mappings: { x: "date", y: "value" },\n  config: {\n    layout: { title: "Time Series" },\n    // Date axis automatically gets "%b %Y" format\n  }\n})',
    ],
    related: ["mutate", "filter", "groupBy"],
    bestPractices: [
      "✓ GOOD: Use scatter plots for correlation analysis and multi-dimensional data",
      "✓ GOOD: Use line charts for trends and time series data",
      "✓ GOOD: Use bar charts for categorical comparisons",
      "✓ GOOD: Use area charts for cumulative data and part-to-whole relationships",
      "✓ GOOD: Chain with mutate() to create derived columns for visualization",
      "✓ GOOD: Use color schemes like 'professional' or 'vibrant' for better aesthetics",
      "✓ GOOD: Export charts as PNG/SVG for reports and presentations",
      "✓ GOOD: Use series mapping for multiple lines/bars/areas",
      "✓ GOOD: Configure tooltip.fields to show only relevant columns",
      "✓ GOOD: Use domain filtering to focus on specific data ranges",
      "✓ GOOD: Use scale: 2-4 for high-resolution PNG exports",
      "✓ GOOD: All row fields are automatically available in tooltips unless filtered",
      "✓ GOOD: Date columns are automatically detected and formatted as temporal axes",
      "Charts are interactive in Jupyter notebooks with hover tooltips",
      "Backed by Vega-Lite for high-quality visualizations",
      "When domain is specified, data is filtered and chart is clipped to that range",
    ],
    antiPatterns: [
      "❌ BAD: Using scatter plots for time series (use line charts instead)",
      "❌ BAD: Using bar charts for continuous numeric data (use line charts)",
      "❌ BAD: Not specifying mappings.x and mappings.y (required)",
      "❌ BAD: Using 'container' width in savePNG/saveSVG (use numeric width)",
      "❌ BAD: Using scale > 4 (will be clamped to 4)",
    ],
  },
};
