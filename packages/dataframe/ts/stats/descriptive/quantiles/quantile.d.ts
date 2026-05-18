export type CleanNumberArray = readonly number[];
export type NumbersWithNullable = (number | null | undefined)[] | readonly (number | null | undefined)[];
/** Options for filtering values in quantile function */
export interface QuantileOptions {
    removeNull?: boolean;
    removeUndefined?: boolean;
    removeNaN?: boolean;
}
/**
 * Calculate quantiles of an array of values
 * Uses R's Type 7 algorithm (default)
 *
 * @param data - Array of numbers or single number
 * @param probs - Probability value(s) between 0 and 1
 * @param options - Optional object with removal flags
 * @param options.removeNull - If true, filters out null values (default: false)
 * @param options.removeUndefined - If true, filters out undefined values (default: false)
 * @param options.removeNaN - If true, filters out NaN values (default: false)
 * @returns Quantile value(s)
 *
 * @example
 * ```ts
 * quantile([1, 2, 3, 4, 5], 0.5) // 3 (median)
 * quantile([1, 2, 3, 4, 5], [0.25, 0.75]) // [2, 4]
 * quantile([1, null, 5], 0.5) // null (null present)
 * quantile([1, null, 5], 0.5, { removeNull: true }) // 3
 * quantile([1, NaN, 5], 0.5) // NaN (NaN propagates)
 * quantile([1, NaN, 5], 0.5, { removeNaN: true }) // 3
 * ```
 */
export declare function quantile(data: number, probs: number, options?: QuantileOptions): number;
export declare function quantile(data: number, probs: number[], options?: QuantileOptions): number[];
export declare function quantile(data: Float64Array, probs: number, options?: QuantileOptions): number;
export declare function quantile(data: Float64Array, probs: number[], options?: QuantileOptions): number[];
export declare function quantile(data: CleanNumberArray, probs: number, options?: QuantileOptions): number;
export declare function quantile(data: CleanNumberArray, probs: number[], options?: QuantileOptions): number[];
export declare function quantile(data: number[], probs: number, options?: QuantileOptions): number;
export declare function quantile(data: number[], probs: number[], options?: QuantileOptions): number[];
export declare function quantile(data: NumbersWithNullable, probs: number, options: {
    removeNull: true;
    removeUndefined: true;
}): number;
export declare function quantile(data: NumbersWithNullable, probs: number[], options: {
    removeNull: true;
    removeUndefined: true;
}): number[];
export declare function quantile(data: (number | null)[] | readonly (number | null)[], probs: number, options: {
    removeNull: true;
    removeNaN?: boolean;
    removeUndefined?: boolean;
}): number;
export declare function quantile(data: (number | null)[] | readonly (number | null)[], probs: number[], options: {
    removeNull: true;
    removeNaN?: boolean;
    removeUndefined?: boolean;
}): number[];
export declare function quantile(data: (number | undefined)[] | readonly (number | undefined)[], probs: number, options: {
    removeUndefined: true;
    removeNaN?: boolean;
    removeNull?: boolean;
}): number;
export declare function quantile(data: (number | undefined)[] | readonly (number | undefined)[], probs: number[], options: {
    removeUndefined: true;
    removeNaN?: boolean;
    removeNull?: boolean;
}): number[];
export declare function quantile(data: NumbersWithNullable, probs: number, options?: QuantileOptions): number | null;
export declare function quantile(data: NumbersWithNullable, probs: number[], options?: QuantileOptions): (number | null)[];
