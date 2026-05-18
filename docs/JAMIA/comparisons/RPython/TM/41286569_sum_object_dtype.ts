/**
 * RPython SO#41286569 — Get total of Pandas column
 * Effect: Crash
 * Bug class: Type coercion
 *
 * In pandas, df['MyColumn'].sum() on an object-dtype column concatenates
 * strings instead of adding numbers. The user thinks they have numeric data.
 *
 * In tidy-ts, the column is typed as string. Passing string[] to s.sum()
 * is a compile-time error.
 */
import { createDataFrame, stats as s } from "@tidy-ts/dataframe";

const df = createDataFrame([
  { X: "A", MyColumn: "84", Y: 13.0 },
  { X: "B", MyColumn: "76", Y: 77.0 },
  { X: "C", MyColumn: "28", Y: 69.0 },
  { X: "D", MyColumn: "19", Y: 20.0 },
]);

// MyColumn is string — s.sum() rejects string[]
// @ts-expect-error — string[] is not assignable to number[]
const wrong = s.sum(df.extract("MyColumn"));

// Fix: parse first, then sum
const parsed = df.mutate({ MyColumn_num: (r) => parseFloat(r.MyColumn) });
console.log(s.sum(parsed.extract("MyColumn_num")));
