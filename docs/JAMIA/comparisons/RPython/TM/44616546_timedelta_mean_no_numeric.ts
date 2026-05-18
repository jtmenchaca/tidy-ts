/**
 * RPython SO#44616546 — Finding the mean and standard deviation of a timedelta object
 * Effect: Crash
 * Bug class: Implicit column selection
 *
 * In pandas, groupby().mean() on a timedelta column either crashes ("No numeric types
 * to aggregate") or silently drops the column depending on version.
 *
 * In tidy-ts, durations are stored as numbers (e.g., seconds). There is no special
 * timedelta type that gets silently excluded from numeric operations.
 * Passing a string column to s.mean() is caught at compile time.
 */
import { createDataFrame, stats as s } from "@tidy-ts/dataframe";

const df = createDataFrame([
  { bank: "Bank of Japan", diff_seconds: 57 },
  { bank: "Bank of Japan", diff_seconds: 21 },
  { bank: "Fed", diff_seconds: 691200 },
  { bank: "Fed", diff_seconds: 172800 },
]);

// Durations as numbers — s.mean() works on numeric columns
const result = df.groupBy("bank").summarize({
  mean_diff_seconds: (g) => s.mean(g.extract("diff_seconds")),
});

// Passing string column to mean is caught
// @ts-expect-error — string[] is not assignable to number[]
const wrong = s.mean(df.extract("bank"));

result.print();
