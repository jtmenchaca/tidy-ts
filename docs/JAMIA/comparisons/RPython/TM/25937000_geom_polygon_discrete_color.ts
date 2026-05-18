/**
 * RPython SO#25937000 — geom_polygon color=factor on continuous color scale
 * Effect: Crash
 * Bug class: Type coercion
 *
 * R bug: One layer uses continuous color (numeric diff), another uses discrete
 * microstyle (character). Mixing crashes: "Continuous value supplied to discrete scale."
 *
 * In tidy-ts, a string microstyle column cannot be used in numeric operations.
 * The type system prevents mixing discrete string values with continuous numeric scales.
 */
import { createDataFrame, stats as s } from "@tidy-ts/dataframe";

const splineHull = createDataFrame([
  { pauseMedian: 1.2, numTotalPauses: 8, microstyle: "staccato" },
  { pauseMedian: 2.4, numTotalPauses: 14, microstyle: "legato" },
  { pauseMedian: 0.8, numTotalPauses: 5, microstyle: "staccato" },
]);

// The SO user's intent: use microstyle as a color scale alongside numeric diff.
// ggplot2 crashes because discrete and continuous color are mixed.
// tidy-ts: correlating string microstyle with numeric values requires number[].
// @ts-expect-error — string[] is not assignable to number[]
s.test.correlation.pearson({ x: splineHull.extract("microstyle"), y: splineHull.extract("pauseMedian") });
