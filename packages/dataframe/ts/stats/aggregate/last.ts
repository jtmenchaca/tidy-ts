import type {
  CleanNumberArray,
  CleanNumberIterable,
  NumbersWithNullable,
  NumbersWithNullableIterable,
} from "../helpers.ts";

// Type definitions for Date arrays
export type CleanDateArray = readonly Date[];
export type DatesWithNullable =
  | (Date | null | undefined)[]
  | readonly (Date | null | undefined)[];

/** Options for filtering values in last function */
export interface LastOptions {
  removeNull?: boolean;
  removeUndefined?: boolean;
}

/**
 * Get the last value in an array of numbers, dates, or other types
 *
 * @param values - Array of values, or single value
 * @param options - Optional object with removal flags
 * @param options.removeNull - If true, skips null values (default: false)
 * @param options.removeUndefined - If true, skips undefined values (default: false)
 * @returns The last value, or null if no valid values
 *
 * @example
 * ```ts
 * last(42) // Always returns 42 for single value
 * last([1, 2, 3, 4, 5]) // 5
 * last([1, 2, null]) // null (last value is null)
 * last([1, 2, null], { removeNull: true }) // 2 (skips null)
 * last([new Date('2024-01-01'), new Date('2024-01-02')]) // new Date('2024-01-02')
 * ```
 */

// Clean array overloads (no nulls/undefined). These MUST come before the
// single-value generic overload — otherwise TS picks `last<T>(value: T): T`
// for `last([1,2,3])` with `T = number[]` and the return type collapses to
// the entire array.
export function last(values: readonly Date[], options?: LastOptions): Date;
export function last(values: Date[], options?: LastOptions): Date;
export function last(values: readonly number[], options?: LastOptions): number;
export function last(values: number[], options?: LastOptions): number;
export function last(values: Iterable<number>, options?: LastOptions): number;
export function last<T>(values: readonly T[], options?: LastOptions): T;
export function last<T>(values: T[], options?: LastOptions): T;

// Single-value overload — only triggers when nothing above matched.
export function last<T>(value: T): T;

// Arrays with nullables - when all removal flags are true, return non-nullable
export function last<T>(
  values: (T | null | undefined)[],
  options: { removeNull: true; removeUndefined: true },
): T;
export function last(
  values: DatesWithNullable,
  options: { removeNull: true; removeUndefined: true },
): Date;
export function last(
  values: NumbersWithNullable,
  options: { removeNull: true; removeUndefined: true },
): number;
export function last(
  values: NumbersWithNullableIterable,
  options: { removeNull: true; removeUndefined: true },
): number;

// Arrays with only null (no undefined) - removeNull sufficient
export function last<T>(
  values: (T | null)[] | readonly (T | null)[],
  options: { removeNull: true; removeUndefined?: boolean },
): T;
export function last(
  values: (Date | null)[] | readonly (Date | null)[],
  options: { removeNull: true; removeUndefined?: boolean },
): Date;
export function last(
  values: (number | null)[] | readonly (number | null)[],
  options: { removeNull: true; removeUndefined?: boolean },
): number;

// Arrays with only undefined (no null) - removeUndefined sufficient
export function last<T>(
  values: (T | undefined)[] | readonly (T | undefined)[],
  options: { removeUndefined: true; removeNull?: boolean },
): T;
export function last(
  values: (Date | undefined)[] | readonly (Date | undefined)[],
  options: { removeUndefined: true; removeNull?: boolean },
): Date;
export function last(
  values: (number | undefined)[] | readonly (number | undefined)[],
  options: { removeUndefined: true; removeNull?: boolean },
): number;

// Arrays with nullables - return nullable when not all flags are true
export function last<T>(
  values: (T | null | undefined)[],
  options?: LastOptions,
): T | null;
export function last(
  values: DatesWithNullable,
  options?: LastOptions,
): Date | null;
export function last(
  values: NumbersWithNullable,
  options?: LastOptions,
): number | null;
export function last(
  values: NumbersWithNullableIterable,
  options?: LastOptions,
): number | null;

// Implementation
export function last(
  values:
    | unknown
    | CleanNumberArray
    | CleanDateArray
    | NumbersWithNullable
    | DatesWithNullable
    | CleanNumberIterable
    | NumbersWithNullableIterable
    | readonly unknown[]
    | unknown[]
    | Iterable<unknown>,
  options: LastOptions = {},
): unknown {
  const { removeNull = false, removeUndefined = false } = options;

  // Handle single number case
  if (typeof values === "number") {
    return values;
  }

  // Handle single date case
  if (values instanceof Date) {
    return values;
  }

  // Handle single non-array, non-iterable value
  if (
    !Array.isArray(values) &&
    typeof values !== "object" &&
    typeof values !== "function"
  ) {
    return values;
  }

  // Convert iterable to array if needed
  let processArray: unknown[];
  if (Array.isArray(values)) {
    processArray = values;
  } else if (
    values &&
    typeof values === "object" &&
    Symbol.iterator in values
  ) {
    processArray = Array.from(values as Iterable<unknown>);
  } else {
    // Not an array or iterable, treat as single value
    return values ?? null;
  }

  if (processArray.length === 0) {
    return null;
  }

  // Process with filtering (iterate backwards)
  for (let i = processArray.length - 1; i >= 0; i--) {
    const val = processArray[i];
    if (val === null) {
      if (!removeNull) return null;
      continue;
    }
    if (val === undefined) {
      if (!removeUndefined) return null;
      continue;
    }
    return val;
  }

  return null;
}
