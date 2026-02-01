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

/** Options for filtering values in first function */
export interface FirstOptions {
  removeNull?: boolean;
  removeUndefined?: boolean;
}

/**
 * Get the first value in an array of numbers, dates, or other types
 *
 * @param values - Array of values, or single value
 * @param options - Optional object with removal flags
 * @param options.removeNull - If true, skips null values (default: false)
 * @param options.removeUndefined - If true, skips undefined values (default: false)
 * @returns The first value, or null if no valid values
 *
 * @example
 * ```ts
 * first(42) // Always returns 42 for single value
 * first([1, 2, 3, 4, 5]) // 1
 * first([null, 2, 3]) // null (first value is null)
 * first([null, 2, 3], { removeNull: true }) // 2 (skips null)
 * first([new Date('2024-01-01'), new Date('2024-01-02')]) // new Date('2024-01-01')
 * ```
 */

// Single value overloads
export function first<T>(value: T): T;

// Clean array overloads (no nulls/undefined) - MUST come before nullable overloads
export function first<T>(values: readonly T[], options?: FirstOptions): T;
export function first<T>(values: T[], options?: FirstOptions): T;
export function first(values: readonly Date[], options?: FirstOptions): Date;
export function first(values: Date[], options?: FirstOptions): Date;
export function first(
  values: readonly number[],
  options?: FirstOptions,
): number;
export function first(values: number[], options?: FirstOptions): number;
export function first(values: Iterable<number>, options?: FirstOptions): number;

// Arrays with nullables - when all removal flags are true, return non-nullable
export function first<T>(
  values: (T | null | undefined)[],
  options: { removeNull: true; removeUndefined: true },
): T;
export function first(
  values: DatesWithNullable,
  options: { removeNull: true; removeUndefined: true },
): Date;
export function first(
  values: NumbersWithNullable,
  options: { removeNull: true; removeUndefined: true },
): number;
export function first(
  values: NumbersWithNullableIterable,
  options: { removeNull: true; removeUndefined: true },
): number;

// Arrays with only null (no undefined) - removeNull sufficient
export function first<T>(
  values: (T | null)[] | readonly (T | null)[],
  options: { removeNull: true; removeUndefined?: boolean },
): T;
export function first(
  values: (Date | null)[] | readonly (Date | null)[],
  options: { removeNull: true; removeUndefined?: boolean },
): Date;
export function first(
  values: (number | null)[] | readonly (number | null)[],
  options: { removeNull: true; removeUndefined?: boolean },
): number;

// Arrays with only undefined (no null) - removeUndefined sufficient
export function first<T>(
  values: (T | undefined)[] | readonly (T | undefined)[],
  options: { removeUndefined: true; removeNull?: boolean },
): T;
export function first(
  values: (Date | undefined)[] | readonly (Date | undefined)[],
  options: { removeUndefined: true; removeNull?: boolean },
): Date;
export function first(
  values: (number | undefined)[] | readonly (number | undefined)[],
  options: { removeUndefined: true; removeNull?: boolean },
): number;

// Arrays with nullables - return nullable when not all flags are true
export function first<T>(
  values: (T | null | undefined)[],
  options?: FirstOptions,
): T | null;
export function first(
  values: DatesWithNullable,
  options?: FirstOptions,
): Date | null;
export function first(
  values: NumbersWithNullable,
  options?: FirstOptions,
): number | null;
export function first(
  values: NumbersWithNullableIterable,
  options?: FirstOptions,
): number | null;

// Implementation
export function first(
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
  options: FirstOptions = {},
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

  // Process with filtering
  for (let i = 0; i < processArray.length; i++) {
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
