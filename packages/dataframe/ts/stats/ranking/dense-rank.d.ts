/**
 * Calculate dense rank of values (no gaps in ranking).
 *
 * @param values - Array of values to rank
 * @param options - Ranking options
 * @returns Array of dense ranks
 *
 * @example
 * ```ts
 * denseRank([10, 20, 20, 30])  // [1, 2, 2, 3] (no gap after ties)
 * denseRank([5, 3, 8, 3, 1])   // [3, 2, 4, 2, 1]
 *
 * // Descending order
 * denseRank([10, 20, 20, 30], { desc: true })  // [4, 3, 3, 1]
 *
 * // Use in mutate for ranking
 * df.mutate({
 *   dense_rank: row => denseRank(df.score)
 * });
 * ```
 *
 * @remarks
 * - Unlike regular rank, dense rank has no gaps after tied values
 * - If values are [10, 20, 20, 30], regular rank is [1, 2, 2, 4] but dense rank is [1, 2, 2, 3]
 * - Handles null/undefined by assigning them the lowest rank
 * - Useful when you want consecutive rank numbers without gaps
 */
export declare function denseRank<T>(values: readonly T[]): number[];
export declare function denseRank<T>(values: readonly (T | null | undefined)[], options: {
    desc?: boolean;
}): number[];
export declare function denseRank<T>(values: readonly (T | null | undefined)[], target: T): number | null;
export declare function denseRank<T>(values: readonly (T | null | undefined)[], target: T, options: {
    desc?: boolean;
}): number | null;
