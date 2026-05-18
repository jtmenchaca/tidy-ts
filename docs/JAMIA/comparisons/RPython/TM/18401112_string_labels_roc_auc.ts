/**
 * RPython SO#18401112 — ValueError: Data is not binary and pos_label is not specified
 * Effect: Crash
 * Bug class: Type coercion
 *
 * In Python, roc_auc_score crashes when labels are strings ('0','1') instead of
 * integers (0, 1). The type mismatch is only discovered at runtime.
 *
 * In tidy-ts, a column of string labels is typed as string[]. Any function
 * expecting number[] would produce a compile-time error.
 */
import { createDataFrame, stats as s } from "@tidy-ts/dataframe";

const df = createDataFrame([
  { score: 0.63, label: "0" },
  { score: 0.53, label: "1" },
  { score: 0.36, label: "0" },
  { score: 0.70, label: "1" },
  { score: 1.0, label: "1" },
]);

// @ts-expect-error — string[] is not assignable to number[]
const wrong = s.mean(df.extract("label"));

// Fix: explicit conversion
const numeric = df.mutate({ label: (r) => parseInt(r.label, 10) });
const labels = numeric.extract("label"); // number[]
console.log(labels);
