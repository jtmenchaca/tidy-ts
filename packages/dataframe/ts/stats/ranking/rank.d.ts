/**
 * Calculate ranks for an array of values
 *
 * @param values - Array of numbers
 * @param ties - How to handle ties: "average" (default), "min", "max", "dense"
 * @param descending - Whether to rank in descending order (default: false = ascending)
 * @returns Array of ranks (1-based by default)
 *
 * @example
 * ```ts
 * rank([3, 1, 4, 1, 5]) // [3, 1.5, 4, 1.5, 5]
 * rank([3, 1, 4, 1, 5], "average") // [3, 1.5, 4, 1.5, 5]
 * rank([3, 1, 4, 1, 5], "min") // [3, 1, 4, 1, 5]
 * rank([3, 1, 4, 1, 5], "max") // [3, 2, 4, 2, 5]
 * rank([3, 1, 4, 1, 5], "average", true) // descending order
 * ```
 */
/**
 * Find the rank of a specific target value within an array
 *
 * @param values - Array of numbers
 * @param target - The value to find the rank for
 * @param ties - How to handle ties: "average" (default), "min", "max", "dense"
 * @param descending - Whether to rank in descending order (default: false = ascending)
 * @returns Rank of the target value (1-based)
 *
 * @example
 * ```ts
 * rank([3, 1, 4, 1, 5], 3) // 3 (3 is the 3rd smallest value)
 * rank([3, 1, 4, 1, 5], 1) // 1 (1 is the smallest value)
 * rank([3, 1, 4, 1, 5], 5) // 5 (5 is the largest value)
 * ```
 */
export declare function rank(value: number): number;
export declare function rank(values: number[]): number[];
export declare function rank(values: (number | null | undefined)[], ties?: "average" | "min" | "max" | "dense", descending?: boolean): (number | null)[];
export declare function rank(values: Iterable<number>): number[];
export declare function rank(values: Iterable<number | null | undefined>, ties?: "average" | "min" | "max" | "dense", descending?: boolean): (number | null)[];
export declare function rank(values: number[], target: number): number;
export declare function rank(values: (number | null | undefined)[], target: number): number | null;
export declare function rank(values: Iterable<number>, target: number): number;
export declare function rank(values: Iterable<number | null | undefined>, target: number): number | null;
