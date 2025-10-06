import { hasMixedTypes } from "../../helpers.ts";
import type {
  CleanNumberArray,
  CleanNumberIterable,
  NumbersWithNullable,
  NumbersWithNullableIterable,
} from "../../helpers.ts";
import { extractNumbersWithOptions } from "../../helpers.ts";

/**
 * Helper function to calculate mode information
 *
 * @param values - Array of numbers
 * @returns Mode information object or null
 */
function calculateModeInfo(
  values: unknown[] | Iterable<unknown>,
): { value: number; count: number } | null {
  // Extract numeric values (includes Infinity, excludes NaN and non-numbers)
  const validValues = extractNumbersWithOptions(values, true, false);
  if (validValues.length === 0) return null;

  const frequency: { [key: number]: number } = {};
  for (const val of validValues) {
    frequency[val] = (frequency[val] || 0) + 1;
  }

  let modeValue: number | null = null;
  let maxCount = 0;

  for (const [value, count] of Object.entries(frequency)) {
    if (count > maxCount) {
      maxCount = count;
      modeValue = Number(value);
    }
  }

  return modeValue !== null ? { value: modeValue, count: maxCount } : null;
}

/**
 * Calculate the mode (most frequent value) of an array
 *
 * @param values - Array of numbers or single number
 * @param removeNA - If true, guarantees a number return (throws if no valid values)
 * @returns The mode value, or null if no valid values and removeNA=false
 *
 * @example
 * ```ts
 * mode(42) // Always returns the single value
 * mode([1, 1, 2, 3, 3, 3]) // 3 (always number for clean array)
 * mode([null, 2, 3], false) // 3 (or null if no valid values)
 * mode([null, 2, 3], true) // 3 (guaranteed number or throws)
 * ```
 */
// Types that should be rejected at compile-time (examples):
// type ArrayWithStrings = (number | string)[];
// type ArrayWithBooleans = (number | boolean)[];
// type ArrayWithMixedTypes = (number | string | boolean | null)[];
// These types are intentionally NOT supported in overloads - use runtime filtering instead

export function mode(value: number): number;
export function mode(values: CleanNumberArray): number;
export function mode(values: NumbersWithNullable, removeNA: true): number;
export function mode(values: CleanNumberIterable): number;
export function mode(
  values: NumbersWithNullableIterable,
  removeNA: true,
): number;
export function mode(
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
    return values;
  }

  // Check for mixed types first - return null unless removeNA is true
  if (hasMixedTypes(values) && !removeNA) {
    return null;
  }

  const result = calculateModeInfo(values);

  if (!result) {
    return null;
  }

  return result.value;
}

/**
 * Calculate the frequency count of the mode (most frequent value) of an array
 *
 * @param values - Array of numbers
 * @returns The count of the mode value, or 0 if no valid values
 *
 * @example
 * ```ts
 * modeCount([1, 1, 2, 3, 3, 3]) // 3
 * modeCount([]) // 0
 * ```
 */
export function modeCount(values: CleanNumberArray): number;
export function modeCount(values: NumbersWithNullable): number;
export function modeCount(values: CleanNumberIterable): number;
export function modeCount(values: NumbersWithNullableIterable): number;
export function modeCount(
  values:
    | CleanNumberArray
    | NumbersWithNullable
    | CleanNumberIterable
    | NumbersWithNullableIterable
    | unknown[] // Runtime filtering fallback
    | Iterable<unknown>, // Runtime filtering fallback
): number {
  const result = calculateModeInfo(values);
  return result?.count ?? 0;
}
