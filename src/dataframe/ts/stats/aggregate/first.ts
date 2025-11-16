import type {
  CleanNumberArray,
  CleanNumberIterable,
  NumbersWithNullable,
  NumbersWithNullableIterable,
} from "../helpers.ts";
import { isNA } from "../helpers.ts";

// Type definitions for Date arrays
export type CleanDateArray = readonly Date[];
export type DatesWithNullable =
  | (Date | null | undefined)[]
  | readonly (Date | null | undefined)[];

/**
 * Get the first value in an array of numbers, dates, or other types
 *
 * @param values - Array of values, or single value
 * @param removeNA - If true, skips null/undefined values and returns first valid value
 * @returns The first value, or null if no valid values and removeNA=false
 *
 * @example
 * ```ts
 * first(42) // Always returns 42 for single value
 * first([1, 2, 3, 4, 5]) // 1
 * first([null, 2, 3], false) // null (first value is null)
 * first([null, 2, 3], true) // 2 (skips null, returns first valid)
 * first([new Date('2024-01-01'), new Date('2024-01-02')]) // new Date('2024-01-01')
 * ```
 */
// Single value overloads
export function first<T>(value: T): T;

// Clean array overloads (no nulls/undefined) - MUST come before nullable overloads
export function first<T>(values: readonly T[]): T;
export function first<T>(values: T[]): T;
export function first(values: readonly Date[]): Date;
export function first(values: Date[]): Date;
export function first(values: readonly number[]): number;
export function first(values: number[]): number;
export function first(values: Iterable<number>): number;

// Arrays with nullables that require removeNA=true
export function first<T>(values: (T | null | undefined)[], removeNA: true): T;
export function first(values: DatesWithNullable, removeNA: true): Date;
export function first(values: NumbersWithNullable, removeNA: true): number;
export function first(
  values: NumbersWithNullableIterable,
  removeNA: true,
): number;

// Arrays with nullables that return nullable (removeNA=false explicitly)
export function first<T>(
  values: (T | null | undefined)[],
  removeNA: false,
): T | null;
export function first(
  values: DatesWithNullable,
  removeNA: false,
): Date | null;
export function first(
  values: NumbersWithNullable,
  removeNA: false,
): number | null;
export function first(
  values: NumbersWithNullableIterable,
  removeNA: false,
): number | null;
export function first(
  values:
    | unknown
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
): unknown {
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
    !Array.isArray(values) && typeof values !== "object" &&
    typeof values !== "function"
  ) {
    return values;
  }

  // Convert iterable to array if needed
  let processArray: unknown[];
  if (Array.isArray(values)) {
    processArray = values;
  } else if (
    values && typeof values === "object" && Symbol.iterator in values
  ) {
    processArray = Array.from(values as Iterable<unknown>);
  } else {
    // Not an array or iterable, treat as single value
    return values ?? null;
  }

  if (processArray.length === 0) {
    return null;
  }

  // If removeNA is true, skip null/undefined values
  if (removeNA) {
    for (let i = 0; i < processArray.length; i++) {
      const val = processArray[i];
      if (!isNA(val)) {
        return val;
      }
    }
    return null;
  }

  // Return first value (even if null/undefined)
  return processArray[0] ?? null;
}
