export type CleanBooleanArray = readonly boolean[];
export type BooleansWithNullable = (boolean | null | undefined)[] | readonly (boolean | null | undefined)[];
/** Options for filtering values in any function */
export interface AnyOptions {
    removeNull?: boolean;
    removeUndefined?: boolean;
}
/**
 * Check if any value in a boolean array is true.
 *
 * @param values - A single boolean or array of booleans
 * @param options - Optional object with removal flags
 * @param options.removeNull - If true, filters out null values (default: false)
 * @param options.removeUndefined - If true, filters out undefined values (default: false)
 * @returns true if any value is true, false if all are false, or null if no valid values
 *
 * @example
 * ```typescript
 * import { stats } from "@tidy-ts/dataframe";
 *
 * stats.any([true, false, false]); // true
 * stats.any([false, false, false]); // false
 * stats.any([null, true], { removeNull: true }); // true
 * stats.any([]); // null
 * ```
 */
export declare function any(value: boolean): boolean;
export declare function any(values: CleanBooleanArray, options?: AnyOptions): boolean;
export declare function any(values: boolean[], options?: AnyOptions): boolean;
export declare function any(values: BooleansWithNullable, options: {
    removeNull: true;
    removeUndefined: true;
}): boolean;
export declare function any(values: (boolean | null)[] | readonly (boolean | null)[], options: {
    removeNull: true;
    removeUndefined?: boolean;
}): boolean;
export declare function any(values: (boolean | undefined)[] | readonly (boolean | undefined)[], options: {
    removeUndefined: true;
    removeNull?: boolean;
}): boolean;
export declare function any(values: BooleansWithNullable, options?: AnyOptions): boolean | null;
