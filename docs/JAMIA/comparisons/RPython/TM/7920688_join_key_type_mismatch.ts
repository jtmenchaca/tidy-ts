/**
 * RPython SO#7920688 — non-joins with data.tables
 * Effect: Crash
 * Bug class: Nullable type
 *
 * In R data.table, which=TRUE returns NA for non-matching keys. Using these
 * NAs in negative indexing crashes. The user doesn't handle the NA positions.
 *
 * In tidy-ts, join operations produce typed DataFrames directly. There are
 * no implicit NA index positions to mishandle. Anti-join is done via filter.
 */
import { createDataFrame, stats as s } from "@tidy-ts/dataframe";

const dt1 = createDataFrame([
  { a: "a", b: 1 },
  { a: "b", b: 4 },
  { a: "c", b: 2 },
  { a: "f", b: 2 },
  { a: "g", b: 3 },
]);

const dt2Keys = new Set(["a", "b", "k"]);

// Anti-join via filter — explicit, no NA confusion
const antiJoin = dt1.filter((r) => !dt2Keys.has(r.a));
antiJoin.print();

// Type system catches passing string key column to numeric ops
// @ts-expect-error — string[] is not assignable to number[]
const wrong = s.sum(dt1.extract("a"));
