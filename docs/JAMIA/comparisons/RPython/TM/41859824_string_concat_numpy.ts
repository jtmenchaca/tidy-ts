/**
 * RPython SO#41859824 — ufunc 'add' did not contain loop with signature matching types
 * Effect: Crash
 * Bug class: Type coercion
 *
 * In numpy, arithmetic operators on string arrays dispatch to ufuncs which don't
 * support string dtype, crashing at runtime.
 *
 * In tidy-ts, string columns are typed as string[]. Passing them to numeric
 * operations (e.g., s.mean()) is a compile-time error — the user must convert
 * before proceeding with arithmetic.
 */
import { createDataFrame, stats as s } from "@tidy-ts/dataframe";

const df = createDataFrame([
  { distance: "1.0", d_prob: "0.2", efficiency: "0.8", e_prob: "0.1" },
  { distance: "2.0", d_prob: "0.3", efficiency: "0.6", e_prob: "0.2" },
]);

// The user has string data and attempts a numeric operation without converting
// @ts-expect-error — string[] is not assignable to number[]
const wrong = s.mean(df.extract("distance"));

// Fix: explicit conversion before numeric operations
const numeric = df.mutate({
  distance: (r) => parseFloat(r.distance),
  d_prob: (r) => parseFloat(r.d_prob),
});
console.log(s.mean(numeric.extract("distance")));
