/**
 * RPython SO#5957380 — structured array .view(float64) reads garbage
 * Effect: DC (silent data corruption)
 * Bug class: Type coercion
 *
 * numpy bug: A structured array with named float32 fields is viewed as float64
 * via `.view(np.float64)`. This reinterprets memory — two 32-bit floats are
 * read as one 64-bit float, producing garbage values silently.
 * The fix is `np.column_stack([data["a_soil"], data["b_soil"]])`.
 *
 * In tidy-ts, there is no memory reinterpretation. Each column is independently
 * typed. If you try to pass a structured row object where a flat number[] is
 * expected, the type system catches it — you must extract columns individually.
 */
import { createDataFrame, stats as s } from "@tidy-ts/dataframe";

// Same data as the .py: structured with named float fields
const data = createDataFrame([
  { a_soil: 0.01479368, b_soil: 0.00668112, Ea_V: 0.0, Kcc: 0.0 },
  { a_soil: 0.01479368, b_soil: 0.00668112, Ea_V: 0.0, Kcc: 0.0 },
]);

// The .py user's mistake: .view(float64) on the whole structured array
// to get a flat numeric 2D array. In tidy-ts, extract() returns individual
// typed columns — there's no way to "reinterpret" the whole row as flat numbers.

// If the user tries to pass extracted row objects (not flat numbers) to a
// function expecting number[], the type system catches it.
// @ts-expect-error — object[] is not assignable to number[]
s.mean(data.rows());
