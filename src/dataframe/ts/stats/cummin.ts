import { isNA } from "../utilities/mod.ts";
import { hasMixedTypes } from "./helpers.ts";
import type {
  CleanNumberArray,
  CleanNumberIterable,
  NumbersWithNullable,
  NumbersWithNullableIterable,
} from "./helpers.ts";

/**
 * Calculate cumulative minimum of numeric values
 *
 * @param values - Array of numbers
 * @param remove_na - If true, removes non-numeric values; if false, returns null for mixed types
 * @returns Array of cumulative minimums
 *
 * @example
 * ```ts
 * cummin([1, 2, 3, 4, 5]) // [1, 1, 1, 1, 1]
 * cummin([1, null, 3, 4], true) // [1, 1, 1, 1] - removes nulls
 * ```
 */

// Types that should be rejected at compile-time (examples):
// type ArrayWithStrings = (number | string)[];
// type ArrayWithBooleans = (number | boolean)[];
// type ArrayWithMixedTypes = (number | string | boolean | null)[];
// These types are intentionally NOT supported in overloads - use runtime filtering instead

export function cummin(value: number): number;
export function cummin(values: CleanNumberArray): number[];
export function cummin(
  values: NumbersWithNullable,
  remove_na: true,
): number[];
export function cummin(values: CleanNumberIterable): number[];
export function cummin(
  values: NumbersWithNullableIterable,
  remove_na: true,
): number[];
export function cummin(
  values:
    | number
    | CleanNumberArray
    | NumbersWithNullable
    | CleanNumberIterable
    | NumbersWithNullableIterable
    | unknown[] // Runtime filtering fallback
    | Iterable<unknown>, // Runtime filtering fallback
  remove_na: boolean = false,
): number | number[] | (number | null)[] {
  // Handle single number case
  if (typeof values === "number") {
    return values;
  }

  // Handle iterables by materializing to array
  const processArray = Array.isArray(values) ? values : Array.from(values);

  // Check for mixed types first - return null array unless remove_na is true
  if (hasMixedTypes(values) && !remove_na) {
    return new Array(processArray.length).fill(null);
  }

  if (remove_na) {
    // Calculate cumulative minimum while preserving array length, skipping NA values
    const result: number[] = [];
    let min = Infinity;

    for (const val of processArray) {
      if (isNA(val) || typeof val !== "number") {
        // Skip NA values and non-numbers, maintain array length by repeating previous min
        result.push(min === Infinity ? NaN : min);
      } else {
        min = Math.min(min, val);
        result.push(min);
      }
    }

    return result;
  } else {
    // Check if any true NA values present (null/undefined only, not NaN)
    const hasNA = processArray.some((val) => val === null || val === undefined);
    if (hasNA) {
      return new Array(processArray.length).fill(null);
    }

    // No true NA values, proceed with cummin (includes NaN and Infinity handling)
    const result: (number | null)[] = [];
    let min = Infinity;

    for (const val of processArray) {
      if (typeof val === "number") {
        min = Math.min(min, val); // This handles NaN and Infinity correctly
        result.push(min);
      } else {
        // Non-numeric values
        result.push(null);
      }
    }

    return result;
  }
}
