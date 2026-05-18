import type { CleanNumberArray, CleanNumberIterable, NumbersWithNullable, NumbersWithNullableIterable } from "../../helpers.ts";
/** Options for filtering values in iqr function */
export interface IqrOptions {
    removeNull?: boolean;
    removeUndefined?: boolean;
    removeNaN?: boolean;
}
/**
 * Calculate the interquartile range (IQR) of values
 *
 * @param values - Array of numbers or single number
 * @param options - Optional object with removal flags
 * @param options.removeNull - If true, filters out null values (default: false)
 * @param options.removeUndefined - If true, filters out undefined values (default: false)
 * @param options.removeNaN - If true, filters out NaN values (default: false)
 * @returns IQR value (Q75 - Q25) or null if no valid values
 *
 * @example
 * ```ts
 * iqr(42) // Always returns 0 for single value
 * iqr([1, 2, 3, 4, 5]) // 2 (Q75 - Q25 = 4 - 2)
 * iqr([1, null, 5]) // null (null present)
 * iqr([1, null, 5], { removeNull: true }) // IQR of [1, 5]
 * iqr([1, NaN, 5]) // NaN (NaN propagates)
 * iqr([1, NaN, 5], { removeNaN: true }) // IQR of [1, 5]
 * ```
 */
export declare function iqr(value: number, options?: IqrOptions): number;
export declare function iqr(values: CleanNumberArray, options?: IqrOptions): number;
export declare function iqr(values: number[], options?: IqrOptions): number;
export declare function iqr(values: CleanNumberIterable, options?: IqrOptions): number;
export declare function iqr(values: NumbersWithNullable, options: {
    removeNull: true;
    removeUndefined: true;
}): number;
export declare function iqr(values: NumbersWithNullableIterable, options: {
    removeNull: true;
    removeUndefined: true;
}): number;
export declare function iqr(values: (number | null)[] | readonly (number | null)[], options: {
    removeNull: true;
    removeNaN?: boolean;
    removeUndefined?: boolean;
}): number;
export declare function iqr(values: (number | undefined)[] | readonly (number | undefined)[], options: {
    removeUndefined: true;
    removeNaN?: boolean;
    removeNull?: boolean;
}): number;
export declare function iqr(values: NumbersWithNullable, options?: IqrOptions): number | null;
export declare function iqr(values: NumbersWithNullableIterable, options?: IqrOptions): number | null;
