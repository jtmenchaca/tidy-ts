/**
 * RPython SO#22481271 — corr() on object-dtype columns
 *
 * In pandas, CSV data can arrive as object dtype (looks numeric, isn't).
 * DataFrame.corr() silently returns an empty matrix — no error.
 *
 * In tidy-ts, CSV parsing produces typed columns. If a column parsed as
 * string (due to leading spaces, mixed formats), the type system reflects
 * that. Passing string columns to s.test.correlation.pearson is a
 * compile-time error — you must explicitly convert first.
 */
import { createDataFrame, stats as s } from "@tidy-ts/dataframe";

// If CSV parsing produced string columns (e.g., leading spaces prevented
// numeric parsing), the schema reflects reality:
const df = createDataFrame([
  { A: " 0.006", B: "-0.001", C: " 0.003" },
  { A: " 0.002", B: "-0.001", C: "-0.002" },
  { A: " 0.010", B: " 0.000", C: " 0.002" },
]);

// Schema is { A: string, B: string, C: string }
// extract("A") returns string[] — pearson requires number[]
// @ts-expect-error — string[] is not assignable to number[]
const result = s.test.correlation.pearson({ x: df.extract("A"), y: df.extract("B") });

// The fix is explicit: parse the columns to numbers first.
const numeric = df.mutate({
  A: (r) => parseFloat(r.A),
  B: (r) => parseFloat(r.B),
  C: (r) => parseFloat(r.C),
});

// Now extract returns number[] — this works
const correct = s.test.correlation.pearson({
  x: numeric.extract("A"),
  y: numeric.extract("B"),
});
console.log(correct.effectSize.value); // the Pearson r coefficient
