import type { DocEntry } from "../mcp-types.ts";

export const transformationDocs: Record<string, DocEntry> = {
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
};
