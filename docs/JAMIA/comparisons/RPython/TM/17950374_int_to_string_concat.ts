/**
 * RPython SO#17950374 — Converting a column within pandas DataFrame from int to string
 * Effect: Crash
 * Bug class: Type coercion
 *
 * In pandas, concatenating a string column with an int column using + crashes.
 * The user must explicitly convert with .astype(str) first.
 *
 * In tidy-ts, string + number produces string in JS. The resulting column
 * is typed as string. Downstream numeric operations on that column are
 * rejected at compile time.
 */
import { createDataFrame, stats as s } from "@tidy-ts/dataframe";

const df = createDataFrame([
  { id: 1, prefix: "A" },
  { id: 2, prefix: "B" },
  { id: 3, prefix: "C" },
]);

// Concatenation produces a string column
const result = df.mutate({
  combined: (r) => r.prefix + r.id,
});

// The combined column is string — numeric operations are rejected downstream
// @ts-expect-error — string[] is not assignable to number[]
const wrong = s.mean(result.extract("combined"));
