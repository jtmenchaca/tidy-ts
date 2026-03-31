import { isAllFiniteNumbers, isComparable } from "../helpers.ts";
import type { Comparable } from "../helpers.ts";

// Type definitions for number arrays
export type CleanNumberArray = readonly number[];
export type NumbersWithNullable =
  | (number | null | undefined)[]
  | readonly (number | null | undefined)[];

// Type definitions for Date arrays
export type CleanDateArray = readonly Date[];
export type DatesWithNullable =
  | (Date | null | undefined)[]
  | readonly (Date | null | undefined)[];

// Structural type that matches any Temporal type (native or polyfill)
export interface TemporalComparable {
  readonly [Symbol.toStringTag]: string;
  toString(): string;
  toJSON(): string;
}

type TemporalWithNullable<T extends TemporalComparable> =
  | (T | null | undefined)[]
  | readonly (T | null | undefined)[];

/** Options for filtering values in cumulative min function */
export interface CumminOptions {
  removeNull?: boolean;
  removeUndefined?: boolean;
  removeNaN?: boolean;
}

/**
 * Calculate cumulative minimum of numeric, Date, or Temporal values
 *
 * @param values - Array of numbers, dates, or Temporal values
 * @param options - Optional object with removal flags
 * @param options.removeNull - If true, filters out null values (default: false)
 * @param options.removeUndefined - If true, filters out undefined values (default: false)
 * @param options.removeNaN - If true, filters out NaN values (default: false)
 * @returns Array of cumulative minimums
 *
 * @example
 * ```ts
 * cummin([5, 3, 4, 1, 2]) // [5, 3, 3, 1, 1]
 * cummin([3, null, 1]) // [null, null, null] - null causes all results to be null
 * cummin([3, null, 1], { removeNull: true }) // [3, 3, 1]
 * cummin([3, NaN, 1]) // [3, NaN, NaN] - NaN propagates
 * cummin([3, NaN, 1], { removeNaN: true }) // [3, 3, 1]
 * cummin([new Date('2024-01-03'), new Date('2024-01-01'), new Date('2024-01-02')])
 *   // [Date('2024-01-03'), Date('2024-01-01'), Date('2024-01-01')]
 * ```
 */

// Single value overloads
export function cummin(values: number, options?: CumminOptions): number;
export function cummin(values: Date, options?: CumminOptions): Date;
export function cummin<T extends TemporalComparable>(
  values: T,
  options?: CumminOptions,
): T;

// Clean array overloads (no nulls/undefined)
export function cummin(
  values: CleanDateArray,
  options?: CumminOptions,
): Date[];
export function cummin(values: Date[], options?: CumminOptions): Date[];
export function cummin(
  values: CleanNumberArray,
  options?: CumminOptions,
): number[];
export function cummin(values: number[], options?: CumminOptions): number[];
export function cummin<T extends TemporalComparable>(
  values: readonly T[],
  options?: CumminOptions,
): T[];
export function cummin<T extends TemporalComparable>(
  values: T[],
  options?: CumminOptions,
): T[];

// Arrays with nullables - when removal flags are true, return non-nullable
export function cummin(
  values: DatesWithNullable,
  options: { removeNull: true; removeUndefined: true },
): Date[];
export function cummin(
  values: NumbersWithNullable,
  options: { removeNull: true; removeUndefined: true },
): number[];
export function cummin<T extends TemporalComparable>(
  values: TemporalWithNullable<T>,
  options: { removeNull: true; removeUndefined: true },
): T[];

// Arrays with only null - removeNull sufficient
export function cummin(
  values: (number | null)[] | readonly (number | null)[],
  options: { removeNull: true; removeNaN?: boolean; removeUndefined?: boolean },
): number[];
export function cummin(
  values: (Date | null)[] | readonly (Date | null)[],
  options: { removeNull: true; removeNaN?: boolean; removeUndefined?: boolean },
): Date[];
export function cummin<T extends TemporalComparable>(
  values: (T | null)[] | readonly (T | null)[],
  options: { removeNull: true; removeNaN?: boolean; removeUndefined?: boolean },
): T[];

// Arrays with only undefined - removeUndefined sufficient
export function cummin(
  values: (number | undefined)[] | readonly (number | undefined)[],
  options: { removeUndefined: true; removeNaN?: boolean; removeNull?: boolean },
): number[];
export function cummin(
  values: (Date | undefined)[] | readonly (Date | undefined)[],
  options: { removeUndefined: true; removeNaN?: boolean; removeNull?: boolean },
): Date[];
export function cummin<T extends TemporalComparable>(
  values: (T | undefined)[] | readonly (T | undefined)[],
  options: { removeUndefined: true; removeNaN?: boolean; removeNull?: boolean },
): T[];

// Arrays with nullables - return nullable when not all flags are true
export function cummin(
  values: DatesWithNullable,
  options?: CumminOptions,
): (Date | null)[];
export function cummin(
  values: NumbersWithNullable,
  options?: CumminOptions,
): (number | null)[];
export function cummin<T extends TemporalComparable>(
  values: TemporalWithNullable<T>,
  options?: CumminOptions,
): (T | null)[];

// Implementation
export function cummin(
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
  options: CumminOptions = {},
): number | Date | TemporalComparable | unknown[] {
  const {
    removeNull = false,
    removeUndefined = false,
    removeNaN = false,
  } = options;

  // Handle single number case
  if (typeof values === "number") {
    if (Number.isNaN(values)) {
      return removeNaN ? Infinity : NaN;
    }
    return values;
  }

  // Handle single Date case
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
    return [];
  }

  // Check first non-null value to determine type
  const firstNonNull = processArray.find(
    (v) => v !== null && v !== undefined,
  );

  if (firstNonNull instanceof Date) {
    return cumminDates(processArray, removeNull, removeUndefined);
  }

  if (isComparable(firstNonNull)) {
    return cumminComparables(processArray, removeNull, removeUndefined);
  }

  // Handle numeric arrays
  return cumminNumbers(processArray, removeNull, removeUndefined, removeNaN);
}

function cumminDates(
  values: unknown[],
  removeNull: boolean,
  removeUndefined: boolean,
): (Date | null)[] {
  const result: (Date | null)[] = [];
  let minDate: Date | null = null;

  for (const v of values) {
    if (v === null) {
      if (!removeNull) {
        return new Array(values.length).fill(null);
      }
      result.push(minDate);
      continue;
    }
    if (v === undefined) {
      if (!removeUndefined) {
        return new Array(values.length).fill(null);
      }
      result.push(minDate);
      continue;
    }
    if (v instanceof Date) {
      if (minDate === null || v < minDate) {
        minDate = v;
      }
      result.push(minDate);
    }
  }

  return result;
}

function cumminComparables(
  values: unknown[],
  removeNull: boolean,
  removeUndefined: boolean,
): (unknown | null)[] {
  const result: (unknown | null)[] = [];
  let best: Comparable | null = null;

  for (const v of values) {
    if (v === null) {
      if (!removeNull) {
        return new Array(values.length).fill(null);
      }
      result.push(best);
      continue;
    }
    if (v === undefined) {
      if (!removeUndefined) {
        return new Array(values.length).fill(null);
      }
      result.push(best);
      continue;
    }
    if (isComparable(v)) {
      if (best === null || best.constructor.compare(v, best) === -1) {
        best = v;
      }
      result.push(best);
    }
  }

  return result;
}

function cumminNumbers(
  values: unknown[],
  removeNull: boolean,
  removeUndefined: boolean,
  removeNaN: boolean,
): (number | null)[] {
  // Fast path for clean numeric arrays
  if (isAllFiniteNumbers(values)) {
    const result: number[] = [];
    let min = Infinity;
    for (let i = 0; i < values.length; i++) {
      min = Math.min(min, values[i]);
      result.push(min);
    }
    return result;
  }

  // Process with filtering
  const result: (number | null)[] = [];
  let min = Infinity;
  let sawNaN = false;
  let sawFirstValue = false;

  for (const v of values) {
    if (v === null) {
      if (!removeNull) {
        return new Array(values.length).fill(null);
      }
      result.push(sawFirstValue ? min : NaN);
      continue;
    }
    if (v === undefined) {
      if (!removeUndefined) {
        return new Array(values.length).fill(null);
      }
      result.push(sawFirstValue ? min : NaN);
      continue;
    }
    if (typeof v === "number") {
      if (Number.isNaN(v)) {
        if (!removeNaN) {
          sawNaN = true;
        }
        result.push(sawNaN ? NaN : (sawFirstValue ? min : NaN));
        continue;
      }
      if (sawNaN) {
        result.push(NaN);
      } else {
        min = Math.min(min, v);
        sawFirstValue = true;
        result.push(min);
      }
    } else {
      result.push(sawFirstValue ? min : NaN);
    }
  }

  return result;
}
