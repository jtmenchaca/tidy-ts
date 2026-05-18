export type CleanNumberArray = readonly number[];
export type NumbersWithNullable = (number | null | undefined)[] | readonly (number | null | undefined)[];
/** Options for filtering values in variance function */
export interface VarianceOptions {
    removeNull?: boolean;
    removeUndefined?: boolean;
    removeNaN?: boolean;
}
/**
 * Calculate the sample variance of an array of values (uses N-1 denominator)
 *
 * @param values - Array of numbers or single number
 * @param options - Optional object with removal flags
 * @param options.removeNull - If true, filters out null values (default: false)
 * @param options.removeUndefined - If true, filters out undefined values (default: false)
 * @param options.removeNaN - If true, filters out NaN values (default: false)
 * @returns Sample variance value or null if insufficient data
 *
 * @example
 * ```ts
 * variance(42) // Always returns 0 for single value
 * variance([1, 2, 3, 4, 5]) // sample variance
 * variance([1, null, 3]) // null (null present)
 * variance([1, null, 3], { removeNull: true }) // variance of [1, 3]
 * variance([1, NaN, 3]) // NaN (NaN propagates)
 * variance([1, NaN, 3], { removeNaN: true }) // variance of [1, 3]
 * ```
 */
export declare function variance(values: number, options?: VarianceOptions): number;
export declare function variance(values: Float64Array, options?: VarianceOptions): number;
export declare function variance(values: CleanNumberArray, options?: VarianceOptions): number;
export declare function variance(values: number[], options?: VarianceOptions): number;
export declare function variance(values: Iterable<number>, options?: VarianceOptions): number;
export declare function variance(values: NumbersWithNullable, options: {
    removeNull: true;
    removeUndefined: true;
}): number;
export declare function variance(values: (number | null)[] | readonly (number | null)[], options: {
    removeNull: true;
    removeNaN?: boolean;
    removeUndefined?: boolean;
}): number;
export declare function variance(values: (number | undefined)[] | readonly (number | undefined)[], options: {
    removeUndefined: true;
    removeNaN?: boolean;
    removeNull?: boolean;
}): number;
export declare function variance(values: NumbersWithNullable, options?: VarianceOptions): number | null;
