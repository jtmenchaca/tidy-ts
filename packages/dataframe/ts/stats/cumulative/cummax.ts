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

/** Options for filtering values in cumulative max function */
export interface CummaxOptions {
  removeNull?: boolean;
  removeUndefined?: boolean;
  removeNaN?: boolean;
}

/**
 * Calculate cumulative maximum of numeric, Date, or Temporal values
 *
 * @param values - Array of numbers, dates, or Temporal values
 * @param options - Optional object with removal flags
 * @param options.removeNull - If true, filters out null values (default: false)
 * @param options.removeUndefined - If true, filters out undefined values (default: false)
 * @param options.removeNaN - If true, filters out NaN values (default: false)
 * @returns Array of cumulative maximums
 *
 * @example
 * ```ts
 * cummax([1, 3, 2, 5, 4]) // [1, 3, 3, 5, 5]
 * cummax([1, null, 3]) // [null, null, null] - null causes all results to be null
 * cummax([1, null, 3], { removeNull: true }) // [1, 1, 3]
 * cummax([1, NaN, 3]) // [1, NaN, NaN] - NaN propagates
 * cummax([1, NaN, 3], { removeNaN: true }) // [1, 1, 3]
 * cummax([new Date('2024-01-01'), new Date('2024-01-03'), new Date('2024-01-02')])
 *   // [Date('2024-01-01'), Date('2024-01-03'), Date('2024-01-03')]
 * ```
 */

// Single value overloads
export function cummax(values: number, options?: CummaxOptions): number;
export function cummax(values: Date, options?: CummaxOptions): Date;
export function cummax<T extends TemporalComparable>(
  values: T,
  options?: CummaxOptions,
): T;

// Clean array overloads (no nulls/undefined)
export function cummax(
  values: CleanDateArray,
  options?: CummaxOptions,
): Date[];
export function cummax(values: Date[], options?: CummaxOptions): Date[];
export function cummax(
  values: CleanNumberArray,
  options?: CummaxOptions,
): number[];
export function cummax(values: number[], options?: CummaxOptions): number[];
export function cummax<T extends TemporalComparable>(
  values: readonly T[],
  options?: CummaxOptions,
): T[];
export function cummax<T extends TemporalComparable>(
  values: T[],
  options?: CummaxOptions,
): T[];

// Arrays with nullables - when removal flags are true, return non-nullable
export function cummax(
  values: DatesWithNullable,
  options: { removeNull: true; removeUndefined: true },
): Date[];
export function cummax(
  values: NumbersWithNullable,
  options: { removeNull: true; removeUndefined: true },
): number[];
export function cummax<T extends TemporalComparable>(
  values: TemporalWithNullable<T>,
  options: { removeNull: true; removeUndefined: true },
): T[];

// Arrays with only null - removeNull sufficient
export function cummax(
  values: (number | null)[] | readonly (number | null)[],
  options: { removeNull: true; removeNaN?: boolean; removeUndefined?: boolean },
): number[];
export function cummax(
  values: (Date | null)[] | readonly (Date | null)[],
  options: { removeNull: true; removeNaN?: boolean; removeUndefined?: boolean },
): Date[];
export function cummax<T extends TemporalComparable>(
  values: (T | null)[] | readonly (T | null)[],
  options: { removeNull: true; removeNaN?: boolean; removeUndefined?: boolean },
): T[];

// Arrays with only undefined - removeUndefined sufficient
export function cummax(
  values: (number | undefined)[] | readonly (number | undefined)[],
  options: { removeUndefined: true; removeNaN?: boolean; removeNull?: boolean },
): number[];
export function cummax(
  values: (Date | undefined)[] | readonly (Date | undefined)[],
  options: { removeUndefined: true; removeNaN?: boolean; removeNull?: boolean },
): Date[];
export function cummax<T extends TemporalComparable>(
  values: (T | undefined)[] | readonly (T | undefined)[],
  options: { removeUndefined: true; removeNaN?: boolean; removeNull?: boolean },
): T[];

// Arrays with nullables - return nullable when not all flags are true
export function cummax(
  values: DatesWithNullable,
  options?: CummaxOptions,
): (Date | null)[];
export function cummax(
  values: NumbersWithNullable,
  options?: CummaxOptions,
): (number | null)[];
export function cummax<T extends TemporalComparable>(
  values: TemporalWithNullable<T>,
  options?: CummaxOptions,
): (T | null)[];

// Implementation
export function cummax(
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
  options: CummaxOptions = {},
): number | Date | TemporalComparable | unknown[] {
  const {
    removeNull = false,
    removeUndefined = false,
    removeNaN = false,
  } = options;

  // Handle single number case
  if (typeof values === "number") {
    if (Number.isNaN(values)) {
      return removeNaN ? -Infinity : NaN;
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
    return cummaxDates(processArray, removeNull, removeUndefined);
  }

  if (isComparable(firstNonNull)) {
    return cummaxComparables(processArray, removeNull, removeUndefined);
  }

  // Handle numeric arrays
  return cummaxNumbers(processArray, removeNull, removeUndefined, removeNaN);
}

function cummaxDates(
  values: unknown[],
  removeNull: boolean,
  removeUndefined: boolean,
): (Date | null)[] {
  const result: (Date | null)[] = [];
  let maxDate: Date | null = null;

  for (const v of values) {
    if (v === null) {
      if (!removeNull) {
        return new Array(values.length).fill(null);
      }
      result.push(maxDate);
      continue;
    }
    if (v === undefined) {
      if (!removeUndefined) {
        return new Array(values.length).fill(null);
      }
      result.push(maxDate);
      continue;
    }
    if (v instanceof Date) {
      if (maxDate === null || v > maxDate) {
        maxDate = v;
      }
      result.push(maxDate);
    }
  }

  return result;
}

function cummaxComparables(
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
      if (best === null || best.constructor.compare(v, best) === 1) {
        best = v;
      }
      result.push(best);
    }
  }

  return result;
}

function cummaxNumbers(
  values: unknown[],
  removeNull: boolean,
  removeUndefined: boolean,
  removeNaN: boolean,
): (number | null)[] {
  // Fast path for clean numeric arrays
  if (isAllFiniteNumbers(values)) {
    const result: number[] = [];
    let max = -Infinity;
    for (let i = 0; i < values.length; i++) {
      max = Math.max(max, values[i]);
      result.push(max);
    }
    return result;
  }

  // Process with filtering
  const result: (number | null)[] = [];
  let max = -Infinity;
  let sawNaN = false;
  let sawFirstValue = false;

  for (const v of values) {
    if (v === null) {
      if (!removeNull) {
        return new Array(values.length).fill(null);
      }
      result.push(sawFirstValue ? max : NaN);
      continue;
    }
    if (v === undefined) {
      if (!removeUndefined) {
        return new Array(values.length).fill(null);
      }
      result.push(sawFirstValue ? max : NaN);
      continue;
    }
    if (typeof v === "number") {
      if (Number.isNaN(v)) {
        if (!removeNaN) {
          sawNaN = true;
        }
        result.push(sawNaN ? NaN : (sawFirstValue ? max : NaN));
        continue;
      }
      if (sawNaN) {
        result.push(NaN);
      } else {
        max = Math.max(max, v);
        sawFirstValue = true;
        result.push(max);
      }
    } else {
      result.push(sawFirstValue ? max : NaN);
    }
  }

  return result;
}
