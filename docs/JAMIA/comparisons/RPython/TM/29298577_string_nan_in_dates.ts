/**
 * RPython SO#29298577 — How to convert string to datetime with nulls
 * Effect: Crash
 * Bug class: Nullable type
 *
 * In pandas, a date column containing literal string 'nan' crashes strptime.
 * The user doesn't know the column has non-date content mixed in.
 *
 * In tidy-ts, the column is typed as string. Parsing requires explicit
 * handling of invalid values. The type system forces you to account for
 * the possibility that parsing fails.
 */
import { createDataFrame, stats as s } from "@tidy-ts/dataframe";

const df = createDataFrame([
  { date: "2014-10-20 10:44:31" },
  { date: "2014-10-23 09:33:46" },
  { date: "nan" },
  { date: "2014-10-01 09:38:45" },
]);

// date is string — numeric operations are caught
// @ts-expect-error — string[] is not assignable to number[]
const wrong = s.mean(df.extract("date"));

// Explicit parse with null handling for invalid dates
const parsed = df.mutate({
  timestamp: (r) => {
    const ms = Date.parse(r.date);
    return Number.isNaN(ms) ? null : ms;
  },
});
parsed.print();
