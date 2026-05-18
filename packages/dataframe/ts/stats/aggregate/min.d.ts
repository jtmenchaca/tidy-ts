export type CleanDateArray = readonly Date[];
export type DatesWithNullable = (Date | null | undefined)[] | readonly (Date | null | undefined)[];
export type CleanNumberArray = readonly number[];
export type NumbersWithNullable = (number | null | undefined)[] | readonly (number | null | undefined)[];
export interface TemporalComparable {
    readonly [Symbol.toStringTag]: string;
    toString(): string;
    toJSON(): string;
}
type TemporalWithNullable<T extends TemporalComparable> = (T | null | undefined)[] | readonly (T | null | undefined)[];
/** Options for filtering values in min function */
export interface MinOptions {
    removeNull?: boolean;
    removeUndefined?: boolean;
    removeNaN?: boolean;
}
/**
 * Find the minimum value in an array of numbers, dates, or Temporal types
 *
 * @param values - Array of numbers/dates/Temporal values, or single value
 * @param options - Optional object with removal flags
 * @param options.removeNull - If true, filters out null values (default: false)
 * @param options.removeUndefined - If true, filters out undefined values (default: false)
 * @param options.removeNaN - If true, filters out NaN values (default: false)
 * @returns The minimum value, or null if no valid values
 *
 * @example
 * ```ts
 * min(42) // 42
 * min([1, 2, 3, 4, 5]) // 1
 * min([null, 2, 3], { removeNull: true }) // 2
 * min([1, NaN, 3], { removeNaN: true }) // 1
 * min([1, NaN, 3]) // NaN (NaN propagates by default)
 * min([new Date('2024-01-01'), new Date('2024-01-02')]) // new Date('2024-01-01')
 * min([Temporal.PlainDate.from('2024-01-01'), Temporal.PlainDate.from('2024-06-15')]) // PlainDate('2024-01-01')
 * ```
 */
export declare function min(values: number, options?: MinOptions): number;
export declare function min(values: Date, options?: MinOptions): Date;
export declare function min<T extends TemporalComparable>(values: T, options?: MinOptions): T;
export declare function min(values: CleanDateArray, options?: MinOptions): Date;
export declare function min(values: Date[], options?: MinOptions): Date;
export declare function min(values: CleanNumberArray, options?: MinOptions): number;
export declare function min(values: number[], options?: MinOptions): number;
export declare function min(values: Iterable<number>, options?: MinOptions): number;
export declare function min<T extends TemporalComparable>(values: readonly T[], options?: MinOptions): T;
export declare function min<T extends TemporalComparable>(values: T[], options?: MinOptions): T;
export declare function min(values: DatesWithNullable, options: {
    removeNull: true;
    removeUndefined: true;
}): Date;
export declare function min(values: NumbersWithNullable, options: {
    removeNull: true;
    removeUndefined: true;
}): number;
export declare function min<T extends TemporalComparable>(values: TemporalWithNullable<T>, options: {
    removeNull: true;
    removeUndefined: true;
}): T;
export declare function min(values: (number | null)[] | readonly (number | null)[], options: {
    removeNull: true;
    removeNaN?: boolean;
    removeUndefined?: boolean;
}): number;
export declare function min(values: (Date | null)[] | readonly (Date | null)[], options: {
    removeNull: true;
    removeNaN?: boolean;
    removeUndefined?: boolean;
}): Date;
export declare function min<T extends TemporalComparable>(values: (T | null)[] | readonly (T | null)[], options: {
    removeNull: true;
    removeNaN?: boolean;
    removeUndefined?: boolean;
}): T;
export declare function min(values: (number | undefined)[] | readonly (number | undefined)[], options: {
    removeUndefined: true;
    removeNaN?: boolean;
    removeNull?: boolean;
}): number;
export declare function min(values: (Date | undefined)[] | readonly (Date | undefined)[], options: {
    removeUndefined: true;
    removeNaN?: boolean;
    removeNull?: boolean;
}): Date;
export declare function min<T extends TemporalComparable>(values: (T | undefined)[] | readonly (T | undefined)[], options: {
    removeUndefined: true;
    removeNaN?: boolean;
    removeNull?: boolean;
}): T;
export declare function min(values: DatesWithNullable, options?: MinOptions): Date | null;
export declare function min(values: NumbersWithNullable, options?: MinOptions): number | null;
export declare function min<T extends TemporalComparable>(values: TemporalWithNullable<T>, options?: MinOptions): T | null;
export {};
