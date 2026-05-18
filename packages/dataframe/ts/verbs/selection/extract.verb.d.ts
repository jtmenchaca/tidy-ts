export declare function extract(column: string): (df: any) => any[];
/**
 * Extract the first value from a column.
 *
 * @param column - The column name to extract
 * @param n - Must be 1 for single value extraction
 * @returns A function that takes a DataFrame and returns the first value from the specified column
 *
 * @example
 * ```ts
 * const topName = df
 *   .slice_max("score", 1)
 *   .extract_head("name", 1); // "Alice"
 * ```
 */
export declare function extract_head(column: string, n: number): (df: any) => any;
/**
 * Extract the last n values from a column.
 *
 * @param column - The column name to extract
 * @param n - Number of values to extract from the end
 * @returns A function that takes a DataFrame and returns the last n values from the specified column
 *
 * @example
 * ```ts
 * const recentNames = df
 *   .arrange("date")
 *   .extract_tail("name", 2); // ["David", "Eve"]
 * ```
 */
export declare function extract_tail(column: string, n: number): (df: any) => any;
/**
 * Extract a single value at the specified index from a column.
 *
 * @param column - The column name to extract
 * @param index - The index of the value to extract (0-based)
 * @returns A function that takes a DataFrame and returns the value at the specified index, or undefined if index is out of bounds
 *
 * @example
 * ```ts
 * const topScore = df
 *   .slice_max("score", 1)
 *   .extract_nth("name", 0); // "Alice"
 * ```
 */
export declare function extract_nth(column: string, index: number): (df: any) => any;
/**
 * Extract n random values from a column.
 *
 * @param column - The column name to extract
 * @param n - Number of random values to extract
 * @returns A function that takes a DataFrame and returns n random values from the specified column
 *
 * @example
 * ```ts
 * const randomNames = df.extract_sample("name", 3); // ["Bob", "Alice", "David"]
 * ```
 */
export declare function extract_sample(column: string, n: number): (df: any) => any[];
/**
 * Extract unique values from a column.
 * Functionally equivalent to [...new Set(df.extract("column"))].
 *
 * @param column - The column name to extract unique values from
 * @returns A function that takes a DataFrame and returns an array of unique values from the specified column
 *
 * @example
 * ```ts
 * const uniqueCategories = df.extractUnique("category"); // ["A", "B", "C"]
 * const uniqueAges = df.extractUnique("age"); // [25, 30, 35]
 * ```
 */
export declare function extract_unique(column: string): (df: any) => any[];
