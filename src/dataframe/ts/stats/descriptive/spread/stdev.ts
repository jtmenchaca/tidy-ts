// deno-lint-ignore-file no-explicit-any
import { variance } from "./variance.ts";
import { isNA } from "../../../utilities/mod.ts";
import { hasMixedTypes } from "../../helpers.ts";
import type {
  CleanNumberArray,
  CleanNumberIterable,
  NumbersWithNullable,
  NumbersWithNullableIterable,
} from "../../helpers.ts";

/**
 * Calculate the sample standard deviation of an array of values
 *
 * @param values - Array of numbers or single number
 * @param removeNA - If true, processes valid numbers from mixed arrays; if false, returns null for mixed arrays
 * @returns Sample standard deviation value or null if insufficient data
 *
 * @example
 * ```ts
 * sd(42) // Always returns 0 for single value
 * sd([1, 2, 3, 4, 5]) // sample standard deviation (default)
 * sd([1, "2", 3], true) // 1.41... (std dev of [1, 3] with removeNA=true)
 * sd([1, "2", 3], false) // null (mixed types, removeNA=false)
 * ```
 */
// Types that should be rejected at compile-time (examples):
// type ArrayWithStrings = (number | string)[];
// type ArrayWithBooleans = (number | boolean)[];
// type ArrayWithMixedTypes = (number | string | boolean | null)[];
// These types are intentionally NOT supported in overloads - use runtime filtering instead

export function sd(value: number): number;
export function sd(values: CleanNumberArray): number;
export function sd(values: NumbersWithNullable, removeNA: true): number;
export function sd(values: CleanNumberIterable): number;
export function sd(
  values: NumbersWithNullableIterable,
  removeNA: true,
): number;
export function sd(
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
    return 0; // Standard deviation of a single value is 0
  }

  // Check for mixed types first - return null unless removeNA is true
  if (hasMixedTypes(values) && !removeNA) {
    return null;
  }

  // Call variance with same parameters

  const var_val = removeNA
    ? variance(values as any, true)
    : variance(values as any);

  if (var_val === null) {
    if (removeNA) {
      // Handle iterables by materializing to array for checking
      const processArray = Array.isArray(values)
        ? values
        : Array.from(values as Iterable<number | null>);
      if (processArray.some((v) => !isNA(v))) {
        throw new Error("Insufficient data to calculate standard deviation");
      }
    }
    return null;
  }

  return Math.sqrt(var_val);
}
