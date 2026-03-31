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
 * lag([1, 2, 3, 4, 5])        // [undefined, 1, 2, 3, 4]
 * lag([1, 2, 3, 4, 5], 2)     // [undefined, undefined, 1, 2, 3]
 * lag([1, 2, 3, 4, 5], 1, 0)  // [0, 1, 2, 3, 4]
 * ```
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
