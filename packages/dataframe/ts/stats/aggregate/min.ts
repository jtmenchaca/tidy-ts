import { comparableMinMax, isAllFiniteNumbers, isComparable } from "../helpers.ts";
import type { Temporal } from "temporal-polyfill";

// Math.min/max with spread operator has a limit of ~125k arguments on V8
// Use a conservative limit to avoid stack overflow
const SPREAD_OPERATOR_SAFE_LIMIT = 100000;

// Type definitions for Date arrays
export type CleanDateArray = readonly Date[];
export type DatesWithNullable =
  | (Date | null | undefined)[]
  | readonly (Date | null | undefined)[];

// Type definitions for number arrays
export type CleanNumberArray = readonly number[];
export type NumbersWithNullable =
  | (number | null | undefined)[]
  | readonly (number | null | undefined)[];

// Union of Temporal types that support static .compare()
type TemporalComparable =
  | Temporal.PlainDate
  | Temporal.PlainDateTime
  | Temporal.PlainTime
  | Temporal.Instant
  | Temporal.ZonedDateTime;

type TemporalWithNullable<T extends TemporalComparable> =
  | (T | null | undefined)[]
  | readonly (T | null | undefined)[];

/** Options for filtering values in min function */
export interface MinOptions {
  removeNull?: boolean;
  removeUndefined?: boolean;
  removeNaN?: boolean;
}

/**
 * Find the minimum value in an array of numbers, dates, or Temporal types
 *
 * @param values - Array of numbers/dates/Temporal values, or single value
 * @param options - Optional object with removal flags
 * @param options.removeNull - If true, filters out null values (default: false)
 * @param options.removeUndefined - If true, filters out undefined values (default: false)
 * @param options.removeNaN - If true, filters out NaN values (default: false)
 * @returns The minimum value, or null if no valid values
 *
 * @example
 * ```ts
 * min(42) // 42
 * min([1, 2, 3, 4, 5]) // 1
 * min([null, 2, 3], { removeNull: true }) // 2
 * min([1, NaN, 3], { removeNaN: true }) // 1
 * min([1, NaN, 3]) // NaN (NaN propagates by default)
 * min([new Date('2024-01-01'), new Date('2024-01-02')]) // new Date('2024-01-01')
 * min([Temporal.PlainDate.from('2024-01-01'), Temporal.PlainDate.from('2024-06-15')]) // PlainDate('2024-01-01')
 * ```
 */

// Single value overloads
export function min(values: number, options?: MinOptions): number;
export function min(values: Date, options?: MinOptions): Date;
export function min<T extends TemporalComparable>(values: T, options?: MinOptions): T;

// Clean array overloads (no nulls/undefined)
export function min(values: CleanDateArray, options?: MinOptions): Date;
export function min(values: Date[], options?: MinOptions): Date;
export function min(values: CleanNumberArray, options?: MinOptions): number;
export function min(values: number[], options?: MinOptions): number;
export function min(values: Iterable<number>, options?: MinOptions): number;
export function min<T extends TemporalComparable>(values: readonly T[], options?: MinOptions): T;
export function min<T extends TemporalComparable>(values: T[], options?: MinOptions): T;

// Arrays with nullables - when all removal flags are true, return non-nullable
export function min(
  values: DatesWithNullable,
  options: { removeNull: true; removeUndefined: true },
): Date;
export function min(
  values: NumbersWithNullable,
  options: { removeNull: true; removeUndefined: true },
): number;
export function min<T extends TemporalComparable>(
  values: TemporalWithNullable<T>,
  options: { removeNull: true; removeUndefined: true },
): T;

// Arrays with only null (no undefined) - removeNull sufficient
export function min(
  values: (number | null)[] | readonly (number | null)[],
  options: { removeNull: true; removeNaN?: boolean; removeUndefined?: boolean },
): number;
export function min(
  values: (Date | null)[] | readonly (Date | null)[],
  options: { removeNull: true; removeNaN?: boolean; removeUndefined?: boolean },
): Date;
export function min<T extends TemporalComparable>(
  values: (T | null)[] | readonly (T | null)[],
  options: { removeNull: true; removeNaN?: boolean; removeUndefined?: boolean },
): T;

// Arrays with only undefined (no null) - removeUndefined sufficient
export function min(
  values: (number | undefined)[] | readonly (number | undefined)[],
  options: { removeUndefined: true; removeNaN?: boolean; removeNull?: boolean },
): number;
export function min(
  values: (Date | undefined)[] | readonly (Date | undefined)[],
  options: { removeUndefined: true; removeNaN?: boolean; removeNull?: boolean },
): Date;
export function min<T extends TemporalComparable>(
  values: (T | undefined)[] | readonly (T | undefined)[],
  options: { removeUndefined: true; removeNaN?: boolean; removeNull?: boolean },
): T;

// Arrays with nullables - return nullable when not all flags are true
export function min(
  values: DatesWithNullable,
  options?: MinOptions,
): Date | null;
export function min(
  values: NumbersWithNullable,
  options?: MinOptions,
): number | null;
export function min<T extends TemporalComparable>(
  values: TemporalWithNullable<T>,
  options?: MinOptions,
): T | null;

// Implementation
export function min(
  values:
    | number
    | Date
    | TemporalComparable
    | CleanNumberArray
    | CleanDateArray
    | NumbersWithNullable
    | DatesWithNullable
    | Iterable<number>
    | Iterable<unknown>,
  options: MinOptions = {},
): number | Date | TemporalComparable | null {
  const {
    removeNull = false,
    removeUndefined = false,
    removeNaN = false,
  } = options;

  // Handle single number case
  if (typeof values === "number") {
    if (Number.isNaN(values)) {
      return removeNaN ? null : NaN;
    }
    return values;
  }

  // Handle single date case
  if (values instanceof Date) {
    return values;
  }

  // Handle single comparable (e.g. Temporal.PlainDate)
  if (isComparable(values)) {
    return values as TemporalComparable;
  }

  // Convert to array
  const processArray = Array.isArray(values)
    ? values
    : Array.from(values as Iterable<unknown>);

  if (processArray.length === 0) {
    return null;
  }

  // Check first non-null value to determine type
  const firstNonNull = processArray.find(
    (v) => v !== null && v !== undefined,
  );
  if (firstNonNull instanceof Date) {
    return minDates(processArray, removeNull, removeUndefined);
  }

  // Check if this is a comparable array (Temporal types, etc.)
  if (isComparable(firstNonNull)) {
    return comparableMinMax(
      processArray,
      "min",
      removeNull,
      removeUndefined,
    ) as TemporalComparable | null;
  }

  // Handle numeric arrays
  return minNumbers(processArray, removeNull, removeUndefined, removeNaN);
}

function minDates(
  values: unknown[],
  removeNull: boolean,
  removeUndefined: boolean,
): Date | null {
  let minDate: Date | null = null;

  for (const v of values) {
    if (v === null) {
      if (!removeNull) return null;
      continue;
    }
    if (v === undefined) {
      if (!removeUndefined) return null;
      continue;
    }
    if (v instanceof Date) {
      if (minDate === null || v < minDate) {
        minDate = v;
      }
    }
  }

  return minDate;
}

function minNumbers(
  values: unknown[],
  removeNull: boolean,
  removeUndefined: boolean,
  removeNaN: boolean,
): number | null {
  // Fast path for clean numeric arrays
  if (isAllFiniteNumbers(values)) {
    if (values.length > SPREAD_OPERATOR_SAFE_LIMIT) {
      let min = values[0];
      for (let i = 1; i < values.length; i++) {
        if (values[i] < min) min = values[i];
      }
      return min;
    }
    return Math.min(...values);
  }

  // Process with filtering
  let minVal: number | null = null;
  let foundNaN = false;

  for (const v of values) {
    if (v === null) {
      if (!removeNull) return null;
      continue;
    }
    if (v === undefined) {
      if (!removeUndefined) return null;
      continue;
    }
    if (typeof v === "number") {
      if (Number.isNaN(v)) {
        if (!removeNaN) {
          foundNaN = true;
        }
        continue;
      }
      if (minVal === null || v < minVal) {
        minVal = v;
      }
    }
  }

  // If we found NaN and didn't remove it, return NaN
  if (foundNaN) {
    return NaN;
  }

  return minVal;
}
