export type CleanNumberArray = readonly number[];
export type NumbersWithNullable = (number | null | undefined)[] | readonly (number | null | undefined)[];
/** Options for filtering values in cumulative functions */
export interface CumsumOptions {
    removeNull?: boolean;
    removeUndefined?: boolean;
    removeNaN?: boolean;
}
/**
 * Calculate cumulative sums for an array of values
 *
 * @param values - Array of numbers
 * @param options - Optional object with removal flags
 * @param options.removeNull - If true, filters out null values (default: false)
 * @param options.removeUndefined - If true, filters out undefined values (default: false)
 * @param options.removeNaN - If true, filters out NaN values (default: false)
 * @returns Array of cumulative sums
 *
 * @example
 * ```ts
 * cumsum([1, 2, 3, 4, 5]) // [1, 3, 6, 10, 15]
 * cumsum([1, null, 3]) // [null, null, null] - null causes all results to be null
 * cumsum([1, null, 3], { removeNull: true }) // [1, 1, 4]
 * cumsum([1, NaN, 3]) // [1, NaN, NaN] - NaN propagates
 * cumsum([1, NaN, 3], { removeNaN: true }) // [1, 1, 4]
 * ```
 */
export declare function cumsum(values: number, options?: CumsumOptions): number;
export declare function cumsum(values: CleanNumberArray, options?: CumsumOptions): number[];
export declare function cumsum(values: number[], options?: CumsumOptions): number[];
export declare function cumsum(values: NumbersWithNullable, options: {
    removeNull: true;
    removeUndefined: true;
}): number[];
export declare function cumsum(values: (number | null)[] | readonly (number | null)[], options: {
    removeNull: true;
    removeNaN?: boolean;
    removeUndefined?: boolean;
}): number[];
export declare function cumsum(values: (number | undefined)[] | readonly (number | undefined)[], options: {
    removeUndefined: true;
    removeNaN?: boolean;
    removeNull?: boolean;
}): number[];
export declare function cumsum(values: NumbersWithNullable, options?: CumsumOptions): (number | null)[];
