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
 * Calculate cumulative mean of values.
 *
 * Returns an array where each element is the mean of all values up to that point.
 *
 * @param values - Array of numbers
 * @param options - If true (legacy), removes all NA values. If object, specifies which to remove.
 * @returns Array of cumulative means
 *
 * @example
 * ```ts
 * cummean([1, 2, 3, 4]) // [1, 1.5, 2, 2.5]
 * cummean([1, null, 3, 4], true) // [1, 1, 2, 2.5] - legacy: removes nulls
 * cummean([1, null, 3], { removeNull: true }) // [1, 1, 2]
 * cummean([1, NaN, 3]) // [1, NaN, NaN] - NaN propagates
 * cummean([1, NaN, 3], { removeNaN: true }) // [1, 1, 2]
 * ```
 */

// Single value overloads
export function cummean(
  values: number,
  options?: CumulativeOptions | boolean,
): number;

// Clean array overloads (no nulls/undefined)
export function cummean(
  values: CleanNumberArray,
  options?: CumulativeOptions | boolean,
): number[];
export function cummean(
  values: number[],
  options?: CumulativeOptions | boolean,
): number[];

// Arrays with nullables - when removal flags are true, return number[]
export function cummean(
  values: NumbersWithNullable,
  options: { removeNull: true; removeUndefined: true } | true,
): number[];

// Arrays with only null - removeNull sufficient
export function cummean(
  values: (number | null)[] | readonly (number | null)[],
  options: { removeNull: true } | true,
): number[];

// Arrays with only undefined - removeUndefined sufficient
export function cummean(
  values: (number | undefined)[] | readonly (number | undefined)[],
  options: { removeUndefined: true } | true,
): number[];

// Arrays with nullables - return nullable when not all flags are true
export function cummean(
  values: NumbersWithNullable,
  options?: CumulativeOptions | boolean,
): (number | null)[];

// Implementation
export function cummean(
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
      return removeNaN ? 0 : NaN;
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
    let sum = 0;
    for (let i = 0; i < processArray.length; i++) {
      sum += processArray[i];
      result.push(sum / (i + 1));
    }
    return result;
  }

  // Process with filtering
  const result: (number | null)[] = [];
  let sum = 0;
  let count = 0;
  let sawNaN = false;

  for (const v of processArray) {
    if (v === null) {
      if (!removeNull) {
        return new Array(processArray.length).fill(null);
      }
      result.push(count > 0 ? sum / count : 0);
      continue;
    }
    if (v === undefined) {
      if (!removeUndefined) {
        return new Array(processArray.length).fill(null);
      }
      result.push(count > 0 ? sum / count : 0);
      continue;
    }
    if (typeof v === "number") {
      if (Number.isNaN(v)) {
        if (!removeNaN) {
          sawNaN = true;
        }
        result.push(sawNaN ? NaN : (count > 0 ? sum / count : 0));
        continue;
      }
      if (sawNaN) {
        result.push(NaN);
      } else {
        sum += v;
        count++;
        result.push(sum / count);
      }
    } else {
      result.push(count > 0 ? sum / count : 0);
    }
  }

  return result;
}
