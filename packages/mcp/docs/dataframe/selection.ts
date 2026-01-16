import type { DocEntry } from "../mcp-types.ts";

export const selectionDocs: Record<string, DocEntry> = {
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
      '// Filter and select chained together\nconst sales = createDataFrame([\n  { region: "North", revenue: 1000, cost: 800, profit: 200 },\n  { region: "South", revenue: 1500, cost: 1200, profit: 300 },\n  { region: "North", revenue: 800, cost: 900, profit: -100 },\n]);\n\n// Filter to profitable rows, then select only region and profit\nconst profitable = sales\n  .filter(row => row.profit > 0)\n  .select("region", "profit");\n// Result: Only profitable rows with region and profit columns',
      '// Filter numeric column condition, then select two columns\nconst data = createDataFrame([\n  { id: 1, age: 25, score: 85, status: "active" },\n  { id: 2, age: 30, score: 92, status: "active" },\n  { id: 3, age: 20, score: 78, status: "inactive" },\n]);\n\nconst highScorers = data\n  .filter(row => row.score >= 85)\n  .select("id", "score");\n// Result: Rows with score >= 85, only id and score columns',
    ],
    related: ["slice", "distinct", "select"],
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
};
