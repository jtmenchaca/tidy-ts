export type CleanNumberArray = readonly number[];
export type NumbersWithNullable = (number | null | undefined)[] | readonly (number | null | undefined)[];
/** Options for filtering values in sum function */
export interface SumOptions {
    removeNull?: boolean;
    removeUndefined?: boolean;
    removeNaN?: boolean;
}
/**
 * Calculate the sum of numeric values.
 *
 * @param values - A single number or array of numbers
 * @param options - Optional object with removal flags
 * @param options.removeNull - If true, filters out null values (default: false)
 * @param options.removeUndefined - If true, filters out undefined values (default: false)
 * @param options.removeNaN - If true, filters out NaN values (default: false)
 * @returns The sum of all numeric values, or null if no valid values
 *
 * @example
 * ```typescript
 * import { stats } from "@tidy-ts/dataframe";
 *
 * // Single value
 * stats.sum(5); // 5
 *
 * // Array of numbers
 * stats.sum([1, 2, 3, 4]); // 10
 *
 * // Array with nulls
 * stats.sum([1, 2, null, 4], { removeNull: true }); // 7
 *
 * // Array with NaN (propagates by default)
 * stats.sum([1, NaN, 3]); // NaN
 * stats.sum([1, NaN, 3], { removeNaN: true }); // 4
 * ```
 */
export declare function sum(values: number, options?: SumOptions): number;
export declare function sum(values: Float64Array, options?: SumOptions): number;
export declare function sum(values: CleanNumberArray, options?: SumOptions): number;
export declare function sum(values: number[], options?: SumOptions): number;
export declare function sum(values: Iterable<number>, options?: SumOptions): number;
export declare function sum(values: NumbersWithNullable, options: {
    removeNull: true;
    removeUndefined: true;
}): number;
export declare function sum(values: (number | null)[] | readonly (number | null)[], options: {
    removeNull: true;
    removeNaN?: boolean;
    removeUndefined?: boolean;
}): number;
export declare function sum(values: (number | undefined)[] | readonly (number | undefined)[], options: {
    removeUndefined: true;
    removeNaN?: boolean;
    removeNull?: boolean;
}): number;
export declare function sum(values: NumbersWithNullable, options?: SumOptions): number | null;
