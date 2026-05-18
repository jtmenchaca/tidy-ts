/**
 * RPython SO#33221655 — ValueError: setting an array element with a sequence
 * Effect: Crash
 * Bug class: Type coercion
 *
 * In pandas, assigning a list [400.0] to a scalar float64 cell crashes.
 * The user accidentally provides an array where a scalar is expected.
 *
 * In tidy-ts, mutate allows returning any value (it becomes the column type).
 * If you return number[] instead of number, the column becomes number[].
 * Downstream numeric operations that expect number[] (flat) catch the mismatch.
 */
import { createDataFrame, stats as s } from "@tidy-ts/dataframe";

const df = createDataFrame([
  { project: "Project1", sold_count: 800.0 },
]);

// Returning [400.0] makes sold_count a number[] column
const wrong = df.mutate({ sold_count: (_r) => [400.0] });

// Downstream: s.mean expects number[], but gets number[][] (array of arrays)
// @ts-expect-error — number[][] is not assignable to number[]
const bad = s.mean(wrong.extract("sold_count"));

// Correct: return a scalar
const fixed = df.mutate({ sold_count: (_r) => 400.0 });
console.log(s.mean(fixed.extract("sold_count")));
