import { iqr_wasm } from "../wasm-loader.ts";
import { hasMixedTypes } from "./helpers.ts";
import type {
  CleanNumberArray,
  CleanNumberIterable,
  NumbersWithNullable,
  NumbersWithNullableIterable,
} from "./helpers.ts";
import { extractNumbersWithOptions } from "./helpers.ts";

/**
 * Calculate the interquartile range (IQR) of values
 *
 * @param values - Array of numbers or single number
 * @param remove_na - If true, removes non-numeric values; if false, returns null for mixed types
 * @returns IQR value (Q75 - Q25) or null if no valid values
 *
 * @example
 * ```ts
 * iqr(42) // Always returns 0 for single value
 * const iqr_val = iqr([1, 2, 3, 4, 5]); // 2 (4 - 2)
 * ```
 */
// Types that should be rejected at compile-time (examples):
// type ArrayWithStrings = (number | string)[];
// type ArrayWithBooleans = (number | boolean)[];
// type ArrayWithMixedTypes = (number | string | boolean | null)[];
// These types are intentionally NOT supported in overloads - use runtime filtering instead

export function iqr(value: number): number;
export function iqr(values: CleanNumberArray): number;
export function iqr(values: NumbersWithNullable, remove_na: true): number;
export function iqr(values: CleanNumberIterable): number;
export function iqr(
  values: NumbersWithNullableIterable,
  remove_na: true,
): number;
export function iqr(
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
    return 0; // IQR of a single value is 0
  }

  // Check for mixed types first - return null unless remove_na is true
  if (hasMixedTypes(data) && !remove_na) {
    return null;
  }

  // Extract numeric values (includes Infinity, excludes NaN and non-numbers)
  const validValues = extractNumbersWithOptions(data, true, false);

  if (validValues.length === 0) {
    if (remove_na) {
      throw new Error("No valid values found to calculate IQR");
    }
    return null;
  }

  return iqr_wasm(new Float64Array(validValues));
}
