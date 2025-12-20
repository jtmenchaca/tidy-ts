import { canUseFastPath } from "../helpers.ts";
import { sum_wasm } from "../../wasm/wasm-loader.ts";

// Type definitions for number arrays
export type CleanNumberArray = readonly number[];
export type NumbersWithNullable =
  | (number | null | undefined)[]
  | readonly (number | null | undefined)[];

/** Options for filtering values in sum function */
export interface SumOptions {
  removeNull?: boolean;
  removeUndefined?: boolean;
  removeNaN?: boolean;
}

/**
 * Calculate the sum of numeric values.
 *
 * @param values - A single number or array of numbers
 * @param options - Optional object with removal flags
 * @param options.removeNull - If true, filters out null values (default: false)
 * @param options.removeUndefined - If true, filters out undefined values (default: false)
 * @param options.removeNaN - If true, filters out NaN values (default: false)
 * @returns The sum of all numeric values, or null if no valid values
 *
 * @example
 * ```typescript
 * import { stats } from "@tidy-ts/dataframe";
 *
 * // Single value
 * stats.sum(5); // 5
 *
 * // Array of numbers
 * stats.sum([1, 2, 3, 4]); // 10
 *
 * // Array with nulls
 * stats.sum([1, 2, null, 4], { removeNull: true }); // 7
 *
 * // Array with NaN (propagates by default)
 * stats.sum([1, NaN, 3]); // NaN
 * stats.sum([1, NaN, 3], { removeNaN: true }); // 4
 * ```
 */

// Single value overloads
export function sum(values: number, options?: SumOptions): number;

// Clean array overloads (no nulls/undefined)
export function sum(values: CleanNumberArray, options?: SumOptions): number;
export function sum(values: number[], options?: SumOptions): number;
export function sum(values: Iterable<number>, options?: SumOptions): number;

// Arrays with nullables - when all removal flags are true, return non-nullable
export function sum(
  values: NumbersWithNullable,
  options: { removeNull: true; removeUndefined: true },
): number;

// Arrays with only null (no undefined) - removeNull sufficient
export function sum(
  values: (number | null)[] | readonly (number | null)[],
  options: { removeNull: true },
): number;

// Arrays with only undefined (no null) - removeUndefined sufficient
export function sum(
  values: (number | undefined)[] | readonly (number | undefined)[],
  options: { removeUndefined: true },
): number;

// Arrays with nullables - return nullable when not all flags are true
export function sum(
  values: NumbersWithNullable,
  options?: SumOptions,
): number | null;

// Implementation
export function sum(
  values:
    | number
    | CleanNumberArray
    | NumbersWithNullable
    | Iterable<number>
    | Iterable<unknown>,
  options: SumOptions = {},
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

  // Fast path for clean number arrays - only when no removal filtering is needed
  // and array contains only finite numbers
  if (canUseFastPath(processArray, options)) {
    // Use WASM for very large arrays
    if (processArray.length >= 1 << 15) {
      return sum_wasm(new Float64Array(processArray));
    }
    let s = 0;
    for (let i = 0; i < processArray.length; i++) s += processArray[i];
    return s;
  }

  // Process with filtering
  let s = 0;
  let count = 0;
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
      count++;
      s += v;
    }
  }

  // If we found NaN and didn't remove it, return NaN
  if (foundNaN) {
    return NaN;
  }

  return count > 0 ? s : null;
}
