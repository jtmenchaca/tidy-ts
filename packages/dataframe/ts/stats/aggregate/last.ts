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
 * Get the last value in an array of numbers, dates, or other types
 *
 * @param values - Array of values, or single value
 * @param removeNA - If true, skips null/undefined values and returns last valid value
 * @returns The last value, or null if no valid values and removeNA=false
 *
 * @example
 * ```ts
 * last(42) // Always returns 42 for single value
 * last([1, 2, 3, 4, 5]) // 5
 * last([1, 2, null], false) // null (last value is null)
 * last([1, 2, null], true) // 2 (skips null, returns last valid)
 * last([new Date('2024-01-01'), new Date('2024-01-02')]) // new Date('2024-01-02')
 * ```
 */
// Single value overloads
export function last<T>(value: T): T;

// Clean array overloads (no nulls/undefined) - MUST come before nullable overloads
export function last<T>(values: readonly T[]): T;
export function last<T>(values: T[]): T;
export function last(values: readonly Date[]): Date;
export function last(values: Date[]): Date;
export function last(values: readonly number[]): number;
export function last(values: number[]): number;
export function last(values: Iterable<number>): number;

// Arrays with nullables that require removeNA=true
export function last<T>(values: (T | null | undefined)[], removeNA: true): T;
export function last(values: DatesWithNullable, removeNA: true): Date;
export function last(values: NumbersWithNullable, removeNA: true): number;
export function last(
  values: NumbersWithNullableIterable,
  removeNA: true,
): number;

// Arrays with nullables that return nullable (removeNA=false explicitly)
export function last<T>(
  values: (T | null | undefined)[],
  removeNA: false,
): T | null;
export function last(
  values: DatesWithNullable,
  removeNA: false,
): Date | null;
export function last(
  values: NumbersWithNullable,
  removeNA: false,
): number | null;
export function last(
  values: NumbersWithNullableIterable,
  removeNA: false,
): number | null;
export function last(
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

  // If removeNA is true, skip null/undefined values and return last valid
  if (removeNA) {
    for (let i = processArray.length - 1; i >= 0; i--) {
      const val = processArray[i];
      if (!isNA(val)) {
        return val;
      }
    }
    return null;
  }

  // Return last value (even if null/undefined)
  return processArray[processArray.length - 1] ?? null;
}
