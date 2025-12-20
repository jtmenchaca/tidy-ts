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
 * Calculate cumulative maximum of numeric values
 *
 * @param values - Array of numbers
 * @param options - If true (legacy), removes all NA values. If object, specifies which to remove.
 * @returns Array of cumulative maximums
 *
 * @example
 * ```ts
 * cummax([1, 3, 2, 5, 4]) // [1, 3, 3, 5, 5]
 * cummax([1, null, 3, 4], true) // [1, 1, 3, 4] - legacy: removes nulls
 * cummax([1, null, 3], { removeNull: true }) // [1, 1, 3]
 * cummax([1, NaN, 3]) // [1, NaN, NaN] - NaN propagates
 * cummax([1, NaN, 3], { removeNaN: true }) // [1, 1, 3]
 * ```
 */

// Single value overloads
export function cummax(
  values: number,
  options?: CumulativeOptions | boolean,
): number;

// Clean array overloads (no nulls/undefined)
export function cummax(
  values: CleanNumberArray,
  options?: CumulativeOptions | boolean,
): number[];
export function cummax(
  values: number[],
  options?: CumulativeOptions | boolean,
): number[];

// Arrays with nullables - when removal flags are true, return number[]
export function cummax(
  values: NumbersWithNullable,
  options: { removeNull: true; removeUndefined: true } | true,
): number[];

// Arrays with only null - removeNull sufficient
export function cummax(
  values: (number | null)[] | readonly (number | null)[],
  options: { removeNull: true } | true,
): number[];

// Arrays with only undefined - removeUndefined sufficient
export function cummax(
  values: (number | undefined)[] | readonly (number | undefined)[],
  options: { removeUndefined: true } | true,
): number[];

// Arrays with nullables - return nullable when not all flags are true
export function cummax(
  values: NumbersWithNullable,
  options?: CumulativeOptions | boolean,
): (number | null)[];

// Implementation
export function cummax(
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
      return removeNaN ? -Infinity : NaN;
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
    let max = -Infinity;
    for (let i = 0; i < processArray.length; i++) {
      max = Math.max(max, processArray[i]);
      result.push(max);
    }
    return result;
  }

  // Process with filtering
  const result: (number | null)[] = [];
  let max = -Infinity;
  let sawNaN = false;
  let sawFirstValue = false;

  for (const v of processArray) {
    if (v === null) {
      if (!removeNull) {
        return new Array(processArray.length).fill(null);
      }
      result.push(sawFirstValue ? max : NaN);
      continue;
    }
    if (v === undefined) {
      if (!removeUndefined) {
        return new Array(processArray.length).fill(null);
      }
      result.push(sawFirstValue ? max : NaN);
      continue;
    }
    if (typeof v === "number") {
      if (Number.isNaN(v)) {
        if (!removeNaN) {
          sawNaN = true;
        }
        result.push(sawNaN ? NaN : (sawFirstValue ? max : NaN));
        continue;
      }
      if (sawNaN) {
        result.push(NaN);
      } else {
        max = Math.max(max, v);
        sawFirstValue = true;
        result.push(max);
      }
    } else {
      result.push(sawFirstValue ? max : NaN);
    }
  }

  return result;
}
