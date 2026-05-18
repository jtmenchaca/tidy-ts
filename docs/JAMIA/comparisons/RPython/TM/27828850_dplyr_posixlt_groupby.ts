/**
 * RPython SO#27828850 — dplyr group_by with POSIXlt dates
 * Effect: Crash
 * Bug class: Nullable type
 *
 * R bug: POSIXlt date columns in data.frame break dplyr's group_by because POSIXlt
 * is internally a list, not a vector. weekdays() + group_by on the result crashes.
 * Fix: use as.POSIXct() or store as character and parse explicitly.
 *
 * In tidy-ts, date strings require explicit parsing via Temporal before temporal
 * arithmetic. String date columns cannot be used in numeric statistical operations.
 */
import { createDataFrame, stats as s } from "@tidy-ts/dataframe";

const d = createDataFrame([
  { startDate: "01/15/14 10:00", bikeNo: 1 },
  { startDate: "01/15/14 11:00", bikeNo: 2 },
  { startDate: "01/16/14 09:00", bikeNo: 3 },
]);

// The SO user's intent: group_by(weekdays(startDate)) then count.
// dplyr crashes because POSIXlt is a list internally.
// tidy-ts: correlating date strings with bike numbers requires numeric x.
// @ts-expect-error — string[] is not assignable to number[]
s.test.correlation.pearson({ x: d.extract("startDate"), y: d.extract("bikeNo") });
