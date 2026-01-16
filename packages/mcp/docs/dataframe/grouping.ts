import type { DocEntry } from "../mcp-types.ts";

export const groupingDocs: Record<string, DocEntry> = {
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
};
