/**
 * RPython SO#36462257 — Create Empty Dataframe in Pandas specifying column types
 * Effect: Crash
 * Bug class: Type coercion
 *
 * In pandas, pd.DataFrame() cannot accept per-column dtypes at construction.
 * Users must create empty and then cast, risking schema drift.
 *
 * In tidy-ts, the schema is defined by the row type. Column types are inferred
 * from the data provided. There is no separate "dtype" specification that can
 * diverge from the actual data.
 */
import { createDataFrame, stats as s } from "@tidy-ts/dataframe";

// Schema is defined by the row shape — types are explicit and consistent
const df = createDataFrame([
  { contract: "H1234", state: "CA", membership: 500, raf: 1.05 },
  { contract: "H5678", state: "TX", membership: 300, raf: 0.92 },
]);

// Numeric columns are number, string columns are string — no ambiguity
console.log(s.mean(df.extract("raf")));

// Attempting numeric ops on string columns is caught at compile time
// @ts-expect-error — string[] is not assignable to number[]
const wrong = s.mean(df.extract("contract"));
