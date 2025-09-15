/**
 * Lead values by k positions (shift backward, filling with default).
 *
 * @param values - Array of values to lead
 * @param k - Number of positions to lead (default: 1)
 * @param defaultValue - Value to fill missing positions (default: undefined)
 * @returns Array with values led by k positions
 *
 * @example
 * ```ts
 * // Basic lead by 1
 * lead([1, 2, 3, 4, 5])  // [2, 3, 4, 5, undefined]
 *
 * // Lead by 2 positions
 * lead([1, 2, 3, 4, 5], 2)  // [3, 4, 5, undefined, undefined]
 *
 * // Lead with custom default
 * lead([1, 2, 3, 4, 5], 1, 0)  // [2, 3, 4, 5, 0]
 *
 * // Use in mutate to compare with future values
 * df.mutate({
 *   next_sales: row => lead(df.sales, 1, 0),
 *   decline: row => df.sales[row.index] - lead(df.sales, 1, 0)[row.index]
 * });
 * ```
 *
 * @remarks
 * - Shifts values backward by k positions
 * - Last k values are filled with defaultValue
 * - Useful for time series analysis and comparing with future values
 * - Often used in grouped operations to lead within groups
 * - Opposite of lag function
 */
export function lead<T>(
  values: readonly T[],
  k: number = 1,
  defaultValue?: T,
): (T | undefined)[] {
  if (k < 0) {
    throw new Error("Lead k must be non-negative");
  }

  if (k === 0) {
    return [...values];
  }

  const result = new Array<T | undefined>(values.length);

  // Copy values shifted by k positions
  for (let i = 0; i < values.length - k; i++) {
    result[i] = values[i + k];
  }

  // Fill last k positions with default value
  for (let i = Math.max(0, values.length - k); i < values.length; i++) {
    result[i] = defaultValue;
  }

  return result;
}
