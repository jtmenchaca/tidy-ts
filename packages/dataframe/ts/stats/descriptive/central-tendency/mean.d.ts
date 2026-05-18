export type CleanNumberArray = readonly number[];
export type NumbersWithNullable = (number | null | undefined)[] | readonly (number | null | undefined)[];
/** Options for filtering values in mean function */
export interface MeanOptions {
    removeNull?: boolean;
    removeUndefined?: boolean;
    removeNaN?: boolean;
}
/**
 * Calculate the arithmetic mean (average) of numeric values.
 *
 * @param values - A single number or array of numbers
 * @param options - Optional object with removal flags
 * @param options.removeNull - If true, filters out null values (default: false)
 * @param options.removeUndefined - If true, filters out undefined values (default: false)
 * @param options.removeNaN - If true, filters out NaN values (default: false)
 * @returns The arithmetic mean of all numeric values, or null if no valid values
 *
 * @example
 * ```typescript
 * import { stats } from "@tidy-ts/dataframe";
 *
 * // Single value
 * stats.mean(5); // 5
 *
 * // Array of numbers
 * stats.mean([1, 2, 3, 4]); // 2.5
 *
 * // Array with nulls
 * stats.mean([1, 2, null, 4], { removeNull: true }); // 2.33
 *
 * // Array with NaN (propagates by default)
 * stats.mean([1, NaN, 3]); // NaN
 * stats.mean([1, NaN, 3], { removeNaN: true }); // 2
 * ```
 */
export declare function mean(values: number, options?: MeanOptions): number;
export declare function mean(values: Float64Array, options?: MeanOptions): number;
export declare function mean(values: CleanNumberArray, options?: MeanOptions): number;
export declare function mean(values: number[], options?: MeanOptions): number;
export declare function mean(values: Iterable<number>, options?: MeanOptions): number;
export declare function mean(values: NumbersWithNullable, options: {
    removeNull: true;
    removeUndefined: true;
}): number;
export declare function mean(values: (number | null)[] | readonly (number | null)[], options: {
    removeNull: true;
    removeNaN?: boolean;
    removeUndefined?: boolean;
}): number;
export declare function mean(values: (number | undefined)[] | readonly (number | undefined)[], options: {
    removeUndefined: true;
    removeNaN?: boolean;
    removeNull?: boolean;
}): number;
export declare function mean(values: NumbersWithNullable, options?: MeanOptions): number | null;
