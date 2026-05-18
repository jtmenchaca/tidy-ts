/**
 * RPython SO#22557322 — numpy savetxt formatted as integer is not saving zeroes
 * Effect: IF (silent incorrect functionality)
 * Bug class: Int/double distinction
 *
 * In numpy, `np.savetxt(buf, result, fmt='%i')` on a float64 array silently
 * drops zero values in output. The integer format specifier doesn't match the
 * float data type.
 *
 * In tidy-ts, there is no int/float distinction — all numbers are `number`.
 * The bug class is structurally absent: there is no format specifier that
 * silently corrupts numeric output based on an int vs float mismatch.
 * The closest proxy: if the data were accidentally string-typed (e.g., from
 * a format operation that returns strings), numeric operations would be rejected.
 */
import { createDataFrame, stats as s } from "@tidy-ts/dataframe";

// Same data as the .py: a 2D float array
const df = createDataFrame([
  { col1: 1.0, col2: 2.0 },
  { col1: 2.0, col2: 0.0 },
  { col1: 3.0, col2: 9.0 },
  { col1: 4.0, col2: 0.0 },
  { col1: 5.0, col2: 3.0 },
]);

// If the user formatted to integer strings (analogous to fmt='%i'),
// the column becomes string — downstream numeric ops are rejected.
const formatted = df.mutate({ col2_str: (r) => r.col2.toFixed(0) });

// @ts-expect-error — col2_str is string, not number
s.sum(formatted.extract("col2_str"));
