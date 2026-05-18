/**
 * RPython SO#30519140 — pandas DataFrame set value on boolean mask
 * Effect: Crash
 * Bug class: Type coercion
 *
 * In pandas, df[mask] = 30 attempts to set a value across all columns matching
 * a boolean mask. On a mixed-type DataFrame (int + string columns), this crashes
 * because assigning an integer to a string column is not valid. The user didn't
 * account for the column types before proceeding.
 *
 * In tidy-ts, mutate allows returning number | string, but downstream operations
 * that expect a specific type force the user to narrow first.
 */
import { createDataFrame, stats as s } from "@tidy-ts/dataframe";

const df = createDataFrame([
  { a: 1, b: "a" },
  { a: 2, b: "b" },
  { a: 3, b: "f" },
]);

// mutate allows mixed return — the column becomes number | string
const mixed = df.mutate({ b: (r) => r.a === 1 ? 30 : r.b });

// But downstream, attempting to use that column as number[] fails —
// the user is forced to account for the mixed type before proceeding
// @ts-expect-error — (string | number)[] is not assignable to number[]
const wrong = s.mean(mixed.extract("b"));
