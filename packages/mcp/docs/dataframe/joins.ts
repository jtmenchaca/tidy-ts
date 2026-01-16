import type { DocEntry } from "../mcp-types.ts";

export const joinsDocs: Record<string, DocEntry> = {
  innerJoin: {
    name: "innerJoin",
    category: "dataframe",
    signature:
      "innerJoin<U>(other: DataFrame<U>, on: string | string[], options?: { suffixes?: { left?: string; right?: string } }): DataFrame<T & U>\ninnerJoin<U>(other: DataFrame<U>, options: { keys: string | string[] | { left: string | string[], right: string | string[] }, suffixes?: { left?: string; right?: string } }): DataFrame<T & U>",
    description: "Inner join with another DataFrame. Only keeps matching rows.",
    imports: ['import { createDataFrame } from "@tidy-ts/dataframe";'],
    parameters: [
      "other: DataFrame to join with",
      "Overload 1 - Simple API:",
      "  on: string | string[] - Column name(s) that exist in both DataFrames",
      "    - string: Single column, e.g., 'id'",
      "    - string[]: Multiple columns, e.g., ['region', 'product']",
      "  options?: { suffixes?: { left?: string; right?: string } }",
      "Overload 2 - Advanced API:",
      "  options: {",
      "    keys: string | string[] | { left: string | string[], right: string | string[] }",
      "      - string: Single column name (must exist in both DataFrames)",
      "      - string[]: Multiple column names (must exist in both DataFrames)",
      "      - { left: string | string[], right: string | string[] }: Different column names in each DataFrame",
      "    suffixes?: { left?: string; right?: string }",
      "  }",
    ],
    returns: "DataFrame<T & U> - Only matching rows from both DataFrames",
    examples: [
      'df.innerJoin(other, "id")',
      'df.innerJoin(other, ["region", "product"])',
      'df.innerJoin(other, { keys: { left: "user_id", right: "id" } })',
    ],
    related: ["leftJoin", "rightJoin", "outerJoin"],
  },

  leftJoin: {
    name: "leftJoin",
    category: "dataframe",
    signature:
      "leftJoin<U>(other: DataFrame<U>, on: string | string[], options?: { suffixes?: { left?: string; right?: string } }): DataFrame<T & Partial<U>>\nleftJoin<U>(other: DataFrame<U>, options: { keys: string | string[] | { left: string | string[], right: string | string[] }, suffixes?: { left?: string; right?: string } }): DataFrame<T & Partial<U>>",
    description:
      "Left join with another DataFrame. Keeps all rows from the left DataFrame, filling nulls for columns from right where no match exists. This is the most common join type for preserving all records from a primary table while enriching with optional data.",
    imports: ['import { createDataFrame } from "@tidy-ts/dataframe";'],
    parameters: [
      "other: DataFrame to join with",
      "Overload 1 - Simple API:",
      "  on: string | string[] - Column name(s) that exist in both DataFrames",
      "    - string: Single column, e.g., 'id'",
      "    - string[]: Multiple columns, e.g., ['region', 'date']",
      "  options?: { suffixes?: { left?: string; right?: string } } - Optional suffix configuration",
      "Overload 2 - Advanced API:",
      "  options: {",
      "    keys: string | string[] | { left: string | string[], right: string | string[] }",
      "      - string: Single column name (must exist in both DataFrames)",
      "      - string[]: Multiple column names (must exist in both DataFrames)",
      "      - { left: string | string[], right: string | string[] }: Different column names in each DataFrame",
      "    suffixes?: { left?: string; right?: string } - Optional suffix configuration",
      "  }",
    ],
    returns: "DataFrame<T & Partial<U>> - All left rows with matched right columns (null if no match)",
    examples: [
      '// Overload 1: Simple API - single column\nconst users = createDataFrame([\n  { user_id: 1, name: "Alice" },\n  { user_id: 2, name: "Bob" },\n]);\nconst orders = createDataFrame([\n  { user_id: 1, product: "Widget", amount: 100 },\n]);\n\nconst result = users.leftJoin(orders, "user_id");\n// All users kept, Bob has null for product/amount',
      '// Overload 1: Simple API - multiple columns\nconst sales = createDataFrame([\n  { region: "North", date: "2023-01", revenue: 1000 },\n]);\nconst targets = createDataFrame([\n  { region: "North", date: "2023-01", target: 1200 },\n]);\n\nsales.leftJoin(targets, ["region", "date"])',
      '// Overload 2: Advanced API - different column names\nconst customers = createDataFrame([\n  { customer_id: 1, name: "Alice" },\n]);\nconst purchases = createDataFrame([\n  { buyer_id: 1, item: "Widget" },\n]);\n\ncustomers.leftJoin(purchases, {\n  keys: { left: "customer_id", right: "buyer_id" },\n})',
      '// Overload 2: Advanced API - multiple different column names\nconst df1 = createDataFrame([\n  { emp_id: 1, dept: "Sales", year: 2023 },\n]);\nconst df2 = createDataFrame([\n  { employee_id: 1, department: "Sales", year: 2023, bonus: 1000 },\n]);\n\ndf1.leftJoin(df2, {\n  keys: {\n    left: ["emp_id", "dept"],\n    right: ["employee_id", "department"],\n  },\n})',
      '// Overload 1: With suffixes option\nusers.leftJoin(orders, "user_id", {\n  suffixes: { left: "_user", right: "_order" },\n})',
    ],
    related: ["innerJoin", "rightJoin", "outerJoin"],
    bestPractices: [
      "✓ GOOD: Use Overload 1 (simple API) when column names match between DataFrames",
      "✓ GOOD: Use Overload 2 (advanced API) when column names differ or you need explicit control",
      "✓ GOOD: Check for nulls in result columns from the right DataFrame",
      "✓ GOOD: Use suffixes when both DataFrames have overlapping non-key column names",
    ],
  },

  rightJoin: {
    name: "rightJoin",
    category: "dataframe",
    signature:
      "rightJoin<U>(other: DataFrame<U>, on: string | string[], options?: { suffixes?: { left?: string; right?: string } }): DataFrame<Partial<T> & U>\nrightJoin<U>(other: DataFrame<U>, options: { keys: string | string[] | { left: string | string[], right: string | string[] }, suffixes?: { left?: string; right?: string } }): DataFrame<Partial<T> & U>",
    description:
      "Right join with another DataFrame. Keeps all rows from right, fills nulls for non-matches.",
    imports: ['import { createDataFrame } from "@tidy-ts/dataframe";'],
    parameters: [
      "other: DataFrame to join with",
      "Overload 1 - Simple API:",
      "  on: string | string[] - Column name(s) that exist in both DataFrames",
      "  options?: { suffixes?: { left?: string; right?: string } }",
      "Overload 2 - Advanced API:",
      "  options: {",
      "    keys: string | string[] | { left: string | string[], right: string | string[] }",
      "    suffixes?: { left?: string; right?: string }",
      "  }",
    ],
    returns: "DataFrame<Partial<T> & U> - All right rows with matched left columns (null if no match)",
    examples: [
      'df.rightJoin(other, "id")',
      'df.rightJoin(other, ["region", "year"])',
      'df.rightJoin(other, { keys: { left: "user_id", right: "id" } })',
    ],
    related: ["innerJoin", "leftJoin", "outerJoin"],
  },

  outerJoin: {
    name: "outerJoin",
    category: "dataframe",
    signature:
      "outerJoin<U>(other: DataFrame<U>, on: string | string[], options?: { suffixes?: { left?: string; right?: string } }): DataFrame<Partial<T> & Partial<U>>\nouterJoin<U>(other: DataFrame<U>, options: { keys: string | string[] | { left: string | string[], right: string | string[] }, suffixes?: { left?: string; right?: string } }): DataFrame<Partial<T> & Partial<U>>",
    description:
      "Full outer join. Keeps all rows from both DataFrames, fills nulls for non-matches.",
    imports: ['import { createDataFrame } from "@tidy-ts/dataframe";'],
    parameters: [
      "other: DataFrame to join with",
      "Overload 1 - Simple API:",
      "  on: string | string[] - Column name(s) that exist in both DataFrames",
      "  options?: { suffixes?: { left?: string; right?: string } }",
      "Overload 2 - Advanced API:",
      "  options: {",
      "    keys: string | string[] | { left: string | string[], right: string | string[] }",
      "    suffixes?: { left?: string; right?: string }",
      "  }",
    ],
    returns: "DataFrame<Partial<T> & Partial<U>> - All rows from both DataFrames",
    examples: [
      'df.outerJoin(other, "id")',
      'df.outerJoin(other, ["region", "year"])',
      'df.outerJoin(other, { keys: { left: "user_id", right: "id" } })',
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
