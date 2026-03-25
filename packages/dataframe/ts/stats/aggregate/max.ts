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

/** Options for filtering values in max function */
export interface MaxOptions {
  removeNull?: boolean;
  removeUndefined?: boolean;
  removeNaN?: boolean;
}

/**
 * Find the maximum value in an array of numbers, dates, or Temporal types
 *
 * @param values - Array of numbers/dates/Temporal values, or single value
 * @param options - Optional object with removal flags
 * @param options.removeNull - If true, filters out null values (default: false)
 * @param options.removeUndefined - If true, filters out undefined values (default: false)
 * @param options.removeNaN - If true, filters out NaN values (default: false)
 * @returns The maximum value, or null if no valid values
 *
 * @example
 * ```ts
 * max(42) // 42
 * max([1, 2, 3, 4, 5]) // 5
 * max([null, 2, 3], { removeNull: true }) // 3
 * max([1, NaN, 3], { removeNaN: true }) // 3
 * max([1, NaN, 3]) // NaN (NaN propagates by default)
 * max([new Date('2024-01-01'), new Date('2024-01-02')]) // new Date('2024-01-02')
 * max([Temporal.PlainDate.from('2024-01-01'), Temporal.PlainDate.from('2024-06-15')]) // PlainDate('2024-06-15')
 * ```
 */

// Single value overloads
export function max(values: number, options?: MaxOptions): number;
export function max(values: Date, options?: MaxOptions): Date;
export function max<T extends TemporalComparable>(values: T, options?: MaxOptions): T;

// Clean array overloads (no nulls/undefined)
export function max(values: CleanDateArray, options?: MaxOptions): Date;
export function max(values: Date[], options?: MaxOptions): Date;
export function max(values: CleanNumberArray, options?: MaxOptions): number;
export function max(values: number[], options?: MaxOptions): number;
export function max(values: Iterable<number>, options?: MaxOptions): number;
export function max<T extends TemporalComparable>(values: readonly T[], options?: MaxOptions): T;
export function max<T extends TemporalComparable>(values: T[], options?: MaxOptions): T;

// Arrays with nullables - when all removal flags are true, return non-nullable
export function max(
  values: DatesWithNullable,
  options: { removeNull: true; removeUndefined: true },
): Date;
export function max(
  values: NumbersWithNullable,
  options: { removeNull: true; removeUndefined: true },
): number;
export function max<T extends TemporalComparable>(
  values: TemporalWithNullable<T>,
  options: { removeNull: true; removeUndefined: true },
): T;

// Arrays with only null (no undefined) - removeNull sufficient
export function max(
  values: (number | null)[] | readonly (number | null)[],
  options: { removeNull: true; removeNaN?: boolean; removeUndefined?: boolean },
): number;
export function max(
  values: (Date | null)[] | readonly (Date | null)[],
  options: { removeNull: true; removeNaN?: boolean; removeUndefined?: boolean },
): Date;
export function max<T extends TemporalComparable>(
  values: (T | null)[] | readonly (T | null)[],
  options: { removeNull: true; removeNaN?: boolean; removeUndefined?: boolean },
): T;

// Arrays with only undefined (no null) - removeUndefined sufficient
export function max(
  values: (number | undefined)[] | readonly (number | undefined)[],
  options: { removeUndefined: true; removeNaN?: boolean; removeNull?: boolean },
): number;
export function max(
  values: (Date | undefined)[] | readonly (Date | undefined)[],
  options: { removeUndefined: true; removeNaN?: boolean; removeNull?: boolean },
): Date;
export function max<T extends TemporalComparable>(
  values: (T | undefined)[] | readonly (T | undefined)[],
  options: { removeUndefined: true; removeNaN?: boolean; removeNull?: boolean },
): T;

// Arrays with nullables - return nullable when not all flags are true
export function max(
  values: DatesWithNullable,
  options?: MaxOptions,
): Date | null;
export function max(
  values: NumbersWithNullable,
  options?: MaxOptions,
): number | null;
export function max<T extends TemporalComparable>(
  values: TemporalWithNullable<T>,
  options?: MaxOptions,
): T | null;

// Implementation
export function max(
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
  options: MaxOptions = {},
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
    return maxDates(processArray, removeNull, removeUndefined);
  }

  // Check if this is a comparable array (Temporal types, etc.)
  if (isComparable(firstNonNull)) {
    return comparableMinMax(
      processArray,
      "max",
      removeNull,
      removeUndefined,
    ) as TemporalComparable | null;
  }

  // Handle numeric arrays
  return maxNumbers(processArray, removeNull, removeUndefined, removeNaN);
}

function maxDates(
  values: unknown[],
  removeNull: boolean,
  removeUndefined: boolean,
): Date | null {
  let maxDate: Date | null = null;

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
      if (maxDate === null || v > maxDate) {
        maxDate = v;
      }
    }
  }

  return maxDate;
}

function maxNumbers(
  values: unknown[],
  removeNull: boolean,
  removeUndefined: boolean,
  removeNaN: boolean,
): number | null {
  // Fast path for clean numeric arrays
  if (isAllFiniteNumbers(values)) {
    if (values.length > SPREAD_OPERATOR_SAFE_LIMIT) {
      let max = values[0];
      for (let i = 1; i < values.length; i++) {
        if (values[i] > max) max = values[i];
      }
      return max;
    }
    return Math.max(...values);
  }

  // Process with filtering
  let maxVal: number | null = null;
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
      if (maxVal === null || v > maxVal) {
        maxVal = v;
      }
    }
  }

  // If we found NaN and didn't remove it, return NaN
  if (foundNaN) {
    return NaN;
  }

  return maxVal;
}
