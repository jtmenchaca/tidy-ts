/**
 * RPython SO#30132282 — datetime to string with series in pandas
 * Effect: Crash
 * Bug class: Type coercion
 *
 * In pandas, .str accessor on a datetime Series crashes. The user wants to
 * format the dates as strings but uses the wrong accessor for the dtype.
 *
 * In tidy-ts, dates stored as strings are typed as string — string methods
 * work. Dates stored as numbers can't have string methods called on them.
 */
import { createDataFrame, stats as s } from "@tidy-ts/dataframe";

const df = createDataFrame([
  { date_str: "2001-01-01", amount: 100 },
  { date_str: "2001-03-31", amount: 200 },
]);

// date_str is string — string operations work in mutate
const formatted = df.mutate({
  year: (r) => r.date_str.slice(0, 4),
});

// Numeric operations on string column are caught
// @ts-expect-error — string[] is not assignable to number[]
const wrong = s.mean(df.extract("date_str"));

formatted.print();
