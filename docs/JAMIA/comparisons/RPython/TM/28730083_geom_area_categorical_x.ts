/**
 * RPython SO#28730083 — geom_area with categorical period on x-axis
 * Effect: Crash
 * Bug class: Type coercion
 *
 * R bug: geom_area on factor/character x-axis (e.g., "1984-1985") crashes ggplot2
 * when it expects a continuous scale for the area ribbon fill.
 *
 * In tidy-ts, using a string period column in a continuous numeric operation (like
 * fitting a trend or correlating with values) is a compile-time error.
 */
import { createDataFrame, stats as s } from "@tidy-ts/dataframe";

const data = createDataFrame([
  { def_percent: 6.48, period: "1984-1985", valence: "neg" },
  { def_percent: 5.82, period: "1985-1986", valence: "neg" },
  { def_percent: -2.4, period: "1986-1987", valence: "pos" },
]);

// The SO user's intent: area chart with period as a continuous x-axis.
// ggplot2 crashes because period is factor, not continuous.
// tidy-ts: fitting a trend over period requires all-numeric columns.
// The string period/valence columns fail Record<string, number>.
// @ts-expect-error — Type '{ def_percent: number; period: string; valence: string }' does not satisfy 'Record<string, number>'
s.glm({ formula: "def_percent ~ period", family: "gaussian", link: "identity", data });
