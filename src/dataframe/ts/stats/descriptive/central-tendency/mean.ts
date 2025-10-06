import { hasMixedTypes } from "../../helpers.ts";
import type {
  CleanNumberArray,
  CleanNumberIterable,
  NumbersWithNullable,
  NumbersWithNullableIterable,
} from "../../helpers.ts";
import {
  extractNumbersWithOptions,
  isAllFiniteNumbers,
} from "../../helpers.ts";
import type {
  NullableArrayWithoutRemoveNa,
  RestrictNullableArray,
} from "../../../dataframe/types/error-types.ts";

// Types that should be rejected at compile-time (examples):
// type ArrayWithStrings = (number | string)[];
// type ArrayWithBooleans = (number | boolean)[];
// type ArrayWithMixedTypes = (number | string | boolean | null)[];
// These types are intentionally NOT supported in overloads - use runtime filtering instead

/**
 * Calculate the arithmetic mean (average) of numeric values.
 *
 * @param value - A single number or array of numbers
 * @param removeNA - Whether to exclude null/undefined values (when using mixed arrays)
 * @returns The arithmetic mean of all numeric values
 *
 * @example
 * ```typescript
 * import { stats } from "@tidy-ts/dataframe";
 *
 * // Single value
 * stats.mean(5); // 5
 *
 * // Array of numbers
 * stats.mean([1, 2, 3, 4]); // 2.5
 *
 * // Array with nulls (requires removeNA flag)
 * stats.mean([1, 2, null, 4], true); // 2.33
 *
 * // Using with DataFrame columns
 * const df = createDataFrame([
 *   { score: 85 }, { score: 92 }, { score: 78 }
 * ]);
 * stats.mean(df.score); // 85
 * ```
 */
export function mean(value: number): number;
export function mean(values: CleanNumberArray): number;
export function mean(values: CleanNumberIterable): number;
export function mean(values: NumbersWithNullable, removeNA: true): number;
export function mean(
  values: NumbersWithNullableIterable,
  removeNA: true,
): number;
// Error overload for nullable arrays without removeNA
export function mean(
  values: RestrictNullableArray<
    NumbersWithNullable,
    NullableArrayWithoutRemoveNa
  >,
): number;
export function mean(
  values: RestrictNullableArray<
    readonly (number | null | undefined)[],
    NullableArrayWithoutRemoveNa
  >,
): number;
export function mean(
  values: RestrictNullableArray<
    readonly (number | null)[],
    NullableArrayWithoutRemoveNa
  >,
): number;
export function mean(
  values:
    | number
    | CleanNumberArray
    | NumbersWithNullable
    | CleanNumberIterable
    | NumbersWithNullableIterable
    | unknown[] // Runtime filtering fallback
    | Iterable<unknown>, // Runtime filtering fallback
  removeNA: boolean = false,
  // deno-lint-ignore no-explicit-any
): any {
  if (typeof values === "number") return values;

  // Check for mixed types first - return null unless removeNA is true
  if (hasMixedTypes(values) && !removeNA) {
    return null;
  }

  // Fast path for clean number arrays (common case from materialized group columns)
  if (Array.isArray(values) && isAllFiniteNumbers(values)) {
    let sum = 0;
    const len = values.length;
    for (let i = 0; i < len; i++) sum += values[i];
    return sum / len;
  }

  // Extract numeric values (includes Infinity, excludes NaN and non-numbers)
  const validValues = extractNumbersWithOptions(values, true, false);

  if (validValues.length === 0) {
    return null;
  }

  // Welford's algorithm for numerical stability
  let count = 0;
  let m = 0;

  for (let i = 0; i < validValues.length; i++) {
    const x = validValues[i];
    count++;
    m += (x - m) / count;
  }

  return m;
}
