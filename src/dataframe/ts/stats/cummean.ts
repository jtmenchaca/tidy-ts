// src/dataframe/ts/descriptive/cumulative-mean.ts

import { isNA } from "../utilities/mod.ts";
import { hasMixedTypes } from "./helpers.ts";
import type {
  CleanNumberArray,
  CleanNumberIterable,
  NumbersWithNullable,
  NumbersWithNullableIterable,
} from "./helpers.ts";

/**
 * Calculate cumulative mean of values.
 *
 * Returns an array where each element is the mean of all values up to that point.
 *
 * @param values - Array of numbers
 * @param remove_na - If true, removes non-numeric values; if false, returns null for mixed types
 * @returns Array of cumulative means
 *
 * @example
 * ```typescript
 * cummean([1, 2, 3, 4])  // [1, 1.5, 2, 2.5]
 * cummean([1, null, 3, 4, 5], true)  // [1, 1, 2, 2.5, 3]
 * ```
 */
// Types that should be rejected at compile-time (examples):
// type ArrayWithStrings = (number | string)[];
// type ArrayWithBooleans = (number | boolean)[];
// type ArrayWithMixedTypes = (number | string | boolean | null)[];
// These types are intentionally NOT supported in overloads - use runtime filtering instead

export function cummean(value: number): number;
export function cummean(values: CleanNumberArray): number[];
export function cummean(
  values: NumbersWithNullable,
  remove_na: true,
): number[];
export function cummean(values: CleanNumberIterable): number[];
export function cummean(
  values: NumbersWithNullableIterable,
  remove_na: true,
): number[];
export function cummean(
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

  if (processArray.length === 0) {
    return [];
  }

  // Check for mixed types first - return null array unless remove_na is true
  if (hasMixedTypes(values) && !remove_na) {
    return new Array(processArray.length).fill(null);
  }

  if (remove_na) {
    // Calculate cumulative mean while preserving array length, skipping NA values
    const result: number[] = [];
    let sum = 0;
    let count = 0;

    for (const val of processArray) {
      if (isNA(val) || typeof val !== "number") {
        // Skip NA values and non-numbers, maintain array length by repeating previous mean
        result.push(count > 0 ? sum / count : 0);
      } else {
        sum += val;
        count++;
        result.push(sum / count);
      }
    }

    return result;
  } else {
    // Check if any true NA values present (null/undefined only, not NaN)
    const hasNA = processArray.some((val) => val === null || val === undefined);
    if (hasNA) {
      return new Array(processArray.length).fill(null);
    }

    // No true NA values, proceed with cummean (includes NaN and Infinity handling)
    const result: (number | null)[] = [];
    let sum = 0;
    let count = 0;

    for (const val of processArray) {
      if (typeof val === "number") {
        sum += val; // This handles NaN and Infinity correctly
        count++;
        result.push(sum / count);
      } else {
        // Non-numeric values
        result.push(null);
      }
    }

    return result;
  }
}
