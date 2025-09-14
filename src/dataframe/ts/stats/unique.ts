import { unique_f64, unique_i32, unique_str } from "../wasm-loader.ts";

/**
 * Get unique values from an array (WASM-optimized version).
 *
 * @param values - Array of values to get unique values from
 * @returns Array of unique values in order of first appearance
 *
 * @example
 * ```ts
 * unique([1, 2, 1, 3, 2]) // [1, 2, 3]
 * unique(["a", "b", "a", "c"]) // ["a", "b", "c"]
 * unique([true, false, true]) // [true, false]
 * ```
 */
export function unique<T>(values: T[]): T[];
export function unique<T>(values: Iterable<T>): T[];
export function unique<T>(values: T[] | Iterable<T>): T[] {
  // Handle iterables by materializing to array
  const processArray = Array.isArray(values) ? values : Array.from(values);
  if (processArray.length === 0) return [];

  // Check for mixed types (null/undefined mixed with other types)
  const hasNullOrUndefined = processArray.some((v) =>
    v === null || v === undefined
  );

  // Determine the type and use appropriate WASM function
  const firstValue = processArray[0];

  if (typeof firstValue === "number" && !hasNullOrUndefined) {
    // Use Float64Array for numbers (only if no null/undefined)
    const floatArray = new Float64Array(processArray as number[]);
    const uniqueFloats = unique_f64(floatArray);
    return Array.from(uniqueFloats) as T[];
  } else if (typeof firstValue === "string" && !hasNullOrUndefined) {
    // Use string array directly (only if no null/undefined)
    const uniqueStrings = unique_str(processArray as string[]);
    return uniqueStrings as T[];
  } else if (typeof firstValue === "boolean" && !hasNullOrUndefined) {
    // Convert booleans to numbers (only if no null/undefined)
    const boolAsNumbers = (processArray as boolean[]).map((v) => v ? 1 : 0);
    const int32Array = new Int32Array(boolAsNumbers);
    const uniqueInts = unique_i32(int32Array);
    const uniqueBools = Array.from(uniqueInts).map((v) => v === 1);
    return uniqueBools as T[];
  } else {
    // Fallback to JavaScript implementation for complex types or mixed types
    return Array.from(new Set(processArray));
  }
}
