import { createDataFrame, type DataFrame } from "@tidy-ts/dataframe";

// ── Test data ──────────────────────────────────────────────────────────

const employees = createDataFrame([
  { id: 1, name: "Alice", dept_id: 10 },
  { id: 2, name: "Bob", dept_id: 20 },
]);

const departments = createDataFrame([
  { dept_id: 10, dept_name: "Engineering" },
  { dept_id: 20, dept_name: "Sales" },
]);

// ── 1. No overlapping non-key columns ──────────────────────────────────

const noOverlap = employees.leftJoin(departments, "dept_id");
const _noOverlapCheck: DataFrame<{
  id: number;
  name: string;
  dept_id: number;
  dept_name: string | undefined;
}> = noOverlap;

// ── 2. Overlapping non-key columns ─────────────────────────────────────

const left = createDataFrame([
  { time: 1, symbol: "AAPL", quantity: 100 },
  { time: 3, symbol: "GOOG", quantity: 200 },
]);

const right = createDataFrame([
  { time: 1, symbol: "AAPL", price: 150 },
  { time: 2, symbol: "GOOG", price: 2800 },
]);

// "symbol" is shared but NOT a join key — L gets "symbol_x", R gets "symbol_y"
const overlap = left.leftJoin(right, "time");
const _overlapCheck: DataFrame<{
  time: number;
  symbol_x: string;
  quantity: number;
  price: number | undefined;
  symbol_y: string | undefined;
}> = overlap;

// ── 3. Multiple shared non-key columns ─────────────────────────────────

const events = createDataFrame([
  { id: "a", time: 1, code: "X", flag: true },
]);

const logs = createDataFrame([
  { id: "a", time: 0, code: "Y", detail: "info" },
]);

// Join on "id" — "time" and "code" are shared non-key cols
// L gets _x suffix, R gets _y suffix
const multiShared = events.leftJoin(logs, "id");
const _multiSharedCheck: DataFrame<{
  id: string;
  time_x: number;
  code_x: string;
  flag: boolean;
  detail: string | undefined;
  time_y: number | undefined;
  code_y: string | undefined;
}> = multiShared;

// ── 4. Single column tables ────────────────────────────────────────────

const keys = createDataFrame([{ id: 1 }, { id: 2 }]);
const values = createDataFrame([{ id: 1, value: "hello" }]);

const minimal = keys.leftJoin(values, "id");
const _minimalCheck: DataFrame<{
  id: number;
  value: string | undefined;
}> = minimal;

// ── 5. With suffix option ──────────────────────────────────────────────

const withSuffix = left.leftJoin(right, {
  keys: ["time"],
  suffixes: { left: "_trade", right: "_quote" },
});
const _withSuffixCheck: DataFrame<{
  time: number;
  quantity: number;
  symbol_trade: string;
  price: number | undefined;
  symbol_quote: string | undefined;
}> = withSuffix;

// ── 6. Object API without suffixes (keys only) ─────────────────────────
// Should behave identically to the simple API — collision gets _x/_y suffixes

const objNoSuffix = left.leftJoin(right, {
  keys: ["time"],
});
const _objNoSuffixCheck: DataFrame<{
  time: number;
  symbol_x: string;
  quantity: number;
  price: number | undefined;
  symbol_y: string | undefined;
}> = objNoSuffix;

// ── 7. Object API without suffixes, multiple shared non-key columns ────

const objMultiShared = events.leftJoin(logs, {
  keys: ["id"],
});
const _objMultiSharedCheck: DataFrame<{
  id: string;
  time_x: number;
  code_x: string;
  flag: boolean;
  detail: string | undefined;
  time_y: number | undefined;
  code_y: string | undefined;
}> = objMultiShared;
