import { quantile_wasm } from "../../../wasm/wasm-loader.ts";
import { extractValidNumbers, hasMixedTypes } from "../../helpers.ts";
import type {
  CleanNumberArray,
  CleanNumberIterable,
  NumbersWithNullable,
  NumbersWithNullableIterable,
} from "../../helpers.ts";

/**
 * Calculate the quartiles (Q25, median/Q50, Q75) of values
 *
 * @param values - Array of numbers or values that can contain null/undefined, or single number
 * @param removeNA - If true, removes non-numeric values; if false, returns null for mixed types
 * @returns Array of [Q25, Q50, Q75] or `null` if no valid values
 *
 * @example
 * ```ts
 * quartiles(42) // Always returns [42, 42, 42] for single value
 * const [q25, q50, q75] = quartiles([1, 2, 3, 4, 5]); // [2, 3, 4]
 * ```
 */
// Types that should be rejected at compile-time (examples):
// type ArrayWithStrings = (number | string)[];
// type ArrayWithBooleans = (number | boolean)[];
// type ArrayWithMixedTypes = (number | string | boolean | null)[];
// These types are intentionally NOT supported in overloads - use runtime filtering instead

export function quartiles(value: number): [number, number, number];
export function quartiles(values: CleanNumberArray): [number, number, number];
export function quartiles(
  values: NumbersWithNullable,
  removeNA: true,
): [number, number, number];
export function quartiles(
  values: CleanNumberIterable,
): [number, number, number];
export function quartiles(
  values: NumbersWithNullableIterable,
  removeNA: true,
): [number, number, number];
export function quartiles(
  data:
    | number
    | CleanNumberArray
    | NumbersWithNullable
    | CleanNumberIterable
    | NumbersWithNullableIterable
    | unknown[] // Runtime filtering fallback
    | Iterable<unknown>, // Runtime filtering fallback
  removeNA: boolean = false,
): [number, number, number] | null {
  // Handle single number case
  if (typeof data === "number") {
    return [data, data, data]; // Single value has same Q25, Q50, Q75
  }

  // Check for mixed types first - return null unless removeNA is true
  if (hasMixedTypes(data) && !removeNA) {
    return null;
  }

  // Extract only valid numeric values (excludes strings, booleans, etc.)
  const validValues = extractValidNumbers(data);

  if (validValues.length === 0) {
    if (removeNA) {
      throw new Error("No valid values found to calculate quartiles");
    }
    return null;
  }

  const result = Array.from(
    quantile_wasm(
      new Float64Array(validValues),
      new Float64Array([0.25, 0.5, 0.75]),
    ),
  );

  return [result[0], result[1], result[2]];
}
