/**
 * RPython SO#19864028 — Convert numerical data in pandas DataFrame to floats in the presence of strings
 * Effect: Crash
 * Bug class: Type coercion
 *
 * In pandas, a column containing 'na' as a string alongside numeric strings
 * crashes on astype(float). The user doesn't know the column has non-numeric content.
 *
 * In tidy-ts, the column is typed as string. parseFloat on "na" returns NaN,
 * which is a valid number. But the column must be explicitly parsed — you can't
 * accidentally treat strings as numbers.
 */
import { createDataFrame, stats as s } from "@tidy-ts/dataframe";

const df = createDataFrame([
  { cap: "5.2" },
  { cap: "na" },
  { cap: "2.2" },
  { cap: "7.6" },
  { cap: "7.5" },
  { cap: "3.0" },
]);

// cap is string — cannot pass to numeric operations
// @ts-expect-error — string[] is not assignable to number[]
const wrong = s.mean(df.extract("cap"));

// Fix: explicit parse (NaN for non-numeric)
const parsed = df.mutate({ cap_num: (r) => parseFloat(r.cap) });
console.log(s.mean(parsed.extract("cap_num"))); // NaN propagates from "na"
