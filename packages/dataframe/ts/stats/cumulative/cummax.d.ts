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
/** Options for filtering values in cumulative max function */
export interface CummaxOptions {
    removeNull?: boolean;
    removeUndefined?: boolean;
    removeNaN?: boolean;
}
/**
 * Calculate cumulative maximum of numeric, Date, or Temporal values
 *
 * @param values - Array of numbers, dates, or Temporal values
 * @param options - Optional object with removal flags
 * @param options.removeNull - If true, filters out null values (default: false)
 * @param options.removeUndefined - If true, filters out undefined values (default: false)
 * @param options.removeNaN - If true, filters out NaN values (default: false)
 * @returns Array of cumulative maximums
 *
 * @example
 * ```ts
 * cummax([1, 3, 2, 5, 4]) // [1, 3, 3, 5, 5]
 * cummax([1, null, 3]) // [null, null, null] - null causes all results to be null
 * cummax([1, null, 3], { removeNull: true }) // [1, 1, 3]
 * cummax([1, NaN, 3]) // [1, NaN, NaN] - NaN propagates
 * cummax([1, NaN, 3], { removeNaN: true }) // [1, 1, 3]
 * cummax([new Date('2024-01-01'), new Date('2024-01-03'), new Date('2024-01-02')])
 *   // [Date('2024-01-01'), Date('2024-01-03'), Date('2024-01-03')]
 * ```
 */
export declare function cummax(values: number, options?: CummaxOptions): number;
export declare function cummax(values: Date, options?: CummaxOptions): Date;
export declare function cummax<T extends TemporalComparable>(values: T, options?: CummaxOptions): T;
export declare function cummax(values: CleanDateArray, options?: CummaxOptions): Date[];
export declare function cummax(values: Date[], options?: CummaxOptions): Date[];
export declare function cummax(values: CleanNumberArray, options?: CummaxOptions): number[];
export declare function cummax(values: number[], options?: CummaxOptions): number[];
export declare function cummax<T extends TemporalComparable>(values: readonly T[], options?: CummaxOptions): T[];
export declare function cummax<T extends TemporalComparable>(values: T[], options?: CummaxOptions): T[];
export declare function cummax(values: DatesWithNullable, options: {
    removeNull: true;
    removeUndefined: true;
}): Date[];
export declare function cummax(values: NumbersWithNullable, options: {
    removeNull: true;
    removeUndefined: true;
}): number[];
export declare function cummax<T extends TemporalComparable>(values: TemporalWithNullable<T>, options: {
    removeNull: true;
    removeUndefined: true;
}): T[];
export declare function cummax(values: (number | null)[] | readonly (number | null)[], options: {
    removeNull: true;
    removeNaN?: boolean;
    removeUndefined?: boolean;
}): number[];
export declare function cummax(values: (Date | null)[] | readonly (Date | null)[], options: {
    removeNull: true;
    removeNaN?: boolean;
    removeUndefined?: boolean;
}): Date[];
export declare function cummax<T extends TemporalComparable>(values: (T | null)[] | readonly (T | null)[], options: {
    removeNull: true;
    removeNaN?: boolean;
    removeUndefined?: boolean;
}): T[];
export declare function cummax(values: (number | undefined)[] | readonly (number | undefined)[], options: {
    removeUndefined: true;
    removeNaN?: boolean;
    removeNull?: boolean;
}): number[];
export declare function cummax(values: (Date | undefined)[] | readonly (Date | undefined)[], options: {
    removeUndefined: true;
    removeNaN?: boolean;
    removeNull?: boolean;
}): Date[];
export declare function cummax<T extends TemporalComparable>(values: (T | undefined)[] | readonly (T | undefined)[], options: {
    removeUndefined: true;
    removeNaN?: boolean;
    removeNull?: boolean;
}): T[];
export declare function cummax(values: DatesWithNullable, options?: CummaxOptions): (Date | null)[];
export declare function cummax(values: NumbersWithNullable, options?: CummaxOptions): (number | null)[];
export declare function cummax<T extends TemporalComparable>(values: TemporalWithNullable<T>, options?: CummaxOptions): (T | null)[];
export {};
