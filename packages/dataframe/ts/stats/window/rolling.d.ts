import type { DataFrame } from "../../dataframe/index.ts";
/**
 * Apply a function over a rolling window of values.
 *
 * This function supports two usage patterns:
 * 1. Array-based: `rolling({ values, windowSize, fn })` - returns array with rolling function applied
 * 2. Column-based: `rolling({ column, windowSize, fn })` - returns function for use in mutate
 *
 * @param options - Configuration object
 * @param options.values - Array of values (for array-based usage)
 * @param options.column - Column name (for DataFrame operations)
 * @param options.windowSize - Window size (number of values to include in rolling window)
 * @param options.fn - Function to apply over the window (e.g., mean, sum, max, min)
 * @returns Array with rolling function applied OR function for mutate operations
 *
 * @example
 * ```ts
 * import { stats } from "@tidy-ts/dataframe";
 *
 * // Array-based usage
 * rolling({ values: [1, 2, 3, 4, 5], windowSize: 3, fn: stats.mean })  // [1, 1.5, 2, 3, 4]
 * rolling({ values: [1, 2, 3, 4, 5], windowSize: 2, fn: stats.sum })   // [1, 3, 5, 7, 9]
 *
 * // Column-based usage in mutate
 * df.mutate({
 *   rolling_mean: rolling({ column: "price", windowSize: 3, fn: stats.mean }),
 *   rolling_sum: rolling({ column: "volume", windowSize: 5, fn: stats.sum })
 * });
 *
 * // Use with grouped operations
 * df.groupBy("category").mutate({
 *   rolling_avg: rolling({ column: "price", windowSize: 3, fn: stats.mean })
 * });
 * ```
 *
 * @remarks
 * - Window size determines how many previous values (including current) to include
 * - For positions with fewer than windowSize values, uses available values
 * - Useful for time series analysis and smoothing data
 * - Often used in grouped operations to roll within groups
 * - Column-based usage provides type-safe column name access
 */
export declare function rolling<T, R>(options: {
    values: readonly T[];
    windowSize: number;
    fn: (window: any) => R;
}): R[];
export declare function rolling<Row extends Record<string, unknown>, ColName extends keyof Row, R>(options: {
    column: ColName;
    windowSize: number;
    fn: (window: any) => R;
}): (row: Row, index: number, df: DataFrame<Row>) => R;
