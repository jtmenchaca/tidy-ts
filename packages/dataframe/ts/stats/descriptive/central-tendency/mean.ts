import { canUseFastPath, getTypedArray } from "../../helpers.ts";
import { mean_wasm } from "../../../wasm/wasm-loader.ts";

// Type definitions for number arrays
export type CleanNumberArray = readonly number[];
export type NumbersWithNullable =
  | (number | null | undefined)[]
  | readonly (number | null | undefined)[];

/** Options for filtering values in mean function */
export interface MeanOptions {
  removeNull?: boolean;
  removeUndefined?: boolean;
  removeNaN?: boolean;
}

/**
 * Calculate the arithmetic mean (average) of numeric values.
 *
 * @param values - A single number or array of numbers
 * @param options - Optional object with removal flags
 * @param options.removeNull - If true, filters out null values (default: false)
 * @param options.removeUndefined - If true, filters out undefined values (default: false)
 * @param options.removeNaN - If true, filters out NaN values (default: false)
 * @returns The arithmetic mean of all numeric values, or null if no valid values
 *
 * @example
 * ```typescript
 * import { stats } from "@tidy-ts/dataframe";
 *
 * // Single value
 * stats.mean(5); // 5
 *
 * // Array of numbers
 * stats.mean([1, 2, 3, 4]); // 2.5
 *
 * // Array with nulls
 * stats.mean([1, 2, null, 4], { removeNull: true }); // 2.33
 *
 * // Array with NaN (propagates by default)
 * stats.mean([1, NaN, 3]); // NaN
 * stats.mean([1, NaN, 3], { removeNaN: true }); // 2
 * ```
 */

// Single value overloads
export function mean(values: number, options?: MeanOptions): number;

// Float64Array fast path (zero-copy to WASM)
export function mean(values: Float64Array, options?: MeanOptions): number;

// Clean array overloads (no nulls/undefined)
export function mean(values: CleanNumberArray, options?: MeanOptions): number;
export function mean(values: number[], options?: MeanOptions): number;
export function mean(values: Iterable<number>, options?: MeanOptions): number;

// Arrays with nullables - when all removal flags are true, return non-nullable
export function mean(
  values: NumbersWithNullable,
  options: { removeNull: true; removeUndefined: true },
): number;

// Arrays with only null (no undefined) - removeNull sufficient
export function mean(
  values: (number | null)[] | readonly (number | null)[],
  options: { removeNull: true; removeNaN?: boolean; removeUndefined?: boolean },
): number;

// Arrays with only undefined (no null) - removeUndefined sufficient
export function mean(
  values: (number | undefined)[] | readonly (number | undefined)[],
  options: { removeUndefined: true; removeNaN?: boolean; removeNull?: boolean },
): number;

// Arrays with nullables - return nullable when not all flags are true
export function mean(
  values: NumbersWithNullable,
  options?: MeanOptions,
): number | null;

// Implementation
export function mean(
  values:
    | number
    | CleanNumberArray
    | NumbersWithNullable
    | Iterable<number>
    | Iterable<unknown>,
  options: MeanOptions = {},
): number | null {
  const {
    removeNull = false,
    removeUndefined = false,
    removeNaN = false,
  } = options;

  const _p = (globalThis as any).__TIDY_PROFILE;

  // Handle single number case
  if (typeof values === "number") {
    if (Number.isNaN(values)) {
      return removeNaN ? null : NaN;
    }
    return values;
  }

  // Float64Array fast path — skip all scanning and copying
  let t0: number = 0;
  if (_p) t0 = performance.now();
  const typed = getTypedArray(values);
  if (_p) console.log(`  [mean] getTypedArray: ${(performance.now() - t0).toFixed(4)}ms, got=${typed ? "Float64Array" : "null"}`);
  if (typed) {
    if (typed.length === 0) return null;
    if (_p) t0 = performance.now();
    const result = mean_wasm(typed);
    if (_p) console.log(`  [mean] mean_wasm(${typed.length}): ${(performance.now() - t0).toFixed(4)}ms`);
    return result;
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
      return mean_wasm(new Float64Array(processArray));
    }
    let sum = 0;
    const len = processArray.length;
    for (let i = 0; i < len; i++) sum += processArray[i];
    return sum / len;
  }

  // Process with filtering
  let sum = 0;
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
      sum += v;
    }
  }

  // If we found NaN and didn't remove it, return NaN
  if (foundNaN) {
    return NaN;
  }

  return count > 0 ? sum / count : null;
}
