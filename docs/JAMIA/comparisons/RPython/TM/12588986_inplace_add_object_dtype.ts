/**
 * RPython SO#12588986 — TypeError on inplace add after silent dtype promotion
 * Effect: Crash
 * Bug class: Type coercion
 *
 * numpy bug: `c = c / 2**63` silently promotes c from float64 to object dtype.
 * Then `b += c` crashes because you can't inplace-add object to float64.
 * The values are still floats — only the dtype container changed silently.
 *
 * In tidy-ts, division never changes the type: number / number = number.
 * There is no "object dtype" that silently wraps numeric values.
 * The bug is structurally absent — but if a column WERE corrupted to a union
 * type (e.g., via transpose mixing numeric and non-numeric columns), the
 * downstream arithmetic would be caught.
 */
import { createDataFrame, stats as s } from "@tidy-ts/dataframe";

// Same data as the .py: two numeric arrays
const df = createDataFrame([
  { b: 0.0, c: 0.0 },
]);

// The .py operation: c = c / 2**63
// In tidy-ts this stays number — no silent promotion
const divided = df.mutate({ c: (r) => r.c / 2 ** 63 });

// To demonstrate the type catch: if b and c were mixed via transpose
// (analogous to numpy's silent object promotion), arithmetic is rejected.
const mixed = createDataFrame([
  { b: 0.0, label: "x" },
]);
const transposed = mixed.transpose({ numberOfRows: 1 });

// @ts-expect-error — column is number | string after transpose, not number
s.sum(transposed.extract("row_0"));
