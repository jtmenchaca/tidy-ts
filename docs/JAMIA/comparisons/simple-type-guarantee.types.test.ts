/**
 * Type-System Guarantee Audit for Tidy-TS
 *
 * This file is a compile-time test: it type-checks but never runs.
 * Every Expect<IsExact<Actual, Expected>> asserts bidirectional type equality.
 * A @ts-expect-error comment asserts that something is correctly rejected.
 *
 */

import {
  createDataFrame,
  stats,
  type DataFrame,
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
// 3. SCHEMA EXTENSION — columns added or replaced
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

// ═══════════════════════════════════════════════════════════════════════
// 4. SCHEMA REPLACEMENT — entirely new row type
// ═══════════════════════════════════════════════════════════════════════

// 4a. summarise (ungrouped) — output schema is only the summary columns
const summary = df.summarise({
  avg_age: (g) => stats.mean(g.age),
  count: (g) => g.nrows(),
});
type _4a = Expect<IsExact<
  RowOf<typeof summary>,
  { avg_age: number; count: number }
>>;

// 4b. groupBy.summarise — output schema is group keys + summary columns
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

// 4c. accessing non-summary column after summarise is rejected
// @ts-expect-error — "name" was consumed by summarise
summary.mutate({ bad: (r) => r.name });

// ═══════════════════════════════════════════════════════════════════════
// 5. JOINS — merged schema from L, R, K
// ═══════════════════════════════════════════════════════════════════════

const employees = createDataFrame([
  { id: 1, name: "Alice", dept_id: 10 },
  { id: 2, name: "Bob", dept_id: 20 },
]);
const departments = createDataFrame([
  { dept_id: 10, dept_name: "Engineering" },
  { dept_id: 20, dept_name: "Sales" },
]);

// 5a. innerJoin — no undefined introduction (both sides matched)
const innerJoined = employees.innerJoin(departments, "dept_id");
type _5a = Expect<IsExact<
  RowOf<typeof innerJoined>,
  { id: number; name: string; dept_id: number; dept_name: string }
>>;

// 5b. leftJoin — right-side non-key columns become T | undefined
const leftJoined = employees.leftJoin(departments, "dept_id");
type _5b = Expect<IsExact<
  RowOf<typeof leftJoined>,
  { id: number; name: string; dept_id: number; dept_name: string | undefined }
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

// 5e. leftJoin with column collision — shared non-key cols get _x/_y suffix
const left = createDataFrame([
  { time: 1, symbol: "AAPL", quantity: 100 },
]);
const right = createDataFrame([
  { time: 1, symbol: "AAPL", price: 150 },
]);
const collisionJoin = left.leftJoin(right, "time");
type _5e = Expect<IsExact<
  RowOf<typeof collisionJoin>,
  {
    time: number;
    symbol_x: string;
    quantity: number;
    price: number | undefined;
    symbol_y: string | undefined;
  }
>>;

// 5f. arithmetic on left-join-introduced undefined is rejected
// @ts-expect-error — dept_name is string | undefined, can't call toUpperCase
leftJoined.mutate({ bad: (r) => r.dept_name.toUpperCase() });

// ═══════════════════════════════════════════════════════════════════════
// 6. MISSING VALUE HANDLING — narrow or substitute field types
// ═══════════════════════════════════════════════════════════════════════

// 6a. replaceNull — removes null from column type
const nullableData = createDataFrame(
  [{ id: 1, value: 10 }, { id: 2, value: null }],
  z.object({ id: z.number(), value: z.number().nullable() }),
);
const cleaned = nullableData.replaceNull({ value: 0 });
type _6a = Expect<IsExact<
  RowOf<typeof cleaned>,
  { id: number; value: number }
>>;

// 6b. replaceUndefined — removes undefined from column type
const pipelineWithJoin = employees
  .leftJoin(departments, "dept_id")
  .replaceUndefined({ dept_name: "Unknown" });
type _6b = Expect<IsExact<
  RowOf<typeof pipelineWithJoin>,
  { id: number; name: string; dept_id: number; dept_name: string }
>>;

// 6c. removeNull — narrows column type by removing null, drops rows
const nullableDF = createDataFrame(
  [{ id: 1, value: "a" }, { id: 2, value: null }],
  z.object({ id: z.number(), value: z.string().nullable() }),
);
const narrowedByFilter = nullableDF.removeNull("value");
type _6c = Expect<IsExact<RowOf<typeof narrowedByFilter>, { id: number; value: string }>>;

// 6d. removeUndefined — removes undefined from column type, drops rows
const withUndefined = createDataFrame([
  { id: 1, tag: "a" as string | undefined },
  { id: 2, tag: undefined as string | undefined },
]);
const noUndef = withUndefined.removeUndefined("tag");
type _6d = Expect<IsExact<
  RowOf<typeof noUndef>,
  { id: number; tag: string }
>>;
