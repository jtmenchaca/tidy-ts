/**
 * RPython SO#42013903 — ufunc 'multiply' error with values from raw_input
 * Effect: Crash
 * Bug class: Type coercion
 *
 * In Python, raw_input/input returns a string. Using it in numpy arithmetic
 * crashes because numpy can't multiply string × float64.
 *
 * In tidy-ts, if data comes in as strings, s.mean() or arithmetic in mutate()
 * will produce a compile-time error because string is not number.
 */
import { createDataFrame, stats as s } from "@tidy-ts/dataframe";

const df = createDataFrame([
  { x: 0, acceleration: "9.8", velocity: "5.0" },
  { x: 1, acceleration: "9.8", velocity: "5.0" },
  { x: 2, acceleration: "9.8", velocity: "5.0" },
]);

// @ts-expect-error — string[] is not assignable to number[]
const wrong = s.mean(df.extract("acceleration"));

// Fix: explicit conversion
const numeric = df.mutate({
  a: (r) => parseFloat(r.acceleration),
  v: (r) => parseFloat(r.velocity),
  y: (r) => parseFloat(r.velocity) * r.x - 0.5 * parseFloat(r.acceleration) * r.x ** 2,
});

numeric.print();
