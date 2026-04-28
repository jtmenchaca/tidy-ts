import { getTypedArray, isAllFiniteNumbers } from "../../helpers.ts";
import { variance_wasm } from "../../../wasm/wasm-loader.ts";

// Type definitions for number arrays
export type CleanNumberArray = readonly number[];
export type NumbersWithNullable =
  | (number | null | undefined)[]
  | readonly (number | null | undefined)[];

/** Options for filtering values in variance function */
export interface VarianceOptions {
  removeNull?: boolean;
  removeUndefined?: boolean;
  removeNaN?: boolean;
}

/**
 * Calculate the sample variance of an array of values (uses N-1 denominator)
 *
 * @param values - Array of numbers or single number
 * @param options - Optional object with removal flags
 * @param options.removeNull - If true, filters out null values (default: false)
 * @param options.removeUndefined - If true, filters out undefined values (default: false)
 * @param options.removeNaN - If true, filters out NaN values (default: false)
 * @returns Sample variance value or null if insufficient data
 *
 * @example
 * ```ts
 * variance(42) // Always returns 0 for single value
 * variance([1, 2, 3, 4, 5]) // sample variance
 * variance([1, null, 3]) // null (null present)
 * variance([1, null, 3], { removeNull: true }) // variance of [1, 3]
 * variance([1, NaN, 3]) // NaN (NaN propagates)
 * variance([1, NaN, 3], { removeNaN: true }) // variance of [1, 3]
 * ```
 */

// Single value overloads
export function variance(values: number, options?: VarianceOptions): number;

// Float64Array fast path (zero-copy to WASM)
export function variance(values: Float64Array, options?: VarianceOptions): number;

// Clean array overloads (no nulls/undefined)
export function variance(
  values: CleanNumberArray,
  options?: VarianceOptions,
): number;
export function variance(values: number[], options?: VarianceOptions): number;
export function variance(
  values: Iterable<number>,
  options?: VarianceOptions,
): number;

// Arrays with nullables - when all removal flags are true, return non-nullable
export function variance(
  values: NumbersWithNullable,
  options: { removeNull: true; removeUndefined: true },
): number;

// Arrays with only null (no undefined) - removeNull sufficient
export function variance(
  values: (number | null)[] | readonly (number | null)[],
  options: { removeNull: true; removeNaN?: boolean; removeUndefined?: boolean },
): number;

// Arrays with only undefined (no null) - removeUndefined sufficient
export function variance(
  values: (number | undefined)[] | readonly (number | undefined)[],
  options: { removeUndefined: true; removeNaN?: boolean; removeNull?: boolean },
): number;

// Arrays with nullables - return nullable when not all flags are true
export function variance(
  values: NumbersWithNullable,
  options?: VarianceOptions,
): number | null;

// Implementation
export function variance(
  values:
    | number
    | CleanNumberArray
    | NumbersWithNullable
    | Iterable<number>
    | Iterable<unknown>,
  options: VarianceOptions = {},
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
    return 0; // Variance of a single value is 0
  }

  // Float64Array fast path — skip all scanning, delegate to WASM
  const typed = getTypedArray(values);
  if (typed) {
    if (typed.length === 0) return null;
    if (typed.length === 1) return null;
    return variance_wasm(typed);
  }

  // Convert to array
  const processArray = Array.isArray(values) ? values : Array.from(values);

  if (processArray.length === 0) {
    return null;
  }

  // Fast path for clean numeric arrays
  if (isAllFiniteNumbers(processArray)) {
    if (processArray.length === 1) return null; // Sample variance undefined for n=1

    const meanVal = processArray.reduce((sum, val) => sum + val, 0) /
      processArray.length;
    const sumSquaredDiffs = processArray.reduce((sum, val) => {
      const diff = val - meanVal;
      return sum + diff * diff;
    }, 0);

    return sumSquaredDiffs / (processArray.length - 1);
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
  if (validNumbers.length === 1) {
    return null; // Sample variance undefined for n=1
  }

  const meanVal = validNumbers.reduce((sum, val) => sum + val, 0) /
    validNumbers.length;
  const sumSquaredDiffs = validNumbers.reduce((sum, val) => {
    const diff = val - meanVal;
    return sum + diff * diff;
  }, 0);

  return sumSquaredDiffs / (validNumbers.length - 1);
}
