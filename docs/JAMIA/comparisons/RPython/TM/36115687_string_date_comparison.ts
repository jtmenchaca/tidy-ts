/**
 * RPython SO#36115687 — PySpark: filtering DataFrame by date field where date is string
 * Effect: IF (silent incorrect functionality)
 * Bug class: Type coercion
 *
 * In PySpark/pandas, dates stored as strings are compared using string ordering.
 * Non-ISO date formats like "7/2/2015" produce wrong results with > comparison
 * because "11/5/2015" < "6/30/2015" lexicographically.
 *
 * In tidy-ts, dates stored as strings are typed as string. The type system
 * catches attempts to use them in numeric operations. Date comparison requires
 * explicit parsing.
 */
import { createDataFrame, stats as s } from "@tidy-ts/dataframe";

const df = createDataFrame([
  { date: "1/15/2015", value: 100 },
  { date: "2/3/2015", value: 200 },
  { date: "12/1/2014", value: 300 },
  { date: "7/20/2015", value: 400 },
  { date: "11/5/2015", value: 500 },
]);

// date is string — numeric operations are rejected
// @ts-expect-error — string[] is not assignable to number[]
const wrong = s.mean(df.extract("date"));

// Correct: parse dates explicitly, then filter
const parsed = df.mutate({ date_ms: (r) => new Date(r.date).getTime() });
const cutoff = new Date("6/30/2015").getTime();
const filtered = parsed.filter((r) => r.date_ms > cutoff);
filtered.print();
