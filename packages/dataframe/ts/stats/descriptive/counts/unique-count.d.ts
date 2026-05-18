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
export declare function uniqueCount(value: number | string): number;
export declare function uniqueCount(values: (number | string | null | undefined)[]): number;
export declare function uniqueCount(values: Iterable<number | string>): number;
export declare function uniqueCount(values: Iterable<number | string | null | undefined>): number;
