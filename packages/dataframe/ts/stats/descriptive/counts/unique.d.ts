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
export declare function unique<T>(values: T[]): T[];
export declare function unique<T>(values: Iterable<T>): T[];
