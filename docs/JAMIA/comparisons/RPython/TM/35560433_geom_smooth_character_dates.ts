/**
 * RPython SO#35560433 — geom_smooth not working/showing up
 * Effect: IF (silent incorrect functionality)
 * Bug class: Type coercion
 *
 * R bug: day column is character (e.g., "05/22"). geom_smooth(method='lm') silently
 * fails to produce a trend line because linear regression requires a numeric x-axis.
 * ggplot2 does not error — it just renders nothing for the smooth layer.
 *
 * In tidy-ts, attempting to run a linear correlation or regression with string x-values
 * is a compile-time error — the user must parse dates to numeric before fitting.
 */
import { createDataFrame, stats as s } from "@tidy-ts/dataframe";

const b = createDataFrame([
  { day: "05/22", temp: 10.1 },
  { day: "05/23", temp: 8.7 },
  { day: "05/24", temp: 11.4 },
  { day: "05/25", temp: 11.4 },
  { day: "05/26", temp: 11.6 },
  { day: "05/27", temp: 10.7 },
  { day: "05/28", temp: 9.6 },
  { day: "05/29", temp: 11.0 },
  { day: "05/30", temp: 10.0 },
  { day: "05/31", temp: 10.7 },
  { day: "06/01", temp: 9.5 },
  { day: "06/02", temp: 10.3 },
]);

// The SO user's intent: fit a linear trend (geom_smooth(method='lm')) over time.
// With string day, ggplot2 silently produces no smooth line.
// tidy-ts: s.glm requires Row extends Record<string, number>. A DataFrame with
// string columns does not satisfy this constraint — the model fit is rejected.
// @ts-expect-error — Type '{ day: string; temp: number; }' does not satisfy 'Record<string, number>'
s.glm({ formula: "temp ~ day", family: "gaussian", link: "identity", data: b });
