import { unique_f64 } from "../wasm-loader.ts";
import { isNA } from "../utilities/mod.ts";

/**
 * Count the number of unique values in an array
 *
 * @param values - Array of numbers, strings, or single value
 * @returns The count of unique values
 *
 * @example
 * ```ts
 * uniqueCount(42) // Always returns 1 for single value
 * uniqueCount([1, 1, 2, 3, 3, 3]) // 3
 * uniqueCount(["a", "b", "a", "c"]) // 3
 * uniqueCount([null, 1, 2, null]) // 2
 * uniqueCount([]) // 0
 * ```
 */
export function uniqueCount(value: number | string): number;
export function uniqueCount(
  values: (number | string | null | undefined)[],
): number;
// NEW: accept iterables without breaking the API
export function uniqueCount(values: Iterable<number | string>): number;
export function uniqueCount(
  values: Iterable<number | string | null | undefined>,
): number;
export function uniqueCount(
  values:
    | number
    | string
    | (number | string | null | undefined)[]
    | Iterable<number | string | null | undefined>,
): number {
  // Handle single value case
  if (typeof values === "number" || typeof values === "string") {
    return 1; // Single value has 1 unique value
  }

  // Handle arrays with fast path
  if (Array.isArray(values)) {
    if (values.length === 0) return 0;

    // Filter out null/undefined values
    const validValues = values.filter((val) =>
      !isNA(val)
    ) as (number | string)[];
    if (validValues.length === 0) return 0;

    // Check if all values are numbers (use WASM for efficiency)
    if (validValues.every((val) => typeof val === "number")) {
      const floatArray = new Float64Array(validValues as number[]);
      const uniqueValues = unique_f64(floatArray);
      return uniqueValues.length;
    }

    // For mixed types or string arrays, use JavaScript Set
    const uniqueSet = new Set(validValues);
    return uniqueSet.size;
  }

  // Handle iterables - streaming approach with Set
  const uniqueSet = new Set<number | string>();
  let hasAnyValue = false;

  for (const val of values as Iterable<number | string | null | undefined>) {
    if (!isNA(val)) {
      uniqueSet.add(val as number | string);
      hasAnyValue = true;
    }
  }

  return hasAnyValue ? uniqueSet.size : 0;
}
