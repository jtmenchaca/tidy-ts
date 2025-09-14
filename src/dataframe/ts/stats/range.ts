import { hasMixedTypes } from "./helpers.ts";
import type {
  CleanNumberArray,
  CleanNumberIterable,
  NumbersWithNullable,
  NumbersWithNullableIterable,
} from "./helpers.ts";
import { extractNumbersWithOptions } from "./helpers.ts";

/**
 * Calculate the range of values (max - min)
 *
 * @param values - Array of numbers, or single number
 * @returns Range value or null if no valid values
 *
 * @example
 * ```ts
 * range(42) // Always returns 0 for single value
 * const r = range([1, 5, 3, 9, 2]); // 8 (9 - 1)
 * ```
 */
// Types that should be rejected at compile-time (examples):
// type ArrayWithStrings = (number | string)[];
// type ArrayWithBooleans = (number | boolean)[];
// type ArrayWithMixedTypes = (number | string | boolean | null)[];
// These types are intentionally NOT supported in overloads - use runtime filtering instead

export function range(value: number): number;
export function range(values: CleanNumberArray): number;
export function range(values: NumbersWithNullable, remove_na: true): number;
export function range(values: CleanNumberIterable): number;
export function range(
  values: NumbersWithNullableIterable,
  remove_na: true,
): number;
export function range(
  data:
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
  if (typeof data === "number") {
    return 0; // Range of a single value is 0
  }

  // Check for mixed types first - return null unless remove_na is true
  if (hasMixedTypes(data) && !remove_na) {
    return null;
  }

  // Extract numeric values (includes Infinity, excludes NaN and non-numbers)
  const validValues = extractNumbersWithOptions(data, true, false);

  if (validValues.length === 0) {
    if (remove_na) {
      throw new Error("No valid values found to calculate range");
    }
    return null;
  }

  const min_val = Math.min(...validValues);
  const max_val = Math.max(...validValues);

  return max_val - min_val;
}
