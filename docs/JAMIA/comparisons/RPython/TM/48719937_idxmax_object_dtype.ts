/**
 * RPython SO#48719937 — TypeError: reduction operation 'argmax' not allowed for this dtype
 * Effect: Crash
 * Bug class: Type coercion
 *
 * In pandas, idxmax() fails on object-dtype columns. The column contains
 * numeric values stored as strings due to DataFrame construction with wrong
 * index size (extra NaN rows coerce column to object).
 *
 * In tidy-ts, the column type is explicit. If the column is string,
 * numeric reductions are rejected at compile time.
 */
import { createDataFrame, stats as s } from "@tidy-ts/dataframe";

const results = createDataFrame([
  { C_parameter: 0.01, mean_recall: "0.95" },
  { C_parameter: 0.1, mean_recall: "0.90" },
  { C_parameter: 1, mean_recall: "0.92" },
  { C_parameter: 10, mean_recall: "0.92" },
  { C_parameter: 100, mean_recall: "0.92" },
]);

// mean_recall is string — numeric reduction is rejected
// @ts-expect-error — string[] is not assignable to number[]
const wrong = s.max(results.extract("mean_recall"));

// Fix: parse the column first
const parsed = results.mutate({ recall_num: (r) => parseFloat(r.mean_recall) });
console.log(s.max(parsed.extract("recall_num")));
