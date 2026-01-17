import { quantile_wasm } from "../../../wasm/wasm-loader.ts";
import type {
  CleanNumberArray,
  CleanNumberIterable,
  NumbersWithNullable,
  NumbersWithNullableIterable,
} from "../../helpers.ts";

/** Options for filtering values in quartiles function */
export interface QuartilesOptions {
  removeNull?: boolean;
  removeUndefined?: boolean;
  removeNaN?: boolean;
}

/**
 * Calculate the quartiles (Q25, median/Q50, Q75) of values
 *
 * @param values - Array of numbers or single number
 * @param options - Optional object with removal flags
 * @param options.removeNull - If true, filters out null values (default: false)
 * @param options.removeUndefined - If true, filters out undefined values (default: false)
 * @param options.removeNaN - If true, filters out NaN values (default: false)
 * @returns Array of [Q25, Q50, Q75] or null if no valid values
 *
 * @example
 * ```ts
 * quartiles(42) // Always returns [42, 42, 42] for single value
 * quartiles([1, 2, 3, 4, 5]) // [2, 3, 4]
 * quartiles([1, null, 5]) // null (null present)
 * quartiles([1, null, 5], { removeNull: true }) // quartiles of [1, 5]
 * quartiles([1, NaN, 5]) // NaN propagates in result
 * quartiles([1, NaN, 5], { removeNaN: true }) // quartiles of [1, 5]
 * ```
 */

// Single value overloads
export function quartiles(
  value: number,
  options?: QuartilesOptions,
): [number, number, number];

// Clean array overloads (no nulls/undefined)
export function quartiles(
  values: CleanNumberArray,
  options?: QuartilesOptions,
): [number, number, number];
export function quartiles(
  values: number[],
  options?: QuartilesOptions,
): [number, number, number];
export function quartiles(
  values: CleanNumberIterable,
  options?: QuartilesOptions,
): [number, number, number];

// Arrays with nullables - when all removal flags are true, return non-nullable
export function quartiles(
  values: NumbersWithNullable,
  options: { removeNull: true; removeUndefined: true },
): [number, number, number];
export function quartiles(
  values: NumbersWithNullableIterable,
  options: { removeNull: true; removeUndefined: true },
): [number, number, number];

// Arrays with only null (no undefined) - removeNull sufficient
export function quartiles(
  values: (number | null)[] | readonly (number | null)[],
  options: { removeNull: true; removeNaN?: boolean; removeUndefined?: boolean },
): [number, number, number];

// Arrays with only undefined (no null) - removeUndefined sufficient
export function quartiles(
  values: (number | undefined)[] | readonly (number | undefined)[],
  options: { removeUndefined: true; removeNaN?: boolean; removeNull?: boolean },
): [number, number, number];

// Arrays with nullables - return nullable when not all flags are true
export function quartiles(
  values: NumbersWithNullable,
  options?: QuartilesOptions,
): [number, number, number] | null;
export function quartiles(
  values: NumbersWithNullableIterable,
  options?: QuartilesOptions,
): [number, number, number] | null;

// Implementation
export function quartiles(
  data:
    | number
    | CleanNumberArray
    | NumbersWithNullable
    | CleanNumberIterable
    | NumbersWithNullableIterable
    | Iterable<number>
    | Iterable<unknown>,
  options: QuartilesOptions = {},
): [number, number, number] | null {
  const {
    removeNull = false,
    removeUndefined = false,
    removeNaN = false,
  } = options;

  // Handle single number case
  if (typeof data === "number") {
    if (Number.isNaN(data)) {
      return removeNaN ? null : [NaN, NaN, NaN];
    }
    return [data, data, data]; // Single value has same Q25, Q50, Q75
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

  // If we found NaN and didn't remove it, return NaN tuple
  if (foundNaN) {
    return [NaN, NaN, NaN];
  }

  if (validValues.length === 0) {
    return null;
  }

  const result = Array.from(
    quantile_wasm(
      new Float64Array(validValues),
      new Float64Array([0.25, 0.5, 0.75]),
    ),
  );

  return [result[0], result[1], result[2]];
}
