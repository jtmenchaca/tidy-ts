export type CleanNumberArray = readonly number[];
export type NumbersWithNullable = (number | null | undefined)[] | readonly (number | null | undefined)[];
/** Options for filtering values in range function */
export interface RangeOptions {
    removeNull?: boolean;
    removeUndefined?: boolean;
    removeNaN?: boolean;
}
/**
 * Calculate the range of values (max - min)
 *
 * @param values - Array of numbers, or single number
 * @param options - Optional object with removal flags
 * @param options.removeNull - If true, filters out null values (default: false)
 * @param options.removeUndefined - If true, filters out undefined values (default: false)
 * @param options.removeNaN - If true, filters out NaN values (default: false)
 * @returns Range value or null if no valid values
 *
 * @example
 * ```ts
 * range(42) // Always returns 0 for single value
 * range([1, 5, 3, 9, 2]) // 8 (9 - 1)
 * range([1, null, 5]) // null (null present)
 * range([1, null, 5], { removeNull: true }) // 4 (5 - 1)
 * range([1, NaN, 5]) // NaN (NaN propagates)
 * range([1, NaN, 5], { removeNaN: true }) // 4
 * ```
 */
export declare function range(values: number, options?: RangeOptions): number;
export declare function range(values: CleanNumberArray, options?: RangeOptions): number;
export declare function range(values: number[], options?: RangeOptions): number;
export declare function range(values: Iterable<number>, options?: RangeOptions): number;
export declare function range(values: NumbersWithNullable, options: {
    removeNull: true;
    removeUndefined: true;
}): number;
export declare function range(values: (number | null)[] | readonly (number | null)[], options: {
    removeNull: true;
    removeNaN?: boolean;
    removeUndefined?: boolean;
}): number;
export declare function range(values: (number | undefined)[] | readonly (number | undefined)[], options: {
    removeUndefined: true;
    removeNaN?: boolean;
    removeNull?: boolean;
}): number;
export declare function range(values: NumbersWithNullable, options?: RangeOptions): number | null;
