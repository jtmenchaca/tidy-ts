import { statsDocs } from "./stats.ts";

export interface DocEntry {
  name: string;
  category: string;
  signature: string;
  description: string;
  imports?: string[];
  parameters?: string[];
  returns?: string;
  examples?: string[];
  related?: string[];
  antiPatterns?: string[];
  bestPractices?: string[];
}

export const DOCS: Record<string, DocEntry> = {
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
    related: ["toArray", "columns", "nrows"],
    antiPatterns: [
      "❌ BAD: console.log(df.toArray())",
      "❌ BAD: console.log(df)",
    ],
    bestPractices: [
      "✓ GOOD: df.print() - formatted table output",
      "✓ GOOD: df.print('Title') - with descriptive title",
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
      "❌ BAD: Using no_types for production code without good reason",
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
    signature: "distinct<K extends keyof T>(...columns: K[]): DataFrame<T>",
    description: "Keep only unique rows (by all columns or specified columns).",
    imports: ['import { createDataFrame } from "@tidy-ts/dataframe";'],
    parameters: [
      "...columns: Columns to check for uniqueness (default: all columns)",
    ],
    returns: "DataFrame<T>",
    examples: [
      "df.distinct() // Unique rows",
      'df.distinct("region") // Unique regions',
      'df.distinct("region", "product")',
    ],
    related: ["filter", "groupBy"],
  },

  rename: {
    name: "rename",
    category: "dataframe",
    signature:
      "rename<RenameMap>(mapping: RenameMap): DataFrame<RenamedColumns<T, RenameMap>>",
    description:
      "Rename columns. Mapping format: { newName: oldName }. Pure rename - old column is removed.",
    imports: ['import { createDataFrame } from "@tidy-ts/dataframe";'],
    parameters: [
      "mapping: Object mapping new column names to old column names { newName: oldName }",
    ],
    returns: "DataFrame with renamed columns",
    examples: [
      'df.rename({ weight: "mass" }) // Rename mass to weight',
      'df.rename({ character_name: "name", weight: "mass" })',
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
    related: ["innerJoin", "leftJoin", "downsample", "upsample"],
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

  downsample: {
    name: "downsample",
    category: "dataframe",
    signature:
      "downsample({ timeColumn, frequency, aggregations, startDate?, endDate? }): DataFrame<...>",
    description:
      "Downsample time-series data by aggregating high-frequency data to lower frequency (e.g., hourly → daily). Groups rows by time buckets and applies aggregation functions. The time column must be of type Date (or Date | null).",
    imports: [
      'import { createDataFrame, stats } from "@tidy-ts/dataframe";',
    ],
    parameters: [
      "timeColumn: Name of the Date column to use for downsampling",
      "frequency: Target frequency string or object:",
      "  - Seconds: '1S', '5S', '15S', '30S'",
      "  - Minutes: '1min', '5min', '15min', '30min'",
      "  - Hours: '1H', '6H', '12H'",
      "  - Days: '1D', '7D'",
      "  - Weeks: '1W'",
      "  - Months: '1M'",
      "  - Quarters: '1Q'",
      "  - Years: '1Y'",
      "  - Custom: number (milliseconds) or { value: number, unit: 'ms' | 's' | 'min' | 'h' | 'd' | 'w' | 'M' | 'Q' | 'Y' }",
      "aggregations: Object mapping column names to aggregation functions:",
      "  - Use stats.mean, stats.sum, stats.max, stats.min, stats.first, stats.last",
      "  - Can create new columns (e.g., { open: stats.first, high: stats.max, low: stats.min, close: stats.last })",
      "startDate: Optional start date for downsampling period",
      "endDate: Optional end date for downsampling period",
    ],
    returns: "DataFrame with downsampled data",
    examples: [
      '// Downsample hourly to daily\nconst hourly = createDataFrame([\n  { timestamp: new Date("2023-01-01T10:00:00"), price: 100, volume: 10 },\n  { timestamp: new Date("2023-01-01T11:00:00"), price: 110, volume: 20 },\n  { timestamp: new Date("2023-01-01T12:00:00"), price: 120, volume: 30 },\n  { timestamp: new Date("2023-01-02T10:00:00"), price: 130, volume: 40 },\n]);\nconst daily = hourly.downsample({\n  timeColumn: "timestamp",\n  frequency: "1D",\n  aggregations: {\n    price: stats.mean,\n    volume: stats.sum\n  }\n})\n// Result: 2 rows (one per day)\n// Day 1: price = 110 (mean of 100, 110, 120), volume = 60 (sum of 10, 20, 30)\n// Day 2: price = 130, volume = 40',
      '// Downsample with OHLC pattern (Open, High, Low, Close)\nconst ohlc = df.downsample({\n  timeColumn: "timestamp",\n  frequency: "1D",\n  aggregations: {\n    open: stats.first,  // First price in period\n    high: stats.max,    // Highest price\n    low: stats.min,     // Lowest price\n    close: stats.last   // Last price\n  }\n})',
      '// Works with grouped DataFrames\nconst result = df.groupBy("symbol").downsample({\n  timeColumn: "timestamp",\n  frequency: "1D",\n  aggregations: {\n    price: stats.mean\n  }\n})',
      '// With date range\nconst result = df.downsample({\n  timeColumn: "timestamp",\n  frequency: "1D",\n  aggregations: { price: stats.mean },\n  startDate: new Date("2023-01-01"),\n  endDate: new Date("2023-01-31")\n})',
    ],
    related: ["upsample", "groupBy", "summarize", "fillForward", "fillBackward"],
    bestPractices: [
      "✓ GOOD: Use for converting from higher to lower frequency (e.g., hourly → daily)",
      "✓ GOOD: The time column must be of type Date (or Date | null) - TypeScript enforces this",
      "✓ GOOD: Use aggregation functions like stats.mean, stats.sum, stats.max, stats.min, stats.first, stats.last",
      "✓ GOOD: Preserves grouping when called on grouped DataFrames",
      "✓ GOOD: Can create new columns during downsampling (e.g., OHLC pattern)",
      "✓ GOOD: Use startDate/endDate to define explicit time ranges",
    ],
    antiPatterns: [
      "❌ BAD: Using non-Date column for timeColumn - TypeScript will error",
      "❌ BAD: Using for upsampling - use upsample() instead",
    ],
  },

  upsample: {
    name: "upsample",
    category: "dataframe",
    signature:
      "upsample({ timeColumn, frequency, fillMethod, startDate?, endDate? }): DataFrame<...>",
    description:
      "Upsample time-series data by filling low-frequency data to higher frequency (e.g., daily → hourly). Generates a complete time sequence and fills missing values using forward or backward fill.",
    imports: [
      'import { createDataFrame } from "@tidy-ts/dataframe";',
    ],
    parameters: [
      "timeColumn: Name of the Date column to use for upsampling",
      "frequency: Target frequency string or object:",
      "  - Seconds: '1S', '5S', '15S', '30S'",
      "  - Minutes: '1min', '5min', '15min', '30min'",
      "  - Hours: '1H', '6H', '12H'",
      "  - Days: '1D', '7D'",
      "  - Weeks: '1W'",
      "  - Months: '1M'",
      "  - Quarters: '1Q'",
      "  - Years: '1Y'",
      "  - Custom: number (milliseconds) or { value: number, unit: 'ms' | 's' | 'min' | 'h' | 'd' | 'w' | 'M' | 'Q' | 'Y' }",
      "fillMethod: Fill strategy for missing values:",
      "  - 'forward': Carry forward the last known value (forward fill)",
      "  - 'backward': Use the next known value (backward fill)",
      "startDate: Optional start date for upsampling period",
      "endDate: Optional end date for upsampling period",
    ],
    returns: "DataFrame with upsampled data",
    examples: [
      '// Upsample daily to hourly with forward fill\nconst daily = createDataFrame([\n  { timestamp: new Date("2023-01-01T10:00:00"), value: 100 },\n  { timestamp: new Date("2023-01-01T12:00:00"), value: 200 },\n]);\nconst hourly = daily.upsample({\n  timeColumn: "timestamp",\n  frequency: "1H",\n  fillMethod: "forward"\n})\n// Result: 3 rows (10:00, 11:00, 12:00)\n// 10:00: value = 100\n// 11:00: value = 100 (forward filled)\n// 12:00: value = 200',
      '// Upsample with backward fill\nconst hourly = daily.upsample({\n  timeColumn: "timestamp",\n  frequency: "1H",\n  fillMethod: "backward"\n})',
      '// With date range\nconst result = df.upsample({\n  timeColumn: "timestamp",\n  frequency: "6H",\n  fillMethod: "forward",\n  startDate: new Date("2023-01-01"),\n  endDate: new Date("2023-01-31")\n})',
    ],
    related: ["downsample", "fillForward", "fillBackward"],
    bestPractices: [
      "✓ GOOD: Use for converting from lower to higher frequency (e.g., daily → hourly)",
      "✓ GOOD: The time column must be of type Date (or Date | null) - TypeScript enforces this",
      "✓ GOOD: Forward fill is most common - carries last known value forward",
      "✓ GOOD: Backward fill uses next known value - useful for looking ahead",
      "✓ GOOD: Use startDate/endDate to define explicit time ranges",
    ],
    antiPatterns: [
      "❌ BAD: Using non-Date column for timeColumn - TypeScript will error",
      "❌ BAD: Using for downsampling - use downsample() instead",
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

  // I/O Operations
  readCSV: {
    name: "readCSV",
    category: "io",
    signature:
      "readCSV<T>(pathOrContent: string, schema?: ZodSchema<T>, opts?: CsvOptions): Promise<DataFrame<T>>\nreadCSV(pathOrContent: string, opts: { no_types: true }): Promise<DataFrame<any>>\nreadCSV<T>(pathOrContent: string, schema: ZodSchema<T>, opts: { no_types: true }): Promise<DataFrame<any>>",
    description:
      "Read CSV file or parse CSV content with optional Zod schema validation. Returns a DataFrame that you can use with all DataFrame operations. Use readCSVMetadata() first to inspect headers and preview data structure. When `no_types: true`, returns DataFrame<any> without strict type checking, useful for dynamic or unknown schemas.",
    imports: [
      'import { readCSV, writeCSV, readCSVMetadata } from "@tidy-ts/dataframe";',
    ],
    parameters: [
      "pathOrContent: File path to CSV or raw CSV content string",
      "schema: Optional Zod schema for validation and type conversion (required unless no_types is true)",
      "opts.comma: Field delimiter/comma character (default: ',')",
      "opts.skipEmptyLines: Skip empty lines (default: true)",
      "opts.no_types: When true, returns DataFrame<any> instead of typed DataFrame. Schema is optional when true.",
    ],
    returns:
      "Promise<DataFrame<T>> or Promise<DataFrame<any>> - A DataFrame object with all standard operations",
    examples: [
      '// Read from file with schema\nconst df = await readCSV("data.csv", schema)',
      '// Parse from string\nconst csv = "name,age\\nAlice,30\\nBob,25";\nconst df = await readCSV(csv, schema)',
      '// With custom delimiter\nconst df = await readCSV("data.tsv", schema, { comma: "\\t" })',
      '// Without schema - returns DataFrame<any>\nconst df = await readCSV("data.csv", { no_types: true })\n// All values remain as strings, but methods work',
      '// With schema but no_types - validation occurs but returns DataFrame<any>\nconst df = await readCSV("data.csv", schema, { no_types: true })',
      '// Chain with DataFrame operations\nconst result = await readCSV("sales.csv", schema)\n  .filter(r => r.amount > 100)\n  .groupBy("region")\n  .summarize({ total: g => s.sum(g.amount) })',
    ],
    related: ["writeCSV", "readCSVMetadata", "readXLSX"],
    bestPractices: [
      "✓ GOOD: Use readCSVMetadata() first to inspect headers and structure",
      "✓ GOOD: Provide a Zod schema for type safety and automatic type conversion",
      "✓ GOOD: Use no_types: true when schema is truly unknown or dynamic",
      "✓ GOOD: Works with both file paths and raw CSV strings",
    ],
    antiPatterns: [
      "❌ BAD: Using no_types when you know the schema - you lose type safety",
      "❌ BAD: Reading large files without schema - use streaming readCSVStream instead",
    ],
  },

  readCSVMetadata: {
    name: "readCSVMetadata",
    category: "io",
    signature:
      "readCSVMetadata(pathOrContent: string, { previewRows?: number, comma?: string }): Promise<CSVMetadata>",
    description:
      "Read metadata about a CSV file without full parsing. Shows column headers and a preview of the first few rows. Use this before readCSV() to understand the file structure and determine the appropriate schema.",
    imports: [
      'import { readCSVMetadata, readCSV } from "@tidy-ts/dataframe";',
    ],
    parameters: [
      "pathOrContent: File path to CSV or raw CSV content string",
      "previewRows: Number of rows to preview (default: 5)",
      'comma: Field delimiter/comma character (default: ",")',
    ],
    returns:
      "Promise<{ headers: string[], totalRows: number, firstRows: string[][], delimiter: string }>",
    examples: [
      '// Inspect file structure\nconst meta = await readCSVMetadata("data.csv")\nconsole.log("Columns:", meta.headers)\nconsole.log("Preview:", meta.firstRows)',
      '// Build schema from headers\nconst meta = await readCSVMetadata("data.csv")\nconst schema = z.object({\n  [meta.headers[0]]: z.number(),\n  [meta.headers[1]]: z.string(),\n  // ...\n})\nconst df = await readCSV("data.csv", schema)',
      '// Preview TSV file\nconst meta = await readCSVMetadata("data.tsv", { comma: "\\t" })',
    ],
    related: ["readCSV"],
    bestPractices: [
      "✓ GOOD: Use before readCSV to understand file structure",
      "✓ GOOD: Check headers to determine appropriate Zod schema",
      "✓ GOOD: Inspect preview to identify data types and missing values",
    ],
  },

  writeCSV: {
    name: "writeCSV",
    category: "io",
    signature: "writeCSV<T>(df: DataFrame<T>, path: string): Promise<void>",
    description: "Write DataFrame to CSV file.",
    imports: [
      'import { readCSV, writeCSV, readXLSX, writeXLSX } from "@tidy-ts/dataframe";',
    ],
    parameters: [
      "df: DataFrame to write",
      "path: Output file path",
    ],
    returns: "Promise<void>",
    examples: [
      'await writeCSV(df, "output.csv")',
    ],
    related: ["readCSV", "writeXLSX", "writeParquet"],
  },

  readXLSX: {
    name: "readXLSX",
    category: "io",
    signature:
      "readXLSX<T>(pathOrBuffer: string | ArrayBuffer | File | Blob, schema?: ZodSchema<T>, opts?: ReadXLSXOpts): Promise<DataFrame<T>>\nreadXLSX(pathOrBuffer: string | ArrayBuffer | File | Blob, opts: { no_types: true }): Promise<DataFrame<any>>\nreadXLSX<T>(pathOrBuffer: string | ArrayBuffer | File | Blob, schema: ZodSchema<T>, opts: { no_types: true }): Promise<DataFrame<any>>",
    description:
      "Read XLSX file with optional schema validation and sheet selection. Returns a DataFrame that you can use with all DataFrame operations (filter, mutate, groupBy, etc.). Use readXLSXMetadata() first to inspect sheet names and preview data structure. When `no_types: true`, returns DataFrame<any> without strict type checking and preserves original types from XLSX (numbers, booleans). Supports file paths (Node.js/Deno) or ArrayBuffer/File/Blob (all environments including browsers).",
    imports: [
      'import { readCSV, writeCSV, readXLSX, writeXLSX, readXLSXMetadata } from "@tidy-ts/dataframe";',
    ],
    parameters: [
      "pathOrBuffer: File path (Node.js/Deno) or ArrayBuffer/File/Blob (all environments including browsers)",
      "schema: Optional Zod schema for type validation and conversion (required unless no_types is true)",
      "opts.sheet: Sheet name or index (default: first sheet)",
      "opts.skip: Number of rows to skip (useful if first row is a title, not headers)",
      "opts.no_types: When true, returns DataFrame<any> instead of typed DataFrame. Schema is optional when true. Preserves original XLSX types (numbers, booleans).",
    ],
    returns:
      "Promise<DataFrame<T>> or Promise<DataFrame<any>> - A DataFrame object with all standard operations",
    examples: [
      '// Basic usage - requires schema\nconst schema = z.object({ name: z.string(), age: z.number() })\nconst df = await readXLSX("data.xlsx", schema)',
      '// Without schema - returns DataFrame<any>\nconst df = await readXLSX("data.xlsx", { no_types: true })\n// Types are inferred from XLSX (numbers, booleans preserved)',
      '// With schema but no_types - validation occurs but returns DataFrame<any>\nconst df = await readXLSX("data.xlsx", schema, { no_types: true })',
      "// Browser-compatible: Read from File object\nconst fileInput = document.querySelector('input[type=\"file\"]');\nconst file = fileInput.files[0];\nconst df = await readXLSX(file, schema, { no_types: true })",
      "// Browser-compatible: Read from ArrayBuffer\nconst arrayBuffer = await file.arrayBuffer();\nconst df = await readXLSX(arrayBuffer, { no_types: true })",
      '// Select specific sheet\nconst df = await readXLSX("data.xlsx", schema, { sheet: "Summary" })',
      '// Skip header rows (e.g., if row 0 is a title)\nconst df = await readXLSX("data.xlsx", schema, { skip: 1 })',
      '// Chain with DataFrame operations\nconst result = await readXLSX("sales.xlsx", schema)\n  .filter(r => r.amount > 100)\n  .groupBy("region")\n  .summarize({ total: g => s.sum(g.amount) })',
    ],
    related: ["writeXLSX", "readCSV", "readXLSXMetadata"],
    bestPractices: [
      "✓ GOOD: Use readXLSXMetadata() first to inspect sheets and preview structure",
      "✓ GOOD: Use skip option if first row is a title/note rather than column headers",
      "✓ GOOD: Provide a Zod schema for type safety and automatic type conversion",
      "✓ GOOD: Use no_types: true when schema is unknown or dynamic",
      "✓ GOOD: Chain DataFrame operations immediately after reading",
    ],
    antiPatterns: [
      "❌ BAD: Using no_types when you know the schema - you lose type safety",
    ],
  },

  readXLSXMetadata: {
    name: "readXLSXMetadata",
    category: "io",
    signature:
      "readXLSXMetadata(pathOrBuffer: string | ArrayBuffer | File | Blob, { previewRows?: number, sheet?: string | number }): Promise<XLSXMetadata>",
    description:
      "Read metadata about an XLSX file without full parsing. Shows available sheets, default sheet, and a preview of the first few rows. Use this before readXLSX() to understand the file structure and determine which sheet to read and whether to skip rows. Supports file paths (Node.js/Deno) or ArrayBuffer/File/Blob (all environments including browsers).",
    imports: [
      'import { readXLSXMetadata, readXLSX } from "@tidy-ts/dataframe";',
    ],
    parameters: [
      "pathOrBuffer: File path (Node.js/Deno) or ArrayBuffer/File/Blob (all environments including browsers)",
      "previewRows: Number of rows to preview (default: 5)",
      "sheet: Which sheet to preview - name or index (default: first sheet)",
    ],
    returns:
      "Promise<{ sheets: SheetInfo[], defaultSheet: string, sheetName: string, headers: string[], totalRows: number, firstRows: string[][] }>",
    examples: [
      '// Inspect file structure (file path)\nconst meta = await readXLSXMetadata("data.xlsx")\nconsole.log("Sheets:", meta.sheets)\nconsole.log("Headers:", meta.headers)\nconsole.log("Preview:", meta.firstRows)',
      '// Browser-compatible: Inspect from File object\nconst fileInput = document.querySelector(\'input[type="file"]\');\nconst file = fileInput.files[0];\nconst meta = await readXLSXMetadata(file)\nconsole.log("Sheets:", meta.sheets)',
      '// Check if first row needs to be skipped\nconst meta = await readXLSXMetadata("data.xlsx")\nif (meta.firstRows[0][0] === "Report Title") {\n  df = await readXLSX("data.xlsx", schema, { skip: 1 })\n}',
      '// Preview a specific sheet\nconst meta = await readXLSXMetadata("data.xlsx", { sheet: "Summary", previewRows: 10 })',
    ],
    related: ["readXLSX"],
    bestPractices: [
      "✓ GOOD: Use before readXLSX to understand file structure",
      "✓ GOOD: Check preview to determine if skip option is needed",
      "✓ GOOD: Verify sheet names before reading specific sheets",
    ],
  },

  writeXLSX: {
    name: "writeXLSX",
    category: "io",
    signature:
      "writeXLSX<T>(df: DataFrame<T>, path: string, opts?: { sheet?: string }): Promise<void>",
    description: "Write DataFrame to XLSX file.",
    imports: [
      'import { readCSV, writeCSV, readXLSX, writeXLSX } from "@tidy-ts/dataframe";',
    ],
    parameters: [
      "df: DataFrame to write",
      "path: Output file path",
      'opts.sheet: Sheet name (default: "Sheet1")',
    ],
    returns: "Promise<void>",
    examples: [
      'await writeXLSX(df, "output.xlsx")',
      'await writeXLSX(df, "output.xlsx", { sheet: "Summary" })',
    ],
    related: ["readXLSX", "writeCSV"],
  },

  readJSON: {
    name: "readJSON",
    category: "io",
    signature:
      "readJSON<T>(filePath: string, schema: ZodSchema<T>): Promise<DataFrame<T> | T>",
    description:
      "Read JSON file with Zod schema validation. Returns a DataFrame for array of objects, or validated data for other schemas. Automatically infers types from schema.",
    imports: [
      'import { readJSON } from "@tidy-ts/dataframe";',
    ],
    parameters: [
      "filePath: Path to JSON file (Node.js/Deno only)",
      "schema: Zod schema for validation and type inference",
    ],
    returns:
      "Promise<DataFrame<T>> for array of objects, or Promise<T> for other types",
    examples: [
      '// Read array of objects as DataFrame\nconst UserSchema = z.array(z.object({\n  id: z.number(),\n  name: z.string(),\n  email: z.string().email(),\n}));\nconst users = await readJSON("users.json", UserSchema)',
      '// Read configuration object\nconst ConfigSchema = z.object({\n  apiUrl: z.string().url(),\n  timeout: z.number().positive(),\n});\nconst config = await readJSON("config.json", ConfigSchema)',
    ],
    related: ["writeJSON", "readCSV"],
    bestPractices: [
      "✓ GOOD: Use z.array(z.object({...})) to get a DataFrame",
      "✓ GOOD: Zod schema provides automatic type validation and conversion",
    ],
  },

  writeJSON: {
    name: "writeJSON",
    category: "io",
    signature:
      "writeJSON<T>(filePath: string, dataFrame: DataFrame<T>, opts?: WriteJSONOpts): Promise<void>",
    description:
      "Write DataFrame to JSON file. Serializes each row as an object in a JSON array. Handles nested DataFrames by converting them to arrays.",
    imports: [
      'import { writeJSON } from "@tidy-ts/dataframe";',
    ],
    parameters: [
      "filePath: Path where JSON file should be written",
      "dataFrame: DataFrame to export",
      "opts.naValue: Custom NA representation (optional)",
      "opts.formatDate: Custom date formatting function (optional)",
    ],
    returns: "Promise<void>",
    examples: [
      '// Basic export\nconst df = createDataFrame([\n  { name: "Alice", age: 25 },\n  { name: "Bob", age: 30 }\n]);\nawait writeJSON("users.json", df)',
      '// With custom date formatting\nawait writeJSON("data.json", df, {\n  formatDate: (date) => date.toISOString().split("T")[0]\n})',
    ],
    related: ["readJSON", "writeCSV"],
  },

  readParquet: {
    name: "readParquet",
    category: "io",
    signature:
      "readParquet<T>(pathOrBuffer: string | ArrayBuffer, schema: ZodSchema<T>, opts?: ParquetOptions): Promise<DataFrame<T>>",
    description:
      "Read Parquet file or buffer with Zod schema validation. Supports file paths (Node.js/Deno) or ArrayBuffer (all environments). Efficient columnar format for large datasets.",
    imports: [
      'import { readParquet } from "@tidy-ts/dataframe";',
    ],
    parameters: [
      "pathOrBuffer: File path (Node.js/Deno) or ArrayBuffer",
      "schema: Zod schema for validation and type conversion",
      "opts.columns: Select specific columns (optional)",
      "opts.rowStart: Start row index (optional)",
      "opts.rowEnd: End row index (optional)",
    ],
    returns: "Promise<DataFrame<T>>",
    examples: [
      '// Read from file\nconst schema = z.object({\n  id: z.number(),\n  name: z.string(),\n});\nconst df = await readParquet("data.parquet", schema)',
      '// Read specific columns and row range\nconst df = await readParquet("data.parquet", schema, {\n  columns: ["id", "name"],\n  rowStart: 0,\n  rowEnd: 1000\n})',
    ],
    related: ["writeParquet", "readArrow", "readCSV"],
    bestPractices: [
      "✓ GOOD: Use Parquet for large datasets - efficient columnar storage",
      "✓ GOOD: Specify columns option to read only needed data",
    ],
  },

  writeParquet: {
    name: "writeParquet",
    category: "io",
    signature: "writeParquet<T>(df: DataFrame<T>, path: string): DataFrame<T>",
    description:
      "Write DataFrame to Parquet file. Automatically infers column types. Requires static import. Efficient columnar format for large datasets.",
    imports: [
      'import { writeParquet } from "@tidy-ts/dataframe/ts/verbs/utility";',
    ],
    parameters: [
      "df: DataFrame to write",
      "path: Output file path",
    ],
    returns: "DataFrame<T> - Original DataFrame for chaining",
    examples: [
      '// Write to Parquet file\nimport { writeParquet } from "@tidy-ts/dataframe/ts/verbs/utility";\n\nconst df = createDataFrame([\n  { id: 1, name: "Alice", age: 30 },\n  { id: 2, name: "Bob", age: 25 }\n]);\nwriteParquet(df, "output.parquet")',
    ],
    related: ["readParquet", "writeCSV"],
    bestPractices: [
      "⚠ NOTE: Requires static import, not available via dynamic import",
      "✓ GOOD: Use Parquet for large datasets - efficient columnar storage",
    ],
  },

  readArrow: {
    name: "readArrow",
    category: "io",
    signature:
      "readArrow<T>(pathOrBuffer: string | ArrayBuffer, schema: ZodSchema<T>, opts?: ArrowOptions): Promise<DataFrame<T>>",
    description:
      "Read Apache Arrow file or buffer with Zod schema validation. Supports file paths (Node.js/Deno) or ArrayBuffer (all environments). Efficient for inter-process data exchange.",
    imports: [
      'import { readArrow } from "@tidy-ts/dataframe";',
    ],
    parameters: [
      "pathOrBuffer: File path (Node.js/Deno) or ArrayBuffer",
      "schema: Zod schema for validation and type conversion",
      "opts.columns: Select specific columns (optional)",
      "opts.useDate: Convert timestamps to Date objects (optional)",
      "opts.useBigInt: Use BigInt for large integers (optional)",
    ],
    returns: "Promise<DataFrame<T>>",
    examples: [
      '// Read from file\nconst schema = z.object({\n  id: z.number(),\n  name: z.string(),\n  created: z.date(),\n});\nconst df = await readArrow("data.arrow", schema)',
      '// Read from ArrayBuffer\nconst buffer = await Deno.readFile("data.arrow");\nconst df = await readArrow(buffer, schema, {\n  columns: ["id", "name"],\n  useDate: true\n})',
    ],
    related: ["readParquet", "readCSV"],
    bestPractices: [
      "✓ GOOD: Use Arrow for efficient inter-process data exchange",
      "✓ GOOD: Set useDate: true to convert timestamps to Date objects",
    ],
  },

  // Statistics documentation merged from stats.ts
  // (See stats.ts for all stats function documentation)
  ...statsDocs,
};

// Category groupings for list-operations
export const CATEGORIES = {
  dataframe: [
    "print",
    "createDataFrame",
    "select",
    "drop",
    "filter",
    "slice",
    "sliceHead",
    "sliceTail",
    "sliceMax",
    "sliceMin",
    "sliceSample",
    "mutate",
    "arrange",
    "distinct",
    "rename",
    "extract",
    "extractHead",
    "extractTail",
    "extractNth",
    "extractSample",
    "extractUnique",
    "groupBy",
    "summarize",
    "count",
    "ungroup",
    "innerJoin",
    "leftJoin",
    "rightJoin",
    "outerJoin",
    "asofJoin",
    "pivotLonger",
    "pivotWider",
    "transpose",
    "unnest",
    "bindRows",
    "concatDataFrames",
    "downsample",
    "upsample",
    "replaceNA",
    "removeNA",
    "removeNull",
    "removeUndefined",
    "fillForward",
    "fillBackward",
    "interpolate",
    "profile",
    "graph",
  ],
  io: [
    "readCSV",
    "readCSVMetadata",
    "writeCSV",
    "readXLSX",
    "readXLSXMetadata",
    "writeXLSX",
    "readJSON",
    "writeJSON",
    "readParquet",
    "writeParquet",
    "readArrow",
  ],
  stats: [
    // Descriptive statistics
    "mean",
    "median",
    "mode",
    "sum",
    "max",
    "min",
    "stdev",
    "variance",
    "quantile",
    "quartiles",
    "iqr",
    "range",
    "product",
    // Window/cumulative functions
    "cumsum",
    "cummean",
    "cumprod",
    "cummax",
    "cummin",
    "rolling",
    "lag",
    "lead",
    "forwardFill",
    "backwardFill",
    "interpolate",
    // Aggregation functions
    "first",
    "last",
    // Ranking functions
    "rank",
    "denseRank",
    "percentileRank",
    // Utility functions
    "chunk",
    "batch",
    // Transformation functions
    "normalize",
    "round",
    "percent",
    // Utility functions
    "unique",
    "covariance",
    // Statistical tests
    "tTest",
    "compareAPI",
    // Distributions
    "normalDist",
  ],
  llm: [
    "LLMEmbed",
    "LLMRespond",
    "LLMCompareEmbeddings",
  ],
  all: Object.keys(DOCS),
};

export function getOperationsByCategory(category: string): DocEntry[] {
  const keys = CATEGORIES[category as keyof typeof CATEGORIES] ||
    CATEGORIES.all;
  return keys.map((key) => DOCS[key]).filter(Boolean);
}

export function getDocumentation(topic: string): DocEntry | null {
  // Normalize topic (handle both "mean" and "s.mean")
  const normalized = topic.replace(/^s\./, "");

  // Direct match
  if (DOCS[topic]) return DOCS[topic];
  if (DOCS[normalized]) return DOCS[normalized];

  // Fuzzy match (case-insensitive)
  const lowerTopic = topic.toLowerCase();
  const match = Object.entries(DOCS).find(([key, doc]) =>
    key.toLowerCase() === lowerTopic || doc.name.toLowerCase() === lowerTopic
  );

  return match ? match[1] : null;
}
