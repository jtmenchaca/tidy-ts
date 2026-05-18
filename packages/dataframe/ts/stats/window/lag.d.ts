/**
 * Lag values by k positions (shift forward, filling with default).
 *
 * @param values - Array of values to lag
 * @param options - Optional lag options
 * @param options.k - Number of positions to lag (default: 1)
 * @param options.defaultValue - Value to fill missing positions (default: undefined)
 * @returns Array with values lagged by k positions
 *
 * @example
 * ```ts
 * lag([1, 2, 3, 4, 5])                          // [undefined, 1, 2, 3, 4]
 * lag([1, 2, 3, 4, 5], { k: 2 })                // [undefined, undefined, 1, 2, 3]
 * lag([1, 2, 3, 4, 5], { defaultValue: 0 })     // [0, 1, 2, 3, 4]
 * ```
 */
export interface LagOptions<T> {
    k?: number;
    defaultValue?: T;
}
export declare function lag<T>(values: readonly T[], options: LagOptions<T> & {
    defaultValue: T;
}): T[];
export declare function lag<T>(values: readonly T[], options?: LagOptions<T>): (T | undefined)[];
