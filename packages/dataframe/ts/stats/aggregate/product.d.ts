export type CleanNumberArray = readonly number[];
export type NumbersWithNullable = (number | null | undefined)[] | readonly (number | null | undefined)[];
/** Options for filtering values in product function */
export interface ProductOptions {
    removeNull?: boolean;
    removeUndefined?: boolean;
    removeNaN?: boolean;
}
/**
 * Calculate the product (multiplication) of all values
 *
 * @param values - Array of numbers or single number
 * @param options - Optional object with removal flags
 * @param options.removeNull - If true, filters out null values (default: false)
 * @param options.removeUndefined - If true, filters out undefined values (default: false)
 * @param options.removeNaN - If true, filters out NaN values (default: false)
 * @returns Product of all values, or null if no valid values
 *
 * @example
 * ```ts
 * product(5) // 5
 * product([1, 2, 3, 4]) // 24
 * product([2, null, 3]) // null (due to null)
 * product([2, null, 3], { removeNull: true }) // 6
 * product([1, NaN, 3]) // NaN (NaN propagates)
 * product([1, NaN, 3], { removeNaN: true }) // 3
 * ```
 */
export declare function product(values: number, options?: ProductOptions): number;
export declare function product(values: CleanNumberArray, options?: ProductOptions): number;
export declare function product(values: number[], options?: ProductOptions): number;
export declare function product(values: Iterable<number>, options?: ProductOptions): number;
export declare function product(values: NumbersWithNullable, options: {
    removeNull: true;
    removeUndefined: true;
}): number;
export declare function product(values: (number | null)[] | readonly (number | null)[], options: {
    removeNull: true;
    removeNaN?: boolean;
    removeUndefined?: boolean;
}): number;
export declare function product(values: (number | undefined)[] | readonly (number | undefined)[], options: {
    removeUndefined: true;
    removeNaN?: boolean;
    removeNull?: boolean;
}): number;
export declare function product(values: NumbersWithNullable, options?: ProductOptions): number | null;
