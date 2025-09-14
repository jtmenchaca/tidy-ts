import { count_f64, count_i32, count_str } from "../wasm-loader.ts";

/**
 * Count occurrences of a specific value in an array (WASM-optimized version)
 *
 * @param values - Array of values to count
 * @param target - The value to count occurrences of
 * @returns The number of occurrences of the target value
 *
 * @example
 * ```ts
 * count_value([1, 2, 1, 3, 1], 1) // 3
 * count_value(["a", "b", "a"], "a") // 2
 * count_value([true, false, true], true) // 2
 * ```
 */
export function count_value<T>(values: T[] | Iterable<T>, target: T): number {
  // Handle iterables by materializing to array
  let processArray: T[];
  if (Array.isArray(values)) {
    processArray = values;
  } else {
    processArray = Array.from(values);
  }

  if (processArray.length === 0) return 0;

  if (typeof target === "number") {
    // Filter to only numbers for WASM function
    const numericValues: number[] = [];
    for (const v of processArray) {
      if (typeof v === "number") {
        numericValues.push(v);
      }
    }
    const floatArray = new Float64Array(numericValues);
    return count_f64(floatArray, target as number);
  } else if (typeof target === "string") {
    // Filter to only strings for WASM function
    const stringValues: string[] = [];
    for (const v of processArray) {
      if (typeof v === "string") {
        stringValues.push(v);
      }
    }
    return count_str(stringValues, target as string);
  } else if (typeof target === "boolean") {
    // Filter to only booleans for WASM function
    const booleanValues: boolean[] = [];
    for (const v of processArray) {
      if (typeof v === "boolean") {
        booleanValues.push(v);
      }
    }
    const boolAsNumbers = booleanValues.map((v) => v ? 1 : 0);
    const int32Array = new Int32Array(boolAsNumbers);
    const targetInt = (target as boolean) ? 1 : 0;
    return count_i32(int32Array, targetInt);
  } else {
    // Fallback to JavaScript implementation
    return processArray.filter((val) => val === target).length;
  }
}
