/**
 * RPython SO#23997475 — geom_vline() with date gives "Discrete value supplied to continuous scale"
 * Effect: Crash
 * Bug class: Type coercion
 *
 * R bug: geom_vline(xintercept = as.numeric(dmy("3/6/2014"))) passes a raw numeric
 * to a Date-typed x scale, crashing ggplot2. The user's intent is a vertical reference
 * line on a time-series plot but the type of xintercept doesn't match the scale.
 *
 * In tidy-ts, dates stored as strings cannot be passed to functions expecting number[].
 * The equivalent downstream error: trying to compute a numeric position (e.g., for a
 * regression or statistical test) from date-string data without parsing to numbers first.
 */
import { createDataFrame, stats as s } from "@tidy-ts/dataframe";

const df = createDataFrame([
  { date: "2014-06-02", value: 1 },
  { date: "2014-06-03", value: 2 },
  { date: "2014-06-04", value: 3 },
  { date: "2014-06-05", value: 4 },
]);

// The SO user's task: plot value over date, then add a vertical reference line.
// The R bug: as.numeric(date) passed to xintercept on a Date scale crashes.
// tidy-ts equivalent: trying to correlate date strings with values as if dates were numbers.
// @ts-expect-error — string[] is not assignable to number[] (x requires number[])
s.test.correlation.pearson({ x: df.extract("date"), y: df.extract("value") });
