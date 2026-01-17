import { isAllFiniteNumbers } from "../helpers.ts";

// Type definitions for number arrays
export type CleanNumberArray = readonly number[];
export type NumbersWithNullable =
  | (number | null | undefined)[]
  | readonly (number | null | undefined)[];

/** Options for filtering values in cumulative product function */
export interface CumprodOptions {
  removeNull?: boolean;
  removeUndefined?: boolean;
  removeNaN?: boolean;
}

/**
 * Calculate cumulative product of numeric values
 *
 * @param values - Array of numbers
 * @param options - Optional object with removal flags
 * @param options.removeNull - If true, filters out null values (default: false)
 * @param options.removeUndefined - If true, filters out undefined values (default: false)
 * @param options.removeNaN - If true, filters out NaN values (default: false)
 * @returns Array of cumulative products
 *
 * @example
 * ```ts
 * cumprod([1, 2, 3, 4]) // [1, 2, 6, 24]
 * cumprod([1, null, 3]) // [null, null, null] - null causes all results to be null
 * cumprod([1, null, 3], { removeNull: true }) // [1, 1, 3]
 * cumprod([1, NaN, 3]) // [1, NaN, NaN] - NaN propagates
 * cumprod([1, NaN, 3], { removeNaN: true }) // [1, 1, 3]
 * ```
 */

// Single value overloads
export function cumprod(values: number, options?: CumprodOptions): number;

// Clean array overloads (no nulls/undefined)
export function cumprod(
  values: CleanNumberArray,
  options?: CumprodOptions,
): number[];
export function cumprod(values: number[], options?: CumprodOptions): number[];

// Arrays with nullables - when removal flags are true, return number[]
export function cumprod(
  values: NumbersWithNullable,
  options: { removeNull: true; removeUndefined: true },
): number[];

// Arrays with only null - removeNull sufficient
export function cumprod(
  values: (number | null)[] | readonly (number | null)[],
  options: { removeNull: true; removeNaN?: boolean; removeUndefined?: boolean },
): number[];

// Arrays with only undefined - removeUndefined sufficient
export function cumprod(
  values: (number | undefined)[] | readonly (number | undefined)[],
  options: { removeUndefined: true; removeNaN?: boolean; removeNull?: boolean },
): number[];

// Arrays with nullables - return nullable when not all flags are true
export function cumprod(
  values: NumbersWithNullable,
  options?: CumprodOptions,
): (number | null)[];

// Implementation
export function cumprod(
  values:
    | number
    | CleanNumberArray
    | NumbersWithNullable
    | Iterable<number>
    | Iterable<unknown>,
  options: CumprodOptions = {},
): number | number[] | (number | null)[] {
  const {
    removeNull = false,
    removeUndefined = false,
    removeNaN = false,
  } = options;

  // Handle single number case
  if (typeof values === "number") {
    if (Number.isNaN(values)) {
      return removeNaN ? 1 : NaN;
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
    let prod = 1;
    for (let i = 0; i < processArray.length; i++) {
      prod *= processArray[i];
      result.push(prod);
    }
    return result;
  }

  // Process with filtering
  const result: (number | null)[] = [];
  let prod = 1;
  let sawNaN = false;

  for (const v of processArray) {
    if (v === null) {
      if (!removeNull) {
        return new Array(processArray.length).fill(null);
      }
      result.push(prod);
      continue;
    }
    if (v === undefined) {
      if (!removeUndefined) {
        return new Array(processArray.length).fill(null);
      }
      result.push(prod);
      continue;
    }
    if (typeof v === "number") {
      if (Number.isNaN(v)) {
        if (!removeNaN) {
          sawNaN = true;
        }
        result.push(sawNaN ? NaN : prod);
        continue;
      }
      if (sawNaN) {
        result.push(NaN);
      } else {
        prod *= v;
        result.push(prod);
      }
    } else {
      result.push(prod);
    }
  }

  return result;
}
