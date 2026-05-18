export type CleanNumberArray = readonly number[];
export type NumbersWithNullable = (number | null | undefined)[] | readonly (number | null | undefined)[];
/** Options for filtering values in cumulative product function */
export interface CumprodOptions {
    removeNull?: boolean;
    removeUndefined?: boolean;
    removeNaN?: boolean;
}
/**
 * Calculate cumulative product of numeric values
 *
 * @param values - Array of numbers
 * @param options - Optional object with removal flags
 * @param options.removeNull - If true, filters out null values (default: false)
 * @param options.removeUndefined - If true, filters out undefined values (default: false)
 * @param options.removeNaN - If true, filters out NaN values (default: false)
 * @returns Array of cumulative products
 *
 * @example
 * ```ts
 * cumprod([1, 2, 3, 4]) // [1, 2, 6, 24]
 * cumprod([1, null, 3]) // [null, null, null] - null causes all results to be null
 * cumprod([1, null, 3], { removeNull: true }) // [1, 1, 3]
 * cumprod([1, NaN, 3]) // [1, NaN, NaN] - NaN propagates
 * cumprod([1, NaN, 3], { removeNaN: true }) // [1, 1, 3]
 * ```
 */
export declare function cumprod(values: number, options?: CumprodOptions): number;
export declare function cumprod(values: CleanNumberArray, options?: CumprodOptions): number[];
export declare function cumprod(values: number[], options?: CumprodOptions): number[];
export declare function cumprod(values: NumbersWithNullable, options: {
    removeNull: true;
    removeUndefined: true;
}): number[];
export declare function cumprod(values: (number | null)[] | readonly (number | null)[], options: {
    removeNull: true;
    removeNaN?: boolean;
    removeUndefined?: boolean;
}): number[];
export declare function cumprod(values: (number | undefined)[] | readonly (number | undefined)[], options: {
    removeUndefined: true;
    removeNaN?: boolean;
    removeNull?: boolean;
}): number[];
export declare function cumprod(values: NumbersWithNullable, options?: CumprodOptions): (number | null)[];
