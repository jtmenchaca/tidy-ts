/**
 * Extract the nth value from one column after sorting by another column.
 *
 * This method sorts the data by the sortBy column in the specified direction,
 * then returns the value from the specified column at the requested rank position.
 *
 * @param column - The column to extract the value from
 * @param sortBy - The column to sort by
 * @param direction - Sort direction: "asc" for ascending, "desc" for descending
 * @param rank - Optional rank position (default: 1 for first place, 2 for second place, etc.)
 * @returns A function that takes a DataFrame and returns the value from the specified column
 *
 * @example
 * ```ts
 * const df = createDataFrame([
 *   { name: "Alice", score: 95, department: "Engineering" },
 *   { name: "Bob", score: 87, department: "Sales" },
 *   { name: "Carol", score: 92, department: "Engineering" }
 * ]);
 *
 * // Get the name of the person with the highest score
 * const topPerformer = df.extractNthWhereSorted("name", "score", "desc"); // "Alice"
 *
 * // Get the department of the person with the second-highest score
 * const secondBestDept = df.extractNthWhereSorted("department", "score", "desc", 2); // "Engineering"
 *
 * // Get the name of the person with the lowest score
 * const worstPerformer = df.extractNthWhereSorted("name", "score", "asc"); // "Bob"
 * ```
 *
 * @remarks
 * - Sorts by the specified column in the given direction
 * - Null/undefined values in sortBy column are sorted to the end
 * - For grouped data, applies within each group
 * - Returns undefined if no rows exist or rank is out of bounds
 */
export declare function extract_nth_where_sorted(column: string, sortBy: string, direction: "asc" | "desc", rank?: number): (df: any) => any;
