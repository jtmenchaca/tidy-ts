import { quantile_wasm } from "../wasm-loader.ts";
import { hasMixedTypes } from "./helpers.ts";
import type {
  CleanNumberArray,
  CleanNumberIterable,
  NumbersWithNullable,
  NumbersWithNullableIterable,
} from "./helpers.ts";
import { extractNumbersWithOptions } from "./helpers.ts";

/**
 * Calculate quantiles of an array of values
 * Uses R's Type 7 algorithm (default)
 *
 * @param data - Array of numbers or single number
 * @param probs - Probability value(s) between 0 and 1
 * @param remove_na - If true, removes non-numeric values; if false, returns null for mixed types
 * @returns Quantile value(s)
 *
 * @example
 * ```ts
 * const q50 = quantile([1, 2, 3, 4, 5], 0.5); // 3 (median)
 * const [q25, q75] = quantile([1, 2, 3, 4, 5], [0.25, 0.75]); // [2, 4]
 * ```
 */
// Types that should be rejected at compile-time (examples):
// type ArrayWithStrings = (number | string)[];
// type ArrayWithBooleans = (number | boolean)[];
// type ArrayWithMixedTypes = (number | string | boolean | null)[];
// These types are intentionally NOT supported in overloads - use runtime filtering instead

export function quantile(data: number, probs: number): number;
export function quantile(data: number, probs: number[]): number[];
export function quantile(data: CleanNumberArray, probs: number): number;
export function quantile(data: CleanNumberArray, probs: number[]): number[];
export function quantile(
  data: NumbersWithNullable,
  probs: number,
  remove_na: true,
): number;
export function quantile(
  data: NumbersWithNullable,
  probs: number[],
  remove_na: true,
): number[];
export function quantile(data: CleanNumberIterable, probs: number): number;
export function quantile(data: CleanNumberIterable, probs: number[]): number[];
export function quantile(
  data: NumbersWithNullableIterable,
  probs: number,
  remove_na: true,
): number;
export function quantile(
  data: NumbersWithNullableIterable,
  probs: number[],
  remove_na: true,
): number[];
export function quantile(
  data:
    | number
    | CleanNumberArray
    | NumbersWithNullable
    | CleanNumberIterable
    | NumbersWithNullableIterable
    | unknown[] // Runtime filtering fallback
    | Iterable<unknown>, // Runtime filtering fallback
  probs: number | number[],
  remove_na: boolean = false,
): number | number[] | null | (number | null)[] {
  // Handle single number case
  if (typeof data === "number") {
    return Array.isArray(probs) ? probs.map(() => data) : data;
  }

  // Check for mixed types first - return null unless remove_na is true
  if (hasMixedTypes(data) && !remove_na) {
    return Array.isArray(probs) ? probs.map(() => null) : null;
  }

  // Extract numeric values (includes Infinity, excludes NaN and non-numbers)
  const validValues = extractNumbersWithOptions(data, true, false);

  if (validValues.length === 0) {
    if (remove_na) {
      throw new Error("No valid values found to calculate quantiles");
    }
    return Array.isArray(probs) ? probs.map(() => null) : null;
  }

  // Handle single probability value
  const probsArray = Array.isArray(probs) ? probs : [probs];

  // Validate probabilities
  for (const p of probsArray) {
    if (p < 0 || p > 1) {
      throw new Error("Probabilities must be between 0 and 1");
    }
  }

  const result = Array.from(
    quantile_wasm(new Float64Array(validValues), new Float64Array(probsArray)),
  );

  // Return single value if single probability was passed
  return Array.isArray(probs) ? result : result[0];
}
