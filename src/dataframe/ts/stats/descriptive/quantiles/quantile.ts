import { quantile_wasm } from "../../../wasm/wasm-loader.ts";
import { isAllFiniteNumbers } from "../../helpers.ts";

// Type definitions for number arrays
export type CleanNumberArray = readonly number[];
export type NumbersWithNullable =
  | (number | null | undefined)[]
  | readonly (number | null | undefined)[];

/** Options for filtering values in quantile function */
export interface QuantileOptions {
  removeNull?: boolean;
  removeUndefined?: boolean;
  removeNaN?: boolean;
}

/**
 * Calculate quantiles of an array of values
 * Uses R's Type 7 algorithm (default)
 *
 * @param data - Array of numbers or single number
 * @param probs - Probability value(s) between 0 and 1
 * @param options - Optional object with removal flags
 * @param options.removeNull - If true, filters out null values (default: false)
 * @param options.removeUndefined - If true, filters out undefined values (default: false)
 * @param options.removeNaN - If true, filters out NaN values (default: false)
 * @returns Quantile value(s)
 *
 * @example
 * ```ts
 * quantile([1, 2, 3, 4, 5], 0.5) // 3 (median)
 * quantile([1, 2, 3, 4, 5], [0.25, 0.75]) // [2, 4]
 * quantile([1, null, 5], 0.5) // null (null present)
 * quantile([1, null, 5], 0.5, { removeNull: true }) // 3
 * quantile([1, NaN, 5], 0.5) // NaN (NaN propagates)
 * quantile([1, NaN, 5], 0.5, { removeNaN: true }) // 3
 * ```
 */

// Single value overloads
export function quantile(
  data: number,
  probs: number,
  options?: QuantileOptions,
): number;
export function quantile(
  data: number,
  probs: number[],
  options?: QuantileOptions,
): number[];

// Clean array overloads (no nulls/undefined)
export function quantile(
  data: CleanNumberArray,
  probs: number,
  options?: QuantileOptions,
): number;
export function quantile(
  data: CleanNumberArray,
  probs: number[],
  options?: QuantileOptions,
): number[];
export function quantile(
  data: number[],
  probs: number,
  options?: QuantileOptions,
): number;
export function quantile(
  data: number[],
  probs: number[],
  options?: QuantileOptions,
): number[];

// Arrays with nullables - when all removal flags are true, return non-nullable
export function quantile(
  data: NumbersWithNullable,
  probs: number,
  options: { removeNull: true; removeUndefined: true },
): number;
export function quantile(
  data: NumbersWithNullable,
  probs: number[],
  options: { removeNull: true; removeUndefined: true },
): number[];

// Arrays with only null (no undefined) - removeNull sufficient
export function quantile(
  data: (number | null)[] | readonly (number | null)[],
  probs: number,
  options: { removeNull: true; removeNaN?: boolean; removeUndefined?: boolean },
): number;
export function quantile(
  data: (number | null)[] | readonly (number | null)[],
  probs: number[],
  options: { removeNull: true; removeNaN?: boolean; removeUndefined?: boolean },
): number[];

// Arrays with only undefined (no null) - removeUndefined sufficient
export function quantile(
  data: (number | undefined)[] | readonly (number | undefined)[],
  probs: number,
  options: { removeUndefined: true; removeNaN?: boolean; removeNull?: boolean },
): number;
export function quantile(
  data: (number | undefined)[] | readonly (number | undefined)[],
  probs: number[],
  options: { removeUndefined: true; removeNaN?: boolean; removeNull?: boolean },
): number[];

// Arrays with nullables - return nullable when not all flags are true
export function quantile(
  data: NumbersWithNullable,
  probs: number,
  options?: QuantileOptions,
): number | null;
export function quantile(
  data: NumbersWithNullable,
  probs: number[],
  options?: QuantileOptions,
): (number | null)[];

// Implementation
export function quantile(
  data:
    | number
    | CleanNumberArray
    | NumbersWithNullable
    | Iterable<number>
    | Iterable<unknown>,
  probs: number | number[],
  options: QuantileOptions = {},
): number | number[] | null | (number | null)[] {
  const {
    removeNull = false,
    removeUndefined = false,
    removeNaN = false,
  } = options;

  // Handle single number case
  if (typeof data === "number") {
    if (Number.isNaN(data)) {
      if (removeNaN) {
        return Array.isArray(probs) ? probs.map(() => null) : null;
      }
      return Array.isArray(probs) ? probs.map(() => NaN) : NaN;
    }
    return Array.isArray(probs) ? probs.map(() => data) : data;
  }

  // Validate probabilities
  const probsArray = Array.isArray(probs) ? probs : [probs];
  for (const p of probsArray) {
    if (p < 0 || p > 1) {
      throw new Error("Probabilities must be between 0 and 1");
    }
  }

  // Convert to array
  const processArray = Array.isArray(data) ? data : Array.from(data);

  if (processArray.length === 0) {
    return Array.isArray(probs) ? probs.map(() => null) : null;
  }

  // Fast path for clean numeric arrays
  if (isAllFiniteNumbers(processArray)) {
    const result = Array.from(
      quantile_wasm(
        new Float64Array(processArray),
        new Float64Array(probsArray),
      ),
    );
    return Array.isArray(probs) ? result : result[0];
  }

  // Process with filtering - collect valid numbers
  const validNumbers: number[] = [];
  let foundNaN = false;

  for (const v of processArray) {
    if (v === null) {
      if (!removeNull) {
        return Array.isArray(probs) ? probs.map(() => null) : null;
      }
      continue;
    }
    if (v === undefined) {
      if (!removeUndefined) {
        return Array.isArray(probs) ? probs.map(() => null) : null;
      }
      continue;
    }
    if (typeof v === "number") {
      if (Number.isNaN(v)) {
        if (!removeNaN) {
          foundNaN = true;
        }
        continue;
      }
      validNumbers.push(v);
    }
  }

  // If we found NaN and didn't remove it, return NaN
  if (foundNaN) {
    return Array.isArray(probs) ? probs.map(() => NaN) : NaN;
  }

  if (validNumbers.length === 0) {
    return Array.isArray(probs) ? probs.map(() => null) : null;
  }

  const result = Array.from(
    quantile_wasm(new Float64Array(validNumbers), new Float64Array(probsArray)),
  );
  return Array.isArray(probs) ? result : result[0];
}
