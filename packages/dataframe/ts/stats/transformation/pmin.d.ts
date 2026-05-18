/**
 * Parallel minimum — elementwise min of an array against a scalar or another array.
 *
 * Equivalent to R's `pmin()`. Each element of the input is compared against
 * the corresponding element (or scalar), and the smaller value is returned.
 *
 * Null/undefined values pass through as null. NaN propagates as NaN.
 *
 * @param values - Array of numbers (may include null/undefined)
 * @param other - Scalar number or array of numbers to compare against
 * @returns Array of elementwise minimums
 *
 * @example
 * ```ts
 * pmin([1, 5, 3], 4)          // [1, 4, 3]
 * pmin([10, 2, 30], 5)        // [5, 2, 5]
 * pmin([1, 5, 3], [2, 3, 7])  // [1, 3, 3]
 * pmin([1, null, 3], 0)       // [0, null, 0]
 * ```
 */
export declare function pmin(values: number[], other: number): number[];
export declare function pmin(values: readonly number[], other: number): number[];
export declare function pmin(values: (number | null)[] | readonly (number | null)[], other: number): (number | null)[];
export declare function pmin(values: (number | undefined)[] | readonly (number | undefined)[], other: number): (number | null)[];
export declare function pmin(values: (number | null | undefined)[] | readonly (number | null | undefined)[], other: number): (number | null)[];
export declare function pmin(values: Iterable<number>, other: number): number[];
export declare function pmin(values: Iterable<number | null | undefined>, other: number): (number | null)[];
export declare function pmin(values: number[], other: number[]): number[];
export declare function pmin(values: readonly number[], other: readonly number[]): number[];
export declare function pmin(values: (number | null | undefined)[] | readonly (number | null | undefined)[], other: (number | null | undefined)[] | readonly (number | null | undefined)[]): (number | null)[];
