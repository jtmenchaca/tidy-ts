/**
 * RPython SO#36115687 — PySpark filtering a DataFrame by date field in range (string dates)
 * Effect: IF (silent incorrect functionality)
 * Bug class: Type coercion
 *
 * PySpark/pandas bug: dates stored as ISO strings compared with >= against a
 * YYYY-MM-DD cutoff string. Lexicographic comparison works for pure ISO format but
 * can disagree with temporal order when formats differ (e.g., timestamps vs date-only).
 * The SO user's filter: df.where(df.date >= last_week)
 *
 * In tidy-ts, string date columns stay typed as string. The filter itself
 * (string >= string) is valid TypeScript — the type system cannot prevent the
 * lexicographic comparison. However, the type system prevents the user from
 * performing downstream temporal arithmetic on string columns without parsing,
 * which forces explicit date handling via Temporal.
 */
import { createDataFrame, stats as s } from "@tidy-ts/dataframe";

const df = createDataFrame([
  { date: "2015-07-02T11:22:21.050Z", value: 10 },
  { date: "2015-06-01T11:22:21.050Z", value: 20 },
  { date: "2016-03-20T21:00:00.000Z", value: 30 },
]);

// The SO user's filter — this compiles (string >= string is valid JS):
const lastWeek = "2015-06-15";
const filtered = df.filter((r) => r.date >= lastWeek);

// The user then tries to correlate the date field with values — treating dates as
// a numeric axis (the same conceptual mistake as comparing string dates without parsing).
// tidy-ts rejects passing string[] where number[] is required:
// @ts-expect-error — string[] is not assignable to number[]
s.test.correlation.pearson({ x: filtered.extract("date"), y: filtered.extract("value") });
