/**
 * RPython SO#41815365 — geom_rect with character xmin/xmax on Date axis
 * Effect: Crash
 * Bug class: Type coercion
 *
 * R bug: ggplot2 date_trans scale requires Date objects for xmin/xmax in geom_rect.
 * Passing character strings crashes: "Invalid input: date_trans works with objects
 * of class Date only."
 *
 * In tidy-ts, date strings cannot be used where numeric/temporal operations are expected.
 * The type system catches the mismatch at the point of numeric consumption.
 */
import { createDataFrame, stats as s } from "@tidy-ts/dataframe";

const Data = createDataFrame([
  { date: "2002-05-23", well: "MW-3", elev: 929.04 },
  { date: "2002-05-29", well: "MW-3", elev: 929.39 },
  { date: "2002-06-15", well: "MW-1", elev: 930.12 },
]);

// The SO user's intent: plot elevation over time with date-based rectangles.
// ggplot2 needs Date objects; strings crash date_trans.
// tidy-ts equivalent: correlation of date strings with elevation requires numeric x.
// @ts-expect-error — string[] is not assignable to number[]
s.test.correlation.pearson({ x: Data.extract("date"), y: Data.extract("elev") });
