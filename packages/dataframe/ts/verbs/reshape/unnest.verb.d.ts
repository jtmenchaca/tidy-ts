/**
 * Unnest an array column, creating one row per array element.
 *
 * Takes an array column and creates multiple rows, one for each element in the array.
 * Other columns are duplicated for each array element. Empty arrays result in no rows
 * for that original row.
 *
 * @param column - The array column to unnest
 * @returns A function that takes a DataFrame and returns it with the array column unnested
 *
 * @example
 * ```ts
 * const df = createDataFrame([
 *   { id: 1, name: "Alice", tags: ["admin", "user"] },
 *   { id: 2, name: "Bob", tags: ["user"] },
 *   { id: 3, name: "Charlie", tags: [] }
 * ]);
 *
 * // Unnest the tags column
 * const unnested = pipe(df, unnest("tags"));
 * // Result: [
 * //   { id: 1, name: "Alice", tags: "admin" },
 * //   { id: 1, name: "Alice", tags: "user" },
 * //   { id: 2, name: "Bob", tags: "user" }
 * // ]
 * ```
 */
export declare function unnest(column: string): (df: any) => any;
