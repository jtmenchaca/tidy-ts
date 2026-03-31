/**
 * Lead values by k positions (shift backward, filling with default).
 *
 * @param values - Array of values to lead
 * @param options - Optional lead options
 * @param options.k - Number of positions to lead (default: 1)
 * @param options.defaultValue - Value to fill missing positions (default: undefined)
 * @returns Array with values led by k positions
 *
 * @example
 * ```ts
 * lead([1, 2, 3, 4, 5])                          // [2, 3, 4, 5, undefined]
 * lead([1, 2, 3, 4, 5], { k: 2 })                // [3, 4, 5, undefined, undefined]
 * lead([1, 2, 3, 4, 5], { defaultValue: 0 })     // [2, 3, 4, 5, 0]
 * ```
 */

export interface LeadOptions<T> {
  k?: number;
  defaultValue?: T;
}

export function lead<T>(
  values: readonly T[],
  options: LeadOptions<T> & { defaultValue: T },
): T[];
export function lead<T>(
  values: readonly T[],
  options?: LeadOptions<T>,
): (T | undefined)[];
export function lead<T>(
  values: readonly T[],
  options: LeadOptions<T> = {},
): (T | undefined)[] {
  const { k = 1, defaultValue } = options;

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
