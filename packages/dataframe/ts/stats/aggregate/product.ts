import { isAllFiniteNumbers } from "../helpers.ts";

// Type definitions for number arrays
export type CleanNumberArray = readonly number[];
export type NumbersWithNullable =
  | (number | null | undefined)[]
  | readonly (number | null | undefined)[];

/** Options for filtering values in product function */
export interface ProductOptions {
  removeNull?: boolean;
  removeUndefined?: boolean;
  removeNaN?: boolean;
}

/**
 * Calculate the product (multiplication) of all values
 *
 * @param values - Array of numbers or single number
 * @param options - Optional object with removal flags
 * @param options.removeNull - If true, filters out null values (default: false)
 * @param options.removeUndefined - If true, filters out undefined values (default: false)
 * @param options.removeNaN - If true, filters out NaN values (default: false)
 * @returns Product of all values, or null if no valid values
 *
 * @example
 * ```ts
 * product(5) // 5
 * product([1, 2, 3, 4]) // 24
 * product([2, null, 3]) // null (due to null)
 * product([2, null, 3], { removeNull: true }) // 6
 * product([1, NaN, 3]) // NaN (NaN propagates)
 * product([1, NaN, 3], { removeNaN: true }) // 3
 * ```
 */

// Single value overloads
export function product(values: number, options?: ProductOptions): number;

// Clean array overloads (no nulls/undefined)
export function product(
  values: CleanNumberArray,
  options?: ProductOptions,
): number;
export function product(values: number[], options?: ProductOptions): number;
export function product(
  values: Iterable<number>,
  options?: ProductOptions,
): number;

// Arrays with nullables - when all removal flags are true, return non-nullable
export function product(
  values: NumbersWithNullable,
  options: { removeNull: true; removeUndefined: true },
): number;

// Arrays with only null (no undefined) - removeNull sufficient
export function product(
  values: (number | null)[] | readonly (number | null)[],
  options: { removeNull: true; removeNaN?: boolean; removeUndefined?: boolean },
): number;

// Arrays with only undefined (no null) - removeUndefined sufficient
export function product(
  values: (number | undefined)[] | readonly (number | undefined)[],
  options: { removeUndefined: true; removeNaN?: boolean; removeNull?: boolean },
): number;

// Arrays with nullables - return nullable when not all flags are true
export function product(
  values: NumbersWithNullable,
  options?: ProductOptions,
): number | null;

// Implementation
export function product(
  values:
    | number
    | CleanNumberArray
    | NumbersWithNullable
    | Iterable<number>
    | Iterable<unknown>,
  options: ProductOptions = {},
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

  // Fast path for clean number arrays
  if (isAllFiniteNumbers(processArray)) {
    let p = 1;
    for (let i = 0; i < processArray.length; i++) p *= processArray[i];
    return p;
  }

  // Process with filtering
  let p = 1;
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
      p *= v;
    }
  }

  // If we found NaN and didn't remove it, return NaN
  if (foundNaN) {
    return NaN;
  }

  return count > 0 ? p : null;
}
