/**
 * RPython SO#4231190 — linalg.svd on object array of tuples
 * Effect: Crash
 * Bug class: Value type
 *
 * numpy bug: A 3x3 array filled with (float, float, 1.0) tuples has dtype="O"
 * (object). Calling `np.linalg.svd(anArray)` crashes because SVD requires a
 * numeric 2D array, not an array of tuple objects.
 *
 * In tidy-ts, if tuple data is stored as strings (object representation), it
 * cannot be passed to numeric operations. The type system forces the user to
 * use separate numeric columns for matrix operations.
 */
import { createDataFrame, stats as s } from "@tidy-ts/dataframe";

// Same structure as the .py: 3x3 grid with (h, w, 1.0) tuples stored as strings
// (analogous to numpy object array — the values are tuples, not flat numbers)
const anArray = createDataFrame([
  { c0: "(0.0, 0.0, 1.0)", c1: "(0.0, 1.0, 1.0)", c2: "(0.0, 2.0, 1.0)" },
  { c0: "(1.0, 0.0, 1.0)", c1: "(1.0, 1.0, 1.0)", c2: "(1.0, 2.0, 1.0)" },
  { c0: "(2.0, 0.0, 1.0)", c1: "(2.0, 1.0, 1.0)", c2: "(2.0, 2.0, 1.0)" },
]);

// The .py calls np.linalg.svd(anArray) — needs number[][] for linear algebra.
// In tidy-ts, s.mean() (or any numeric operation) rejects string columns.
// @ts-expect-error — string[] is not assignable to number[]
s.mean(anArray.extract("c0"));
