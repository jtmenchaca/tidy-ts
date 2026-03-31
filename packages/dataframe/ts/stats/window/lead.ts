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
 * lead([1, 2, 3, 4, 5])        // [2, 3, 4, 5, undefined]
 * lead([1, 2, 3, 4, 5], 2)     // [3, 4, 5, undefined, undefined]
 * lead([1, 2, 3, 4, 5], 1, 0)  // [2, 3, 4, 5, 0]
 * ```
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
