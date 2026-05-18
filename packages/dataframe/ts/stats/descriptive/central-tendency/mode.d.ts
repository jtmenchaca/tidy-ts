export type CleanNumberArray = readonly number[];
export type NumbersWithNullable = (number | null | undefined)[] | readonly (number | null | undefined)[];
/** Options for filtering values in mode function */
export interface ModeOptions {
    removeNull?: boolean;
    removeUndefined?: boolean;
    removeNaN?: boolean;
}
/**
 * Calculate the mode (most frequent value) of an array
 *
 * @param values - Array of numbers or single number
 * @param options - Optional object with removal flags
 * @param options.removeNull - If true, filters out null values (default: false)
 * @param options.removeUndefined - If true, filters out undefined values (default: false)
 * @param options.removeNaN - If true, filters out NaN values (default: false)
 * @returns The mode value, or null if no valid values
 *
 * @example
 * ```ts
 * mode(42) // Always returns the single value
 * mode([1, 1, 2, 3, 3, 3]) // 3
 * mode([null, 2, 3]) // null (null present)
 * mode([null, 2, 3], { removeNull: true }) // 2 or 3 (most frequent)
 * mode([1, NaN, 3]) // NaN (NaN propagates)
 * mode([1, NaN, 3], { removeNaN: true }) // 1 or 3
 * ```
 */
export declare function mode(values: number, options?: ModeOptions): number;
export declare function mode(values: CleanNumberArray, options?: ModeOptions): number;
export declare function mode(values: number[], options?: ModeOptions): number;
export declare function mode(values: Iterable<number>, options?: ModeOptions): number;
export declare function mode(values: NumbersWithNullable, options: {
    removeNull: true;
    removeUndefined: true;
}): number;
export declare function mode(values: (number | null)[] | readonly (number | null)[], options: {
    removeNull: true;
    removeNaN?: boolean;
    removeUndefined?: boolean;
}): number;
export declare function mode(values: (number | undefined)[] | readonly (number | undefined)[], options: {
    removeUndefined: true;
    removeNaN?: boolean;
    removeNull?: boolean;
}): number;
export declare function mode(values: NumbersWithNullable, options?: ModeOptions): number | null;
/**
 * Calculate the frequency count of the mode (most frequent value) of an array
 *
 * @param values - Array of numbers
 * @param options - Optional object with removal flags
 * @returns The count of the mode value, or 0 if no valid values
 *
 * @example
 * ```ts
 * modeCount([1, 1, 2, 3, 3, 3]) // 3
 * modeCount([]) // 0
 * ```
 */
export declare function modeCount(values: CleanNumberArray, options?: ModeOptions): number;
export declare function modeCount(values: NumbersWithNullable, options?: ModeOptions): number;
export declare function modeCount(values: Iterable<number>, options?: ModeOptions): number;
