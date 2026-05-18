/**
 * RPython SO#16067144 — fillna on float column with string
 *
 * In pandas, an all-empty CSV column becomes float64. Filling with "UNKNOWN"
 * via astype(object).fillna() silently widens every column to object dtype;
 * downstream code can still treat the column as numeric.
 *
 * In tidy-ts, an all-null column is typed as null (not number). replaceNull
 * with a string is fine and updates the schema to string. The compiler blocks
 * using that column in numeric operations once the type is known.
 */
import { createDataFrame, stats as s } from "@tidy-ts/dataframe";

// All-null middle column — schema is col2: null (not pandas' silent float64)
const df = createDataFrame([
  { col0: "a", col1: "a", col2: null, col3: "a" },
  { col0: "b", col1: "b", col2: null, col3: "b" },
  { col0: "c", col1: "c", col2: null, col3: "c" },
]);

// Filling nulls with a label is allowed; col2 becomes string
const corrupted = df.replaceNull({ col2: "UNKNOWN" });

// Pandas lets you keep treating col2 as numeric after the silent cast.
// tidy-ts: col2 is string — mean() rejects string[]
// @ts-expect-error — string[] is not assignable to number[]
const wrong = s.mean(corrupted.extract("col2"));

// Correct: use col2 as a label (filter, join keys, etc.) or parse explicitly first
const parsed = corrupted.mutate({ col2_num: (r) => parseFloat(r.col2) });
console.log(s.mean(parsed.extract("col2_num")));
