/**
 * Pivot data from long to wide format.
 * Similar to R's tidyverse pivot_wider() function.
 *
 * @param config - Configuration for the pivot operation
 * @returns A function that takes a DataFrame and returns the pivoted DataFrame
 *
 * @example
 * ```ts
 * const df = createDataFrame([
 *   { group: "A", variable: "x", value: 1 },
 *   { group: "A", variable: "y", value: 2 },
 *   { group: "B", variable: "x", value: 3 },
 *   { group: "B", variable: "y", value: 4 }
 * ]);
 *
 * // Basic usage with expected columns
 * // IMPORTANT: expectedColumns should only contain values from the namesFrom column!
 * const result = pipe(
 *   df,
 *   pivot_wider({
 *     namesFrom: "variable",
 *     valuesFrom: "value",
 *     expectedColumns: ["x", "y"]  // Values from 'variable' column, NOT 'group'!
 *   })
 * );
 * // Result: { group: ["A", "B"], x: [1, 3], y: [2, 4] }
 *
 * // Using .unique() to get expected columns automatically
 * const result2 = pipe(
 *   df,
 *   pivot_wider({
 *     namesFrom: "variable",
 *     valuesFrom: "value",
 *     expectedColumns: df.variable.unique()  // Automatically gets ["x", "y"]
 *   })
 * );
 *
 * // With aggregation function (no type casting needed!)
 * const result3 = pipe(
 *   df,
 *   pivot_wider({
 *     namesFrom: "variable",
 *     valuesFrom: "value",
 *     expectedColumns: ["x", "y"],
 *     valuesFn: (values) => sum(values) // values automatically typed as number[]
 *   })
 * );
 *
 * // Without expectedColumns (returns Record<string, unknown>)
 * const result4 = pipe(
 *   df,
 *   pivot_wider({
 *     namesFrom: "variable",
 *     valuesFrom: "value"
 *   })
 * );
 * ```
 *
 * @remarks
 * - Converts long format data to wide format
 * - Groups by all columns except namesFrom and valuesFrom
 * - Handles duplicate combinations by using valuesFn if provided
 * - **IMPORTANT**: expectedColumns should ONLY contain the unique values from the namesFrom column
 *   that will become new column names. Do NOT include preserved columns (like 'id', 'group', etc.)
 * - Validates that expectedColumns exactly match unique values in namesFrom column
 * - Use `df.columnName.unique()` to automatically get correct expectedColumns
 * - Omit expectedColumns to skip validation (returns Record<string, unknown>)
 * - valuesFn parameter is automatically typed based on valuesFrom column type
 * - Preserves the original dataframe (does not mutate)
 * - Column matching uses String() coercion, so mixed types (e.g., 1 and "1") will collide
 */
export declare function pivot_wider(config: {
    namesFrom: string;
    valuesFrom: string;
    expectedColumns?: readonly string[];
    valuesFn?: (values: any[]) => unknown;
    namesPrefix?: string;
}): (df: any) => any;
/**
 * Pivot data from wide to long format.
 * Similar to R's tidyverse pivot_longer() function.
 *
 * @param config - Configuration for the pivot operation
 * @returns A function that takes a DataFrame and returns the pivoted DataFrame
 *
 * @example
 * ```ts
 * const df = createDataFrame([
 *   { id: 1, x: 10, y: 20 },
 *   { id: 2, x: 15, y: 25 }
 * ]);
 *
 * const result = pipe(
 *   df,
 *   pivot_longer({
 *     cols: ["x", "y"],
 *     namesTo: "variable",
 *     valuesTo: "value"
 *   })
 * );
 * // Result: { id: [1, 1, 2, 2], variable: ["x", "y", "x", "y"], value: [10, 20, 15, 25] }
 * ```
 *
 * @remarks
 * - Converts wide format data to long format
 * - Validates that specified columns exist in the data
 * - Preserves the original dataframe (does not mutate)
 * - Provides full type safety for result columns
 * - When the input DataFrame is grouped, the output DataFrame will also be grouped,
 *   and the pivoted columns will be added to the group keys.
 * - Column matching uses String() coercion, so mixed types (e.g., 1 and "1") will collide
 */
export declare function pivot_longer(config: {
    cols: readonly string[];
    namesTo: string;
    valuesTo: string;
    namesPrefix?: string;
    names_pattern?: RegExp;
}): (df: any) => any;
