import type { DocEntry } from "../mcp-types.ts";

export const transformationDocs: Record<string, DocEntry> = {
  mutate: {
    name: "mutate",
    category: "dataframe",
    signature:
      "mutate(assignments): DataFrame<...> | GroupedDataFrame<...>\n// Sync only — async formulas must use mutateAsync(); see packages/dataframe/ts/verbs/transformation/mutate/mutate.types.ts",
    description:
      "Add or transform columns with synchronous formulas, arrays, scalars, or null. TypeScript rejects async functions here (use mutateAsync).",
    imports: [
      'import { createDataFrame, stats as s } from "@tidy-ts/dataframe";',
    ],
    parameters: [
      "assignments: Object mapping column names to:",
      "  - Function: (row, index, df) => value (sync only)",
      "  - Array: per-row values (length must match row count)",
      "  - Scalar / null: broadcast or clear column",
    ],
    returns: "DataFrame<T> or GroupedDataFrame (never PromisedDataFrame)",
    examples: [
      "df.mutate({ revenue: row => row.price * row.quantity })",
      'df.mutate({ status: ["Active", "Pending", "Active"] })',
      "df.mutate({ tax_rate: () => 0.08 })",
      "// Async formulas:",
      "await df.mutateAsync({ data: async (row) => await fetch(row.url) }, { concurrency: 3 })",
    ],
    related: ["mutateOverGroup", "mutateAsync", "select", "drop", "transmute"],
  },

  mutateOverGroup: {
    name: "mutateOverGroup",
    category: "dataframe",
    signature:
      "mutateOverGroup(assignments: { [col: string]: (groupDf: DataFrame<R>) => unknown[] }): DataFrame<...> | GroupedDataFrame<...>",
    description:
      "After groupBy(), compute new columns from each group's sub-DataFrame. Each function returns an array with one value per row in that group (O(groups) dispatch). Use with window helpers like s.lag / s.lead on groupDf.extract(\"col\").",
    imports: [
      'import { createDataFrame, stats as s } from "@tidy-ts/dataframe";',
    ],
    parameters: [
      "assignments: Record of column name → (groupDf) => array of length groupDf.nrows()",
    ],
    returns: "GroupedDataFrame or DataFrame with new/updated columns",
    examples: [
      'df.groupBy("id").mutateOverGroup({',
      '  prev: (g) => s.lag(g.extract("value"), { defaultValue: 0 }),',
      "});",
    ],
    related: ["groupBy", "mutate", "lag", "lead"],
  },

  mutateAsync: {
    name: "mutateAsync",
    category: "dataframe",
    signature:
      "mutateAsync(assignments, options?: ConcurrencyOptions): PromisedDataFrame<...> | PromisedGroupedDataFrame<...>\n// packages/dataframe/ts/verbs/transformation/mutate/mutate.types.ts",
    description:
      "Like mutate but allows async formulas (Promises). Optional ConcurrencyOptions for parallel limits / retries.",
    imports: [
      'import { createDataFrame } from "@tidy-ts/dataframe";',
    ],
    parameters: [
      "assignments: Column formulas (may be async)",
      "options: Optional concurrency / batch / retry settings",
    ],
    returns: "PromisedDataFrame or PromisedGroupedDataFrame",
    examples: [
      "await df.mutateAsync({ data: async (row) => await fetch(row.url).then((r) => r.json()) })",
    ],
    related: ["mutate", "filterAsync"],
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
      "Get unique combinations of specified columns (SQL DISTINCT). Returns only the specified columns with unique combinations. On a grouped DataFrame, uniqueness is evaluated within each group.",
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
