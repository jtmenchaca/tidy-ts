/**
 * Replace null values with fixed values in specified columns.
 *
 * @param mapping - Object mapping column names to replacement values
 * @returns A function that takes a DataFrame and returns a DataFrame with nulls replaced
 */
export declare function replaceNull(mapping: Record<string, any>): (df: any) => any;
/**
 * Replace undefined values with fixed values in specified columns.
 *
 * @param mapping - Object mapping column names to replacement values
 * @returns A function that takes a DataFrame and returns a DataFrame with undefined replaced
 */
export declare function replaceUndefined(mapping: Record<string, any>): (df: any) => any;
/**
 * Replace null/undefined values with fixed values in specified columns.
 *
 * @param mapping - Object mapping column names to replacement values
 * @returns A function that takes a DataFrame and returns a DataFrame with replaced values
 *
 * @example
 * ```ts
 * const df = createDataFrame([
 *   { name: "Alice", age: 25, score: null },
 *   { name: null, age: 30, score: 85 },
 *   { name: "Carol", age: null, score: 92 }
 * ]);
 *
 * const cleaned = pipe(df, replaceNA({
 *   name: "Unknown",
 *   age: 0,
 *   score: -1
 * }));
 * ```
 *
 * @remarks
 * - Only replaces null and undefined values
 * - Does not affect other falsy values like 0, false, or ""
 * - Can specify different replacement values for different columns
 * - Creates a new DataFrame without modifying the original
 *
 * @deprecated Use {@link replaceNull} and {@link replaceUndefined} instead.
 */
export declare function replaceNA(mapping: Record<string, any>): (df: any) => any;
