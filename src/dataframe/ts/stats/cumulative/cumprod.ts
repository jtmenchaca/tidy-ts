import { isNA } from "../../utilities/mod.ts";
import { hasMixedTypes } from "../helpers.ts";
import type {
  CleanNumberArray,
  CleanNumberIterable,
  NumbersWithNullable,
  NumbersWithNullableIterable,
} from "../helpers.ts";

/**
 * Calculate cumulative product of numeric values
 *
 * @param values - Array of numbers
 * @param removeNA - If true, removes non-numeric values; if false, returns null for mixed types
 * @returns Array of cumulative products
 *
 * @example
 * ```ts
 * cumprod([1, 2, 3, 4, 5]) // [1, 2, 6, 24, 120]
 * cumprod([1, null, 3, 4], true) // [1, 1, 3, 12] - removes nulls
 * ```
 */

// Types that should be rejected at compile-time (examples):
// type ArrayWithStrings = (number | string)[];
// type ArrayWithBooleans = (number | boolean)[];
// type ArrayWithMixedTypes = (number | string | boolean | null)[];
// These types are intentionally NOT supported in overloads - use runtime filtering instead

export function cumprod(value: number): number;
export function cumprod(values: CleanNumberArray): number[];
export function cumprod(
  values: NumbersWithNullable,
  removeNA: true,
): number[];
export function cumprod(values: CleanNumberIterable): number[];
export function cumprod(
  values: NumbersWithNullableIterable,
  removeNA: true,
): number[];
export function cumprod(
  values:
    | number
    | CleanNumberArray
    | NumbersWithNullable
    | CleanNumberIterable
    | NumbersWithNullableIterable
    | unknown[] // Runtime filtering fallback
    | Iterable<unknown>, // Runtime filtering fallback
  removeNA: boolean = false,
): number | number[] | (number | null)[] {
  // Handle single number case
  if (typeof values === "number") {
    return values;
  }

  // Handle iterables by materializing to array
  const processArray = Array.isArray(values) ? values : Array.from(values);

  // Check for mixed types first - return null array unless removeNA is true
  if (hasMixedTypes(values) && !removeNA) {
    return new Array(processArray.length).fill(null);
  }

  if (removeNA) {
    // Calculate cumulative product while preserving array length, skipping NA values
    const result: number[] = [];
    let product = 1;

    for (const val of processArray) {
      if (isNA(val) || typeof val !== "number") {
        // Skip NA values and non-numbers, maintain array length by repeating previous product
        result.push(product);
      } else {
        product *= val;
        result.push(product);
      }
    }

    return result;
  } else {
    // Check if any true NA values present (null/undefined only, not NaN)
    const hasNA = processArray.some((val) => val === null || val === undefined);
    if (hasNA) {
      return new Array(processArray.length).fill(null);
    }

    // No true NA values, proceed with cumprod (includes NaN and Infinity handling)
    const result: (number | null)[] = [];
    let product = 1;

    for (const val of processArray) {
      if (typeof val === "number") {
        product *= val; // This handles NaN and Infinity correctly
        result.push(product);
      } else {
        // Non-numeric values
        result.push(null);
      }
    }

    return result;
  }
}
