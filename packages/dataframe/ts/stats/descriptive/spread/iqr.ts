import { iqr_wasm } from "../../../wasm/wasm-loader.ts";
import type {
  CleanNumberArray,
  CleanNumberIterable,
  NumbersWithNullable,
  NumbersWithNullableIterable,
} from "../../helpers.ts";

/** Options for filtering values in iqr function */
export interface IqrOptions {
  removeNull?: boolean;
  removeUndefined?: boolean;
  removeNaN?: boolean;
}

/**
 * Calculate the interquartile range (IQR) of values
 *
 * @param values - Array of numbers or single number
 * @param options - Optional object with removal flags
 * @param options.removeNull - If true, filters out null values (default: false)
 * @param options.removeUndefined - If true, filters out undefined values (default: false)
 * @param options.removeNaN - If true, filters out NaN values (default: false)
 * @returns IQR value (Q75 - Q25) or null if no valid values
 *
 * @example
 * ```ts
 * iqr(42) // Always returns 0 for single value
 * iqr([1, 2, 3, 4, 5]) // 2 (Q75 - Q25 = 4 - 2)
 * iqr([1, null, 5]) // null (null present)
 * iqr([1, null, 5], { removeNull: true }) // IQR of [1, 5]
 * iqr([1, NaN, 5]) // NaN (NaN propagates)
 * iqr([1, NaN, 5], { removeNaN: true }) // IQR of [1, 5]
 * ```
 */

// Single value overloads
export function iqr(value: number, options?: IqrOptions): number;

// Clean array overloads (no nulls/undefined)
export function iqr(values: CleanNumberArray, options?: IqrOptions): number;
export function iqr(values: number[], options?: IqrOptions): number;
export function iqr(values: CleanNumberIterable, options?: IqrOptions): number;

// Arrays with nullables - when all removal flags are true, return non-nullable
export function iqr(
  values: NumbersWithNullable,
  options: { removeNull: true; removeUndefined: true },
): number;
export function iqr(
  values: NumbersWithNullableIterable,
  options: { removeNull: true; removeUndefined: true },
): number;

// Arrays with only null (no undefined) - removeNull sufficient
export function iqr(
  values: (number | null)[] | readonly (number | null)[],
  options: { removeNull: true; removeNaN?: boolean; removeUndefined?: boolean },
): number;

// Arrays with only undefined (no null) - removeUndefined sufficient
export function iqr(
  values: (number | undefined)[] | readonly (number | undefined)[],
  options: { removeUndefined: true; removeNaN?: boolean; removeNull?: boolean },
): number;

// Arrays with nullables - return nullable when not all flags are true
export function iqr(
  values: NumbersWithNullable,
  options?: IqrOptions,
): number | null;
export function iqr(
  values: NumbersWithNullableIterable,
  options?: IqrOptions,
): number | null;

// Implementation
export function iqr(
  data:
    | number
    | CleanNumberArray
    | NumbersWithNullable
    | CleanNumberIterable
    | NumbersWithNullableIterable
    | Iterable<number>
    | Iterable<unknown>,
  options: IqrOptions = {},
): number | null {
  const {
    removeNull = false,
    removeUndefined = false,
    removeNaN = false,
  } = options;

  // Handle single number case
  if (typeof data === "number") {
    if (Number.isNaN(data)) {
      return removeNaN ? null : NaN;
    }
    return 0; // IQR of a single value is 0
  }

  // Convert to array
  const processArray = Array.isArray(data) ? data : Array.from(data);

  if (processArray.length === 0) {
    return null;
  }

  // Process with filtering
  const validValues: number[] = [];
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
      validValues.push(v);
    }
  }

  // If we found NaN and didn't remove it, return NaN
  if (foundNaN) {
    return NaN;
  }

  if (validValues.length === 0) {
    return null;
  }

  return iqr_wasm(new Float64Array(validValues));
}
