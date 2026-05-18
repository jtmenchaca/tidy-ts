/**
 * Parallel maximum — elementwise max of an array against a scalar or another array.
 *
 * Equivalent to R's `pmax()`. Each element of the input is compared against
 * the corresponding element (or scalar), and the larger value is returned.
 *
 * Null/undefined values pass through as null. NaN propagates as NaN.
 *
 * @param values - Array of numbers (may include null/undefined)
 * @param other - Scalar number or array of numbers to compare against
 * @returns Array of elementwise maximums
 *
 * @example
 * ```ts
 * pmax([1, 5, 3], 4)          // [4, 5, 4]
 * pmax([-1, 2, -3], 0)        // [0, 2, 0]
 * pmax([1, 5, 3], [2, 3, 7])  // [2, 5, 7]
 * pmax([1, null, 3], 0)       // [1, null, 3]
 * ```
 */
export declare function pmax(values: number[], other: number): number[];
export declare function pmax(values: readonly number[], other: number): number[];
export declare function pmax(values: (number | null)[] | readonly (number | null)[], other: number): (number | null)[];
export declare function pmax(values: (number | undefined)[] | readonly (number | undefined)[], other: number): (number | null)[];
export declare function pmax(values: (number | null | undefined)[] | readonly (number | null | undefined)[], other: number): (number | null)[];
export declare function pmax(values: Iterable<number>, other: number): number[];
export declare function pmax(values: Iterable<number | null | undefined>, other: number): (number | null)[];
export declare function pmax(values: number[], other: number[]): number[];
export declare function pmax(values: readonly number[], other: readonly number[]): number[];
export declare function pmax(values: (number | null | undefined)[] | readonly (number | null | undefined)[], other: (number | null | undefined)[] | readonly (number | null | undefined)[]): (number | null)[];
