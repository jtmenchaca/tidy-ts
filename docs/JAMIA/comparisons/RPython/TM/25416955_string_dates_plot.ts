/**
 * RPython SO#25416955 — Plot pandas dates in matplotlib
 * Effect: Crash
 * Bug class: Type coercion
 *
 * In pandas, datetime column read from CSV as strings can't be used for
 * date arithmetic or time-axis plotting without explicit conversion.
 *
 * In tidy-ts, the column is typed as string. Attempting numeric operations
 * (which would be needed for date arithmetic) is caught at compile time.
 */
import { createDataFrame, stats as s } from "@tidy-ts/dataframe";

const df = createDataFrame([
  { time: "2014-07-10 11:49:14", amount: 45 },
  { time: "2014-07-10 11:50:14", amount: 45 },
  { time: "2014-07-10 11:51:14", amount: 21 },
]);

// time is string — numeric operations are rejected
// @ts-expect-error — string[] is not assignable to number[]
const wrong = s.mean(df.extract("time"));

// Correct: use time as a string grouping key or parse explicitly
console.log(s.mean(df.extract("amount")));
