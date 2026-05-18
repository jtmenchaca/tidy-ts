import { type VarianceOptions } from "./variance.ts";
export type CleanNumberArray = readonly number[];
export type NumbersWithNullable = (number | null | undefined)[] | readonly (number | null | undefined)[];
/** Options for filtering values in sd function */
export type SdOptions = VarianceOptions;
/**
 * Calculate the sample standard deviation of an array of values
 *
 * @param values - Array of numbers or single number
 * @param options - Optional object with removal flags
 * @param options.removeNull - If true, filters out null values (default: false)
 * @param options.removeUndefined - If true, filters out undefined values (default: false)
 * @param options.removeNaN - If true, filters out NaN values (default: false)
 * @returns Sample standard deviation value or null if insufficient data
 *
 * @example
 * ```ts
 * sd(42) // Always returns 0 for single value
 * sd([1, 2, 3, 4, 5]) // sample standard deviation
 * sd([1, null, 3]) // null (null present)
 * sd([1, null, 3], { removeNull: true }) // std dev of [1, 3]
 * sd([1, NaN, 3]) // NaN (NaN propagates)
 * sd([1, NaN, 3], { removeNaN: true }) // std dev of [1, 3]
 * ```
 */
export declare function sd(values: number, options?: SdOptions): number;
export declare function sd(values: Float64Array, options?: SdOptions): number;
export declare function sd(values: CleanNumberArray, options?: SdOptions): number;
export declare function sd(values: number[], options?: SdOptions): number;
export declare function sd(values: Iterable<number>, options?: SdOptions): number;
export declare function sd(values: NumbersWithNullable, options: {
    removeNull: true;
    removeUndefined: true;
}): number;
export declare function sd(values: (number | null)[] | readonly (number | null)[], options: {
    removeNull: true;
    removeNaN?: boolean;
    removeUndefined?: boolean;
}): number;
export declare function sd(values: (number | undefined)[] | readonly (number | undefined)[], options: {
    removeUndefined: true;
    removeNaN?: boolean;
    removeNull?: boolean;
}): number;
export declare function sd(values: NumbersWithNullable, options?: SdOptions): number | null;
