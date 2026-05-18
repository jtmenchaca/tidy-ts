/** Options for filtering values in covariance function */
export interface CovarianceOptions {
    removeNull?: boolean;
    removeUndefined?: boolean;
    removeNaN?: boolean;
}
/**
 * Calculate the sample covariance between two arrays of values
 *
 * @param x - First array of numbers
 * @param y - Second array of numbers
 * @param options - Optional object with removal flags
 * @param options.removeNull - If true, filters out pairs where either value is null (default: false)
 * @param options.removeUndefined - If true, filters out pairs where either value is undefined (default: false)
 * @param options.removeNaN - If true, filters out pairs where either value is NaN (default: false)
 * @returns Sample covariance between x and y, or null if no valid pairs
 *
 * @example
 * ```ts
 * covariance([1, 2, 3], [1, 2, 3]) // 1
 * covariance([1, 2, 3], [3, 2, 1]) // -1
 * covariance([1, null, 3], [1, 2, 3]) // null (null present)
 * covariance([1, null, 3], [1, 2, 3], { removeNull: true }) // covariance of pairs (1,1) and (3,3)
 * covariance([1, NaN, 3], [1, 2, 3]) // NaN (NaN propagates)
 * covariance([1, NaN, 3], [1, 2, 3], { removeNaN: true }) // covariance of pairs (1,1) and (3,3)
 * ```
 */
export declare function covariance(x: number[], y: number[], options?: CovarianceOptions): number;
export declare function covariance(x: readonly number[], y: readonly number[], options?: CovarianceOptions): number;
export declare function covariance(x: Iterable<number>, y: Iterable<number>, options?: CovarianceOptions): number;
export declare function covariance(x: (number | null | undefined)[], y: (number | null | undefined)[], options: {
    removeNull: true;
    removeUndefined: true;
}): number;
export declare function covariance(x: (number | null)[] | readonly (number | null)[], y: (number | null)[] | readonly (number | null)[], options: {
    removeNull: true;
    removeNaN?: boolean;
    removeUndefined?: boolean;
}): number;
export declare function covariance(x: (number | undefined)[] | readonly (number | undefined)[], y: (number | undefined)[] | readonly (number | undefined)[], options: {
    removeUndefined: true;
    removeNaN?: boolean;
    removeNull?: boolean;
}): number;
export declare function covariance(x: (number | null | undefined)[], y: (number | null | undefined)[], options?: CovarianceOptions): number | null;
export declare function covariance(x: Iterable<number | null | undefined>, y: Iterable<number | null | undefined>, options?: CovarianceOptions): number | null;
