import type { DataFrame } from "../../dataframe/index.ts";

/**
 * Apply a function over a rolling window of values.
 *
 * This function supports two usage patterns:
 * 1. Array-based: `rolling(values, n, fn)` - returns array with rolling function applied
 * 2. Column-based: `rolling(columnName, n, fn)` - returns function for use in mutate
 *
 * @param valuesOrColumnName - Array of values OR column name for DataFrame operations
 * @param n - Window size (number of values to include in rolling window)
 * @param fn - Function to apply over the window (e.g., mean, sum, max, min)
 * @returns Array with rolling function applied OR function for mutate operations
 *
 * @example
 * ```ts
 * import { stats } from "@tidy-ts/dataframe";
 *
 * // Array-based usage
 * rolling([1, 2, 3, 4, 5], 3, stats.mean)  // [1, 1.5, 2, 3, 4]
 * rolling([1, 2, 3, 4, 5], 2, stats.sum)   // [1, 3, 5, 7, 9]
 *
 * // Column-based usage in mutate (R-like syntax)
 * df.mutate({
 *   rolling_mean: rolling("price", 3, stats.mean),
 *   rolling_sum: rolling("volume", 5, stats.sum)
 * });
 *
 * // Use with grouped operations
 * df.group_by("category").mutate({
 *   rolling_avg: rolling("price", 3, stats.mean)
 * });
 * ```
 *
 * @remarks
 * - Window size n determines how many previous values (including current) to include
 * - For positions with fewer than n values, uses available values
 * - Useful for time series analysis and smoothing data
 * - Often used in grouped operations to roll within groups
 * - Column-based usage provides type-safe column name access
 */

// Array-based overload
export function rolling<T, R>(
  values: readonly T[],
  n: number,
  // deno-lint-ignore no-explicit-any
  fn: (window: any) => R,
): R[];

// Column-based overload for DataFrame operations
export function rolling<
  Row extends Record<string, unknown>,
  ColName extends keyof Row,
  R,
>(
  columnName: ColName,
  n: number,
  // deno-lint-ignore no-explicit-any
  fn: (window: any) => R,
): (row: Row, index: number, df: DataFrame<Row>) => R;

// Implementation
export function rolling<
  T,
  Row extends Record<string, unknown>,
  ColName extends keyof Row,
  R,
>(
  valuesOrColumnName: readonly T[] | ColName,
  n: number,
  // deno-lint-ignore no-explicit-any
  fn: (window: any) => R,
):
  | R[]
  | ((row: Row, index: number, df: DataFrame<Row>) => R) {
  if (n < 1) {
    throw new Error("Rolling window size n must be at least 1");
  }

  // Check if first argument is a string (column name) or array
  if (typeof valuesOrColumnName === "string") {
    // Column-based usage - return function for mutate
    return (
      _row: Row,
      index: number,
      df: DataFrame<Row>,
    ) => {
      // deno-lint-ignore no-explicit-any
      const values = df.extract(valuesOrColumnName as any);
      const rollingValues = rollingArray(values, n, fn);
      return rollingValues[index] as R;
    };
  } else {
    // Array-based usage - return rolling array
    return rollingArray(
      valuesOrColumnName as readonly unknown[],
      n,
      fn,
    );
  }
}

// Helper function for array-based rolling logic
function rollingArray<R>(
  values: readonly unknown[],
  n: number,
  // deno-lint-ignore no-explicit-any
  fn: (window: any) => R,
): R[] {
  const result: R[] = [];

  for (let i = 0; i < values.length; i++) {
    // Get window: from max(0, i - n + 1) to i + 1 (inclusive)
    const start = Math.max(0, i - n + 1);
    const end = i + 1;
    const window = values.slice(start, end);
    // Pass window as array to fn (stats functions accept arrays)
    result.push(fn(window));
  }

  return result;
}
