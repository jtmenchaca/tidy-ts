export type CleanBooleanArray = readonly boolean[];
export type BooleansWithNullable = (boolean | null | undefined)[] | readonly (boolean | null | undefined)[];
/** Options for filtering values in all function */
export interface AllOptions {
    removeNull?: boolean;
    removeUndefined?: boolean;
}
/**
 * Check if all values in a boolean array are true.
 *
 * @param values - A single boolean or array of booleans
 * @param options - Optional object with removal flags
 * @param options.removeNull - If true, filters out null values (default: false)
 * @param options.removeUndefined - If true, filters out undefined values (default: false)
 * @returns true if all values are true, false if any is false, or null if no valid values
 *
 * @example
 * ```typescript
 * import { stats } from "@tidy-ts/dataframe";
 *
 * stats.all([true, true, true]); // true
 * stats.all([true, false, true]); // false
 * stats.all([null, true], { removeNull: true }); // true
 * stats.all([]); // null
 * ```
 */
export declare function all(value: boolean): boolean;
export declare function all(values: CleanBooleanArray, options?: AllOptions): boolean;
export declare function all(values: boolean[], options?: AllOptions): boolean;
export declare function all(values: BooleansWithNullable, options: {
    removeNull: true;
    removeUndefined: true;
}): boolean;
export declare function all(values: (boolean | null)[] | readonly (boolean | null)[], options: {
    removeNull: true;
    removeUndefined?: boolean;
}): boolean;
export declare function all(values: (boolean | undefined)[] | readonly (boolean | undefined)[], options: {
    removeUndefined: true;
    removeNull?: boolean;
}): boolean;
export declare function all(values: BooleansWithNullable, options?: AllOptions): boolean | null;
