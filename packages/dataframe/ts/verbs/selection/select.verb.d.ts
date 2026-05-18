/**
 * Keep columns by name in a dataframe.
 *
 * Selects and returns only the specified columns from the dataframe. The order
 * of columns in the result matches the order specified in the arguments.
 *
 * @param columnNames - One or more column names to keep. At least one column must be specified.
 * @returns A function that takes a DataFrame and returns the selected DataFrame
 *
 * @example
 * ```ts
 * // Select a single column
 * df.select("name")
 *
 * // Select multiple columns
 * df.select("name", "species", "mass")
 *
 * // Select all columns explicitly
 * df.select("id", "name", "mass", "species", "homeworld")
 *
 * // Column order is preserved
 * df.select("species", "name", "id")
 *
 * // Chain with other operations
 * df.select("name", "age", "score")
 *   .filter_rows(row => row.age >= 18)
 *   .arrange({ by: "score", desc: true })
 * ```
 * @remarks
 * - Column order in the result matches the order specified in arguments
 * - Duplicate column names are handled gracefully (only one copy kept)
 * - All data types are preserved (strings, numbers, booleans, arrays, objects, null, undefined)
 * - Works with empty dataframes
 * - Preserves the original dataframe (does not mutate)
 * - At least one column name must be specified
 *
 * @throws {ReferenceError} When a specified column name is not found in the dataframe
 */
export declare function select(columnNameOrColumns: string | string[], ...columnNames: string[]): (df: any) => any;
