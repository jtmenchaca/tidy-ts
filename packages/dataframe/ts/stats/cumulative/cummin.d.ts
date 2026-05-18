export type CleanNumberArray = readonly number[];
export type NumbersWithNullable = (number | null | undefined)[] | readonly (number | null | undefined)[];
export type CleanDateArray = readonly Date[];
export type DatesWithNullable = (Date | null | undefined)[] | readonly (Date | null | undefined)[];
export interface TemporalComparable {
    readonly [Symbol.toStringTag]: string;
    toString(): string;
    toJSON(): string;
}
type TemporalWithNullable<T extends TemporalComparable> = (T | null | undefined)[] | readonly (T | null | undefined)[];
/** Options for filtering values in cumulative min function */
export interface CumminOptions {
    removeNull?: boolean;
    removeUndefined?: boolean;
    removeNaN?: boolean;
}
/**
 * Calculate cumulative minimum of numeric, Date, or Temporal values
 *
 * @param values - Array of numbers, dates, or Temporal values
 * @param options - Optional object with removal flags
 * @param options.removeNull - If true, filters out null values (default: false)
 * @param options.removeUndefined - If true, filters out undefined values (default: false)
 * @param options.removeNaN - If true, filters out NaN values (default: false)
 * @returns Array of cumulative minimums
 *
 * @example
 * ```ts
 * cummin([5, 3, 4, 1, 2]) // [5, 3, 3, 1, 1]
 * cummin([3, null, 1]) // [null, null, null] - null causes all results to be null
 * cummin([3, null, 1], { removeNull: true }) // [3, 3, 1]
 * cummin([3, NaN, 1]) // [3, NaN, NaN] - NaN propagates
 * cummin([3, NaN, 1], { removeNaN: true }) // [3, 3, 1]
 * cummin([new Date('2024-01-03'), new Date('2024-01-01'), new Date('2024-01-02')])
 *   // [Date('2024-01-03'), Date('2024-01-01'), Date('2024-01-01')]
 * ```
 */
export declare function cummin(values: number, options?: CumminOptions): number;
export declare function cummin(values: Date, options?: CumminOptions): Date;
export declare function cummin<T extends TemporalComparable>(values: T, options?: CumminOptions): T;
export declare function cummin(values: CleanDateArray, options?: CumminOptions): Date[];
export declare function cummin(values: Date[], options?: CumminOptions): Date[];
export declare function cummin(values: CleanNumberArray, options?: CumminOptions): number[];
export declare function cummin(values: number[], options?: CumminOptions): number[];
export declare function cummin<T extends TemporalComparable>(values: readonly T[], options?: CumminOptions): T[];
export declare function cummin<T extends TemporalComparable>(values: T[], options?: CumminOptions): T[];
export declare function cummin(values: DatesWithNullable, options: {
    removeNull: true;
    removeUndefined: true;
}): Date[];
export declare function cummin(values: NumbersWithNullable, options: {
    removeNull: true;
    removeUndefined: true;
}): number[];
export declare function cummin<T extends TemporalComparable>(values: TemporalWithNullable<T>, options: {
    removeNull: true;
    removeUndefined: true;
}): T[];
export declare function cummin(values: (number | null)[] | readonly (number | null)[], options: {
    removeNull: true;
    removeNaN?: boolean;
    removeUndefined?: boolean;
}): number[];
export declare function cummin(values: (Date | null)[] | readonly (Date | null)[], options: {
    removeNull: true;
    removeNaN?: boolean;
    removeUndefined?: boolean;
}): Date[];
export declare function cummin<T extends TemporalComparable>(values: (T | null)[] | readonly (T | null)[], options: {
    removeNull: true;
    removeNaN?: boolean;
    removeUndefined?: boolean;
}): T[];
export declare function cummin(values: (number | undefined)[] | readonly (number | undefined)[], options: {
    removeUndefined: true;
    removeNaN?: boolean;
    removeNull?: boolean;
}): number[];
export declare function cummin(values: (Date | undefined)[] | readonly (Date | undefined)[], options: {
    removeUndefined: true;
    removeNaN?: boolean;
    removeNull?: boolean;
}): Date[];
export declare function cummin<T extends TemporalComparable>(values: (T | undefined)[] | readonly (T | undefined)[], options: {
    removeUndefined: true;
    removeNaN?: boolean;
    removeNull?: boolean;
}): T[];
export declare function cummin(values: DatesWithNullable, options?: CumminOptions): (Date | null)[];
export declare function cummin(values: NumbersWithNullable, options?: CumminOptions): (number | null)[];
export declare function cummin<T extends TemporalComparable>(values: TemporalWithNullable<T>, options?: CumminOptions): (T | null)[];
export {};
