/**
 * RPython SO#29974535 — scale_x_date on character MonthDay axis
 * Effect: Crash
 * Bug class: Type coercion
 *
 * R bug: ggplot2 scale_x_date() requires Date objects. Character MonthDay strings
 * (e.g., "01-Jan") crash: "Invalid input: date_trans works with objects of class
 * Date only."
 *
 * In tidy-ts, string date columns cannot be used in numeric/temporal statistical
 * operations. The type system rejects strings where numbers are required.
 */
import { createDataFrame, stats as s } from "@tidy-ts/dataframe";

const df = createDataFrame([
  { monthDay: "01-Jan", y: 100 },
  { monthDay: "08-Jan", y: 101 },
  { monthDay: "15-Jan", y: 99 },
  { monthDay: "22-Jan", y: 103 },
]);

// The SO user's intent: plot y over time with a date-formatted x-axis.
// ggplot2 crashes because monthDay is character, not Date.
// tidy-ts: using string x in a trend computation requires numeric x.
// @ts-expect-error — string[] is not assignable to number[]
s.test.correlation.pearson({ x: df.extract("monthDay"), y: df.extract("y") });
