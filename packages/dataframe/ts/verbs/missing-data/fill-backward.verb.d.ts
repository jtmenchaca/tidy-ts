/**
 * Backward fill null/undefined values in specified columns.
 * Replaces null/undefined values with the next non-null value after them.
 *
 * @param columnNames - Column name(s) to backward fill
 * @returns A function that takes a DataFrame and returns a DataFrame with backward-filled values
 *
 * @example
 * ```ts
 * const df = createDataFrame([
 *   { value: null },
 *   { value: null },
 *   { value: 10 },
 *   { value: null },
 *   { value: 20 },
 * ]);
 *
 * const filled = pipe(df, fillBackward("value"));
 * // Results in:
 * // [
 * //   { value: 10 },  // filled from next
 * //   { value: 10 },  // filled from next
 * //   { value: 10 },
 * //   { value: 20 },  // filled from next
 * //   { value: 20 },
 * // ]
 * ```
 *
 * @remarks
 * - Only fills null and undefined values
 * - Values at the end that are null/undefined remain null/undefined
 * - Creates a new DataFrame without modifying the original
 */
export declare function fillBackward(...columnNames: string[]): (df: any) => any;
