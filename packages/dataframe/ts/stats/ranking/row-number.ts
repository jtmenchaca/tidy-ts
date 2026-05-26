/**
 * Generate a sequence of 1-based row positions.
 *
 * Returns `[1, 2, 3, ..., n]` for an input array of length `n`, or for an
 * explicit count `n`. Most useful in `mutateOverGroup` for assigning a
 * "row number within group" column without hand-rolling `Array.from(...)`.
 *
 * @param valuesOrLength - Either an array/iterable (to use its length) or a
 *   non-negative integer length.
 * @returns Array of 1..n.
 *
 * @example
 * ```ts
 * rowNumber(5)              // [1, 2, 3, 4, 5]
 * rowNumber([10, 20, 30])   // [1, 2, 3]
 *
 * // Running count within each group:
 * df.groupBy("species")
 *   .mutateOverGroup({
 *     position: (g) => rowNumber(g.nrows()),
 *   });
 *
 * // Cumulative count of rows seen so far (per group):
 * df.groupBy("species")
 *   .mutateOverGroup({
 *     running_n: (g) => rowNumber(g.nrows()),
 *   });
 * ```
 *
 * @remarks
 * - Always returns plain numbers — no nulls, no surprises.
 * - For "rank rows by some column with strictly unique 1..n ranks (ties
 *   broken by encounter order)" use `rank(values, "first")` instead.
 */
export function rowNumber(length: number): number[];
export function rowNumber(values: ArrayLike<unknown>): number[];
export function rowNumber(values: Iterable<unknown>): number[];
export function rowNumber(
  valuesOrLength: number | ArrayLike<unknown> | Iterable<unknown>,
): number[] {
  let n: number;
  if (typeof valuesOrLength === "number") {
    if (!Number.isInteger(valuesOrLength) || valuesOrLength < 0) {
      throw new Error(
        `rowNumber: length must be a non-negative integer, got ${valuesOrLength}`,
      );
    }
    n = valuesOrLength;
  } else if (
    valuesOrLength != null &&
    typeof (valuesOrLength as ArrayLike<unknown>).length === "number"
  ) {
    n = (valuesOrLength as ArrayLike<unknown>).length;
  } else {
    let count = 0;
    for (const _ of valuesOrLength as Iterable<unknown>) count++;
    n = count;
  }

  const out = new Array<number>(n);
  for (let i = 0; i < n; i++) out[i] = i + 1;
  return out;
}
