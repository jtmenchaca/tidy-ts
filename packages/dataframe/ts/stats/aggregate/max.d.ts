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
/** Options for filtering values in max function */
export interface MaxOptions {
    removeNull?: boolean;
    removeUndefined?: boolean;
    removeNaN?: boolean;
}
/**
 * Find the maximum value in an array of numbers, dates, or Temporal types
 *
 * @param values - Array of numbers/dates/Temporal values, or single value
 * @param options - Optional object with removal flags
 * @param options.removeNull - If true, filters out null values (default: false)
 * @param options.removeUndefined - If true, filters out undefined values (default: false)
 * @param options.removeNaN - If true, filters out NaN values (default: false)
 * @returns The maximum value, or null if no valid values
 *
 * @example
 * ```ts
 * max(42) // 42
 * max([1, 2, 3, 4, 5]) // 5
 * max([null, 2, 3], { removeNull: true }) // 3
 * max([1, NaN, 3], { removeNaN: true }) // 3
 * max([1, NaN, 3]) // NaN (NaN propagates by default)
 * max([new Date('2024-01-01'), new Date('2024-01-02')]) // new Date('2024-01-02')
 * max([Temporal.PlainDate.from('2024-01-01'), Temporal.PlainDate.from('2024-06-15')]) // PlainDate('2024-06-15')
 * ```
 */
export declare function max(values: number, options?: MaxOptions): number;
export declare function max(values: Date, options?: MaxOptions): Date;
export declare function max<T extends TemporalComparable>(values: T, options?: MaxOptions): T;
export declare function max(values: CleanDateArray, options?: MaxOptions): Date;
export declare function max(values: Date[], options?: MaxOptions): Date;
export declare function max(values: CleanNumberArray, options?: MaxOptions): number;
export declare function max(values: number[], options?: MaxOptions): number;
export declare function max(values: Iterable<number>, options?: MaxOptions): number;
export declare function max<T extends TemporalComparable>(values: readonly T[], options?: MaxOptions): T;
export declare function max<T extends TemporalComparable>(values: T[], options?: MaxOptions): T;
export declare function max(values: DatesWithNullable, options: {
    removeNull: true;
    removeUndefined: true;
}): Date;
export declare function max(values: NumbersWithNullable, options: {
    removeNull: true;
    removeUndefined: true;
}): number;
export declare function max<T extends TemporalComparable>(values: TemporalWithNullable<T>, options: {
    removeNull: true;
    removeUndefined: true;
}): T;
export declare function max(values: (number | null)[] | readonly (number | null)[], options: {
    removeNull: true;
    removeNaN?: boolean;
    removeUndefined?: boolean;
}): number;
export declare function max(values: (Date | null)[] | readonly (Date | null)[], options: {
    removeNull: true;
    removeNaN?: boolean;
    removeUndefined?: boolean;
}): Date;
export declare function max<T extends TemporalComparable>(values: (T | null)[] | readonly (T | null)[], options: {
    removeNull: true;
    removeNaN?: boolean;
    removeUndefined?: boolean;
}): T;
export declare function max(values: (number | undefined)[] | readonly (number | undefined)[], options: {
    removeUndefined: true;
    removeNaN?: boolean;
    removeNull?: boolean;
}): number;
export declare function max(values: (Date | undefined)[] | readonly (Date | undefined)[], options: {
    removeUndefined: true;
    removeNaN?: boolean;
    removeNull?: boolean;
}): Date;
export declare function max<T extends TemporalComparable>(values: (T | undefined)[] | readonly (T | undefined)[], options: {
    removeUndefined: true;
    removeNaN?: boolean;
    removeNull?: boolean;
}): T;
export declare function max(values: DatesWithNullable, options?: MaxOptions): Date | null;
export declare function max(values: NumbersWithNullable, options?: MaxOptions): number | null;
export declare function max<T extends TemporalComparable>(values: TemporalWithNullable<T>, options?: MaxOptions): T | null;
export {};
