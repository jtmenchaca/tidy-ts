/**
 * RPython SO#14992644 — Turn Pandas DataFrame of strings into histogram
 * Effect: Crash
 * Bug class: Type coercion
 *
 * In pandas/numpy, np.histogram on string data crashes because numeric
 * operations (min, max, add) fail on strings.
 *
 * In tidy-ts, string columns are typed as string[]. Passing them to
 * numeric operations is a compile-time error.
 */
import { createDataFrame, stats as s } from "@tidy-ts/dataframe";

const df = createDataFrame([
  { s1: "a", s2: "a" },
  { s1: "b", s2: "f" },
  { s1: "a", s2: "a" },
  { s1: "c", s2: "d" },
]);

// s1 is string — numeric operations are rejected
// @ts-expect-error — string[] is not assignable to number[]
const wrong = s.mean(df.extract("s1"));
