/**
 * Lag values by k positions (shift forward, filling with default).
 *
 * @param values - Array of values to lag
 * @param k - Number of positions to lag (default: 1)
 * @param defaultValue - Value to fill missing positions (default: undefined)
 * @returns Array with values lagged by k positions
 *
 * @example
 * ```ts
 * // Basic lag by 1
 * lag([1, 2, 3, 4, 5])  // [undefined, 1, 2, 3, 4]
 *
 * // Lag by 2 positions
 * lag([1, 2, 3, 4, 5], 2)  // [undefined, undefined, 1, 2, 3]
 *
 * // Lag with custom default
 * lag([1, 2, 3, 4, 5], 1, 0)  // [0, 1, 2, 3, 4]
 *
 * // Use in mutate to compare with previous values
 * df.mutate({
 *   prev_sales: row => lag(df.sales, 1, 0),
 *   growth: row => df.sales[row.index] - lag(df.sales, 1, 0)[row.index]
 * });
 * ```
 *
 * @remarks
 * - Shifts values forward by k positions
 * - First k values are filled with defaultValue
 * - Useful for time series analysis and comparing with previous values
 * - Often used in grouped operations to lag within groups
 */
export function lag<T>(
  values: readonly T[],
  k: number = 1,
  defaultValue?: T,
): (T | undefined)[] {
  if (k < 0) {
    throw new Error("Lag k must be non-negative");
  }

  if (k === 0) {
    return [...values];
  }

  const result = new Array<T | undefined>(values.length);

  // Fill first k positions with default value
  for (let i = 0; i < Math.min(k, values.length); i++) {
    result[i] = defaultValue;
  }

  // Copy values shifted by k positions
  for (let i = k; i < values.length; i++) {
    result[i] = values[i - k];
  }

  return result;
}
