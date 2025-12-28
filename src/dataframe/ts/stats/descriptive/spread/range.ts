import { isAllFiniteNumbers } from "../../helpers.ts";

// Type definitions for number arrays
export type CleanNumberArray = readonly number[];
export type NumbersWithNullable =
  | (number | null | undefined)[]
  | readonly (number | null | undefined)[];

/** Options for filtering values in range function */
export interface RangeOptions {
  removeNull?: boolean;
  removeUndefined?: boolean;
  removeNaN?: boolean;
}

/**
 * Calculate the range of values (max - min)
 *
 * @param values - Array of numbers, or single number
 * @param options - Optional object with removal flags
 * @param options.removeNull - If true, filters out null values (default: false)
 * @param options.removeUndefined - If true, filters out undefined values (default: false)
 * @param options.removeNaN - If true, filters out NaN values (default: false)
 * @returns Range value or null if no valid values
 *
 * @example
 * ```ts
 * range(42) // Always returns 0 for single value
 * range([1, 5, 3, 9, 2]) // 8 (9 - 1)
 * range([1, null, 5]) // null (null present)
 * range([1, null, 5], { removeNull: true }) // 4 (5 - 1)
 * range([1, NaN, 5]) // NaN (NaN propagates)
 * range([1, NaN, 5], { removeNaN: true }) // 4
 * ```
 */

// Single value overloads
export function range(values: number, options?: RangeOptions): number;

// Clean array overloads (no nulls/undefined)
export function range(values: CleanNumberArray, options?: RangeOptions): number;
export function range(values: number[], options?: RangeOptions): number;
export function range(values: Iterable<number>, options?: RangeOptions): number;

// Arrays with nullables - when all removal flags are true, return non-nullable
export function range(
  values: NumbersWithNullable,
  options: { removeNull: true; removeUndefined: true },
): number;

// Arrays with only null (no undefined) - removeNull sufficient
export function range(
  values: (number | null)[] | readonly (number | null)[],
  options: { removeNull: true; removeNaN?: boolean; removeUndefined?: boolean },
): number;

// Arrays with only undefined (no null) - removeUndefined sufficient
export function range(
  values: (number | undefined)[] | readonly (number | undefined)[],
  options: { removeUndefined: true; removeNaN?: boolean; removeNull?: boolean },
): number;

// Arrays with nullables - return nullable when not all flags are true
export function range(
  values: NumbersWithNullable,
  options?: RangeOptions,
): number | null;

// Implementation
export function range(
  values:
    | number
    | CleanNumberArray
    | NumbersWithNullable
    | Iterable<number>
    | Iterable<unknown>,
  options: RangeOptions = {},
): number | null {
  const {
    removeNull = false,
    removeUndefined = false,
    removeNaN = false,
  } = options;

  // Handle single number case
  if (typeof values === "number") {
    if (Number.isNaN(values)) {
      return removeNaN ? 0 : NaN;
    }
    return 0; // Range of a single value is 0
  }

  // Convert to array
  const processArray = Array.isArray(values) ? values : Array.from(values);

  if (processArray.length === 0) {
    return null;
  }

  // Fast path for clean numeric arrays
  if (isAllFiniteNumbers(processArray)) {
    const minVal = Math.min(...processArray);
    const maxVal = Math.max(...processArray);
    return maxVal - minVal;
  }

  // Process with filtering - collect valid numbers
  const validNumbers: number[] = [];
  let foundNaN = false;

  for (const v of processArray) {
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
      validNumbers.push(v);
    }
  }

  // If we found NaN and didn't remove it, return NaN
  if (foundNaN) {
    return NaN;
  }

  if (validNumbers.length === 0) {
    return null;
  }

  const minVal = Math.min(...validNumbers);
  const maxVal = Math.max(...validNumbers);
  return maxVal - minVal;
}
