/**
 * Select rows by range (0-based indexing, like JavaScript's Array.slice).
 *
 * Returns rows from start index up to but not including end index.
 * For grouped data, applies the range within each group.
 *
 * @param start - Starting index (0-based, inclusive)
 * @param end - Ending index (0-based, exclusive). If omitted, slices to the end
 * @returns A function that takes a DataFrame and returns the sliced DataFrame
 *
 * @example
 * ```ts
 * // Select rows 0-2 (indices 0, 1, 2)
 * pipe(df, slice(0, 3))
 *
 * // Select from index 2 to the end
 * pipe(df, slice(2))
 *
 * // Select last 3 rows using negative index
 * pipe(df, slice(-3))
 *
 * // Works with grouped data - slices within each group
 * pipe(df, group_by("cyl"), slice(0, 2))
 * ```
 *
 * @remarks
 * - Uses 0-based indexing (like JavaScript arrays)
 * - Negative indices count from the end
 * - For grouped data, applies within each group
 * - Preserves group order for grouped data
 * - Returns empty array if range is invalid
 */
export declare function slice(start: number, end?: number): (df: any) => any;
/**
 * Select the first n rows.
 *
 * Returns the first n rows from the dataframe. For grouped data, returns
 * the first n rows from each group.
 *
 * @param n - Number of rows to select from the beginning
 * @returns A function that takes a DataFrame and returns the sliced DataFrame
 *
 * @example
 * ```ts
 * // Select first 3 rows
 * pipe(df, slice_head(3))
 *
 * // Select first 2 rows from each group
 * pipe(df, group_by("cyl"), slice_head(2))
 * ```
 *
 * @remarks
 * - Returns all rows if n is greater than dataframe length
 * - For grouped data, applies within each group
 * - Preserves group order for grouped data
 * - Returns empty array for empty dataframes
 */
export declare function slice_head(n: number): (df: any) => any;
/**
 * Select the last n rows.
 *
 * Returns the last n rows from the dataframe. For grouped data, returns
 * the last n rows from each group.
 *
 * @param n - Number of rows to select from the end
 * @returns A function that takes a DataFrame and returns the sliced DataFrame
 *
 * @example
 * ```ts
 * // Select last 2 rows
 * pipe(df, slice_tail(2))
 *
 * // Select last row from each group
 * pipe(df, group_by("cyl"), slice_tail(1))
 * ```
 *
 * @remarks
 * - Returns all rows if n is greater than dataframe length
 * - For grouped data, applies within each group
 * - Preserves group order for grouped data
 * - Returns empty array for empty dataframes
 */
export declare function slice_tail(n: number): (df: any) => any;
/**
 * Select n rows with lowest values of a column.
 *
 * Returns n rows with the lowest values in the specified column. For grouped data,
 * returns n rows with lowest values within each group.
 *
 * @param column - Column name to sort by for minimum selection
 * @param n - Number of rows to select
 * @returns A function that takes a DataFrame and returns the sliced DataFrame
 *
 * @example
 * ```ts
 * // Select 2 rows with lowest mpg
 * pipe(df, slice_min("mpg", 2))
 *
 * // Select row with lowest mpg from each group
 * pipe(df, group_by("cyl"), slice_min("mpg", 1))
 * ```
 *
 * @remarks
 * - Sorts by the specified column in ascending order
 * - Null/undefined values are sorted to the end
 * - For grouped data, applies within each group
 * - Preserves group order for grouped data
 * - Returns fewer rows if dataframe is smaller than n
 */
export declare function slice_min(column: any, n: number): (df: any) => any;
/**
 * Select n rows with highest values of a column.
 *
 * Returns n rows with the highest values in the specified column. For grouped data,
 * returns n rows with highest values within each group.
 *
 * @param column - Column name to sort by for maximum selection
 * @param n - Number of rows to select
 * @returns A function that takes a DataFrame and returns the sliced DataFrame
 *
 * @example
 * ```ts
 * // Select 3 rows with highest hp
 * pipe(df, slice_max("hp", 3))
 *
 * // Select row with highest hp from each group
 * pipe(df, group_by("cyl"), slice_max("hp", 1))
 * ```
 *
 * @remarks
 * - Sorts by the specified column in descending order
 * - Null/undefined values are sorted to the end
 * - For grouped data, applies within each group
 * - Preserves group order for grouped data
 * - Returns fewer rows if dataframe is smaller than n
 */
export declare function slice_max(column: any, n: number): (df: any) => any;
/**
 * Select n random rows.
 *
 * Returns n randomly selected rows from the dataframe. For grouped data,
 * returns n random rows from each group.
 *
 * @param n - Number of random rows to select
 * @returns A function that takes a DataFrame and returns the sliced DataFrame
 *
 * @example
 * ```ts
 * // Select 3 random rows
 * df.sample(3))
 *
 * // Select 2 random rows from each group
 * df.groupBy("cyl").sample(2)
 * ```
 *
 * @remarks
 * - Uses Fisher-Yates shuffle algorithm for random selection
 * - Returns all rows if n is greater than dataframe length
 * - For grouped data, applies within each group
 * - Preserves group order for grouped data
 * - Returns empty array for empty dataframes
 * - Each call produces different results (random)
 */
export declare function slice_sample(n: number, seed?: number): (df: any) => any;
