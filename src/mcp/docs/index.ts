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

  // I/O Operations
  readCSV: {
    name: "readCSV",
    category: "io",
    signature:
      "readCSV<T>(pathOrContent: string, schema?: ZodSchema<T>, opts?: CsvOptions): Promise<DataFrame<T>>",
    description:
      "Read CSV file or parse CSV content with optional Zod schema validation. Returns a DataFrame that you can use with all DataFrame operations. Use readCSVMetadata() first to inspect headers and preview data structure.",
    imports: [
      'import { readCSV, writeCSV, readCSVMetadata } from "@tidy-ts/dataframe";',
    ],
    parameters: [
      "pathOrContent: File path to CSV or raw CSV content string",
      "schema: Optional Zod schema for validation and type conversion",
      "opts.comma: Field delimiter/comma character (default: ',')",
      "opts.skipEmptyLines: Skip empty lines (default: true)",
    ],
    returns:
      "Promise<DataFrame<T>> - A DataFrame object with all standard operations",
    examples: [
      '// Read from file\nconst df = await readCSV("data.csv", schema)',
      '// Parse from string\nconst csv = "name,age\\nAlice,30\\nBob,25";\nconst df = await readCSV(csv, schema)',
      '// With custom delimiter\nconst df = await readCSV("data.tsv", schema, { comma: "\\t" })',
      '// Chain with DataFrame operations\nconst result = await readCSV("sales.csv", schema)\n  .filter(r => r.amount > 100)\n  .groupBy("region")\n  .summarize({ total: g => s.sum(g.amount) })',
    ],
    related: ["writeCSV", "readCSVMetadata", "readXLSX"],
    bestPractices: [
      "✓ GOOD: Use readCSVMetadata() first to inspect headers and structure",
      "✓ GOOD: Provide a Zod schema for type safety and automatic type conversion",
      "✓ GOOD: Works with both file paths and raw CSV strings",
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
      "readXLSX<T>(path: string, schema?: ZodSchema<T>, opts?: { sheet?: string, skip?: number }): Promise<DataFrame<T>>",
    description:
      "Read XLSX file with optional schema validation and sheet selection. Returns a DataFrame that you can use with all DataFrame operations (filter, mutate, groupBy, etc.). Use readXLSXMetadata() first to inspect sheet names and preview data structure.",
    imports: [
      'import { readCSV, writeCSV, readXLSX, writeXLSX, readXLSXMetadata } from "@tidy-ts/dataframe";',
    ],
    parameters: [
      "path: File path to XLSX",
      "schema: Optional Zod schema for type validation and conversion",
      "opts.sheet: Sheet name or index (default: first sheet)",
      "opts.skip: Number of rows to skip (useful if first row is a title, not headers)",
    ],
    returns:
      "Promise<DataFrame<T>> - A DataFrame object with all standard operations",
    examples: [
      '// Basic usage - returns a DataFrame\nconst df = await readXLSX("data.xlsx")\ndf.print() // Display the data',
      '// With schema validation\nconst schema = z.object({ name: z.string(), age: z.number() })\nconst df = await readXLSX("data.xlsx", schema)',
      '// Select specific sheet\nconst df = await readXLSX("data.xlsx", schema, { sheet: "Summary" })',
      '// Skip header rows (e.g., if row 0 is a title)\nconst df = await readXLSX("data.xlsx", schema, { skip: 1 })',
      '// Chain with DataFrame operations\nconst result = await readXLSX("sales.xlsx")\n  .filter(r => r.amount > 100)\n  .groupBy("region")\n  .summarize({ total: g => s.sum(g.amount) })',
    ],
    related: ["writeXLSX", "readCSV", "readXLSXMetadata"],
    bestPractices: [
      "✓ GOOD: Use readXLSXMetadata() first to inspect sheets and preview structure",
      "✓ GOOD: Use skip option if first row is a title/note rather than column headers",
      "✓ GOOD: Provide a Zod schema for type safety and automatic type conversion",
      "✓ GOOD: Chain DataFrame operations immediately after reading",
    ],
  },

  readXLSXMetadata: {
    name: "readXLSXMetadata",
    category: "io",
    signature:
      "readXLSXMetadata(path: string, { previewRows?: number, sheet?: string | number }): Promise<XLSXMetadata>",
    description:
      "Read metadata about an XLSX file without full parsing. Shows available sheets, default sheet, and a preview of the first few rows. Use this before readXLSX() to understand the file structure and determine which sheet to read and whether to skip rows.",
    imports: [
      'import { readXLSXMetadata, readXLSX } from "@tidy-ts/dataframe";',
    ],
    parameters: [
      "path: File path to XLSX file",
      "previewRows: Number of rows to preview (default: 5)",
      "sheet: Which sheet to preview - name or index (default: first sheet)",
    ],
    returns:
      "Promise<{ sheets: SheetInfo[], defaultSheet: string, sheetName: string, headers: string[], totalRows: number, firstRows: string[][] }>",
    examples: [
      '// Inspect file structure\nconst meta = await readXLSXMetadata("data.xlsx")\nconsole.log("Sheets:", meta.sheets)\nconsole.log("Headers:", meta.headers)\nconsole.log("Preview:", meta.firstRows)',
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

  // Statistics - Descriptive
  mean: {
    name: "s.mean",
    category: "stats",
    signature: "s.mean(values: number[], removeNA?: boolean): number | null",
    description:
      "Calculate the arithmetic mean (average) of numeric values. Returns null if no valid values.",
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

  stdev: {
    name: "s.stdev",
    category: "stats",
    signature: "s.stdev(values: number[], removeNA?: boolean): number | null",
    description:
      "Calculate the sample standard deviation of an array of values. Returns null if insufficient data or removeNA=false with mixed types.",
    imports: ['import { stats as s } from "@tidy-ts/dataframe";'],
    parameters: [
      "values: Array of numbers or single number",
      "removeNA: If true, processes valid numbers from mixed arrays; if false, returns null for mixed arrays",
    ],
    returns: "number | null",
    examples: [
      "s.stdev(42) // Always returns 0 for single value",
      "s.stdev([1, 2, 3, 4, 5]) // sample standard deviation (default)",
      's.stdev([1, "2", 3], true) // 1.41... (std dev of [1, 3] with removeNA=true)',
      's.stdev([1, "2", 3], false) // null (mixed types, removeNA=false)',
    ],
    related: ["variance", "mean"],
  },

  variance: {
    name: "s.variance",
    category: "stats",
    signature:
      "s.variance(values: number[], removeNA?: boolean): number | null",
    description:
      "Calculate the sample variance of an array of values (uses N-1 denominator). Returns null if insufficient data.",
    imports: ['import { stats as s } from "@tidy-ts/dataframe";'],
    parameters: [
      "values: Array of numbers or single number",
      "removeNA: If true, processes valid numbers from mixed arrays; if false, returns null for mixed arrays",
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
    signature:
      "s.quantile(data: number[], probs: number | number[], removeNA?: boolean): number | number[] | null",
    description:
      "Calculate quantiles of an array of values. Uses R's Type 7 algorithm (default). Accepts single probability or array of probabilities.",
    imports: ['import { stats as s } from "@tidy-ts/dataframe";'],
    parameters: [
      "data: Array of numbers or single number",
      "probs: Probability value(s) between 0 and 1",
      "removeNA: If true, removes non-numeric values; if false, returns null for mixed types",
    ],
    returns:
      "number | number[] | null - Single value or array depending on probs input",
    examples: [
      "const q50 = s.quantile([1, 2, 3, 4, 5], 0.5) // 3 (median)",
      "const [q25, q75] = s.quantile([1, 2, 3, 4, 5], [0.25, 0.75]) // [2, 4]",
    ],
    related: ["median", "quartiles", "iqr"],
  },

  quartiles: {
    name: "s.quartiles",
    category: "stats",
    signature:
      "s.quartiles(values: number[], removeNA?: boolean): [number, number, number] | null",
    description:
      "Calculate the quartiles (Q25, median/Q50, Q75) of values. Returns null if no valid values.",
    imports: ['import { stats as s } from "@tidy-ts/dataframe";'],
    parameters: [
      "values: Array of numbers or values that can contain null/undefined, or single number",
      "removeNA: If true, removes non-numeric values; if false, returns null for mixed types",
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
    description:
      "Calculate the interquartile range (IQR) of values (Q75 - Q25). Returns null if no valid values.",
    imports: ['import { stats as s } from "@tidy-ts/dataframe";'],
    parameters: [
      "values: Array of numbers or single number",
      "removeNA: If true, removes non-numeric values; if false, returns null for mixed types",
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
    description:
      "Calculate the range of values (max - min). Returns null if no valid values.",
    imports: ['import { stats as s } from "@tidy-ts/dataframe";'],
    parameters: [
      "values: Array of numbers, or single number",
      "removeNA: If true, removes non-numeric values; if false, returns null for mixed types",
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

  // Window Functions
  cumsum: {
    name: "s.cumsum",
    category: "stats",
    signature:
      "s.cumsum(values: number[], removeNA?: boolean): number | number[] | (number | null)[]",
    description:
      "Calculate cumulative sums for an array of values. Returns array where each element is the sum of all previous elements.",
    imports: ['import { stats as s } from "@tidy-ts/dataframe";'],
    parameters: [
      "values: Array of numbers",
      "removeNA: If true, removes non-numeric values; if false, returns null for mixed types",
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
    signature:
      "s.cummean(values: number[], removeNA?: boolean): number | number[] | (number | null)[]",
    description:
      "Calculate cumulative mean of values. Returns an array where each element is the mean of all values up to that point.",
    imports: ['import { stats as s } from "@tidy-ts/dataframe";'],
    parameters: [
      "values: Array of numbers",
      "removeNA: If true, removes non-numeric values; if false, returns null for mixed types",
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
    signature:
      "s.cumprod(values: number[], removeNA?: boolean): number | number[] | (number | null)[]",
    description:
      "Calculate cumulative product of numeric values. Returns array where each element is the product of all previous elements.",
    imports: ['import { stats as s } from "@tidy-ts/dataframe";'],
    parameters: [
      "values: Array of numbers",
      "removeNA: If true, removes non-numeric values; if false, returns null for mixed types",
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
    signature:
      "s.cummax(values: number[], removeNA?: boolean): number | number[] | (number | null)[]",
    description:
      "Calculate cumulative maximum of numeric values. Returns array where each element is the max of all previous elements.",
    imports: ['import { stats as s } from "@tidy-ts/dataframe";'],
    parameters: [
      "values: Array of numbers",
      "removeNA: If true, removes non-numeric values; if false, returns null for mixed types",
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
    signature:
      "s.cummin(values: number[], removeNA?: boolean): number | number[] | (number | null)[]",
    description:
      "Calculate cumulative minimum of numeric values. Returns array where each element is the min of all previous elements.",
    imports: ['import { stats as s } from "@tidy-ts/dataframe";'],
    parameters: [
      "values: Array of numbers",
      "removeNA: If true, removes non-numeric values; if false, returns null for mixed types",
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
    related: ["lag"],
  },

  // Ranking Functions
  rank: {
    name: "s.rank",
    category: "stats",
    signature:
      's.rank(values: number[], ties?: "average" | "min" | "max" | "dense", descending?: boolean): number[] | (number | null)[] OR s.rank(values: number[], target: number): number | null',
    description:
      "Calculate ranks for an array of values. Supports finding rank of all values or a specific target value. Handles ties using specified method including dense ranking.",
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
    signature:
      "s.denseRank(values: T[], options?: { desc?: boolean }): number[] OR s.denseRank(values: T[], target: T, options?: { desc?: boolean }): number | null",
    description:
      "Calculate dense rank of values (no gaps in ranking). Unlike regular rank, has no gaps after tied values. Supports finding rank of all values or a specific target value.",
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
    signature:
      "s.percentile_rank(values: number[]): number[] | (number | null)[] OR s.percentile_rank(values: number[], target: number): number | null",
    description:
      "Calculate the percentile rank of a value within an array. Returns a value between 0 and 1 representing the percentile rank. If target is not provided, returns percentile ranks for all values.",
    imports: ['import { stats as s } from "@tidy-ts/dataframe";'],
    parameters: [
      "values: Array of numbers",
      "target: Optional - The value to find the percentile rank for (between 0 and 1)",
    ],
    returns:
      "number | null for single target OR number[] | (number | null)[] for all values",
    examples: [
      "s.percentile_rank([1, 2, 3, 4, 5], 3) // 0.6 (3 is at 60th percentile)",
      "s.percentile_rank([10, 20, 30, 40, 50], 25) // 0.4 (25 is at 40th percentile)",
      "s.percentile_rank([1, 2, 3, 4, 5]) // [0.2, 0.4, 0.6, 0.8, 1.0]",
    ],
    related: ["rank", "denseRank", "quantile"],
  },

  chunk: {
    name: "s.chunk",
    category: "stats",
    signature: "s.chunk<T>(arr: T[], size: number): T[][]",
    description:
      "Split an array into chunks of specified size. The last chunk may be smaller if the array length is not evenly divisible by the chunk size.",
    imports: ['import { stats as s } from "@tidy-ts/dataframe";'],
    parameters: [
      "arr: Array to split into chunks",
      "size: Size of each chunk (must be positive integer)",
    ],
    returns: "Array of chunks, where each chunk is an array of elements",
    examples: [
      "s.chunk([1, 2, 3, 4, 5, 6, 7], 3) // [[1, 2, 3], [4, 5, 6], [7]]",
      "s.chunk(['a', 'b', 'c', 'd'], 2) // [['a', 'b'], ['c', 'd']]",
      "s.chunk([1, 2, 3], 1) // [[1], [2], [3]]",
      "s.chunk([1, 2, 3], 10) // [[1, 2, 3]] (chunk size larger than array)",
    ],
    related: ["batch"],
    bestPractices: [
      "✓ GOOD: Use for batch processing large datasets",
      "✓ GOOD: Useful for pagination or splitting work into parallel tasks",
      "✓ GOOD: Works with any array type (numbers, strings, objects)",
      "✓ GOOD: Combine with s.batch() for concurrent async processing",
    ],
  },

  batch: {
    name: "s.batch",
    category: "stats",
    signature:
      "s.batch<T, R>(items: T[], fn: (item: T, index: number) => Promise<R>, options?: ConcurrencyOptions): Promise<R[]>",
    description:
      "Process an array of items with an async function, applying concurrency control, batching, and retry logic. Provides fine-grained control over async operations to prevent overwhelming servers.",
    imports: ['import { stats as s } from "@tidy-ts/dataframe";'],
    parameters: [
      "items: Array of items to process",
      "fn: Async function to apply to each item (receives item and index)",
      "options.concurrency: Maximum number of concurrent operations (default: 1)",
      "options.batchSize: Process items in batches of this size (default: undefined)",
      "options.batchDelay: Delay in milliseconds between batches (default: 0)",
      'options.retry.backoff: Retry strategy - "exponential" | "linear" | "custom"',
      "options.retry.maxRetries: Maximum retry attempts (default: 3 when retry enabled)",
      "options.retry.baseDelay: Initial retry delay in ms (default: 100)",
      "options.retry.maxDelay: Maximum delay between retries in ms (default: 5000)",
      "options.retry.backoffMultiplier: Multiplier for exponential backoff (default: 2)",
      "options.retry.shouldRetry: Function to determine if error should trigger retry",
      "options.retry.onRetry: Callback when retry occurs (error, attempt, taskIndex)",
    ],
    returns: "Promise<R[]> - Array of results in same order as input",
    examples: [
      "// Basic usage with concurrency limit\nawait s.batch(userIds, async (id) => fetchUser(id), { concurrency: 5 })",
      "// Batch processing with delays\nawait s.batch(apiCalls, async (call) => makeRequest(call), { batchSize: 100, batchDelay: 50 })",
      "// With exponential backoff retry\nawait s.batch(tasks, async (task) => processTask(task), {\n  concurrency: 5,\n  retry: {\n    backoff: 'exponential',\n    maxRetries: 3,\n    baseDelay: 100\n  }\n})",
      "// Combine with s.chunk for batch processing\nconst batches = s.chunk(ids, 300);\nawait s.batch(batches, async (batch) => processBatch(batch), { concurrency: 2 })",
      "// With custom retry logic\nawait s.batch(items, async (item) => process(item), {\n  retry: {\n    backoff: 'exponential',\n    maxRetries: 5,\n    shouldRetry: (error) => error.message.includes('rate limit')\n  }\n})",
    ],
    related: ["chunk"],
    bestPractices: [
      "✓ GOOD: Use concurrency limits to prevent overwhelming APIs (concurrency: 5-10)",
      "✓ GOOD: Use batchSize + batchDelay for rate-limited APIs",
      "✓ GOOD: Add retry logic for unreliable network operations",
      "✓ GOOD: Combine s.chunk() and s.batch() for nested batch processing",
      "✓ GOOD: Use shouldRetry to filter which errors trigger retries",
      "❌ BAD: Promise.all() with no concurrency control on large arrays",
      "❌ BAD: No retry logic for network operations",
    ],
  },

  // Transformation Functions
  normalize: {
    name: "s.normalize",
    category: "stats",
    signature:
      's.normalize(values: number[], method?: "minmax" | "zscore"): number[] | (number | null)[] OR s.normalize(values: number[], target: number, method?: "minmax" | "zscore"): number | null',
    description:
      "Normalize values to 0-1 range using min-max normalization or z-score standardization. Supports finding normalized value for all values or a specific target value.",
    imports: ['import { stats as s } from "@tidy-ts/dataframe";'],
    parameters: [
      "values: Array of numbers",
      'method: Normalization method: "minmax" (default) or "zscore"',
      "target: Optional - The value to find the normalized value for",
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
    signature:
      "s.round(value: number | number[], digits?: number): number | number[]",
    description:
      "Round a number or all values in an array to a specified number of decimal places.",
    imports: ['import { stats as s } from "@tidy-ts/dataframe";'],
    parameters: [
      "value: Number or array of numbers to round",
      "digits: Number of decimal places (default: 0)",
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
    signature:
      "s.percent(numerator: number | null | undefined, denominator: number | null | undefined, decimals?: number): number | null",
    description:
      "Calculate a percentage from a numerator and denominator, rounded to a given number of decimals. Returns 0 when denominator is 0 to handle division-by-zero gracefully. Returns null if either numerator or denominator is null/undefined.",
    imports: ['import { stats as s } from "@tidy-ts/dataframe";'],
    parameters: [
      "numerator: The portion value",
      "denominator: The total value",
      "decimals: Number of decimal places to round to (default: 1)",
    ],
    returns:
      "number | null - Percentage (0–100 scale), rounded, or null if inputs are null/undefined",
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
    description:
      "Get unique values from an array (WASM-optimized version). Returns unique values in order of first appearance.",
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
    signature:
      "s.covariance(x: number[], y: number[], removeNA?: boolean): number | null",
    description:
      "Calculate the sample covariance between two arrays of values. Arrays must have the same length. Returns null if no valid pairs.",
    imports: ['import { stats as s } from "@tidy-ts/dataframe";'],
    parameters: [
      "x: First array of numbers",
      "y: Second array of numbers (same length as x)",
      "removeNA: If true, guarantees a number return (throws if no valid pairs)",
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

  // LLM Utilities
  LLMEmbed: {
    name: "LLM.embed",
    category: "llm",
    signature:
      'LLM.embed(input: string | string[], model?: "text-embedding-3-small" | "text-embedding-3-large" | "text-embedding-ada-002"): Promise<number[] | number[][]>',
    description:
      "Get vector embeddings for text using OpenAI's embeddings API. Single string returns number[], array returns number[][]. Default model is text-embedding-3-large (3072 dimensions).",
    imports: ['import { LLM } from "@tidy-ts/dataframe";'],
    parameters: [
      "input: Text string or array of text strings to embed",
      'model: Embedding model (default: "text-embedding-3-large")',
      "  - text-embedding-3-small: 1536 dimensions, faster, lower cost",
      "  - text-embedding-3-large: 3072 dimensions, better quality (default)",
      "  - text-embedding-ada-002: Legacy model, 1536 dimensions",
    ],
    returns:
      "Promise<number[]> for single string, Promise<number[][]> for array",
    examples: [
      '// Single text\nconst embedding = await LLM.embed("Hello world")\nconsole.log(embedding.length) // 3072',
      '// Multiple texts\nconst embeddings = await LLM.embed(["doc1", "doc2", "doc3"])\nconsole.log(embeddings.length) // 3\nconsole.log(embeddings[0].length) // 3072',
      '// Use smaller/faster model\nconst embedding = await LLM.embed("text", "text-embedding-3-small")\nconsole.log(embedding.length) // 1536',
      '// Use with DataFrame\nconst df = createDataFrame([{ text: "cat" }, { text: "dog" }])\nconst withEmbeddings = await df.mutate({\n  embedding: async (row) => await LLM.embed(row.text)\n})',
    ],
    related: ["LLM.compareEmbeddings", "LLM.respond"],
    bestPractices: [
      "✓ GOOD: Use text-embedding-3-large for best quality (default)",
      "✓ GOOD: Use text-embedding-3-small for faster/cheaper embeddings",
      "✓ GOOD: Batch multiple texts in an array for efficiency",
      "✓ GOOD: Store embeddings in vector databases for similarity search",
      "Environment variable OPENAI_API_KEY must be set",
    ],
  },

  LLMRespond: {
    name: "LLM.respond",
    category: "llm",
    signature:
      "LLM.respond({ userInput, schema?, priorMessages?, instructions?, model? }): Promise<string | T>",
    description:
      "Get structured responses from language models with Zod schema validation. Returns string without schema, typed object with schema. Automatically converts z.date() fields.",
    imports: [
      'import { LLM } from "@tidy-ts/dataframe"',
      'import { z } from "zod"',
    ],
    parameters: [
      "userInput: The prompt/question to send to the LLM",
      "schema: Optional Zod schema for structured output",
      "priorMessages: Optional conversation history for context",
      'instructions: System instructions (default: "You are a helpful assistant.")',
      'model: OpenAI model - "gpt-4.1-mini" (default), "gpt-4.1", "gpt-5-mini"',
    ],
    returns: "Promise<string> without schema, Promise<T> with schema",
    examples: [
      '// Simple string response\nconst answer = await LLM.respond({\n  userInput: "What is 2+2?"\n})\nconsole.log(answer) // "4"',
      '// Structured response\nconst result = await LLM.respond({\n  userInput: "Analyze this data",\n  schema: z.object({\n    summary: z.string(),\n    confidence: z.number()\n  })\n})\nconsole.log(result.summary, result.confidence)',
      '// Date handling\nconst event = await LLM.respond({\n  userInput: "When is the next solar eclipse?",\n  schema: z.object({\n    date: z.date(),\n    location: z.string()\n  })\n})\nconsole.log(event.date.getFullYear()) // Date object',
      '// Use with DataFrame\nconst df = createDataFrame([{ question: "What is 2+2?" }])\nconst withAnswers = await df.mutate({\n  answer: async (row) => await LLM.respond({\n    userInput: row.question\n  })\n})',
    ],
    related: ["LLM.embed", "LLM.compareEmbeddings"],
    bestPractices: [
      "✓ GOOD: Use Zod schemas for type-safe structured output",
      "✓ GOOD: Use z.date() for date fields - auto-converted to Date objects",
      "✓ GOOD: Provide clear system instructions for consistent behavior",
      "✓ GOOD: Use priorMessages for conversation context",
      "Environment variable OPENAI_API_KEY must be set",
    ],
  },

  LLMCompareEmbeddings: {
    name: "LLM.compareEmbeddings",
    category: "llm",
    signature:
      "LLM.compareEmbeddings({ query, candidates, n? }): Array<{ index: number; embedding: number[]; distance: number }>",
    description:
      "Compare one embedding against an array of embeddings and return them ordered by similarity. Uses Euclidean distance (smaller = more similar).",
    imports: ['import { LLM } from "@tidy-ts/dataframe";'],
    parameters: [
      "query: The query embedding to compare against",
      "candidates: Array of candidate embeddings to compare with",
      "n: Optional number of top results to return (default: all)",
    ],
    returns:
      "Array of { index, embedding, distance } sorted by distance (ascending)",
    examples: [
      '// Find similar texts\nconst query = await LLM.embed("The cat sits on the mat")\nconst candidates = await LLM.embed([\n  "A feline rests on the rug",\n  "Python is a programming language",\n  "The dog runs in the park"\n])\n\nconst results = LLM.compareEmbeddings({ query, candidates })\nconsole.log(results[0].index) // Index of most similar\nconsole.log(results[0].distance) // Similarity score',
      "// Get top N results\nconst top3 = LLM.compareEmbeddings({ query, candidates, n: 3 })\nconsole.log(top3.length) // 3",
      '// Semantic search with DataFrame\nconst documents = createDataFrame([\n  { id: 1, text: "Machine learning tutorial" },\n  { id: 2, text: "Cooking recipes" },\n  { id: 3, text: "Deep learning guide" }\n])\n\nconst query = await LLM.embed("AI tutorials")\nconst docEmbeddings = await LLM.embed(documents.extract("text"))\nconst results = LLM.compareEmbeddings({ query, candidates: docEmbeddings, n: 2 })\n\n// Get top matching documents\nconst topDocs = results.map(r => documents.toArray()[r.index])',
    ],
    related: ["LLM.embed", "LLM.respond"],
    bestPractices: [
      "✓ GOOD: Use for semantic search and similarity matching",
      "✓ GOOD: Limit results with n parameter for performance",
      "✓ GOOD: Store embeddings once, compare many times",
      "✓ GOOD: Use with vector databases for large-scale search",
      "Distance metric: Euclidean distance (L2 norm)",
      "Results sorted by distance: smaller distance = more similar",
    ],
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
    "unnest",
    "bindRows",
    "concatDataFrames",
    "replaceNA",
    "removeNA",
    "removeNull",
    "removeUndefined",
    "profile",
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
    "lag",
    "lead",
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
