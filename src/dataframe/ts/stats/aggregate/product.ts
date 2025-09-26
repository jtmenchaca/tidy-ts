import { hasMixedTypes } from "../helpers.ts";
import type {
  CleanNumberArray,
  CleanNumberIterable,
  NumbersWithNullable,
  NumbersWithNullableIterable,
} from "../helpers.ts";
import { extractNumbersWithOptions, isAllFiniteNumbers } from "../helpers.ts";

/**
 * Calculate the product (multiplication) of all values
 *
 * @param values - Array of numbers or single number
 * @param removeNA - If true, guarantees a number return (throws if no valid values)
 * @returns Product of all values, or null if no valid values
 *
 * @example
 * ```ts
 * product(5) // 5
 * product([1, 2, 3, 4]) // 24
 * product([2, null, 3], false) // null (due to null)
 * product([2, null, 3], true) // 6 (ignoring null)
 * ```
 */
// Types that should be rejected at compile-time (examples):
// type ArrayWithStrings = (number | string)[];
// type ArrayWithBooleans = (number | boolean)[];
// type ArrayWithMixedTypes = (number | string | boolean | null)[];
// These types are intentionally NOT supported in overloads - use runtime filtering instead

export function product(value: number): number;
export function product(values: CleanNumberArray): number;
export function product(values: NumbersWithNullable, removeNA: true): number;
export function product(values: CleanNumberIterable): number;
export function product(
  values: NumbersWithNullableIterable,
  removeNA: true,
): number;
export function product(
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
  if (typeof values === "number") {
    return values;
  }

  // Check for mixed types first - return null unless removeNA is true
  if (hasMixedTypes(values) && !removeNA) {
    return null;
  }

  // Fast path for clean arrays
  if (Array.isArray(values) && isAllFiniteNumbers(values)) {
    let p = 1;
    for (let i = 0; i < values.length; i++) p *= values[i];
    return p;
  }

  // Extract numeric values (includes Infinity, excludes NaN and non-numbers)
  const validValues = extractNumbersWithOptions(values, true, false);

  if (validValues.length === 0) {
    if (removeNA) {
      throw new Error("No valid values found to calculate product");
    }
    return null;
  }

  let p = 1;
  for (let i = 0; i < validValues.length; i++) {
    p *= validValues[i];
  }

  return p;
}
