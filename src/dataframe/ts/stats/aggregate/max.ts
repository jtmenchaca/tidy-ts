import { hasMixedTypes } from "../helpers.ts";
import type {
  CleanNumberArray,
  CleanNumberIterable,
  NumbersWithNullable,
  NumbersWithNullableIterable,
} from "../helpers.ts";
import {
  extractNumbersWithOptions,
  isAllFiniteNumbers,
  isNA,
} from "../helpers.ts";

// Math.min/max with spread operator has a limit of ~125k arguments on V8
// Use a conservative limit to avoid stack overflow
const SPREAD_OPERATOR_SAFE_LIMIT = 100000;

// Type definitions for Date arrays
export type CleanDateArray = readonly Date[];
export type DatesWithNullable =
  | (Date | null | undefined)[]
  | readonly (Date | null | undefined)[];

/**
 * Find the maximum value in an array of numbers or dates
 *
 * @param values - Array of numbers/dates, or single number/date
 * @param removeNA - If true, guarantees a number/date return (throws if no valid values)
 * @returns The maximum value, or null if no valid values and removeNA=false
 *
 * @example
 * ```ts
 * max(42) // Always returns 42 for single value
 * max([1, 2, 3, 4, 5]) // 5
 * max([null, 2, 3], false) // 3 (or null if no valid values)
 * max([null, 2, 3], true) // 3 (guaranteed number or throws)
 * max([new Date('2024-01-01'), new Date('2024-01-02')]) // new Date('2024-01-02')
 * ```
 */
// Types that should be rejected at compile-time (examples):
// type ArrayWithStrings = (number | string)[];
// type ArrayWithBooleans = (number | boolean)[];
// type ArrayWithMixedTypes = (number | string | boolean | null)[];
// These types are intentionally NOT supported in overloads - use runtime filtering instead

// Single value overloads
export function max(value: number): number;
export function max(value: Date): Date;

// Clean array overloads (no nulls/undefined) - MUST come before nullable overloads
export function max(values: readonly Date[]): Date;
export function max(values: readonly number[]): number;
export function max(values: number[]): number;
export function max(values: Date[]): Date;
export function max(values: Iterable<number>): number;

// Arrays with nullables that require removeNA=true
export function max(values: DatesWithNullable, removeNA: true): Date;
export function max(values: NumbersWithNullable, removeNA: true): number;
export function max(
  values: NumbersWithNullableIterable,
  removeNA: true,
): number;

// Arrays with nullables that return nullable (removeNA=false explicitly)
export function max(
  values: DatesWithNullable,
  removeNA: false,
): Date | null;
export function max(
  values: NumbersWithNullable,
  removeNA: false,
): number | null;
export function max(
  values: NumbersWithNullableIterable,
  removeNA: false,
): number | null;
export function max(
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
      return null;
    }

    return validDates.reduce((max, date) => date > max ? date : max);
  }

  // Check for mixed types first - return null unless removeNA is true
  if (hasMixedTypes(values) && !removeNA) {
    return null;
  }

  // Fast path for clean numeric arrays
  if (Array.isArray(values) && isAllFiniteNumbers(values)) {
    if (values.length > SPREAD_OPERATOR_SAFE_LIMIT) {
      let max = values[0];
      for (let i = 1; i < values.length; i++) {
        if (values[i] > max) max = values[i];
      }
      return max;
    }
    return Math.max(...values);
  }

  // Extract numeric values (allows Infinity, excludes NaN and non-numbers)
  const validValues = extractNumbersWithOptions(values, true, false);

  if (validValues.length === 0) {
    return null;
  }

  if (validValues.length > SPREAD_OPERATOR_SAFE_LIMIT) {
    let max = validValues[0];
    for (let i = 1; i < validValues.length; i++) {
      if (validValues[i] > max) max = validValues[i];
    }
    return max;
  }

  return Math.max(...validValues);
}
