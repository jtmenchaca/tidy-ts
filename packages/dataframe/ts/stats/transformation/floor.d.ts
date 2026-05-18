/**
 * Apply floor function to a single numeric value.
 *
 * Returns the largest integer less than or equal to the value.
 *
 * @param value - Single number
 * @returns Floor of the number
 *
 * @example
 * ```typescript
 * floor(1.7)  // 1
 * floor(-1.7) // -2
 * ```
 */
export declare function floor(value: number): number;
/**
 * Apply floor function to numeric values.
 *
 * Returns the largest integer less than or equal to each value.
 * Handles null/undefined values by passing them through unchanged.
 *
 * @param values - Array of numbers (can include null/undefined)
 * @returns Array with floor applied to each value
 *
 * @example
 * ```typescript
 * floor([1.1, 2.7, 3.9])  // [1, 2, 3]
 * floor([-1.1, -2.7])     // [-2, -3]
 * floor([1.5, null, 2.3]) // [1, null, 2]
 * ```
 */
export declare function floor(values: number[]): number[];
export declare function floor(values: (number | null)[]): (number | null)[];
export declare function floor(values: Iterable<number>): number[];
export declare function floor(values: Iterable<number | null>): (number | null)[];
