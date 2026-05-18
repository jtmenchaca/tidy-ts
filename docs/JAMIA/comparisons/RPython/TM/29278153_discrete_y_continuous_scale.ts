/**
 * RPython SO#29278153 — scale_y_continuous on factor y-axis
 * Effect: Crash
 * Bug class: Type coercion
 *
 * R bug: pivot_longer (melt) produces a "variable" column that is factor/character.
 * Applying scale_y_continuous to this factor y crashes: "Discrete value supplied to
 * continuous scale."
 *
 * In tidy-ts, the variable column from pivotLonger is typed as string. Passing it to
 * a function requiring number[] is a compile-time error.
 */
import { createDataFrame, stats as s } from "@tidy-ts/dataframe";

const meltDF = createDataFrame([
  { mw: 3.9, variable: "10", value: 1 },
  { mw: 6.4, variable: "33.95", value: 1 },
  { mw: 5.2, variable: "20", value: 2 },
]);

// The SO user's intent: continuous y-scale on the "variable" column.
// ggplot2 crashes because variable is factor, not numeric.
// tidy-ts: correlation with string variable as y requires number[].
// @ts-expect-error — string[] is not assignable to number[]
s.test.correlation.pearson({ x: meltDF.extract("mw"), y: meltDF.extract("variable") });
