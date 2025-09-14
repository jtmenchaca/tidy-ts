import { hasMixedTypes } from "./helpers.ts";
import type {
  CleanNumberArray,
  CleanNumberIterable,
  NumbersWithNullable,
  NumbersWithNullableIterable,
} from "./helpers.ts";
import {
  ERROR_MESSAGES,
  extractNumbersWithOptions,
  isAllFiniteNumbers,
} from "./helpers.ts";

/**
 * Find the minimum value in an array of numbers
 *
 * @param values - Array of numbers, or single number
 * @param remove_na - If true, guarantees a number return (throws if no valid values)
 * @returns The minimum value, or null if no valid values and remove_na=false
 *
 * @example
 * ```ts
 * min(42) // Always returns 42 for single value
 * min([1, 2, 3, 4, 5]) // 1
 * min([null, 2, 3], false) // 2 (or null if no valid values)
 * min([null, 2, 3], true) // 2 (guaranteed number or throws)
 * ```
 */
// Types that should be rejected at compile-time (examples):
// type ArrayWithStrings = (number | string)[];
// type ArrayWithBooleans = (number | boolean)[];
// type ArrayWithMixedTypes = (number | string | boolean | null)[];
// These types are intentionally NOT supported in overloads - use runtime filtering instead

export function min(value: number): number;
export function min(values: CleanNumberArray): number;
export function min(values: NumbersWithNullable, remove_na: true): number;
export function min(values: CleanNumberIterable): number;
export function min(
  values: NumbersWithNullableIterable,
  remove_na: true,
): number;
export function min(
  values:
    | number
    | CleanNumberArray
    | NumbersWithNullable
    | CleanNumberIterable
    | NumbersWithNullableIterable
    | unknown[] // Runtime filtering fallback
    | Iterable<unknown>, // Runtime filtering fallback
  remove_na: boolean = false,
): number | null {
  // Handle single number case
  if (typeof values === "number") {
    return values;
  }

  // Check for mixed types first - return null unless remove_na is true
  if (hasMixedTypes(values) && !remove_na) {
    return null;
  }

  // Fast path for clean numeric arrays
  if (Array.isArray(values) && isAllFiniteNumbers(values)) {
    return Math.min(...values);
  }

  // Extract numeric values (allows Infinity, excludes NaN and non-numbers)
  const validValues = extractNumbersWithOptions(values, true, false);

  if (validValues.length === 0) {
    if (remove_na) {
      throw new Error(ERROR_MESSAGES.NO_VALID_VALUES_MIN);
    }
    return null;
  }

  return Math.min(...validValues);
}
