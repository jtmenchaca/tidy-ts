import type { DocEntry } from "../mcp-types.ts";

export const joinsDocs: Record<string, DocEntry> = {
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
};
