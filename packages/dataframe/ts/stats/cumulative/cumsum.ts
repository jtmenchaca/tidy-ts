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
 * Calculate cumulative sums for an array of values
 *
 * @param values - Array of numbers
 * @param options - If true (legacy), removes all NA values. If object, specifies which to remove.
 * @returns Array of cumulative sums
 *
 * @example
 * ```ts
 * cumsum([1, 2, 3, 4, 5]) // [1, 3, 6, 10, 15]
 * cumsum([1, null, 3, 4], true) // [1, 1, 4, 8] - legacy: removes nulls
 * cumsum([1, null, 3], { removeNull: true }) // [1, 1, 4]
 * cumsum([1, NaN, 3]) // [1, NaN, NaN] - NaN propagates
 * cumsum([1, NaN, 3], { removeNaN: true }) // [1, 1, 4]
 * ```
 */

// Single value overloads
export function cumsum(
  values: number,
  options?: CumulativeOptions | boolean,
): number;

// Clean array overloads (no nulls/undefined)
export function cumsum(
  values: CleanNumberArray,
  options?: CumulativeOptions | boolean,
): number[];
export function cumsum(
  values: number[],
  options?: CumulativeOptions | boolean,
): number[];

// Arrays with nullables - when removal flags are true, return number[]
export function cumsum(
  values: NumbersWithNullable,
  options: { removeNull: true; removeUndefined: true } | true,
): number[];

// Arrays with only null - removeNull sufficient
export function cumsum(
  values: (number | null)[] | readonly (number | null)[],
  options: { removeNull: true } | true,
): number[];

// Arrays with only undefined - removeUndefined sufficient
export function cumsum(
  values: (number | undefined)[] | readonly (number | undefined)[],
  options: { removeUndefined: true } | true,
): number[];

// Arrays with nullables - return nullable when not all flags are true
export function cumsum(
  values: NumbersWithNullable,
  options?: CumulativeOptions | boolean,
): (number | null)[];

// Implementation
export function cumsum(
  values:
    | number
    | CleanNumberArray
    | NumbersWithNullable
    | Iterable<number>
    | Iterable<unknown>,
  options: CumulativeOptions | boolean = {},
): number | number[] | (number | null)[] {
  // Normalize options - support legacy boolean API
  const opts: CumulativeOptions = typeof options === "boolean"
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
      result.push(sum);
    }
    return result;
  }

  // Process with filtering
  const result: (number | null)[] = [];
  let sum = 0;
  let sawNaN = false;

  for (const v of processArray) {
    if (v === null) {
      if (!removeNull) {
        // Fill rest with null
        return new Array(processArray.length).fill(null);
      }
      result.push(sum);
      continue;
    }
    if (v === undefined) {
      if (!removeUndefined) {
        return new Array(processArray.length).fill(null);
      }
      result.push(sum);
      continue;
    }
    if (typeof v === "number") {
      if (Number.isNaN(v)) {
        if (!removeNaN) {
          sawNaN = true;
        }
        result.push(sawNaN ? NaN : sum);
        continue;
      }
      if (sawNaN) {
        result.push(NaN);
      } else {
        sum += v;
        result.push(sum);
      }
    } else {
      result.push(sum);
    }
  }

  return result;
}
