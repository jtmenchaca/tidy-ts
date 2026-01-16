import type { DocEntry } from "../mcp-types.ts";

export const reshapingDocs: Record<string, DocEntry> = {
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
};
