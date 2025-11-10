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
};
