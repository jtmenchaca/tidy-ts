/**
 * Type-System Guarantee Audit for Tidy-TS
 *
 * This file is a compile-time test: it type-checks but never runs.
 * Every Expect<IsExact<Actual, Expected>> asserts bidirectional type equality.
 * A @ts-expect-error comment asserts that something is correctly rejected.
 *
 * ┌──────────────────────┬──────────────────────────────────────┬──────────────────────────────────────┐
 * │ Operation            │ Type effect                          │ Runtime effect                       │
 * ├──────────────────────┼──────────────────────────────────────┼──────────────────────────────────────┤
 * │ filter               │ preserves Row                        │ removes rows by predicate            │
 * │ arrange              │ preserves Row                        │ reorders rows                        │
 * │ slice/sliceHead/Tail │ preserves Row                        │ takes subset of rows by position     │
 * │ sliceMin/sliceMax    │ preserves Row                        │ keeps N smallest/largest by column   │
 * │ sliceSample          │ preserves Row                        │ random sample of rows                │
 * │ shuffle              │ preserves Row                        │ randomizes row order                 │
 * │ reorder              │ preserves Row                        │ changes column display order          │
 * │ interpolate          │ preserves Row                        │ fills nulls via interpolation         │
 * │ select               │ Pick<Row, Cols>                      │ column projection                    │
 * │ drop                 │ Omit<Row, Cols>                      │ column removal                       │
 * │ distinct             │ Pick<Row, Cols>                      │ deduplicate + project                │
 * │ mutate (new col)     │ Row & { col: T }                     │ computes new column                  │
 * │ mutate (replace col) │ Row with col type replaced           │ overwrites column values             │
 * │ rename               │ key substitution, types preserved    │ renames column headers               │
 * │ groupBy              │ GroupedDataFrame<Row, Keys>           │ partitions rows by key values        │
 * │ summarise            │ Pick<Row, GroupKeys> & SummaryCols    │ aggregates groups into single rows   │
 * │ summarise (ungrouped)│ SummaryCols only                     │ aggregates all rows into one         │
 * │ count                │ Pick<Row, K> & { count: number }     │ counts rows per group                │
 * │ pivotWider           │ new cols from data, values T | undef │ reshapes long → wide                 │
 * │ pivotLonger          │ gathers cols into name/value pair    │ reshapes wide → long                 │
 * │ unnest               │ array col → element type | null      │ flattens array col into rows         │
 * │ innerJoin            │ merged schema, no undefined           │ matched rows only                    │
 * │ leftJoin             │ right-side cols become T | undefined  │ unmatched right rows filled          │
 * │ rightJoin            │ left-side cols become T | undefined   │ unmatched left rows filled           │
 * │ outerJoin            │ both sides' cols become T | undefined │ all rows, unmatched filled           │
 * │ crossJoin            │ merged schema, no undefined           │ Cartesian product                    │
 * │ asofJoin             │ right-side cols become T | undefined  │ nearest-match join                   │
 * │ join (collision)     │ shared non-key cols get _x/_y suffix  │ renames to avoid ambiguity           │
 * │ join (custom suffix) │ shared non-key cols get custom suffix │ renames to avoid ambiguity           │
 * │ bindRows             │ union cols; unique cols → T | undef   │ vertical concatenation               │
 * │ lag                  │ (T | undefined)[]                     │ shifts values, fills with undefined  │
 * │ replaceNull          │ removes null from specified cols      │ substitutes null with provided value │
 * │ replaceUndefined     │ removes undefined from specified cols │ substitutes undef with provided val  │
 * │ removeNull           │ removes null, drops rows with null    │ filters rows where col is null       │
 * │ removeUndefined      │ removes undef, drops rows with undef │ filters rows where col is undefined  │
 * │ fillForward          │ preserves Row (leading nulls remain)  │ carries last known value forward     │
 * │ fillBackward         │ preserves Row (trailing nulls remain) │ carries next known value backward    │
 * │ mean(clean[])        │ number                                │ arithmetic mean                      │
 * │ mean(nullable[])     │ number | null                         │ returns null if any null present     │
 * │ mean(nullable[],     │ number                                │ filters nulls, then computes mean    │
 * │   {removeNull: true})│                                       │                                      │
 * │ createDataFrame(,zod)│ DataFrame<z.infer<Schema>>            │ Zod validates each row at creation   │
 * │ append/prepend       │ requires exact Row shape              │ validates row shape at runtime       │
 * └──────────────────────┴──────────────────────────────────────┴──────────────────────────────────────┘
 *
 * Assertions below are organized by type effect category:
 *   1. Schema preservation  — operation does not change the row type
 *   2. Schema narrowing     — operation removes columns
 *   3. Schema extension     — operation adds or replaces columns
 *   4. Schema replacement   — operation produces an entirely new row type
 *   5. Null/undefined introduction — operation widens column types
 *   6. Null/undefined removal     — operation narrows column types
 *   7. Grouping state       — tracked as a type parameter
 *   8. Chained pipelines    — type flows through multi-step transforms
 *   9. Boundary validation  — Zod schema at I/O
 *  10. Escape hatches       — where static guarantees end
 */

import {
  createDataFrame,
  stats,
  type DataFrame,
  type GroupedDataFrame,
} from "@tidy-ts/dataframe";
import { z } from "zod";

// ═══════════════════════════════════════════════════════════════════════
// Test utilities — bidirectional type equality
// ═══════════════════════════════════════════════════════════════════════

type IsExact<A, B> =
  (<T>() => T extends A ? 1 : 2) extends (<T>() => T extends B ? 1 : 2)
    ? (<T>() => T extends B ? 1 : 2) extends (<T>() => T extends A ? 1 : 2)
      ? true
      : false
    : false;

type Expect<_T extends true> = true;

type RowOf<T> = T extends DataFrame<infer R> ? R : never;
type GroupRowOf<T> = T extends GroupedDataFrame<infer R, infer _K> ? R : never;
type GroupKeysOf<T> = T extends GroupedDataFrame<infer _R, infer K> ? K : never;

// ═══════════════════════════════════════════════════════════════════════
// Test data
// ═══════════════════════════════════════════════════════════════════════

const df = createDataFrame([
  { name: "Alice", age: 25, city: "NYC", score: 85 },
  { name: "Bob", age: 30, city: "LA", score: 92 },
]);

type BaseRow = { name: string; age: number; city: string; score: number };

// ═══════════════════════════════════════════════════════════════════════
// 1. SCHEMA PRESERVATION — row type unchanged
// ═══════════════════════════════════════════════════════════════════════

// 1a. filter — preserves row shape, only removes rows
const filtered = df.filter((r) => r.age > 25);
type _1a = Expect<IsExact<RowOf<typeof filtered>, BaseRow>>;

// 1b. arrange — preserves row shape, only reorders rows
const arranged = df.arrange("age", "desc");
type _1b = Expect<IsExact<RowOf<typeof arranged>, BaseRow>>;

// 1c. slice — preserves row shape, takes subset by position
const sliced = df.slice(0, 5);
type _1c = Expect<IsExact<RowOf<typeof sliced>, BaseRow>>;

// 1d. sliceHead — preserves row shape
const headed = df.sliceHead(3);
type _1d = Expect<IsExact<RowOf<typeof headed>, BaseRow>>;

// 1e. sliceTail — preserves row shape
const tailed = df.sliceTail(3);
type _1e = Expect<IsExact<RowOf<typeof tailed>, BaseRow>>;

// 1f. shuffle — preserves row shape, randomizes order
const shuffled = df.shuffle();
type _1f = Expect<IsExact<RowOf<typeof shuffled>, BaseRow>>;

// 1g. sliceMin — preserves row shape, keeps N smallest
const smallest = df.sliceMin("age", 1);
type _1g = Expect<IsExact<RowOf<typeof smallest>, BaseRow>>;

// 1h. sliceMax — preserves row shape, keeps N largest
const largest = df.sliceMax("age", 1);
type _1h = Expect<IsExact<RowOf<typeof largest>, BaseRow>>;

// 1i. sliceSample — preserves row shape, random sample
const sampled = df.sliceSample(1);
type _1i = Expect<IsExact<RowOf<typeof sampled>, BaseRow>>;

// 1j. reorder — preserves row type, changes column order at runtime only
const reordered = df.reorder(["score", "name", "age", "city"]);
type _1j = Expect<IsExact<RowOf<typeof reordered>, BaseRow>>;

// 1k. interpolate — preserves row type (fills null values numerically)
const tsData = createDataFrame([
  { x: 1, y: 10 as number | null },
  { x: 2, y: null as number | null },
  { x: 3, y: 30 as number | null },
]);
const interpolated = tsData.interpolate("y", "x", "linear");
type _1k = Expect<IsExact<RowOf<typeof interpolated>, { x: number; y: number | null }>>;

// ═══════════════════════════════════════════════════════════════════════
// 2. SCHEMA NARROWING — columns removed
// ═══════════════════════════════════════════════════════════════════════

// 2a. select — Pick<Row, ColName>
const selected = df.select("name", "age");
type _2a = Expect<IsExact<RowOf<typeof selected>, { name: string; age: number }>>;

// 2b. drop — Omit<Row, ColName>
const dropped = df.drop("city", "score");
type _2b = Expect<IsExact<RowOf<typeof dropped>, { name: string; age: number }>>;

// 2c. distinct — Pick<Row, Cols> (SQL DISTINCT narrows to selected columns)
const distinct = df.distinct("city", "score");
type _2c = Expect<IsExact<RowOf<typeof distinct>, { city: string; score: number }>>;

// 2d. select rejects nonexistent columns
// @ts-expect-error — "nonexistent" is not a key of BaseRow
df.select("nonexistent");

// 2e. drop rejects nonexistent columns
// @ts-expect-error — "nonexistent" is not a key of BaseRow
df.drop("nonexistent");

// 2f. accessing dropped column is rejected
const afterDrop = df.drop("score");
// @ts-expect-error — "score" no longer exists
afterDrop.mutate({ bad: (r) => r.score * 2 });

// ═══════════════════════════════════════════════════════════════════════
// 3. SCHEMA EXTENSION / REPLACEMENT — columns added or replaced
// ═══════════════════════════════════════════════════════════════════════

// 3a. mutate — adds new columns, preserves existing
const mutated = df.mutate({
  revenue: (r) => r.score * r.age,
  label: (r) => `${r.name}: ${r.city}`,
});
type _3a = Expect<IsExact<
  RowOf<typeof mutated>,
  { name: string; age: number; city: string; score: number; revenue: number; label: string }
>>;

// 3b. mutate — replaces existing column type
const replaced = df.mutate({
  age: (r) => String(r.age),
});
type _3b = Expect<IsExact<
  RowOf<typeof replaced>,
  { name: string; age: string; city: string; score: number }
>>;

// 3c. rename — replaces key names, preserves types
const renamed = df.rename({ name: "fullName", city: "location" });
type _3c = Expect<IsExact<
  RowOf<typeof renamed>,
  { fullName: string; age: number; location: string; score: number }
>>;

// 3d. accessing old name after rename is rejected
// @ts-expect-error — "name" no longer exists after rename
renamed.mutate({ bad: (r) => r.name });

// 3e. chained rename tracks through
const chainRenamed = df.rename({ name: "userName" }).rename({
  userName: "fullName",
});
type _3e = Expect<IsExact<
  RowOf<typeof chainRenamed>,
  { fullName: string; age: number; city: string; score: number }
>>;

// ═══════════════════════════════════════════════════════════════════════
// 4. SCHEMA REPLACEMENT — entirely new row type
// ═══════════════════════════════════════════════════════════════════════

// 4a. summarize (ungrouped) — output schema is only the summary columns
const summary = df.summarise({
  avg_age: (g) => stats.mean(g.age),
  count: (g) => g.nrows(),
});
type _4a = Expect<IsExact<
  RowOf<typeof summary>,
  { avg_age: number; count: number }
>>;

// 4b. summarize (grouped) — output schema is group keys + summary columns
const groupedSummary = df
  .groupBy("city")
  .summarise({
    avg_score: (g) => stats.mean(g.score),
    n: (g) => g.nrows(),
  });
type _4b = Expect<IsExact<
  RowOf<typeof groupedSummary>,
  { city: string; avg_score: number; n: number }
>>;

// 4c. accessing non-summary column after summarize is rejected
// @ts-expect-error — "name" was consumed by summarize
summary.mutate({ bad: (r) => r.name });

// 4d. pivotWider — creates new columns from values
const longData = createDataFrame([
  { group: "A", variable: "x", value: 1 },
  { group: "A", variable: "y", value: 2 },
  { group: "B", variable: "x", value: 3 },
  { group: "B", variable: "y", value: 4 },
]);
const wide = longData.pivotWider({
  namesFrom: "variable",
  valuesFrom: "value",
  expectedColumns: ["x", "y"],
});
type _4d = Expect<IsExact<
  RowOf<typeof wide>,
  { group: string; x: number | undefined; y: number | undefined }
>>;

// 4e. count — Pick<Row, K> & { count: number }
const counted = df.count("city", "name");
type _4e = Expect<IsExact<
  RowOf<typeof counted>,
  { city: string; name: string; count: number }
>>;

// 4f. pivotLonger — gathers columns into name/value pairs
const wideData = createDataFrame([
  { id: 1, height: 170, weight: 70 },
  { id: 2, height: 180, weight: 80 },
]);
const longer = wideData.pivotLonger({
  cols: ["height", "weight"] as const,
  namesTo: "measurement",
  valuesTo: "value",
});
type _4f = Expect<IsExact<
  RowOf<typeof longer>,
  { id: number; measurement: string; value: number }
>>;

// 4g. unnest — flattens array column into individual rows
const nested = createDataFrame([
  { id: 1, tags: ["a", "b"] },
  { id: 2, tags: ["c"] },
]);
const unnested = nested.unnest("tags");
type _4g = Expect<IsExact<
  RowOf<typeof unnested>,
  { id: number; tags: string | null }
>>;

// 4h. accessing consumed pivot column is rejected
// @ts-expect-error — "variable" was consumed by pivot
wide.mutate({ bad: (r) => r.variable });

// ═══════════════════════════════════════════════════════════════════════
// 5. NULL/UNDEFINED INTRODUCTION — operation widens column types
// ═══════════════════════════════════════════════════════════════════════

// 5a. leftJoin — right-side columns become T | undefined
const employees = createDataFrame([
  { id: 1, name: "Alice", dept_id: 10 },
  { id: 2, name: "Bob", dept_id: 20 },
]);
const departments = createDataFrame([
  { dept_id: 10, dept_name: "Engineering" },
  { dept_id: 20, dept_name: "Sales" },
]);
const joined = employees.leftJoin(departments, "dept_id");
type _5a = Expect<IsExact<
  RowOf<typeof joined>,
  { id: number; name: string; dept_id: number; dept_name: string | undefined }
>>;

// 5b. leftJoin with column collision — suffixed + right undefined
const left = createDataFrame([
  { time: 1, symbol: "AAPL", quantity: 100 },
]);
const right = createDataFrame([
  { time: 1, symbol: "AAPL", price: 150 },
]);
const collisionJoin = left.leftJoin(right, "time");
type _5b = Expect<IsExact<
  RowOf<typeof collisionJoin>,
  {
    time: number;
    symbol_x: string;
    quantity: number;
    price: number | undefined;
    symbol_y: string | undefined;
  }
>>;

// 5c. rightJoin — left-side non-key columns become T | undefined
const rightJoined = employees.rightJoin(departments, "dept_id");
type _5c = Expect<IsExact<
  RowOf<typeof rightJoined>,
  {
    dept_id: number;
    dept_name: string;
    id: number | undefined;
    name: string | undefined;
  }
>>;

// 5d. outerJoin — both sides' non-key columns become T | undefined
const outerJoined = employees.outerJoin(departments, "dept_id");
type _5d = Expect<IsExact<
  RowOf<typeof outerJoined>,
  {
    dept_id: number;
    id: number | undefined;
    name: string | undefined;
    dept_name: string | undefined;
  }
>>;

// 5e. crossJoin — Cartesian product, no undefined, no keys
const colors = createDataFrame([{ color: "red" }, { color: "blue" }]);
const sizes = createDataFrame([{ size: "S" }, { size: "L" }]);
const crossed = colors.crossJoin(sizes);
type _5e = Expect<IsExact<
  RowOf<typeof crossed>,
  { color: string; size: string }
>>;
 
// 5f. innerJoin — no undefined introduction (both sides matched)
const innerJoined = employees.innerJoin(departments, "dept_id");
type _5f = Expect<IsExact<
  RowOf<typeof innerJoined>,
  { id: number; name: string; dept_id: number; dept_name: string }
>>;

// 5g. asofJoin — right-side columns become T | undefined
const trades = createDataFrame([{ time: 1, quantity: 100 }]);
const quotes = createDataFrame([{ time: 0, price: 150 }]);
const asofJoined = trades.asofJoin(quotes, "time");
type _5g = Expect<IsExact<
  RowOf<typeof asofJoined>,
  { time: number; quantity: number; price: number | undefined }
>>;

// 5h. leftJoin with custom suffixes — suffix changes column names
const customSuffix = left.leftJoin(right, {
  keys: ["time"],
  suffixes: { left: "_trade", right: "_quote" },
});
type _5h = Expect<IsExact<
  RowOf<typeof customSuffix>,
  {
    time: number;
    quantity: number;
    symbol_trade: string;
    price: number | undefined;
    symbol_quote: string | undefined;
  }
>>;

// 5i. mutate with nullable return — failable parse produces T | null
const withConversions = df.mutate({
  parsed: (r) => {
    const n = Number(r.name);
    return isNaN(n) ? null : n;
  },
});
type _5i = Expect<IsExact<
  RowOf<typeof withConversions>,
  { name: string; age: number; city: string; score: number; parsed: number | null }
>>;

// 5j. lag() introduces undefined
const ages = df.extract("age");
const lagged = stats.lag(ages);
type _5j = Expect<IsExact<typeof lagged, (number | undefined)[]>>;

// 5k. bindRows with different schemas — unique columns become T | undefined
const df1 = createDataFrame([{ a: 1, b: "x" }]);
const df2 = createDataFrame([{ a: 2, c: true }]);
const bound = df1.bindRows(df2);
type _5k = Expect<IsExact<
  RowOf<typeof bound>,
  { a: number; b: string | undefined; c: boolean | undefined }
>>;

// 5l. pivotWider — missing combinations become undefined
// (already demonstrated in 4d)

// 5m. arithmetic on left-join-introduced undefined is rejected
// @ts-expect-error — dept_name is string | undefined, can't call toUpperCase
joined.mutate({ bad: (r) => r.dept_name.toUpperCase() });

// ═══════════════════════════════════════════════════════════════════════
// 6. NULL/UNDEFINED REMOVAL — operation narrows column types
// ═══════════════════════════════════════════════════════════════════════

// 6a. removeNull — narrows column type by removing null, drops rows
const nullableDF = createDataFrame(
  [{ id: 1, value: "a" }, { id: 2, value: null }],
  z.object({ id: z.number(), value: z.string().nullable() }),
);
const narrowedByFilter = nullableDF.removeNull("value");
type _6a = Expect<IsExact<RowOf<typeof narrowedByFilter>, { id: number; value: string }>>;

// 6b. replaceNull — removes null from column type
const nullableData = createDataFrame(
  [{ id: 1, value: 10 }, { id: 2, value: null }],
  z.object({ id: z.number(), value: z.number().nullable() }),
);
const cleaned = nullableData.replaceNull({ value: 0 });
type _6b = Expect<IsExact<
  RowOf<typeof cleaned>,
  { id: number; value: number }
>>;

// 6c. replaceNull only removes null, not undefined
const mixedNullable = createDataFrame(
  [{ id: 1, val: undefined as number | null | undefined }],
  z.object({
    id: z.number(),
    val: z.number().nullable().optional(),
  }),
);
const afterReplaceNull = mixedNullable.replaceNull({ val: 0 });
// null is removed but undefined remains — type is number | undefined
type _6c = Expect<IsExact<
  RowOf<typeof afterReplaceNull>,
  { id: number; val?: number | undefined }
>>;

// 6d. stats.mean with removeNull returns number (not number | null)
const nullableNums = [1, 2, null, 4];
const cleanMean = stats.mean(nullableNums, { removeNull: true });
type _6d = Expect<IsExact<typeof cleanMean, number>>;

// 6e. stats.mean WITHOUT removeNull returns number | null on nullable input
const nullableMean = stats.mean(nullableNums);
type _6e = Expect<IsExact<typeof nullableMean, number | null>>;

// 6f. removeUndefined — removes undefined from column type, drops rows
const withUndefined = createDataFrame([
  { id: 1, tag: "a" as string | undefined },
  { id: 2, tag: undefined as string | undefined },
]);
const noUndef = withUndefined.removeUndefined("tag");
type _6f = Expect<IsExact<
  RowOf<typeof noUndef>,
  { id: number; tag: string }
>>;

// 6g. stats.mean on clean input returns number (no null in signature)
const cleanNums = [1, 2, 3, 4];
const guaranteedMean = stats.mean(cleanNums);
type _6g = Expect<IsExact<typeof guaranteedMean, number>>;

// 6h. fillForward — preserves row type (leading nulls may remain)
const gapData = createDataFrame(
  [
    { t: 1, price: 100 as number | null },
    { t: 2, price: null as number | null },
    { t: 3, price: 200 as number | null },
  ],
  z.object({ t: z.number(), price: z.number().nullable() }),
);
const filled = gapData.fillForward("price");
type _6h = Expect<IsExact<
  RowOf<typeof filled>,
  { t: number; price: number | null }
>>;

// 6i. fillBackward — preserves row type (trailing nulls may remain)
const backfilled = gapData.fillBackward("price");
type _6i = Expect<IsExact<
  RowOf<typeof backfilled>,
  { t: number; price: number | null }
>>;

// ═══════════════════════════════════════════════════════════════════════
// 7. GROUPING STATE — tracked as a type parameter
// ═══════════════════════════════════════════════════════════════════════

// 7a. groupBy produces GroupedDataFrame with group keys in type
const grouped = df.groupBy("city");
type _7a_row = Expect<IsExact<GroupRowOf<typeof grouped>, BaseRow>>;
type _7a_key = Expect<IsExact<GroupKeysOf<typeof grouped>, "city">>;

// 7b. multiple group keys
const multiGrouped = df.groupBy("city", "name");
type _7b_row = Expect<IsExact<GroupRowOf<typeof multiGrouped>, BaseRow>>;
type _7b_key = Expect<IsExact<GroupKeysOf<typeof multiGrouped>, "city" | "name">>;

// 7c. summarize on grouped — output includes group keys
const groupSummary = df
  .groupBy("city", "name")
  .summarise({
    avg: (g) => stats.mean(g.score),
  });
type _7c = Expect<IsExact<
  RowOf<typeof groupSummary>,
  { city: string; name: string; avg: number }
>>;

// ═══════════════════════════════════════════════════════════════════════
// 8. CHAINED PIPELINE — type flows through multi-step transforms
// ═══════════════════════════════════════════════════════════════════════

// 8a. Full pipeline: select → mutate → rename → groupBy → summarize
const pipeline = df
  .select("name", "city", "score")
  .mutate({ adjusted: (r) => r.score * 1.1 })
  .rename({ name: "student" })
  .groupBy("city")
  .summarise({
    avg_adjusted: (g) => stats.mean(g.adjusted),
    count: (g) => g.nrows(),
  });
type _8a = Expect<IsExact<
  RowOf<typeof pipeline>,
  { city: string; avg_adjusted: number; count: number }
>>;

// 8b. Pipeline with join introducing undefined, then narrowing it away
const pipelineWithJoin = employees
  .leftJoin(departments, "dept_id")
  .replaceUndefined({ dept_name: "Unknown" });
type _8b = Expect<IsExact<
  RowOf<typeof pipelineWithJoin>,
  { id: number; name: string; dept_id: number; dept_name: string }
>>;

// 8c. Pipeline with nullable mutate, then narrowing via removeNull
const pipelineWithConversion = createDataFrame([
  { id: 1, amount: "100.50" },
  { id: 2, amount: "invalid" },
]).mutate({
  parsed: (r) => {
    const n = Number(r.amount);
    return isNaN(n) ? null : n;
  },
}).removeNull("parsed");
type _8c = Expect<IsExact<
  RowOf<typeof pipelineWithConversion>,
  { id: number; amount: string; parsed: number }
>>;

// ═══════════════════════════════════════════════════════════════════════
// 9. BOUNDARY VALIDATION — Zod schema at I/O
// ═══════════════════════════════════════════════════════════════════════

// 9a. createDataFrame with Zod schema — types inferred from schema
const schema = z.object({
  id: z.number(),
  name: z.string(),
  active: z.boolean(),
});
const validated = createDataFrame(
  [{ id: 1, name: "Alice", active: true }],
  schema,
);
type _9a = Expect<IsExact<
  RowOf<typeof validated>,
  { id: number; name: string; active: boolean }
>>;

// 9b. Zod schema with nullable — nullable preserved in DataFrame type
const nullableSchema = z.object({
  id: z.number(),
  value: z.number().nullable(),
});
const validatedNullable = createDataFrame(
  [{ id: 1, value: null }],
  nullableSchema,
);
type _9b = Expect<IsExact<
  RowOf<typeof validatedNullable>,
  { id: number; value: number | null }
>>;

// 9c. Zod schema with enum — literal union type preserved
const enumSchema = z.object({
  status: z.enum(["active", "inactive", "pending"]),
  count: z.number(),
});
const validatedEnum = createDataFrame(
  [{ status: "active" as const, count: 5 }],
  enumSchema,
);
type _9c = Expect<IsExact<
  RowOf<typeof validatedEnum>,
  { status: "active" | "inactive" | "pending"; count: number }
>>;

// 9d. append enforces row shape
const strictDF = createDataFrame([{ id: 1, name: "Alice" }]);
// @ts-expect-error — missing "name" column
strictDF.append({ id: 2 });
// @ts-expect-error — wrong type for "name"
strictDF.append({ id: 2, name: 42 });

// 9e. prepend enforces row shape (same constraint as append)
// @ts-expect-error — missing "name" column
strictDF.prepend({ id: 3 });
// @ts-expect-error — wrong type for "name"
strictDF.prepend({ id: 3, name: false });

// ═══════════════════════════════════════════════════════════════════════
// 10. ESCAPE HATCHES — where static guarantees end
// ═══════════════════════════════════════════════════════════════════════
//
// The guarantees above hold when the DataFrame API is used as designed.
// The following patterns bypass the type system. They are documented here
// to make the safety claim precise — not to prevent their use.

// 10a. Casting to DataFrame<any> is rejected — the index signature mismatch prevents it
// @ts-expect-error — DataFrame<BaseRow> is not assignable to DataFrame<any>
const _10a_casted = df as DataFrame<any>;

// 10b. Casting through `unknown` to a wrong row type compiles but lies at runtime
const lied = df as unknown as DataFrame<{ x: boolean }>;
// Compiles — the cast is unchecked
lied.mutate({ y: (r) => !r.x });

// 10c. Dynamic column names bypass key constraints
const dynamicKey = "age" as string;
// string is not assignable to keyof BaseRow — correctly rejected:
// @ts-expect-error — string is not a valid column name
df.select(dynamicKey);

// 10d. fillForward/fillBackward cannot narrow nullability (leading/trailing nulls remain)
// Documented in 6h/6i — the type preserves null because the runtime cannot guarantee removal.
