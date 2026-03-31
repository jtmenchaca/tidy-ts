/**
 * Lag values by k positions (shift forward, filling with default).
 *
 * @param values - Array of values to lag
 * @param options - Optional lag options
 * @param options.k - Number of positions to lag (default: 1)
 * @param options.defaultValue - Value to fill missing positions (default: undefined)
 * @returns Array with values lagged by k positions
 *
 * @example
 * ```ts
 * lag([1, 2, 3, 4, 5])                          // [undefined, 1, 2, 3, 4]
 * lag([1, 2, 3, 4, 5], { k: 2 })                // [undefined, undefined, 1, 2, 3]
 * lag([1, 2, 3, 4, 5], { defaultValue: 0 })     // [0, 1, 2, 3, 4]
 * ```
 */

export interface LagOptions<T> {
  k?: number;
  defaultValue?: T;
}

export function lag<T>(
  values: readonly T[],
  options: LagOptions<T> & { defaultValue: T },
): T[];
export function lag<T>(
  values: readonly T[],
  options?: LagOptions<T>,
): (T | undefined)[];
export function lag<T>(
  values: readonly T[],
  options: LagOptions<T> = {},
): (T | undefined)[] {
  const { k = 1, defaultValue } = options;

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
