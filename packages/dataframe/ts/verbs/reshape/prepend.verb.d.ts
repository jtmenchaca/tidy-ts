import type { DataFrame } from "../../dataframe/index.ts";
/**
 * Add rows to the top of a DataFrame.
 *
 * @param rows - Rows to prepend to the DataFrame
 * @returns A function that takes a DataFrame and returns it with rows prepended
 *
 * @example
 * ```ts
 * const df = createDataFrame([
 *   { name: "Alice", age: 25 },
 *   { name: "Bob", age: 30 }
 * ]);
 *
 * // Prepend new rows
 * const extended = pipe(df, prepend(
 *   { name: "Carol", age: 28 },
 *   { name: "David", age: 32 }
 * ));
 * // Results in 4 rows total with new rows at the beginning
 * ```
 *
 * @remarks
 * - Adds rows to the beginning of the DataFrame
 * - Creates a new DataFrame without modifying the original
 * - New rows must have compatible structure with existing DataFrame
 * - Useful for adding headers, defaults, or priority rows
 */
export declare function prepend<T extends Record<string, unknown>>(row: T): (df: DataFrame<T>) => DataFrame<T>;
export declare function prepend<T extends Record<string, unknown>>(rows: T[]): (df: DataFrame<T>) => DataFrame<T>;
export declare function prepend<T extends Record<string, unknown>>(...rows: T[]): (df: DataFrame<T>) => DataFrame<T>;
