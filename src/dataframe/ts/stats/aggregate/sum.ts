import { isNA } from "../../utilities/mod.ts";
import { sum_wasm } from "../../wasm/wasm-loader.ts";
import { hasMixedTypes } from "../helpers.ts";
import type {
  CleanNumberArray,
  CleanNumberIterable,
  NumbersWithNullable,
  NumbersWithNullableIterable,
} from "../helpers.ts";

// Types that should be rejected at compile-time (examples):
// type ArrayWithStrings = (number | string)[];
// type ArrayWithBooleans = (number | boolean)[];
// type ArrayWithMixedTypes = (number | string | boolean | null)[];
// These types are intentionally NOT supported in overloads - use runtime filtering instead

/**
 * Calculate the sum of numeric values.
 *
 * @param value - A single number or array of numbers
 * @param remove_na - Whether to exclude null/undefined values (when using mixed arrays)
 * @returns The sum of all numeric values
 *
 * @example
 * ```typescript
 * import { stats } from "@tidy-ts/dataframe";
 *
 * // Single value
 * stats.sum(5); // 5
 *
 * // Array of numbers
 * stats.sum([1, 2, 3, 4]); // 10
 *
 * // Array with nulls (requires remove_na flag)
 * stats.sum([1, 2, null, 4], true); // 7
 *
 * // Using with DataFrame columns
 * const df = createDataFrame([
 *   { value: 10 }, { value: 20 }, { value: 30 }
 * ]);
 * stats.sum(df.value); // 60
 * ```
 */
export function sum(value: number): number;
export function sum(values: CleanNumberArray): number;
export function sum(values: NumbersWithNullable, remove_na: true): number;
export function sum(values: CleanNumberIterable): number;
export function sum(
  values: NumbersWithNullableIterable,
  remove_na: true,
): number;
export function sum(
  values:
    | number
    | CleanNumberArray
    | NumbersWithNullable
    | CleanNumberIterable
    | NumbersWithNullableIterable
    | unknown[] // Runtime filtering fallback
    | Iterable<unknown>, // Runtime filtering fallback
  remove_na: boolean = false,
): number | null {
  if (typeof values === "number") return values;
  if (values === undefined || values === null) return null;

  // Check for mixed types first - return null unless remove_na is true
  if (hasMixedTypes(values) && !remove_na) {
    return null;
  }

  // Fast path: clean number[] (common case from materialized group columns)
  if (
    Array.isArray(values) && values.length &&
    values.every((v) => typeof v === "number")
  ) {
    const arr = values as number[];
    // Use WASM for very large arrays
    if (arr.length >= 1 << 15) {
      return sum_wasm(new Float64Array(arr));
    }
    // Simple loop for typical group sizes
    let s = 0;
    for (let i = 0; i < arr.length; i++) s += arr[i];
    return s;
  }

  // Handle arrays with potential nulls or iterables
  let processArray: (number | null)[];

  if (Array.isArray(values)) {
    processArray = values;
  } else if (Symbol.iterator in Object(values)) {
    // Materialize iterable to array - this should be rare now
    processArray = Array.from(values as Iterable<number | null>);
  } else {
    // Fallback
    processArray = values as (number | null)[];
  }

  // Process array with null handling
  let s = 0;
  let sawAny = false;

  for (let i = 0; i < processArray.length; i++) {
    const v = processArray[i];
    if (isNA(v)) continue;
    // Only add numeric values - skip non-numeric values like strings or booleans
    if (typeof v === "number") {
      s += v;
      sawAny = true;
    }
  }

  if (!sawAny) {
    if (remove_na) throw new Error("No valid values found to calculate sum");
    return null;
  }
  return s;
}
