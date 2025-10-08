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

  // OPTIMIZATION: Check if array is pre-validated (from summarise.verb.ts group proxy)
  // Skip expensive type checking if we know the data is clean
  // BUT: only use fast path if NOT removing NAs (fast path doesn't handle nulls)
  const VALIDATED_ARRAY = Symbol.for("tidy-ts:validated-array");
  // deno-lint-ignore no-explicit-any
  if (Array.isArray(values) && (values as any)[VALIDATED_ARRAY] && !removeNA) {
    const arr = values as number[];
    // Use Welford's algorithm for numerical stability (online mean calculation)
    let m = 0;
    let count = 0;
    for (let i = 0; i < arr.length; i++) {
      const val = arr[i];
      // Skip nulls/NaN even in validated arrays
      if (val == null || Number.isNaN(val)) continue;
      count++;
      m += (val - m) / count;
    }
    return count > 0 ? m : null;
  }

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

  let count = 0;
  let m = 0;

  for (let i = 0; i < validValues.length; i++) {
    const x = validValues[i];
    count++;
    m += (x - m) / count;
  }

  return m;
}
