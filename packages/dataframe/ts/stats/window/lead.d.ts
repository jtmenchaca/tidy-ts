/**
 * Lead values by k positions (shift backward, filling with default).
 *
 * @param values - Array of values to lead
 * @param options - Optional lead options
 * @param options.k - Number of positions to lead (default: 1)
 * @param options.defaultValue - Value to fill missing positions (default: undefined)
 * @returns Array with values led by k positions
 *
 * @example
 * ```ts
 * lead([1, 2, 3, 4, 5])                          // [2, 3, 4, 5, undefined]
 * lead([1, 2, 3, 4, 5], { k: 2 })                // [3, 4, 5, undefined, undefined]
 * lead([1, 2, 3, 4, 5], { defaultValue: 0 })     // [2, 3, 4, 5, 0]
 * ```
 */
export interface LeadOptions<T> {
    k?: number;
    defaultValue?: T;
}
export declare function lead<T>(values: readonly T[], options: LeadOptions<T> & {
    defaultValue: T;
}): T[];
export declare function lead<T>(values: readonly T[], options?: LeadOptions<T>): (T | undefined)[];
