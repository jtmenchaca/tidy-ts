import type { ConcatDataFramesFunction } from "./bind-rows.types.ts";
/**
 * Standalone function to concatenate an array of DataFrames by rows (vertical binding).
 *
 * This function combines DataFrames by stacking their rows on top of each other,
 * similar to pandas concat or tidyverse's bind_rows. It handles different column sets
 * by filling missing columns with undefined.
 *
 * @param dataFrames - Array of DataFrames to combine
 * @returns Combined DataFrame with all rows
 *
 * @example
 * ```ts
 * // Combine array of DataFrames
 * const dataFrames = [df1, df2, df3];
 * const combined = concatDataFrames(dataFrames);
 *
 * // Direct usage
 * const combined = concatDataFrames([df1, df2, df3]);
 * ```
 *
 * @remarks
 * - Combines DataFrames vertically (row-wise)
 * - Handles different column sets by filling missing columns with undefined
 * - Preserves column order (insertion order for intuitive behavior)
 * - Maintains type safety with optional properties
 * - Requires at least one DataFrame in the array
 */
export declare const concatDataFrames: ConcatDataFramesFunction;
/**
 * Bind multiple DataFrames together by rows (vertical binding).
 *
 * This function combines DataFrames by stacking their rows on top of each other,
 * similar to tidyverse's bind_rows function. It handles different column sets
 * by filling missing columns with undefined.
 *
 * @param dataFrames - One or more DataFrames to combine
 * @returns A function that takes a DataFrame and returns the combined DataFrame
 *
 * @example
 * ```ts
 * // Basic row binding
 * const combined = df1.bindRows(df2);
 *
 * // Multiple DataFrames
 * const combined = df1.bindRows(df2, df3);
 *
 * // Chaining with other operations
 * const result = df1
 *   .bindRows(df2)
 *   .filter(row => row.active)
 *   .select("name", "active");
 * ```
 *
 * @remarks
 * - Combines DataFrames vertically (row-wise)
 * - Handles different column sets by filling missing columns with undefined
 * - Preserves column order (insertion order for intuitive behavior)
 * - Maintains type safety with optional properties
 * - Returns empty DataFrame if all inputs are empty
 * - Requires at least one DataFrame argument
 */
export declare function bind_rows(...dataFrames: any[]): (df: any) => any;
