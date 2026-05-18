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
export declare function count_value<T>(values: T[] | Iterable<T>, target: T): number;
