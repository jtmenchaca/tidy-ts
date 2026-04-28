import { variance, type VarianceOptions } from "./variance.ts";
import { stdev_wasm } from "../../../wasm/wasm-loader.ts";
import { getTypedArray } from "../../helpers.ts";

// Type definitions for number arrays
export type CleanNumberArray = readonly number[];
export type NumbersWithNullable =
  | (number | null | undefined)[]
  | readonly (number | null | undefined)[];

/** Options for filtering values in sd function */
export type SdOptions = VarianceOptions;

/**
 * Calculate the sample standard deviation of an array of values
 *
 * @param values - Array of numbers or single number
 * @param options - Optional object with removal flags
 * @param options.removeNull - If true, filters out null values (default: false)
 * @param options.removeUndefined - If true, filters out undefined values (default: false)
 * @param options.removeNaN - If true, filters out NaN values (default: false)
 * @returns Sample standard deviation value or null if insufficient data
 *
 * @example
 * ```ts
 * sd(42) // Always returns 0 for single value
 * sd([1, 2, 3, 4, 5]) // sample standard deviation
 * sd([1, null, 3]) // null (null present)
 * sd([1, null, 3], { removeNull: true }) // std dev of [1, 3]
 * sd([1, NaN, 3]) // NaN (NaN propagates)
 * sd([1, NaN, 3], { removeNaN: true }) // std dev of [1, 3]
 * ```
 */

// Single value overloads
export function sd(values: number, options?: SdOptions): number;

// Float64Array fast path (zero-copy to WASM)
export function sd(values: Float64Array, options?: SdOptions): number;

// Clean array overloads (no nulls/undefined)
export function sd(values: CleanNumberArray, options?: SdOptions): number;
export function sd(values: number[], options?: SdOptions): number;
export function sd(values: Iterable<number>, options?: SdOptions): number;

// Arrays with nullables - when all removal flags are true, return non-nullable
export function sd(
  values: NumbersWithNullable,
  options: { removeNull: true; removeUndefined: true },
): number;

// Arrays with only null (no undefined) - removeNull sufficient
export function sd(
  values: (number | null)[] | readonly (number | null)[],
  options: { removeNull: true; removeNaN?: boolean; removeUndefined?: boolean },
): number;

// Arrays with only undefined (no null) - removeUndefined sufficient
export function sd(
  values: (number | undefined)[] | readonly (number | undefined)[],
  options: { removeUndefined: true; removeNaN?: boolean; removeNull?: boolean },
): number;

// Arrays with nullables - return nullable when not all flags are true
export function sd(
  values: NumbersWithNullable,
  options?: SdOptions,
): number | null;

// Implementation
export function sd(
  values:
    | number
    | CleanNumberArray
    | NumbersWithNullable
    | Iterable<number>
    | Iterable<unknown>,
  options: SdOptions = {},
): number | null {
  const _p = (globalThis as any).__TIDY_PROFILE;

  // Handle single number case
  if (typeof values === "number") {
    if (Number.isNaN(values)) {
      return options.removeNaN ? 0 : NaN;
    }
    return 0; // Standard deviation of a single value is 0
  }

  // Float64Array fast path — skip variance delegation, go direct to WASM
  let t0: number = 0;
  if (_p) t0 = performance.now();
  const typed = getTypedArray(values);
  if (_p) console.log(`  [stdev] getTypedArray: ${(performance.now() - t0).toFixed(4)}ms, got=${typed ? "Float64Array" : "null"}`);
  if (typed) {
    if (typed.length === 0) return null;
    if (typed.length === 1) return null;
    if (_p) t0 = performance.now();
    const result = stdev_wasm(typed);
    if (_p) console.log(`  [stdev] stdev_wasm(${typed.length}): ${(performance.now() - t0).toFixed(4)}ms`);
    return result;
  }

  // Delegate to variance with same options
  // deno-lint-ignore no-explicit-any
  const var_val = variance(values as any, options);

  if (var_val === null) {
    return null;
  }

  // Check for NaN (propagated from variance)
  if (Number.isNaN(var_val)) {
    return NaN;
  }

  return Math.sqrt(var_val);
}
