/**
 * Apply ceiling function to a single numeric value.
 *
 * Returns the smallest integer greater than or equal to the value.
 *
 * @param value - Single number
 * @returns Ceiling of the number
 *
 * @example
 * ```typescript
 * ceiling(1.2)  // 2
 * ceiling(-1.2) // -1
 * ```
 */
export declare function ceiling(value: number): number;
/**
 * Apply ceiling function to numeric values.
 *
 * Returns the smallest integer greater than or equal to each value.
 * Handles null/undefined values by passing them through unchanged.
 *
 * @param values - Array of numbers (can include null/undefined)
 * @returns Array with ceiling applied to each value
 *
 * @example
 * ```typescript
 * ceiling([1.1, 2.7, 3.9])  // [2, 3, 4]
 * ceiling([-1.1, -2.7])     // [-1, -2]
 * ceiling([1.5, null, 2.3]) // [2, null, 3]
 * ```
 */
export declare function ceiling(values: number[]): number[];
export declare function ceiling(values: (number | null)[]): (number | null)[];
export declare function ceiling(values: Iterable<number>): number[];
export declare function ceiling(values: Iterable<number | null>): (number | null)[];
