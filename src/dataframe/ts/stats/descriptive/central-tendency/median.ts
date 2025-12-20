import { isAllFiniteNumbers } from "../../helpers.ts";
import { median_wasm } from "../../../wasm/wasm-loader.ts";

// Type definitions for number arrays
export type CleanNumberArray = readonly number[];
export type NumbersWithNullable =
  | (number | null | undefined)[]
  | readonly (number | null | undefined)[];

/** Options for filtering values in median function */
export interface MedianOptions {
  removeNull?: boolean;
  removeUndefined?: boolean;
  removeNaN?: boolean;
}

/**
 * Calculate the median of an array of values
 *
 * @param values - Array of numbers, or single number
 * @param options - Optional object with removal flags
 * @param options.removeNull - If true, filters out null values (default: false)
 * @param options.removeUndefined - If true, filters out undefined values (default: false)
 * @param options.removeNaN - If true, filters out NaN values (default: false)
 * @returns The median value, or null if no valid values
 *
 * @example
 * ```ts
 * median(42) // Always returns 42 for single value
 * median([1, 2, 3, 4, 5]) // 3
 * median([1, 2, 3, 4]) // 2.5
 * median([null, 2, 3]) // null (null present)
 * median([null, 2, 3], { removeNull: true }) // 2.5
 * median([1, NaN, 3]) // NaN (NaN propagates)
 * median([1, NaN, 3], { removeNaN: true }) // 2
 * ```
 */

// Single value overloads
export function median(values: number, options?: MedianOptions): number;

// Clean array overloads (no nulls/undefined)
export function median(
  values: CleanNumberArray,
  options?: MedianOptions,
): number;
export function median(values: number[], options?: MedianOptions): number;
export function median(
  values: Iterable<number>,
  options?: MedianOptions,
): number;

// Arrays with nullables - when all removal flags are true, return non-nullable
export function median(
  values: NumbersWithNullable,
  options: { removeNull: true; removeUndefined: true },
): number;

// Arrays with only null (no undefined) - removeNull sufficient
export function median(
  values: (number | null)[] | readonly (number | null)[],
  options: { removeNull: true },
): number;

// Arrays with only undefined (no null) - removeUndefined sufficient
export function median(
  values: (number | undefined)[] | readonly (number | undefined)[],
  options: { removeUndefined: true },
): number;

// Arrays with nullables - return nullable when not all flags are true
export function median(
  values: NumbersWithNullable,
  options?: MedianOptions,
): number | null;

// Implementation
export function median(
  values:
    | number
    | CleanNumberArray
    | NumbersWithNullable
    | Iterable<number>
    | Iterable<unknown>,
  options: MedianOptions = {},
): number | null {
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

  // Convert to array
  const processArray = Array.isArray(values) ? values : Array.from(values);

  if (processArray.length === 0) {
    return null;
  }

  // Fast path for clean numeric arrays
  if (isAllFiniteNumbers(processArray)) {
    return median_wasm(new Float64Array(processArray));
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

  return median_wasm(new Float64Array(validNumbers));
}
