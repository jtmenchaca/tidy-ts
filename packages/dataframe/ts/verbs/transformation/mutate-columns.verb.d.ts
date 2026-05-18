/**
 * Mutate across multiple columns of the same type.
 *
 * Applies functions to individual column values (row-level operations) across multiple
 * columns of the same type. Creates new columns for each function applied to each
 * specified column.
 *
 * @param config - Specification object defining columns and functions to apply
 * @returns A function that takes a DataFrame and returns the modified DataFrame
 *
 * @example
 * ```ts
 * // Apply multiple functions to numeric columns
 * pipe(df, mutate_columns({
 *   colType: "number",
 *   columns: ["score1", "score2", "score3"],
 *   newColumns: [
 *     { prefix: "add_1_", fn: (col) => col + 1 },
 *     { prefix: "double_", fn: (col) => col * 2 }
 *   ]
 * }))
 *
 * // Apply string operations
 * pipe(df, mutate_columns({
 *   colType: "string",
 *   columns: ["name", "city"],
 *   newColumns: [
 *     { prefix: "upper_", fn: (col) => col.toUpperCase() },
 *     { suffix: "_length", fn: (col) => col.length }
 *   ]
 * }))
 *
 * // Works with grouped data (applies same row-level operations)
 * pipe(df, group_by("category"), mutate_columns({
 *   colType: "number",
 *   columns: ["value1", "value2"],
 *   newColumns: [{ prefix: "scaled_", fn: (col) => col * 10 }]
 * }))
 * ```
 *
 * @remarks
 * - Functions receive individual column values, not entire columns
 * - New column names are created as: `{prefix}{original_column_name}{suffix}`
 * - Works with both grouped and ungrouped dataframes
 * - For grouped data, applies same row-level operations within each group
 * - Preserves the original dataframe (does not mutate)
 * - Provides type safety based on colType parameter
 * - All specified columns must be of the same type
 */
export declare function mutate_columns(config: {
    colType: string;
    columns: readonly string[];
    newColumns: readonly {
        prefix?: string;
        suffix?: string;
        fn: (col: any) => any;
    }[];
}): (df: any) => any;
