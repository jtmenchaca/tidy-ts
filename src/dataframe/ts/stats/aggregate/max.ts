import { hasMixedTypes } from "../helpers.ts";
import type {
  CleanNumberArray,
  CleanNumberIterable,
  NumbersWithNullable,
  NumbersWithNullableIterable,
} from "../helpers.ts";
import {
  ERROR_MESSAGES,
  extractNumbersWithOptions,
  isAllFiniteNumbers,
} from "../helpers.ts";

/**
 * Find the maximum value in an array of numbers
 *
 * @param values - Array of numbers, or single number
 * @param removeNA - If true, guarantees a number return (throws if no valid values)
 * @returns The maximum value, or null if no valid values and removeNA=false
 *
 * @example
 * ```ts
 * max(42) // Always returns 42 for single value
 * max([1, 2, 3, 4, 5]) // 5
 * max([null, 2, 3], false) // 3 (or null if no valid values)
 * max([null, 2, 3], true) // 3 (guaranteed number or throws)
 * ```
 */
// Types that should be rejected at compile-time (examples):
// type ArrayWithStrings = (number | string)[];
// type ArrayWithBooleans = (number | boolean)[];
// type ArrayWithMixedTypes = (number | string | boolean | null)[];
// These types are intentionally NOT supported in overloads - use runtime filtering instead

export function max(value: number): number;
export function max(values: CleanNumberArray): number;
export function max(values: NumbersWithNullable, removeNA: true): number;
export function max(values: CleanNumberIterable): number;
export function max(
  values: NumbersWithNullableIterable,
  removeNA: true,
): number;
export function max(
  values:
    | number
    | CleanNumberArray
    | NumbersWithNullable
    | CleanNumberIterable
    | NumbersWithNullableIterable
    | unknown[] // Runtime filtering fallback
    | Iterable<unknown>, // Runtime filtering fallback
  removeNA: boolean = false,
): number | null {
  // Handle single number case
  if (typeof values === "number") {
    return values;
  }

  // Check for mixed types first - return null unless removeNA is true
  if (hasMixedTypes(values) && !removeNA) {
    return null;
  }

  // Fast path for clean numeric arrays
  if (Array.isArray(values) && isAllFiniteNumbers(values)) {
    return Math.max(...values);
  }

  // Extract numeric values (allows Infinity, excludes NaN and non-numbers)
  const validValues = extractNumbersWithOptions(values, true, false);

  if (validValues.length === 0) {
    if (removeNA) {
      throw new Error(ERROR_MESSAGES.NO_VALID_VALUES_MAX);
    }
    return null;
  }

  return Math.max(...validValues);
}
