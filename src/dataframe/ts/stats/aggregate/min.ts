import { hasMixedTypes } from "../helpers.ts";
import type {
  CleanNumberArray,
  CleanNumberIterable,
  NumbersWithNullable,
  NumbersWithNullableIterable,
} from "../helpers.ts";
import {
  ERROR_MESSAGES,
  extractNumbersWithOptions,
  isAllFiniteNumbers,
  isNA,
} from "../helpers.ts";

// Type definitions for Date arrays
export type CleanDateArray = readonly Date[];
export type DatesWithNullable =
  | (Date | null | undefined)[]
  | readonly (Date | null | undefined)[];

/**
 * Find the minimum value in an array of numbers or dates
 *
 * @param values - Array of numbers/dates, or single number/date
 * @param removeNA - If true, guarantees a number/date return (throws if no valid values)
 * @returns The minimum value, or null if no valid values and removeNA=false
 *
 * @example
 * ```ts
 * min(42) // Always returns 42 for single value
 * min([1, 2, 3, 4, 5]) // 1
 * min([null, 2, 3], false) // 2 (or null if no valid values)
 * min([null, 2, 3], true) // 2 (guaranteed number or throws)
 * min([new Date('2024-01-01'), new Date('2024-01-02')]) // new Date('2024-01-01')
 * ```
 */
// Types that should be rejected at compile-time (examples):
// type ArrayWithStrings = (number | string)[];
// type ArrayWithBooleans = (number | boolean)[];
// type ArrayWithMixedTypes = (number | string | boolean | null)[];
// These types are intentionally NOT supported in overloads - use runtime filtering instead

// Single value overloads
export function min(value: number): number;
export function min(value: Date): Date;

// Clean array overloads (no nulls/undefined) - MUST come before nullable overloads
export function min(values: readonly Date[]): Date;
export function min(values: Date[]): Date;
export function min(values: readonly number[]): number;
export function min(values: number[]): number;
export function min(values: Iterable<number>): number;

// Arrays with nullables that require removeNA=true
export function min(values: DatesWithNullable, removeNA: true): Date;
export function min(values: NumbersWithNullable, removeNA: true): number;
export function min(
  values: NumbersWithNullableIterable,
  removeNA: true,
): number;

// Arrays with nullables that return nullable (removeNA=false explicitly)
export function min(
  values: DatesWithNullable,
  removeNA: false,
): Date | null;
export function min(
  values: NumbersWithNullable,
  removeNA: false,
): number | null;
export function min(
  values: NumbersWithNullableIterable,
  removeNA: false,
): number | null;
export function min(
  values:
    | number
    | Date
    | CleanNumberArray
    | CleanDateArray
    | NumbersWithNullable
    | DatesWithNullable
    | CleanNumberIterable
    | NumbersWithNullableIterable
    | readonly unknown[] // Runtime filtering fallback
    | unknown[] // Runtime filtering fallback
    | Iterable<unknown>, // Runtime filtering fallback
  removeNA: boolean = false,
): number | Date | null {
  // Handle single number case
  if (typeof values === "number") {
    return values;
  }

  // Handle single date case
  if (values instanceof Date) {
    return values;
  }

  // Check if all values are dates (after filtering nulls/undefined)
  const processArray = Array.isArray(values) ? values : Array.from(values);
  const nonNullValues = processArray.filter((v) => !isNA(v));

  if (
    nonNullValues.length > 0 && nonNullValues.every((v) => v instanceof Date)
  ) {
    // Handle date arrays
    const validDates = processArray.filter((v): v is Date => v instanceof Date);

    if (validDates.length === 0) {
      if (removeNA) {
        throw new Error(ERROR_MESSAGES.NO_VALID_VALUES_MIN);
      }
      return null;
    }

    return validDates.reduce((min, date) => date < min ? date : min);
  }

  // Check for mixed types first - return null unless removeNA is true
  if (hasMixedTypes(values) && !removeNA) {
    return null;
  }

  // Fast path for clean numeric arrays
  if (Array.isArray(values) && isAllFiniteNumbers(values)) {
    return Math.min(...values);
  }

  // Extract numeric values (allows Infinity, excludes NaN and non-numbers)
  const validValues = extractNumbersWithOptions(values, true, false);

  if (validValues.length === 0) {
    if (removeNA) {
      throw new Error(ERROR_MESSAGES.NO_VALID_VALUES_MIN);
    }
    return null;
  }

  return Math.min(...validValues);
}
