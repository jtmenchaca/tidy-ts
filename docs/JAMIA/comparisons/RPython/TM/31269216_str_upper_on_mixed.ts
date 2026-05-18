/**
 * RPython SO#31269216 — Applying uppercase to a column in pandas dataframe
 * Effect: Crash
 * Bug class: Type coercion
 *
 * In pandas, `map(str.upper, df['ID'])` fails on mixed-type columns containing
 * non-string values. The column has ['abc', 'def', 123, NaN, 'ghi'] — strings,
 * an integer, and NaN all in one column. str.upper crashes on the integer 123.
 *
 * In tidy-ts, a column with mixed types is typed as string | number | null.
 * Calling .toUpperCase() is a compile-time error because the value might be
 * number or null, not just string.
 */
import { createDataFrame } from "@tidy-ts/dataframe";

// Same data as the .py: mixed string, number, and null in one column
const df = createDataFrame([
  { id: "abc" as string | number | null },
  { id: "def" as string | number | null },
  { id: 123 as string | number | null },
  { id: null as string | number | null },
  { id: "ghi" as string | number | null },
]);

// The .py operation: map(str.upper, df['ID']) — crashes on integer 123
// @ts-expect-error — r.id is string | number | null, .toUpperCase() not available
const wrong = df.mutate({ id: (r) => r.id.toUpperCase() });
