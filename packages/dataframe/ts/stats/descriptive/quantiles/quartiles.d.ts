import type { CleanNumberArray, CleanNumberIterable, NumbersWithNullable, NumbersWithNullableIterable } from "../../helpers.ts";
/** Options for filtering values in quartiles function */
export interface QuartilesOptions {
    removeNull?: boolean;
    removeUndefined?: boolean;
    removeNaN?: boolean;
}
/**
 * Calculate the quartiles (Q25, median/Q50, Q75) of values
 *
 * @param values - Array of numbers or single number
 * @param options - Optional object with removal flags
 * @param options.removeNull - If true, filters out null values (default: false)
 * @param options.removeUndefined - If true, filters out undefined values (default: false)
 * @param options.removeNaN - If true, filters out NaN values (default: false)
 * @returns Array of [Q25, Q50, Q75] or null if no valid values
 *
 * @example
 * ```ts
 * quartiles(42) // Always returns [42, 42, 42] for single value
 * quartiles([1, 2, 3, 4, 5]) // [2, 3, 4]
 * quartiles([1, null, 5]) // null (null present)
 * quartiles([1, null, 5], { removeNull: true }) // quartiles of [1, 5]
 * quartiles([1, NaN, 5]) // NaN propagates in result
 * quartiles([1, NaN, 5], { removeNaN: true }) // quartiles of [1, 5]
 * ```
 */
export declare function quartiles(value: number, options?: QuartilesOptions): [number, number, number];
export declare function quartiles(values: CleanNumberArray, options?: QuartilesOptions): [number, number, number];
export declare function quartiles(values: number[], options?: QuartilesOptions): [number, number, number];
export declare function quartiles(values: CleanNumberIterable, options?: QuartilesOptions): [number, number, number];
export declare function quartiles(values: NumbersWithNullable, options: {
    removeNull: true;
    removeUndefined: true;
}): [number, number, number];
export declare function quartiles(values: NumbersWithNullableIterable, options: {
    removeNull: true;
    removeUndefined: true;
}): [number, number, number];
export declare function quartiles(values: (number | null)[] | readonly (number | null)[], options: {
    removeNull: true;
    removeNaN?: boolean;
    removeUndefined?: boolean;
}): [number, number, number];
export declare function quartiles(values: (number | undefined)[] | readonly (number | undefined)[], options: {
    removeUndefined: true;
    removeNaN?: boolean;
    removeNull?: boolean;
}): [number, number, number];
export declare function quartiles(values: NumbersWithNullable, options?: QuartilesOptions): [number, number, number] | null;
export declare function quartiles(values: NumbersWithNullableIterable, options?: QuartilesOptions): [number, number, number] | null;
