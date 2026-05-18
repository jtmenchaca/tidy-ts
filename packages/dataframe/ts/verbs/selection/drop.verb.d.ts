/**
 * Remove columns by name from a dataframe.
 *
 * Returns a new dataframe with the specified columns removed.
 * Throws a ReferenceError if any specified column does not exist.
 *
 * @param columnOrColumns - Column name, array of column names, or undefined
 * @param additionalColumns - Additional column names (when using sequential arguments)
 * @returns A function that takes a DataFrame and returns the DataFrame with columns removed
 *
 * @example
 * ```ts
 * // Remove a single column
 * df.drop("mass")
 *
 * // Remove multiple columns
 * df.drop("mass", "homeworld")
 *
 * // Remove all columns (results in empty objects)
 * df.drop("id", "name", "mass", "species", "homeworld")
 * ```
 *
 * @remarks
 * - Throws ReferenceError for non-existent column names
 * - Returns a new dataframe (does not mutate the original)
 * - Preserves all rows and remaining columns
 * - Works with empty dataframes
 * - Returns empty objects if all columns are dropped
 */
export declare function drop(columnOrColumns?: string | string[], ...additionalColumns: string[]): (df: any) => any;
