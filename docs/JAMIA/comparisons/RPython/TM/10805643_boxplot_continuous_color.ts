/**
 * RPython SO#10805643 — boxplot with continuous Age on discrete color scale
 * Effect: Crash
 * Bug class: Type coercion
 *
 * R bug: scale_colour_manual expects discrete/factor color aesthetic. Using
 * continuous numeric Age as the color crashes: "Continuous value supplied to
 * discrete scale." The fix: convert age to factor via as.factor(age).
 *
 * In tidy-ts, converting a numeric column to a string label (analogous to factor)
 * makes it a string[]. Downstream operations requiring number[] reject it,
 * catching the discrete/continuous mismatch.
 */
import { createDataFrame, stats as s } from "@tidy-ts/dataframe";

const MYdata = createDataFrame([
  { age: 0, richness: 10000 },
  { age: 1, richness: 10500 },
  { age: 3, richness: 9800 },
]);

// Convert age to string label (analogous to R's as.factor(age) for discrete scale)
const labels = MYdata.mutate({ age_label: (r) => String(r.age) });

// The SO user then tries to use the factor column in a continuous context.
// ggplot2 crashes on discrete/continuous mismatch.
// tidy-ts: string[] cannot be used where number[] is required.
// @ts-expect-error — string[] is not assignable to number[]
s.test.correlation.pearson({ x: labels.extract("age_label"), y: labels.extract("richness") });
