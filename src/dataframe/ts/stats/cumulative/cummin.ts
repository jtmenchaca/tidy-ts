import { isAllFiniteNumbers } from "../helpers.ts";

// Type definitions for number arrays
export type CleanNumberArray = readonly number[];
export type NumbersWithNullable =
  | (number | null | undefined)[]
  | readonly (number | null | undefined)[];

/** Options for filtering values in cumulative functions */
export interface CumulativeOptions {
  removeNull?: boolean;
  removeUndefined?: boolean;
  removeNaN?: boolean;
}

/**
 * Calculate cumulative minimum of numeric values
 *
 * @param values - Array of numbers
 * @param options - If true (legacy), removes all NA values. If object, specifies which to remove.
 * @returns Array of cumulative minimums
 *
 * @example
 * ```ts
 * cummin([5, 3, 4, 1, 2]) // [5, 3, 3, 1, 1]
 * cummin([3, null, 1, 4], true) // [3, 3, 1, 1] - legacy: removes nulls
 * cummin([3, null, 1], { removeNull: true }) // [3, 3, 1]
 * cummin([3, NaN, 1]) // [3, NaN, NaN] - NaN propagates
 * cummin([3, NaN, 1], { removeNaN: true }) // [3, 3, 1]
 * ```
 */

// Single value overloads
export function cummin(
  values: number,
  options?: CumulativeOptions | boolean,
): number;

// Clean array overloads (no nulls/undefined)
export function cummin(
  values: CleanNumberArray,
  options?: CumulativeOptions | boolean,
): number[];
export function cummin(
  values: number[],
  options?: CumulativeOptions | boolean,
): number[];

// Arrays with nullables - when removal flags are true, return number[]
export function cummin(
  values: NumbersWithNullable,
  options: { removeNull: true; removeUndefined: true } | true,
): number[];

// Arrays with only null - removeNull sufficient
export function cummin(
  values: (number | null)[] | readonly (number | null)[],
  options: { removeNull: true } | true,
): number[];

// Arrays with only undefined - removeUndefined sufficient
export function cummin(
  values: (number | undefined)[] | readonly (number | undefined)[],
  options: { removeUndefined: true } | true,
): number[];

// Arrays with nullables - return nullable when not all flags are true
export function cummin(
  values: NumbersWithNullable,
  options?: CumulativeOptions | boolean,
): (number | null)[];

// Implementation
export function cummin(
  values:
    | number
    | CleanNumberArray
    | NumbersWithNullable
    | Iterable<number>
    | Iterable<unknown>,
  options: CumulativeOptions | boolean = {},
): number | number[] | (number | null)[] {
  // Normalize options - support legacy boolean API
  const opts: CumulativeOptions =
    typeof options === "boolean"
      ? { removeNull: options, removeUndefined: options, removeNaN: options }
      : options;

  const {
    removeNull = false,
    removeUndefined = false,
    removeNaN = false,
  } = opts;

  // Handle single number case
  if (typeof values === "number") {
    if (Number.isNaN(values)) {
      return removeNaN ? Infinity : NaN;
    }
    return values;
  }

  // Convert to array
  const processArray = Array.isArray(values) ? values : Array.from(values);

  if (processArray.length === 0) {
    return [];
  }

  // Fast path for clean numeric arrays
  if (isAllFiniteNumbers(processArray)) {
    const result: number[] = [];
    let min = Infinity;
    for (let i = 0; i < processArray.length; i++) {
      min = Math.min(min, processArray[i]);
      result.push(min);
    }
    return result;
  }

  // Process with filtering
  const result: (number | null)[] = [];
  let min = Infinity;
  let sawNaN = false;
  let sawFirstValue = false;

  for (const v of processArray) {
    if (v === null) {
      if (!removeNull) {
        return new Array(processArray.length).fill(null);
      }
      result.push(sawFirstValue ? min : NaN);
      continue;
    }
    if (v === undefined) {
      if (!removeUndefined) {
        return new Array(processArray.length).fill(null);
      }
      result.push(sawFirstValue ? min : NaN);
      continue;
    }
    if (typeof v === "number") {
      if (Number.isNaN(v)) {
        if (!removeNaN) {
          sawNaN = true;
        }
        result.push(sawNaN ? NaN : (sawFirstValue ? min : NaN));
        continue;
      }
      if (sawNaN) {
        result.push(NaN);
      } else {
        min = Math.min(min, v);
        sawFirstValue = true;
        result.push(min);
      }
    } else {
      result.push(sawFirstValue ? min : NaN);
    }
  }

  return result;
}
