/**
 * RPython SO#26614465 — pd.notnull on list column returns array, breaks if-condition
 * Effect: Crash
 * Bug class: Nullable type
 *
 * Python bug: pd.notnull() on a cell containing a list returns an array of booleans
 * (one per element) instead of a single True. Using this in an if-condition crashes:
 * "The truth value of an array is ambiguous." The user expected a scalar null check
 * but got an array because the cell value is itself array-like.
 *
 * In tidy-ts, a column typed as number[] | null makes the nullability explicit.
 * Accessing properties on the nullable value without a null check is caught at
 * compile time — the user must explicitly narrow with !== null.
 */
import { createDataFrame } from "@tidy-ts/dataframe";

const df = createDataFrame([
  { a: "one", c: [1, 2, 3] as number[] | null },
  { a: "two", c: null as number[] | null },
  { a: "three", c: [4, 5] as number[] | null },
]);

// The SO user's intent: apply function only if cell is not null.
// pd.notnull(x[1]) on a list returns an array, which can't be used as a bool.
// tidy-ts: c is number[] | null. Accessing .length without null check fails.
// @ts-expect-error — 'c' is possibly 'null'
df.mutate({ len: (r) => r.c.length });
