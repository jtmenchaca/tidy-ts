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
      "createDataFrame<T>(data: T[] | { columns: Record<string, unknown[]> }): DataFrame<T>",
    description:
      "Create a DataFrame from an array of row objects or from column arrays.",
    imports: [
      'import { createDataFrame, stats as s } from "@tidy-ts/dataframe";',
    ],
    parameters: [
      "data: Array of row objects OR { columns: { columnName: values[] } }",
    ],
    returns: "DataFrame<T>",
    examples: [
      'const df = createDataFrame([{ name: "Alice", age: 30 }, { name: "Bob", age: 25 }])',
      'const df = createDataFrame({ columns: { name: ["Alice", "Bob"], age: [30, 25] } })',
    ],
    related: ["readCSV", "readXLSX", "readJSON"],
    bestPractices: [
      'Always import stats: import { createDataFrame, stats as s } from "@tidy-ts/dataframe"',
      "Use df.print() to display DataFrames, not console.log(df.toArray())",
      "Access columns with df.columnName property (e.g., df.age) instead of manual extraction",
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
    related: ["innerJoin", "leftJoin", "rightJoin"],
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
    related: ["append", "prepend"],
    bestPractices: [
      "✓ GOOD: Automatically handles missing columns - fills with undefined",
      "✓ GOOD: Preserves all columns from all DataFrames",
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

  // I/O Operations
  readCSV: {
    name: "readCSV",
    category: "io",
    signature:
      "readCSV<T>(path: string, schema?: ZodSchema<T>): Promise<DataFrame<T>>",
    description: "Read CSV file with optional Zod schema validation.",
    imports: [
      'import { readCSV, writeCSV, readXLSX, writeXLSX } from "@tidy-ts/dataframe";',
    ],
    parameters: [
      "path: File path to CSV",
      "schema: Optional Zod schema for validation",
    ],
    returns: "Promise<DataFrame<T>>",
    examples: [
      'const df = await readCSV("data.csv")',
      'const df = await readCSV("data.csv", PersonSchema)',
    ],
    related: ["writeCSV", "readXLSX", "readJSON"],
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
      "readXLSX<T>(path: string, schema?: ZodSchema<T>, opts?: { sheet?: string }): Promise<DataFrame<T>>",
    description:
      "Read XLSX file with optional schema validation and sheet selection.",
    imports: [
      'import { readCSV, writeCSV, readXLSX, writeXLSX } from "@tidy-ts/dataframe";',
    ],
    parameters: [
      "path: File path to XLSX",
      "schema: Optional Zod schema",
      "opts.sheet: Sheet name (default: first sheet)",
    ],
    returns: "Promise<DataFrame<T>>",
    examples: [
      'const df = await readXLSX("data.xlsx")',
      'const df = await readXLSX("data.xlsx", PersonSchema, { sheet: "Summary" })',
    ],
    related: ["writeXLSX", "readCSV"],
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

  // Statistics - Descriptive
  mean: {
    name: "s.mean",
    category: "stats",
    signature: "s.mean(values: number[], removeNA?: boolean): number | null",
    description: "Calculate the arithmetic mean (average) of numeric values. Returns null if no valid values.",
    imports: ['import { stats as s } from "@tidy-ts/dataframe";'],
    parameters: [
      "values: A single number or array of numbers",
      "removeNA: Whether to exclude null/undefined values (when using mixed arrays)"
    ],
    returns: "number | null - The arithmetic mean of all numeric values",
    examples: [
      "s.mean(5) // 5",
      "s.mean([1, 2, 3, 4]) // 2.5",
      "s.mean([1, 2, null, 4], true) // 2.33",
      'df.groupBy("region").summarize({ avg: group => s.mean(group.sales) })',
    ],
    related: ["median", "mode", "sd"],
    antiPatterns: [
      "❌ BAD: values.reduce((a, b) => a + b, 0) / values.length",
    ],
    bestPractices: [
      "✓ GOOD: s.mean(values) - built-in, faster, handles edge cases",
      "Use with df.columnName for direct access: s.mean(df.age)",
    ],
  },

  median: {
    name: "s.median",
    category: "stats",
    signature: "s.median(values: number[]): number",
    description: "Calculate the median (50th percentile).",
    imports: ['import { stats as s } from "@tidy-ts/dataframe";'],
    parameters: ["values: Array of numbers"],
    returns: "number",
    examples: [
      "s.median([1, 2, 3, 4, 5]) // 3",
      "s.median(df.sales)",
    ],
    related: ["mean", "quantile"],
    antiPatterns: [
      "❌ BAD: [...values].sort((a, b) => a - b)[Math.floor(values.length / 2)]",
    ],
    bestPractices: [
      "✓ GOOD: s.median(values) - handles even/odd lengths correctly",
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
    signature: "s.max(values: number[]): number",
    description: "Find the maximum value.",
    imports: ['import { stats as s } from "@tidy-ts/dataframe";'],
    parameters: ["values: Array of numbers"],
    returns: "number",
    examples: [
      "s.max([1, 2, 3, 4, 5]) // 5",
      "s.max(df.price)",
    ],
    related: ["min", "cummax"],
  },

  min: {
    name: "s.min",
    category: "stats",
    signature: "s.min(values: number[]): number",
    description: "Find the minimum value.",
    imports: ['import { stats as s } from "@tidy-ts/dataframe";'],
    parameters: ["values: Array of numbers"],
    returns: "number",
    examples: [
      "s.min([1, 2, 3, 4, 5]) // 1",
      "s.min(df.price)",
    ],
    related: ["max", "cummin"],
  },

  // Additional Descriptive Statistics
  mode: {
    name: "s.mode",
    category: "stats",
    signature: "s.mode(values: number[], removeNA?: boolean): number | null",
    description: "Calculate the mode (most frequent value) of an array. Returns null if no valid values and removeNA=false.",
    imports: ['import { stats as s } from "@tidy-ts/dataframe";'],
    parameters: [
      "values: Array of numbers or single number",
      "removeNA: If true, guarantees a number return (throws if no valid values)"
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

  stdev: {
    name: "s.sd",
    category: "stats",
    signature: "s.sd(values: number[], removeNA?: boolean): number | null",
    description: "Calculate the sample standard deviation of an array of values. Returns null if insufficient data or removeNA=false with mixed types.",
    imports: ['import { stats as s } from "@tidy-ts/dataframe";'],
    parameters: [
      "values: Array of numbers or single number",
      "removeNA: If true, processes valid numbers from mixed arrays; if false, returns null for mixed arrays"
    ],
    returns: "number | null",
    examples: [
      "s.sd(42) // Always returns 0 for single value",
      "s.sd([1, 2, 3, 4, 5]) // sample standard deviation (default)",
      's.sd([1, "2", 3], true) // 1.41... (std dev of [1, 3] with removeNA=true)',
      's.sd([1, "2", 3], false) // null (mixed types, removeNA=false)',
    ],
    related: ["variance", "mean"],
  },

  variance: {
    name: "s.variance",
    category: "stats",
    signature: "s.variance(values: number[], removeNA?: boolean): number | null",
    description: "Calculate the sample variance of an array of values (uses N-1 denominator). Returns null if insufficient data.",
    imports: ['import { stats as s } from "@tidy-ts/dataframe";'],
    parameters: [
      "values: Array of numbers or single number",
      "removeNA: If true, processes valid numbers from mixed arrays; if false, returns null for mixed arrays"
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

  quantile: {
    name: "s.quantile",
    category: "stats",
    signature: "s.quantile(data: number[], probs: number | number[], removeNA?: boolean): number | number[] | null",
    description: "Calculate quantiles of an array of values. Uses R's Type 7 algorithm (default). Accepts single probability or array of probabilities.",
    imports: ['import { stats as s } from "@tidy-ts/dataframe";'],
    parameters: [
      "data: Array of numbers or single number",
      "probs: Probability value(s) between 0 and 1",
      "removeNA: If true, removes non-numeric values; if false, returns null for mixed types"
    ],
    returns: "number | number[] | null - Single value or array depending on probs input",
    examples: [
      "const q50 = s.quantile([1, 2, 3, 4, 5], 0.5) // 3 (median)",
      "const [q25, q75] = s.quantile([1, 2, 3, 4, 5], [0.25, 0.75]) // [2, 4]",
    ],
    related: ["median", "quartiles", "iqr"],
  },

  quartiles: {
    name: "s.quartiles",
    category: "stats",
    signature: "s.quartiles(values: number[], removeNA?: boolean): [number, number, number] | null",
    description: "Calculate the quartiles (Q25, median/Q50, Q75) of values. Returns null if no valid values.",
    imports: ['import { stats as s } from "@tidy-ts/dataframe";'],
    parameters: [
      "values: Array of numbers or values that can contain null/undefined, or single number",
      "removeNA: If true, removes non-numeric values; if false, returns null for mixed types"
    ],
    returns: "[Q25, Q50, Q75] tuple or null",
    examples: [
      "s.quartiles(42) // Always returns [42, 42, 42] for single value",
      "const [q25, q50, q75] = s.quartiles([1, 2, 3, 4, 5]) // [2, 3, 4]",
    ],
    related: ["quantile", "iqr", "median"],
  },

  iqr: {
    name: "s.iqr",
    category: "stats",
    signature: "s.iqr(values: number[], removeNA?: boolean): number | null",
    description: "Calculate the interquartile range (IQR) of values (Q75 - Q25). Returns null if no valid values.",
    imports: ['import { stats as s } from "@tidy-ts/dataframe";'],
    parameters: [
      "values: Array of numbers or single number",
      "removeNA: If true, removes non-numeric values; if false, returns null for mixed types"
    ],
    returns: "number | null",
    examples: [
      "s.iqr(42) // Always returns 0 for single value",
      "const iqr_val = s.iqr([1, 2, 3, 4, 5]) // 2 (4 - 2)",
    ],
    related: ["quartiles", "quantile", "range"],
  },

  range: {
    name: "s.range",
    category: "stats",
    signature: "s.range(values: number[], removeNA?: boolean): number | null",
    description: "Calculate the range of values (max - min). Returns null if no valid values.",
    imports: ['import { stats as s } from "@tidy-ts/dataframe";'],
    parameters: [
      "values: Array of numbers, or single number",
      "removeNA: If true, removes non-numeric values; if false, returns null for mixed types"
    ],
    returns: "number | null",
    examples: [
      "s.range(42) // Always returns 0 for single value",
      "const r = s.range([1, 5, 3, 9, 2]) // 8 (9 - 1)",
    ],
    related: ["max", "min", "iqr"],
  },

  product: {
    name: "s.product",
    category: "stats",
    signature: "s.product(values: number[], removeNA?: boolean): number | null",
    description: "Calculate the product (multiplication) of all values. Returns null if no valid values.",
    imports: ['import { stats as s } from "@tidy-ts/dataframe";'],
    parameters: [
      "values: Array of numbers or single number",
      "removeNA: If true, guarantees a number return (throws if no valid values)"
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

  // Window Functions
  cumsum: {
    name: "s.cumsum",
    category: "stats",
    signature: "s.cumsum(values: number[], removeNA?: boolean): number | number[] | (number | null)[]",
    description: "Calculate cumulative sums for an array of values. Returns array where each element is the sum of all previous elements.",
    imports: ['import { stats as s } from "@tidy-ts/dataframe";'],
    parameters: [
      "values: Array of numbers",
      "removeNA: If true, removes non-numeric values; if false, returns null for mixed types"
    ],
    returns: "number | number[] | (number | null)[]",
    examples: [
      "s.cumsum([1, 2, 3, 4, 5]) // [1, 3, 6, 10, 15]",
      "s.cumsum([1, null, 3, 4], true) // [1, 1, 4, 8] - removes nulls",
    ],
    related: ["sum", "cummean", "cumprod"],
  },

  cummean: {
    name: "s.cummean",
    category: "stats",
    signature: "s.cummean(values: number[], removeNA?: boolean): number | number[] | (number | null)[]",
    description: "Calculate cumulative mean of values. Returns an array where each element is the mean of all values up to that point.",
    imports: ['import { stats as s } from "@tidy-ts/dataframe";'],
    parameters: [
      "values: Array of numbers",
      "removeNA: If true, removes non-numeric values; if false, returns null for mixed types"
    ],
    returns: "number | number[] | (number | null)[]",
    examples: [
      "s.cummean([1, 2, 3, 4])  // [1, 1.5, 2, 2.5]",
      "s.cummean([1, null, 3, 4, 5], true)  // [1, 1, 2, 2.5, 3]",
    ],
    related: ["cumsum", "mean"],
  },

  cumprod: {
    name: "s.cumprod",
    category: "stats",
    signature: "s.cumprod(values: number[], removeNA?: boolean): number | number[] | (number | null)[]",
    description: "Calculate cumulative product of numeric values. Returns array where each element is the product of all previous elements.",
    imports: ['import { stats as s } from "@tidy-ts/dataframe";'],
    parameters: [
      "values: Array of numbers",
      "removeNA: If true, removes non-numeric values; if false, returns null for mixed types"
    ],
    returns: "number | number[] | (number | null)[]",
    examples: [
      "s.cumprod([1, 2, 3, 4, 5]) // [1, 2, 6, 24, 120]",
      "s.cumprod([1, null, 3, 4], true) // [1, 1, 3, 12] - removes nulls",
    ],
    related: ["cumsum", "product"],
  },

  cummax: {
    name: "s.cummax",
    category: "stats",
    signature: "s.cummax(values: number[], removeNA?: boolean): number | number[] | (number | null)[]",
    description: "Calculate cumulative maximum of numeric values. Returns array where each element is the max of all previous elements.",
    imports: ['import { stats as s } from "@tidy-ts/dataframe";'],
    parameters: [
      "values: Array of numbers",
      "removeNA: If true, removes non-numeric values; if false, returns null for mixed types"
    ],
    returns: "number | number[] | (number | null)[]",
    examples: [
      "s.cummax([1, 2, 3, 4, 5]) // [1, 2, 3, 4, 5]",
      "s.cummax([1, null, 3, 4], true) // [1, 1, 3, 4] - removes nulls",
    ],
    related: ["cummin", "max"],
  },

  cummin: {
    name: "s.cummin",
    category: "stats",
    signature: "s.cummin(values: number[], removeNA?: boolean): number | number[] | (number | null)[]",
    description: "Calculate cumulative minimum of numeric values. Returns array where each element is the min of all previous elements.",
    imports: ['import { stats as s } from "@tidy-ts/dataframe";'],
    parameters: [
      "values: Array of numbers",
      "removeNA: If true, removes non-numeric values; if false, returns null for mixed types"
    ],
    returns: "number | number[] | (number | null)[]",
    examples: [
      "s.cummin([1, 2, 3, 4, 5]) // [1, 1, 1, 1, 1]",
      "s.cummin([1, null, 3, 4], true) // [1, 1, 1, 1] - removes nulls",
    ],
    related: ["cummax", "min"],
  },

  lag: {
    name: "s.lag",
    category: "stats",
    signature: 's.lag(values: T[], k?: number, defaultValue?: T): (T | undefined)[] OR s.lag(columnName: string, k?: number, defaultValue?: T): (row, index, df) => T | undefined',
    description: "Lag values by k positions (shift forward, filling with default). Supports two usage patterns: array-based and column-based (for use in mutate).",
    imports: ['import { stats as s } from "@tidy-ts/dataframe";'],
    parameters: [
      "valuesOrColumnName: Array of values to lag OR column name for DataFrame operations",
      "k: Number of positions to lag (default: 1)",
      "defaultValue: Value to fill missing positions (default: undefined)",
    ],
    returns: "Array with values lagged by k positions OR function for mutate operations",
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
    signature: 's.lead(values: T[], k?: number, defaultValue?: T): (T | undefined)[] OR s.lead(columnName: string, k?: number, defaultValue?: T): (row, index, df) => T | undefined',
    description: "Lead values by k positions (shift backward, filling with default). Supports two usage patterns: array-based and column-based (for use in mutate).",
    imports: ['import { stats as s } from "@tidy-ts/dataframe";'],
    parameters: [
      "valuesOrColumnName: Array of values to lead OR column name for DataFrame operations",
      "k: Number of positions to lead (default: 1)",
      "defaultValue: Value to fill missing positions (default: undefined)",
    ],
    returns: "Array with values led by k positions OR function for mutate operations",
    examples: [
      "// Array-based usage",
      "s.lead([1, 2, 3, 4, 5])  // [2, 3, 4, 5, undefined]",
      "s.lead([1, 2, 3, 4, 5], 2)  // [3, 4, 5, undefined, undefined]",
      "s.lead([1, 2, 3, 4, 5], 1, 0)  // [2, 3, 4, 5, 0]",
      "// Column-based usage in mutate",
      'df.mutate({ next_sales: s.lead("sales", 1, 0) })',
    ],
    related: ["lag"],
  },

  // Ranking Functions
  rank: {
    name: "s.rank",
    category: "stats",
    signature: 's.rank(values: number[], ties?: "average" | "min" | "max" | "dense", descending?: boolean): number[] | (number | null)[] OR s.rank(values: number[], target: number): number | null',
    description: "Calculate ranks for an array of values. Supports finding rank of all values or a specific target value. Handles ties using specified method including dense ranking.",
    imports: ['import { stats as s } from "@tidy-ts/dataframe";'],
    parameters: [
      "values: Array of numbers",
      'ties: How to handle ties: "average" (default), "min", "max", "dense"',
      "descending: Whether to rank in descending order (default: false = ascending)",
      "target: Optional - The value to find the rank for (returns single rank)",
    ],
    returns: "number[] for all ranks OR number | null for target rank",
    examples: [
      "s.rank([3, 1, 4, 1, 5]) // [3, 1.5, 4, 1.5, 5] (average)",
      's.rank([3, 1, 4, 1, 5], "min") // [3, 1, 4, 1, 5]',
      's.rank([3, 1, 4, 1, 5], "max") // [3, 2, 4, 2, 5]',
      's.rank([3, 1, 4, 1, 5], "average", true) // descending order',
      "s.rank([3, 1, 4, 1, 5], 3) // 3 (rank of value 3)",
    ],
    related: ["denseRank", "percentileRank"],
  },

  denseRank: {
    name: "s.denseRank",
    category: "stats",
    signature: "s.denseRank(values: T[], options?: { desc?: boolean }): number[] OR s.denseRank(values: T[], target: T, options?: { desc?: boolean }): number | null",
    description: "Calculate dense rank of values (no gaps in ranking). Unlike regular rank, has no gaps after tied values. Supports finding rank of all values or a specific target value.",
    imports: ['import { stats as s } from "@tidy-ts/dataframe";'],
    parameters: [
      "values: Array of values to rank",
      "options: Ranking options with desc for descending order (default: false)",
      "target: Optional - The value to find the dense rank for (returns single rank)",
    ],
    returns: "number[] for all ranks OR number | null for target rank",
    examples: [
      "s.denseRank([10, 20, 20, 30])  // [1, 2, 2, 3] (no gap after ties)",
      "s.denseRank([5, 3, 8, 3, 1])   // [3, 2, 4, 2, 1]",
      "s.denseRank([10, 20, 20, 30], { desc: true })  // [4, 3, 3, 1]",
    ],
    related: ["rank", "percentileRank"],
  },

  percentileRank: {
    name: "s.percentile_rank",
    category: "stats",
    signature: "s.percentile_rank(values: number[]): number[] | (number | null)[] OR s.percentile_rank(values: number[], target: number): number | null",
    description: "Calculate the percentile rank of a value within an array. Returns a value between 0 and 1 representing the percentile rank. If target is not provided, returns percentile ranks for all values.",
    imports: ['import { stats as s } from "@tidy-ts/dataframe";'],
    parameters: [
      "values: Array of numbers",
      "target: Optional - The value to find the percentile rank for (between 0 and 1)"
    ],
    returns: "number | null for single target OR number[] | (number | null)[] for all values",
    examples: [
      "s.percentile_rank([1, 2, 3, 4, 5], 3) // 0.6 (3 is at 60th percentile)",
      "s.percentile_rank([10, 20, 30, 40, 50], 25) // 0.4 (25 is at 40th percentile)",
      "s.percentile_rank([1, 2, 3, 4, 5]) // [0.2, 0.4, 0.6, 0.8, 1.0]",
    ],
    related: ["rank", "denseRank", "quantile"],
  },

  // Transformation Functions
  normalize: {
    name: "s.normalize",
    category: "stats",
    signature: 's.normalize(values: number[], method?: "minmax" | "zscore"): number[] | (number | null)[] OR s.normalize(values: number[], target: number, method?: "minmax" | "zscore"): number | null',
    description: 'Normalize values to 0-1 range using min-max normalization or z-score standardization. Supports finding normalized value for all values or a specific target value.',
    imports: ['import { stats as s } from "@tidy-ts/dataframe";'],
    parameters: [
      "values: Array of numbers",
      'method: Normalization method: "minmax" (default) or "zscore"',
      "target: Optional - The value to find the normalized value for"
    ],
    returns: "number[] for all values OR number | null for target value",
    examples: [
      "s.normalize([10, 20, 30]) // [0, 0.5, 1] (min-max normalization)",
      's.normalize([10, 20, 30], "zscore") // z-scores with mean=0, std=1',
      "s.normalize([10, 20, 30], 20) // 0.5 (20 is halfway between 10 and 30)",
      's.normalize([10, 20, 30], 20, "zscore") // z-score of 20',
    ],
    related: ["sd", "mean"],
  },

  round: {
    name: "s.round",
    category: "stats",
    signature: "s.round(value: number | number[], digits?: number): number | number[]",
    description: "Round a number or all values in an array to a specified number of decimal places.",
    imports: ['import { stats as s } from "@tidy-ts/dataframe";'],
    parameters: [
      "value: Number or array of numbers to round",
      "digits: Number of decimal places (default: 0)"
    ],
    returns: "number or number[]",
    examples: [
      "s.round(3.14159) // 3",
      "s.round(3.14159, 2) // 3.14",
      "s.round(123.456, 1) // 123.5",
      "s.round(123.456, -1) // 120",
      "s.round([1.234, 2.567, 3.891], 2) // [1.23, 2.57, 3.89]",
    ],
    related: [],
  },

  percent: {
    name: "s.percent",
    category: "stats",
    signature: "s.percent(numerator: number | null | undefined, denominator: number | null | undefined, decimals?: number): number | null",
    description: "Calculate a percentage from a numerator and denominator, rounded to a given number of decimals. Returns 0 when denominator is 0 to handle division-by-zero gracefully. Returns null if either numerator or denominator is null/undefined.",
    imports: ['import { stats as s } from "@tidy-ts/dataframe";'],
    parameters: [
      "numerator: The portion value",
      "denominator: The total value",
      "decimals: Number of decimal places to round to (default: 1)"
    ],
    returns: "number | null - Percentage (0–100 scale), rounded, or null if inputs are null/undefined",
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

  // Utility Functions
  unique: {
    name: "s.unique",
    category: "stats",
    signature: "s.unique(values: T[]): T[]",
    description: "Get unique values from an array (WASM-optimized version). Returns unique values in order of first appearance.",
    imports: ['import { stats as s } from "@tidy-ts/dataframe";'],
    parameters: ["values: Array of values to get unique values from"],
    returns: "T[] - array with duplicates removed in order of first appearance",
    examples: [
      "s.unique([1, 2, 1, 3, 2]) // [1, 2, 3]",
      's.unique(["a", "b", "a", "c"]) // ["a", "b", "c"]',
      "s.unique([true, false, true]) // [true, false]",
    ],
    related: ["distinct", "mode"],
  },

  covariance: {
    name: "s.covariance",
    category: "stats",
    signature: "s.covariance(x: number[], y: number[], removeNA?: boolean): number | null",
    description: "Calculate the sample covariance between two arrays of values. Arrays must have the same length. Returns null if no valid pairs.",
    imports: ['import { stats as s } from "@tidy-ts/dataframe";'],
    parameters: [
      "x: First array of numbers",
      "y: Second array of numbers (same length as x)",
      "removeNA: If true, guarantees a number return (throws if no valid pairs)"
    ],
    returns: "number | null",
    examples: [
      "s.covariance([1, 2, 3], [1, 2, 3]) // 1",
      "s.covariance([1, 2, 3], [3, 2, 1]) // -1",
      "s.covariance([1, null, 3], [1, 2, 3], false) // null (due to null)",
      "s.covariance([1, null, 3], [1, 2, 3], true) // 2 (ignoring null pair)",
    ],
    related: ["s.test.correlation.pearson", "variance"],
  },

  // Statistics - Tests
  tTest: {
    name: "s.test.t.oneSample",
    category: "stats",
    signature:
      "s.test.t.oneSample({ data, mu, alternative?, alpha? }): TestResult",
    description:
      "One-sample t-test. Tests if mean differs from a hypothesized value.",
    imports: ['import { stats as s } from "@tidy-ts/dataframe";'],
    parameters: [
      "data: Array of numbers",
      "mu: Hypothesized mean",
      'alternative: "two-sided" (default), "less", or "greater"',
      "alpha: Significance level (default: 0.05)",
    ],
    returns:
      "TestResult with p_value, test_statistic, confidence_interval, etc.",
    examples: [
      's.test.t.oneSample({ data: heights, mu: 170, alternative: "two-sided", alpha: 0.05 })',
    ],
    related: ["s.test.t.independent", "s.test.t.paired", "s.compare"],
  },

  compareAPI: {
    name: "s.compare",
    category: "stats",
    signature: "s.compare.{scenario}.{test}(...)",
    description:
      "Intent-driven statistical testing API. Helps you choose the right test based on your comparison goal.",
    imports: ['import { stats as s } from "@tidy-ts/dataframe";'],
    parameters: [
      "Scenarios: oneGroup, twoGroups, multiGroups",
      "Tests: centralTendency, proportions, distribution, association",
      "Options: parametric/nonparametric/auto, comparator type, alpha",
    ],
    returns: "TestResult",
    examples: [
      's.compare.oneGroup.centralTendency.toValue({ data, hypothesizedValue: 100, parametric: "auto" })',
      's.compare.twoGroups.centralTendency.toEachOther({ x, y, paired: false, parametric: "parametric" })',
      's.compare.twoGroups.association.toEachOther({ x, y, method: "pearson" })',
    ],
    related: ["s.test", "s.dist"],
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

  // Distributions
  normalDist: {
    name: "s.dist.normal",
    category: "stats",
    signature: "s.dist.normal.{function}(...)",
    description: "Normal (Gaussian) distribution functions.",
    imports: ['import { stats as s } from "@tidy-ts/dataframe";'],
    parameters: [
      "random({ mean, standardDeviation, sampleSize }): Generate random values",
      "density({ at, mean, standardDeviation }): PDF at x",
      "probability({ at, mean, standardDeviation }): CDF (cumulative probability)",
      "quantile({ probability, mean, standardDeviation }): Inverse CDF (critical value)",
      'data({ mean, standardDeviation, type: "pdf" | "cdf", range, points }): Generate data for plotting',
    ],
    returns: "number or number[]",
    examples: [
      "s.dist.normal.random({ mean: 0, standardDeviation: 1, sampleSize: 100 })",
      "s.dist.normal.probability({ at: 1.96, mean: 0, standardDeviation: 1 }) // ~0.975",
      "s.dist.normal.quantile({ probability: 0.975, mean: 0, standardDeviation: 1 }) // ~1.96",
    ],
    related: ["s.dist.t", "s.dist.chiSquare", "s.dist.beta"],
  },
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
    "pivotLonger",
    "pivotWider",
    "transpose",
    "bindRows",
    "replaceNA",
    "removeNA",
    "removeNull",
    "removeUndefined",
    "profile",
  ],
  io: ["readCSV", "writeCSV", "readXLSX", "writeXLSX"],
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
    "lag",
    "lead",
    // Ranking functions
    "rank",
    "denseRank",
    "percentileRank",
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
