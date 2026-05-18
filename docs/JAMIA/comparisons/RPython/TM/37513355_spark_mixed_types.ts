/**
 * RPython SO#37513355 — Converting Pandas DataFrame into Spark DataFrame error
 * Effect: Crash
 * Bug class: Type coercion
 *
 * Python bug: A DataFrame has a column with mixed float and string values:
 * `mixed_col: [1.5, "NA", 3.2]`. Pandas allows this (object dtype), but Spark's
 * createDataFrame crashes: "Can not merge type StringType and DoubleType".
 *
 * In tidy-ts, a column with mixed types is typed as the union (number | string).
 * Downstream numeric operations on that column are rejected at compile time.
 */
import { createDataFrame, stats as s } from "@tidy-ts/dataframe";

// Same data as the .py: most columns are fine, but mixed_col has both numbers and strings
const df = createDataFrame([
  { id: "10000001", status: "OK", score: 543, mixed_col: 1.5 as number | string },
  { id: "10000001", status: "OK", score: 611, mixed_col: "NA" as number | string },
  { id: "10000002", status: "PA", score: 691, mixed_col: 3.2 as number | string },
]);

// The user wants to do numeric operations on mixed_col (e.g., compute mean).
// In pandas, object dtype silently allows this. In Spark, it crashes on schema.
// In tidy-ts, s.mean() rejects (number | string)[] at compile time.
// @ts-expect-error — (number | string)[] is not assignable to number[]
s.mean(df.extract("mixed_col"));
