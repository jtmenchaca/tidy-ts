import type { DocEntry } from "../mcp-types.ts";

export const joinsDocs: Record<string, DocEntry> = {
  joinSemantics: {
    name: "Join semantics (undefined, keys, suffixes)",
    category: "dataframe",
    signature: "Applies to innerJoin, leftJoin, rightJoin, outerJoin, asofJoin, crossJoin",
    description:
      "Joins are WASM-backed hash joins (except asofJoin, which matches nearest keys on sorted data). Non-matching cells use `undefined` (not `null`): leftJoin keeps all left rows and sets right-side non-key columns to `undefined` when there is no match; rightJoin mirrors that for the left side; outerJoin can leave either side `undefined`; innerJoin only emits rows with a key match so you do not get `undefined` from a missing join partner. Overlapping non-key column names need `suffixes` (or disambiguate before the join). Use the object form `{ keys: { left, right }, suffixes? }` when key columns differ by name—TypeScript then tracks suffixed column names. Plain Date and Temporal types are valid join key values.",
    imports: ['import { createDataFrame } from "@tidy-ts/dataframe";'],
    parameters: [],
    returns: "N/A (conceptual)",
    examples: [
      "// leftJoin: right columns undefined when no match\nusers.leftJoin(orders, \"user_id\");",
      "// innerJoin: only rows present in both on the join key(s)\nusers.innerJoin(orders, \"user_id\");",
      "// outerJoin: either side may be undefined where the other side had no match\nusers.outerJoin(orders, \"user_id\");",
    ],
    related: [
      "innerJoin",
      "leftJoin",
      "rightJoin",
      "outerJoin",
      "crossJoin",
      "asofJoin",
      "removeUndefined",
      "replaceUndefined",
    ],
  },

  innerJoin: {
    name: "innerJoin",
    category: "dataframe",
    signature:
      "innerJoin<OtherRow>(other: DataFrame<OtherRow>, on: (keyof Row & keyof OtherRow) | (keyof Row & keyof OtherRow)[], options?: { suffixes?: { left?: string; right?: string } }): DataFrame<Prettify<SuffixAwareInnerJoinResult<Row, OtherRow, keyof Row & keyof OtherRow>>>\ninnerJoin<OtherRow>(other: DataFrame<OtherRow>, options: { keys: ...; suffixes?: ... }): DataFrame<...>  // object overload preserves literal suffix types on colliding columns",
    description:
      "Inner join: only rows whose join key(s) appear in both DataFrames. Return row shape merges left columns with right columns excluding duplicate join keys; overlapping non-key names use `suffixes` at runtime and the `{ keys, suffixes }` overload tracks resulting column names in types.",
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
    returns:
      "DataFrame whose row type is the inner-join merge of both schemas (no `undefined` from a missing join partner). Exact type is computed from `Row`, `OtherRow`, key columns, and optional `suffixes`.",
    examples: [
      'df.innerJoin(other, "id")',
      'df.innerJoin(other, ["region", "product"])',
      'df.innerJoin(other, { keys: { left: "user_id", right: "id" } })',
    ],
    related: ["joinSemantics", "leftJoin", "rightJoin", "outerJoin", "crossJoin"],
  },

  leftJoin: {
    name: "leftJoin",
    category: "dataframe",
    signature:
      "leftJoin<OtherRow>(other: DataFrame<OtherRow>, on: (keyof Row & keyof OtherRow) | [...], options?: { suffixes?: { left?: string; right?: string } }): DataFrame<Prettify<SuffixAwareLeftJoinResult<...>>>\nleftJoin<OtherRow>(other, options: { keys: ...; suffixes?: ... }): DataFrame<...>",
    description:
      "Left join with another DataFrame. Keeps all rows from the left DataFrame; columns from the right are `undefined` where there is no key match. This is the most common join type for preserving all records from a primary table while enriching with optional data.",
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
    returns:
      "All left rows preserved; right-side columns that are not part of the join key become `T | undefined` when there is no matching right row (see `LeftJoinResult` / suffix-aware variants in types).",
    examples: [
      '// Overload 1: Simple API - single column\nconst users = createDataFrame([\n  { user_id: 1, name: "Alice" },\n  { user_id: 2, name: "Bob" },\n]);\nconst orders = createDataFrame([\n  { user_id: 1, product: "Widget", amount: 100 },\n]);\n\nconst result = users.leftJoin(orders, "user_id");\n// All users kept, Bob has undefined for product/amount',
      '// Overload 1: Simple API - multiple columns\nconst sales = createDataFrame([\n  { region: "North", date: "2023-01", revenue: 1000 },\n]);\nconst targets = createDataFrame([\n  { region: "North", date: "2023-01", target: 1200 },\n]);\n\nsales.leftJoin(targets, ["region", "date"])',
      '// Overload 2: Advanced API - different column names\nconst customers = createDataFrame([\n  { customer_id: 1, name: "Alice" },\n]);\nconst purchases = createDataFrame([\n  { buyer_id: 1, item: "Widget" },\n]);\n\ncustomers.leftJoin(purchases, {\n  keys: { left: "customer_id", right: "buyer_id" },\n})',
      '// Overload 2: Advanced API - multiple different column names\nconst df1 = createDataFrame([\n  { emp_id: 1, dept: "Sales", year: 2023 },\n]);\nconst df2 = createDataFrame([\n  { employee_id: 1, department: "Sales", year: 2023, bonus: 1000 },\n]);\n\ndf1.leftJoin(df2, {\n  keys: {\n    left: ["emp_id", "dept"],\n    right: ["employee_id", "department"],\n  },\n})',
      '// Overload 1: With suffixes option\nusers.leftJoin(orders, "user_id", {\n  suffixes: { left: "_user", right: "_order" },\n})',
    ],
    related: ["joinSemantics", "innerJoin", "rightJoin", "outerJoin"],
    bestPractices: [
      "✓ GOOD: Use Overload 1 (simple API) when column names match between DataFrames",
      "✓ GOOD: Use Overload 2 (advanced API) when column names differ or you need explicit control",
      "✓ GOOD: Check for `undefined` in result columns from the right DataFrame (non-matches)",
      "✓ GOOD: Use suffixes when both DataFrames have overlapping non-key column names",
    ],
  },

  leftJoinGuide: {
    name: "leftJoin: Performance, suffixes vs different keys, error handling",
    category: "dataframe",
    signature: "Guidance and patterns from tests and benchmarks",
    description:
      "leftJoin is WASM-backed (hash join). Use keys: { left, right } when the key column has different names in each DataFrame; use suffixes when key names match but other columns collide. Validate key columns exist before joining when keys come from user input. For large datasets, prefer leftJoin over manual loops (benchmarked ~8x faster than Arquero on 500K rows).",
    imports: ['import { createDataFrame } from "@tidy-ts/dataframe";'],
    parameters: [],
    returns: "N/A (guidance)",
    examples: [
      `// PERFORMANCE (from packages/testing/benchmarks, 500K rows)
// leftJoin: tidy-ts 50.2ms, arquero 400.1ms (~8x). Use leftJoin for large tables.
const leftTidyDf = createDataFrame([...]); // 500K rows
const rightTidyDf = createDataFrame([...]); // 10K rows
const result = leftTidyDf.leftJoin(rightTidyDf, "id");`,
      `// WHEN TO USE keys: { left, right } — key column has different names in each table
// From left-join-multi-key.test.ts
const employees = createDataFrame([
  { emp_id: 1, emp_dept: 10, name: "Alice" },
  { emp_id: 2, emp_dept: 20, name: "Bob" },
]);
const departments = createDataFrame([
  { dept_id: 10, dept_name: "Engineering" },
]);
const result = employees.leftJoin(departments, {
  keys: { left: "emp_dept", right: "dept_id" },
});
// result: Alice has dept_id 10, dept_name "Engineering"; Bob has dept_id undefined, dept_name undefined`,
      `// WHEN TO USE suffixes — same key names but non-key columns collide (e.g. both have "quarter")
// From left-join-multi-key.test.ts
const left = createDataFrame([
  { region: "North", product: "Gadget", quarter: "Q1" },
  { region: "South", product: "Gadget", quarter: "Q1" },
]);
const right = createDataFrame([
  { region: "North", product: "Gadget", quarter: "Q2" },
]);
const result = left.leftJoin(right, {
  keys: ["region", "product"],
  suffixes: { left: "_actual", right: "_target" },
});
// result columns: region, product, quarter_actual, quarter_target`,
      `// Multi-key with different names + suffixes (from getting-started-runtime-test)
const salesData = createDataFrame([
  { sales_region: "North", sales_product: "Widget A", sales_quarter: "Q1", sales_value: 1000 },
]);
const targetsData = createDataFrame([
  { target_region: "North", target_product: "Widget A", target_quarter: "Q1", target_value: 1200 },
]);
salesData.leftJoin(targetsData, {
  keys: {
    left: ["sales_region", "sales_product", "sales_quarter"],
    right: ["target_region", "target_product", "target_quarter"],
  },
  suffixes: { left: "_actual", right: "_target" },
});`,
      `// Chaining multiple leftJoins on same key (from no-types-reassign.test.ts)
const patients = createDataFrame([
  { pat_id: "P001", name: "Alice" },
  { pat_id: "P002", name: "Bob" },
]);
const countsToJoin = [
  createDataFrame([{ pat_id: "P001", num_visit_diagnoses: 3 }, { pat_id: "P002", num_visit_diagnoses: 1 }]),
  createDataFrame([{ pat_id: "P001", num_labs: 5 }, { pat_id: "P002", num_labs: 2 }]),
];
const summary = countsToJoin.reduce(
  (df, counts) => df.leftJoin(counts, "pat_id"),
  patients,
);`,
      `// Error handling: validate key columns exist before join (key columns missing will throw at runtime)
const keyCol = "user_id";
const leftCols = left.columns();
const rightCols = right.columns();
if (!leftCols.includes(keyCol)) {
  throw new Error(\`Left DataFrame missing key column "\${keyCol}". Available: \${leftCols.join(", ")}\`);
}
if (!rightCols.includes(keyCol)) {
  throw new Error(\`Right DataFrame missing key column "\${keyCol}". Available: \${rightCols.join(", ")}\`);
}
const result = left.leftJoin(right, keyCol);`,
    ],
    bestPractices: [
      '✓ Use keys: { left: "a", right: "b" } when the join key has different column names in each DataFrame',
      '✓ Use suffixes when both tables share the same key names but have other columns with the same name (e.g. both have "quarter" or "value")',
      "✓ For large datasets (100K+ rows), use leftJoin; it is WASM-backed and much faster than manual JS loops",
      "✓ Check for `undefined` in right-side columns after a left join (non-matches)",
      "✓ Validate key columns with df.columns().includes(key) before joining when keys are dynamic",
    ],
    antiPatterns: [
      "❌ Using suffixes when the key columns have different names (use keys: { left, right } instead)",
      "❌ Using keys: { left, right } only to rename columns; that is for matching different key column names",
    ],
    related: [
      "joinSemantics",
      "leftJoin",
      "innerJoin",
      "performanceQuantitative",
    ],
  },

  rightJoin: {
    name: "rightJoin",
    category: "dataframe",
    signature:
      "rightJoin<OtherRow>(other: DataFrame<OtherRow>, on: (keyof Row & keyof OtherRow) | [...], options?: { suffixes?: ... }): DataFrame<Prettify<SuffixAwareRightJoinResult<...>>>\nrightJoin<OtherRow>(other, options: { keys: ...; suffixes?: ... }): DataFrame<...>",
    description:
      "Right join with another DataFrame. Keeps all rows from the right; columns from the left are `undefined` where there is no key match.",
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
    returns:
      "All right rows preserved; left-side non-key columns are `T | undefined` when there is no matching left row (`RightJoinResult` pattern).",
    examples: [
      'df.rightJoin(other, "id")',
      'df.rightJoin(other, ["region", "year"])',
      'df.rightJoin(other, { keys: { left: "user_id", right: "id" } })',
    ],
    related: ["joinSemantics", "innerJoin", "leftJoin", "outerJoin"],
  },

  outerJoin: {
    name: "outerJoin",
    category: "dataframe",
    signature:
      "outerJoin<OtherRow>(other: DataFrame<OtherRow>, on: (keyof Row & keyof OtherRow) | [...], options?: { suffixes?: ... }): DataFrame<Prettify<SuffixAwareOuterJoinResult<...>>>\nouterJoin<OtherRow>(other, options: { keys: ...; suffixes?: ... }): DataFrame<...>",
    description:
      "Full outer join. Keeps all rows from both DataFrames; cells from the side with no matching row are `undefined`.",
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
    returns:
      "All rows from both sides; non-key fields from the side without a match are `undefined` (`FullJoinResult` / suffix-aware variants).",
    examples: [
      'df.outerJoin(other, "id")',
      'df.outerJoin(other, ["region", "year"])',
      'df.outerJoin(other, { keys: { left: "user_id", right: "id" } })',
    ],
    related: ["joinSemantics", "innerJoin", "leftJoin", "rightJoin", "asofJoin"],
  },

  crossJoin: {
    name: "crossJoin",
    category: "dataframe",
    signature:
      "crossJoin<OtherRow>(other: DataFrame<OtherRow>, maxRows?: number, suffixes?: { left?: string; right?: string }): DataFrame<Prettify<Row & OtherRow>>",
    description:
      "Cartesian product of two DataFrames (every left row paired with every right row). Output size is left.nrows() × right.nrows()—pass `maxRows` as a safety cap. Optional `suffixes` disambiguate overlapping column names.",
    imports: ['import { createDataFrame } from "@tidy-ts/dataframe";'],
    parameters: [
      "other: Right DataFrame",
      "maxRows: Optional maximum number of output rows (omit for no cap)",
      "suffixes: Optional { left?, right? } appended to overlapping column names",
    ],
    returns:
      "DataFrame whose rows combine both schemas (`Row & OtherRow` in types); if both sides use the same non-key column names, pass `suffixes` so columns do not collide at runtime.",
    examples: [
      "products.crossJoin(colors)",
      "df1.crossJoin(df2, 10_000) // cap explosion",
      'df1.crossJoin(df2, undefined, { left: "_a", right: "_b" })',
    ],
    related: ["joinSemantics", "innerJoin", "leftJoin"],
    bestPractices: [
      "✓ GOOD: Always set maxRows when either side can be large",
      "✓ GOOD: Prefer innerJoin/leftJoin when you have keys; crossJoin is for combinatorics (scenarios × products, etc.)",
    ],
    antiPatterns: [
      "❌ BAD: crossJoin two wide tables without a row cap—can exhaust memory",
    ],
  },

  asofJoin: {
    name: "asofJoin",
    category: "dataframe",
    signature:
      "asofJoin<OtherRow, K extends keyof Row & keyof OtherRow>(other: DataFrame<OtherRow>, by: K, options?: { direction?: 'backward' | 'forward' | 'nearest'; tolerance?: number; group_by?: (keyof Row & keyof OtherRow)[] }): DataFrame<Prettify<SuffixAwareAsofJoinResult<...>>>\nasofJoin(..., options: { ..., suffixes: { left?: string; right?: string } }): DataFrame<...>",
    description:
      "Join DataFrames by nearest key match (as-of join). Joins on a sorted column (typically timestamps), matching each left row with the 'nearest' right row based on direction. Useful for time-series data where exact matches aren't required.",
    imports: [
      'import { createDataFrame, stats as s } from "@tidy-ts/dataframe";',
    ],
    parameters: [
      "other: DataFrame to join with",
      "by: Column name to join on (must exist in both DataFrames; data should be sorted on this column)",
      "options.direction: 'backward' (default) - match prior value, 'forward' - match next value, 'nearest' - closest value",
      "options.tolerance: Optional maximum distance on the `by` column (e.g. ms for Date keys)",
      "options.group_by: Optional columns to partition matches (e.g. symbol)",
      "options.suffixes: Optional; when set, overload preserves literal suffixed column names in the result type",
    ],
    returns:
      "DataFrame merging both sides; non-matched right-side fields follow the left-join-style `| undefined` pattern unless suffixes change column names (see `SuffixAwareAsofJoinResult`).",
    examples: [
      '// Join trades to nearest prior quotes (backward)\nconst trades = createDataFrame([\n  { time: 1, symbol: "AAPL", quantity: 100 },\n  { time: 3, symbol: "AAPL", quantity: 200 },\n]);\nconst quotes = createDataFrame([\n  { time: 0, symbol: "AAPL", price: 150.0 },\n  { time: 2, symbol: "AAPL", price: 151.0 },\n]);\ntrades.asofJoin(quotes, "time", { direction: "backward" })\n// Matches trade at time 1 to quote at time 0, trade at time 3 to quote at time 2',
      '// Forward-looking join\nconst events = createDataFrame([\n  { timestamp: 1, event: "start" },\n]);\nconst logs = createDataFrame([\n  { timestamp: 2, log: "processing" },\n]);\nevents.asofJoin(logs, "timestamp", { direction: "forward" })',
      '// Join with tolerance (within 1000ms)\ntrades.asofJoin(quotes, "time", {\n  direction: "nearest",\n  tolerance: 1000\n})',
      '// Group by symbol before matching\ntrades.asofJoin(quotes, "time", {\n  direction: "backward",\n  group_by: ["symbol"]\n})',
    ],
    related: ["joinSemantics", "innerJoin", "leftJoin", "downsample", "upsample"],
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
