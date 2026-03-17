import type { DocEntry } from "../mcp-types.ts";

/**
 * Performance and architecture deep-dive docs for Context7 and generated docs.
 * Addresses: quantitative benchmarks, BitSet masks, copy-on-write, when-to-use guidance, edge cases.
 */
export const performanceDocs: Record<string, DocEntry> = {
  performanceQuantitative: {
    name: "Performance: Quantitative comparisons",
    category: "dataframe",
    signature: "Benchmark results (500K rows, typical hardware)",
    description:
      "Tidy-TS is benchmarked against other libraries on 500K-row datasets. Joins and sort are WASM-backed; filter uses BitSet masks. Numbers below are from actual benchmark runs; use them to set expectations and choose when to rely on WASM vs JS paths.",
    imports: [
      'import { createDataFrame, stats as s } from "@tidy-ts/dataframe";',
    ],
    returns: "Reference timings for performance tuning",
    examples: [
      `// 500K ROWS - REFERENCE TIMINGS (tidy-ts baseline = 1.0)
// creation:   tidy-ts 115.8ms, arquero 37.6ms, pandas 757ms
// filter:     tidy-ts 12.9ms, arquero 11.8ms (BitSet = no copy, O(n) predicate eval)
// mutate:     tidy-ts 2.0ms, arquero 3.3ms (copy-on-write: only new column allocated)
// sort:       tidy-ts 119ms,  arquero 343ms (WASM sort ~2.9x faster than arquero)
// leftJoin:   tidy-ts 50.2ms, arquero 400ms  (WASM hash join ~8x faster)
// innerJoin:  tidy-ts 65.8ms, arquero 296ms  (WASM ~4.5x faster)
// outerJoin:  tidy-ts 98.9ms, arquero 1245ms (WASM ~12.6x faster)
// distinct:   tidy-ts 108ms,  arquero 616ms  (~5.7x faster)
// Use WASM-backed operations (join, arrange, s.mean, etc.) for large data.`,
      `// Example: prefer WASM join for large tables
const orders = createDataFrame([...]);   // 500K rows
const customers = createDataFrame([...]); // 10K rows
const result = orders.leftJoin(customers, "customer_id"); // ~50ms, WASM hash join`,
    ],
    bestPractices: [
      "✓ Use benchmark numbers to set expectations: joins and sort scale well with WASM",
      "✓ For 100K+ rows, prefer leftJoin/innerJoin/arrange over hand-written JS loops",
      "✓ filter() cost is O(n) predicate evaluation plus BitSet allocation; no row copy",
    ],
    related: ["leftJoin", "innerJoin", "arrange", "filter", "architecture"],
  },

  performanceBitsetMasks: {
    name: "Performance: BitSet masks (filtering)",
    category: "dataframe",
    signature: "filter() → view with mask, not a copy",
    description:
      "Filtering does not copy rows. The DataFrame keeps a BitSet mask: a compact array of bits (Uint32Array) with one bit per row. Bit i set to 1 means 'include row i'; 0 means exclude. Chained filters combine masks with bitwise AND. Data is only materialized when you access rows (e.g. print(), toArray(), or pass to a verb that needs physical rows). This keeps memory and allocation low and allows multiple filters without intermediate copies.",
    imports: ['import { createDataFrame } from "@tidy-ts/dataframe";'],
    returns: "Lazy-filtered DataFrame (view with mask)",
    examples: [
      `// BitSet concept: one bit per row, 1 = include, 0 = exclude
// Internally: mask = { bits: Uint32Array(...), size: nRows }
// filter() sets bits for rows that pass the predicate; no column data is copied.

const df = createDataFrame([
  { id: 1, status: "active" },
  { id: 2, status: "inactive" },
  { id: 3, status: "active" },
]);

const active = df.filter(r => r.status === "active");
// active is a view: same column storage as df, plus a mask [1,0,1] (rows 0,2 kept)

const result = active.filter(r => r.id > 1);
// Chained filter: new mask = previous AND new predicate → bitsetAndInPlace
// Result view mask = [0,0,1] (only row 2). Still no row data copied.

result.print(); // Materialization happens here: only visible rows are read from columns`,
      `// When is the mask applied? On any operation that needs row-level access:
// - print(), toArray(), toJSON(), toString()
// - groupBy() (logical rows per group)
// - arrange(), slice(), distinct, summarize(), etc.
// So: filter early and chain; cost is O(n) per filter to compute the mask, then cheap AND.`,
    ],
    bestPractices: [
      "✓ Chain filters when possible; they combine into one mask with AND",
      "✓ Prefer filter over toArray().filter() to avoid materializing rows",
      "✓ BitSet size is ~n/32 words; much smaller than copying n rows",
    ],
    related: ["filter", "architecture", "performanceWhenToUse"],
  },

  performanceCopyOnWrite: {
    name: "Performance: Copy-on-write semantics",
    category: "dataframe",
    signature:
      "Unchanged columns are shared; only new/changed columns are new arrays",
    description:
      "DataFrames are immutable at the API level, but internally unchanged column arrays are shared between the original and the transformed DataFrame. When you mutate() or add columns, only the new column is allocated; existing columns are referenced, not copied. When you select() a subset of columns, the kept columns are shared. Copy-on-write keeps memory usage low and avoids unnecessary allocation when building pipelines.",
    imports: ['import { createDataFrame } from "@tidy-ts/dataframe";'],
    returns: "New DataFrame with shared column references where possible",
    examples: [
      `// mutate: new column only; existing columns shared
const df = createDataFrame([{ x: 1 }, { x: 2 }, { x: 3 }]);
const df2 = df.mutate({ y: r => r.x * 2 });
// df2.columns.x is the same array as df.columns.x (shared reference)
// df2 has a new array only for y. No copy of x.

console.log(df.columns());   // ["x"]
console.log(df2.columns());  // ["x", "y"]`,
      `// select: kept columns are shared with the source
const wide = createDataFrame([{ a: 1, b: 2, c: 3 }]);
const narrow = wide.select("a", "c");
// narrow's a and c arrays are the same as wide's (shared)
// Dropping b does not copy a or c.`,
    ],
    bestPractices: [
      "✓ Prefer mutate() over building a new object from toArray() to keep column sharing",
      "✓ select() is cheap; it does not copy the retained columns",
      "✓ Immutability: df is unchanged after df2 = df.mutate(...); df2 holds shared refs",
    ],
    related: ["mutate", "select", "architecture", "performanceWhenToUse"],
  },

  performanceWhenToUse: {
    name: "Performance: When to use which operations",
    category: "dataframe",
    signature: "Guidance for optimal performance",
    description:
      "Use column access for single-column reads; use WASM-backed functions for large arrays and joins/sort; chain filters instead of one complex predicate when you want mask combination; use extract() when a stats function needs an array. Prefer creation from columns when you already have column arrays.",
    imports: [
      'import { createDataFrame, stats as s } from "@tidy-ts/dataframe";',
    ],
    returns: "N/A (guidance)",
    examples: [
      `// Single column: use df.columnName (direct array), not toArray().map(r => r.x)
const mean = s.mean(df.x);           // Good: WASM mean on column array
const bad = df.toArray().map(r => r.x); // Avoid: reconstructs rows, then extracts column`,
      `// Stats that need array: use extract() — oneSample expects \`data\`, not \`x\`
const result = s.test.t.oneSample({ data: df.extract("measurement"), mu: 100 });`,
      `// Joins / sort: use built-in verbs (WASM)
df.leftJoin(other, "id");   // WASM hash join
df.arrange("date", "name"); // WASM sort`,
      `// Filter: chain for clear mask combination
df.filter(r => r.a > 0).filter(r => r.b < 10); // Two masks AND'd`,
    ],
    bestPractices: [
      '✓ Column access: df.x or df["x"] for reading one column; avoid toArray() for that',
      "✓ WASM for scale: joins, arrange, s.mean, s.stdev, s.test.* on large data",
      "✓ extract(): when a function needs a plain array from a column",
      "✓ Chained filters: combine with BitSet AND; no need to merge into one predicate",
    ],
    antiPatterns: [
      '❌ Using toArray().map(r => r.col) instead of df.col or df.extract("col")',
      "❌ Hand-written JS join/sort on large DataFrames; use leftJoin/arrange",
    ],
    related: ["architecture", "filter", "leftJoin", "arrange", "extract"],
  },

  performanceEdgeCases: {
    name: "Performance: Edge cases and optimization",
    category: "dataframe",
    signature: "Wide vs long, grouped vs ungrouped, creation from columns",
    description:
      "For very wide tables, select() only the columns you need before heavy work to reduce memory and iteration. For creation, prefer createDataFrame({ columns: { ... } }) when you already have column arrays to avoid building rows. Grouped operations respect the view mask; ungrouped mutate/summarize see only visible rows. These patterns help in edge cases and large datasets.",
    imports: [
      'import { createDataFrame, stats as s } from "@tidy-ts/dataframe";',
    ],
    returns: "N/A (guidance)",
    examples: [
      `// Creation: from columns when you have arrays (no row materialization)
const cols = { id: [1, 2, 3], value: [10, 20, 30] };
const df = createDataFrame({ columns: cols }); // Columns used as-is where possible`,
      `// Wide data: select before expensive operations to limit working set
const narrow = wide.select("id", "date", "value");
narrow.groupBy("date").summarize({ total: g => s.sum(g.value) });`,
      `// Filtered DataFrame: mutate/summarize only see visible rows
const filtered = df.filter(r => r.status === "active");
filtered.mutate({ y: r => r.x * 2 }); // y only for active rows; mask applied.`,
    ],
    bestPractices: [
      "✓ Prefer createDataFrame({ columns }) when you have column arrays",
      "✓ For wide tables, select needed columns before groupBy/summarize",
      "✓ All verbs respect the view (mask/index); no need to materialize first",
    ],
    related: ["createDataFrame", "select", "groupBy", "architecture"],
  },
};
