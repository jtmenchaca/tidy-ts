/**
 * RPython SO#17690738 — Convert string of date strings to datetime objects in a DataFrame
 * Effect: Crash
 * Bug class: Type coercion
 *
 * In pandas, assigning datetime values to an integer Series silently converts
 * the dtype to object. Subsequent numeric operations fail.
 *
 * In tidy-ts, column types are fixed by the schema. You cannot assign a string
 * to a number column — mutate returns a new column with the new type.
 * Downstream numeric operations on string columns are caught.
 */
import { createDataFrame, stats as s } from "@tidy-ts/dataframe";

const df = createDataFrame([
  { idx: 0, date: "2008-12-20" },
  { idx: 1, date: "2008-12-21" },
  { idx: 2, date: "2008-12-22" },
  { idx: 3, date: "2008-12-23" },
]);

// date is string — numeric operations are rejected
// @ts-expect-error — string[] is not assignable to number[]
const wrong = s.mean(df.extract("date"));

// idx is number — works fine
console.log(s.mean(df.extract("idx")));
