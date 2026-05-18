import type { DataFrame } from "../../dataframe/index.ts";
/**
 * Add rows to the bottom of a DataFrame.
 *
 * @param rows - Rows to append to the DataFrame
 * @returns A function that takes a DataFrame and returns it with rows appended
 *
 * @example
 * ```ts
 * const df = createDataFrame([
 *   { name: "Alice", age: 25 },
 *   { name: "Bob", age: 30 }
 * ]);
 *
 * // Append new rows
 * const extended = pipe(df, append(
 *   { name: "Carol", age: 28 },
 *   { name: "David", age: 32 }
 * ));
 * // Results in 4 rows total with new rows at the end
 * ```
 *
 * @remarks
 * - Adds rows to the end of the DataFrame
 * - Creates a new DataFrame without modifying the original
 * - New rows must have compatible structure with existing DataFrame
 * - Equivalent to bind_rows but more intuitive for adding a few rows
 */
export declare function append<T extends Record<string, unknown>>(row: T): (df: DataFrame<T>) => DataFrame<T>;
export declare function append<T extends Record<string, unknown>>(rows: T[]): (df: DataFrame<T>) => DataFrame<T>;
export declare function append<T extends Record<string, unknown>>(...rows: T[]): (df: DataFrame<T>) => DataFrame<T>;
