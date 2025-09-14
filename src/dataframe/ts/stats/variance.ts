import { hasMixedTypes } from "./helpers.ts";
import type {
  CleanNumberArray,
  CleanNumberIterable,
  NumbersWithNullable,
  NumbersWithNullableIterable,
} from "./helpers.ts";
import { extractNumbersWithOptions, isAllFiniteNumbers } from "./helpers.ts";

/**
 * Calculate the sample variance of an array of values (uses N-1 denominator)
 *
 * @param values - Array of numbers or single number
 * @param remove_na - If true, processes valid numbers from mixed arrays; if false, returns null for mixed arrays
 * @returns Sample variance value or null if insufficient data
 *
 * @example
 * ```ts
 * variance(42) // Always returns 0 for single value
 * variance([1, 2, 3, 4, 5]) // sample variance (default)
 * variance([1, "2", 3], true) // 1 (variance of [1, 3] with remove_na=true)
 * variance([1, "2", 3], false) // null (mixed types, remove_na=false)
 * ```
 */
// Types that should be rejected at compile-time (examples):
// type ArrayWithStrings = (number | string)[];
// type ArrayWithBooleans = (number | boolean)[];
// type ArrayWithMixedTypes = (number | string | boolean | null)[];
// These types are intentionally NOT supported in overloads - use runtime filtering instead

export function variance(value: number): number;
export function variance(values: CleanNumberArray): number;
export function variance(values: NumbersWithNullable, remove_na: true): number;
export function variance(values: CleanNumberIterable): number;
export function variance(
  values: NumbersWithNullableIterable,
  remove_na: true,
): number;
export function variance(
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
    return 0; // Variance of a single value is 0
  }

  // Check for mixed types first - return null unless remove_na is true
  if (hasMixedTypes(values) && !remove_na) {
    return null;
  }

  // Fast path for clean numeric arrays
  if (Array.isArray(values) && isAllFiniteNumbers(values)) {
    if (values.length === 0) return null;
    if (values.length === 1) return null; // Sample variance undefined for n=1

    const mean_val = values.reduce((sum, val) => sum + val, 0) / values.length;
    const sumSquaredDiffs = values.reduce((sum, val) => {
      const diff = val - mean_val;
      return sum + (diff * diff);
    }, 0);

    // Always use sample variance (N-1)
    return sumSquaredDiffs / (values.length - 1);
  }

  // Extract numeric values (includes Infinity, excludes NaN and non-numbers)
  const validValues = extractNumbersWithOptions(values, true, false);

  if (validValues.length === 0) {
    if (remove_na) {
      throw new Error("No valid values found to calculate variance");
    }
    return null;
  }
  if (validValues.length === 1) return null; // Sample variance undefined for n=1

  const mean_val = validValues.reduce((sum, val) => sum + val, 0) /
    validValues.length;
  const sumSquaredDiffs = validValues.reduce((sum, val) => {
    const diff = val - mean_val;
    return sum + (diff * diff);
  }, 0);

  // Always use sample variance (N-1)
  return sumSquaredDiffs / (validValues.length - 1);
}
