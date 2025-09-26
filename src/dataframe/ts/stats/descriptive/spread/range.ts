import { hasMixedTypes } from "../../helpers.ts";
import type {
  CleanNumberArray,
  CleanNumberIterable,
  NumbersWithNullable,
  NumbersWithNullableIterable,
} from "../../helpers.ts";
import { extractNumbersWithOptions } from "../../helpers.ts";

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
export function range(values: NumbersWithNullable, removeNA: true): number;
export function range(values: CleanNumberIterable): number;
export function range(
  values: NumbersWithNullableIterable,
  removeNA: true,
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
  removeNA: boolean = false,
): number | null {
  // Handle single number case
  if (typeof data === "number") {
    return 0; // Range of a single value is 0
  }

  // Check for mixed types first - return null unless removeNA is true
  if (hasMixedTypes(data) && !removeNA) {
    return null;
  }

  // Extract numeric values (includes Infinity, excludes NaN and non-numbers)
  const validValues = extractNumbersWithOptions(data, true, false);

  if (validValues.length === 0) {
    if (removeNA) {
      throw new Error("No valid values found to calculate range");
    }
    return null;
  }

  const minVal = Math.min(...validValues);
  const maxVal = Math.max(...validValues);

  return maxVal - minVal;
}
