export type CleanNumberArray = readonly number[];
export type NumbersWithNullable = (number | null | undefined)[] | readonly (number | null | undefined)[];
/** Options for filtering values in cumulative mean function */
export interface CummeanOptions {
    removeNull?: boolean;
    removeUndefined?: boolean;
    removeNaN?: boolean;
}
/**
 * Calculate cumulative mean of values.
 *
 * Returns an array where each element is the mean of all values up to that point.
 *
 * @param values - Array of numbers
 * @param options - Optional object with removal flags
 * @param options.removeNull - If true, filters out null values (default: false)
 * @param options.removeUndefined - If true, filters out undefined values (default: false)
 * @param options.removeNaN - If true, filters out NaN values (default: false)
 * @returns Array of cumulative means
 *
 * @example
 * ```ts
 * cummean([1, 2, 3, 4]) // [1, 1.5, 2, 2.5]
 * cummean([1, null, 3]) // [null, null, null] - null causes all results to be null
 * cummean([1, null, 3], { removeNull: true }) // [1, 1, 2]
 * cummean([1, NaN, 3]) // [1, NaN, NaN] - NaN propagates
 * cummean([1, NaN, 3], { removeNaN: true }) // [1, 1, 2]
 * ```
 */
export declare function cummean(values: number, options?: CummeanOptions): number;
export declare function cummean(values: CleanNumberArray, options?: CummeanOptions): number[];
export declare function cummean(values: number[], options?: CummeanOptions): number[];
export declare function cummean(values: NumbersWithNullable, options: {
    removeNull: true;
    removeUndefined: true;
}): number[];
export declare function cummean(values: (number | null)[] | readonly (number | null)[], options: {
    removeNull: true;
    removeNaN?: boolean;
    removeUndefined?: boolean;
}): number[];
export declare function cummean(values: (number | undefined)[] | readonly (number | undefined)[], options: {
    removeUndefined: true;
    removeNaN?: boolean;
    removeNull?: boolean;
}): number[];
export declare function cummean(values: NumbersWithNullable, options?: CummeanOptions): (number | null)[];
