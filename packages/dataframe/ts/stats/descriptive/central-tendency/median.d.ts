export type CleanNumberArray = readonly number[];
export type NumbersWithNullable = (number | null | undefined)[] | readonly (number | null | undefined)[];
/** Options for filtering values in median function */
export interface MedianOptions {
    removeNull?: boolean;
    removeUndefined?: boolean;
    removeNaN?: boolean;
}
/**
 * Calculate the median of an array of values
 *
 * @param values - Array of numbers, or single number
 * @param options - Optional object with removal flags
 * @param options.removeNull - If true, filters out null values (default: false)
 * @param options.removeUndefined - If true, filters out undefined values (default: false)
 * @param options.removeNaN - If true, filters out NaN values (default: false)
 * @returns The median value, or null if no valid values
 *
 * @example
 * ```ts
 * median(42) // Always returns 42 for single value
 * median([1, 2, 3, 4, 5]) // 3
 * median([1, 2, 3, 4]) // 2.5
 * median([null, 2, 3]) // null (null present)
 * median([null, 2, 3], { removeNull: true }) // 2.5
 * median([1, NaN, 3]) // NaN (NaN propagates)
 * median([1, NaN, 3], { removeNaN: true }) // 2
 * ```
 */
export declare function median(values: number, options?: MedianOptions): number;
export declare function median(values: Float64Array, options?: MedianOptions): number;
export declare function median(values: CleanNumberArray, options?: MedianOptions): number;
export declare function median(values: number[], options?: MedianOptions): number;
export declare function median(values: Iterable<number>, options?: MedianOptions): number;
export declare function median(values: NumbersWithNullable, options: {
    removeNull: true;
    removeUndefined: true;
}): number;
export declare function median(values: (number | null)[] | readonly (number | null)[], options: {
    removeNull: true;
    removeNaN?: boolean;
    removeUndefined?: boolean;
}): number;
export declare function median(values: (number | undefined)[] | readonly (number | undefined)[], options: {
    removeUndefined: true;
    removeNaN?: boolean;
    removeNull?: boolean;
}): number;
export declare function median(values: NumbersWithNullable, options?: MedianOptions): number | null;
