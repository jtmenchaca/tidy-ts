/**
 * RPython SO#16988526 — Pandas reading csv as string type
 * Effect: IF (silent incorrect functionality)
 * Bug class: Type coercion
 *
 * In pandas, read_csv silently infers '1234E5' as float 123400000.0 instead of
 * keeping it as the string "1234E5".
 *
 * In tidy-ts, readCsv returns a typed DataFrame based on an explicit schema or
 * infers all columns as strings by default. There is no silent type coercion —
 * numeric conversion requires explicit parseFloat/parseInt.
 */
import { createDataFrame, stats as s } from "@tidy-ts/dataframe";

// After reading CSV, columns are strings — no silent float inference
const df = createDataFrame([
  { id: "1234E5", value: "hello" },
  { id: "ABC123", value: "world" },
  { id: "5678E2", value: "foo" },
]);

// id is string — no silent coercion happened
const ids = df.extract("id");
console.log(ids); // ["1234E5", "ABC123", "5678E2"] — preserved as-is

// @ts-expect-error — string[] is not assignable to number[]
const wrong = s.mean(df.extract("id"));

// If you actually want numeric, you must be explicit:
// const numeric = df.mutate({ id: (r) => parseFloat(r.id) });
