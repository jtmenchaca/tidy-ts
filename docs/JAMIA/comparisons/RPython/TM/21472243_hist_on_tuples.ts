/**
 * RPython SO#21472243 — plt.hist on (word, count) tuple list
 * Effect: Crash
 * Bug class: Value type
 *
 * Python bug: User passes a list of (word, count) tuples directly to plt.hist().
 * Histogram requires flat numeric data for binning; tuples crash with
 * "can't convert to float."
 *
 * In tidy-ts, the data is structured as separate columns. Passing the string
 * word column to a numeric function (analogous to hist needing numbers) is
 * rejected at compile time.
 */
import { createDataFrame, stats as s } from "@tidy-ts/dataframe";

// Same data as the .py: (word, count) pairs — structured as a DataFrame
const df = createDataFrame([
  { word: "whitefield", count: 65299 },
  { word: "bellandur", count: 57061 },
  { word: "kundalahalli", count: 51769 },
  { word: "marathahalli", count: 50639 },
  { word: "electronic city", count: 44041 },
]);

// The .py passes the whole tuple list to plt.hist().
// The equivalent mistake: passing the string column to a numeric operation.
// @ts-expect-error — string[] is not assignable to number[]
s.mean(df.extract("word"));
