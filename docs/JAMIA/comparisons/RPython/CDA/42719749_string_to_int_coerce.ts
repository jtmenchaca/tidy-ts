/**
 * RPython SO#42719749 — Pandas convert string to int
 * Effect: DC (silent data corruption)
 * Bug class: Type coercion
 *
 * In pandas, to_numeric(errors='coerce') silently converts unparseable strings
 * to NaN, losing data without warning.
 *
 * In tidy-ts, columns are typed. A string column is string — you must explicitly
 * parse it, and parseInt/parseFloat return NaN which is a number, making the
 * corruption visible in the type system and requiring explicit handling.
 */
import { createDataFrame, stats as s } from "@tidy-ts/dataframe";

const df = createDataFrame([
  { id: "4806105017087" },
  { id: "4806105017087" },
  { id: "4901295030089" },
  { id: "CN414149" },
  { id: "4901295030089" },
]);

// @ts-expect-error — string[] is not assignable to number[]
const wrong = s.mean(df.extract("id"));

// Explicit conversion — NaN is visible and must be handled
const parsed = df.mutate({
  id_numeric: (r) => parseInt(r.id, 10),
});

// NaN values are explicit — user must decide what to do with them
const values = parsed.extract("id_numeric");
console.log(values); // [4806105017087, 4806105017087, 4901295030089, NaN, 4901295030089]
