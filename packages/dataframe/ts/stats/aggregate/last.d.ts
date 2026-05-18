import type { NumbersWithNullable, NumbersWithNullableIterable } from "../helpers.ts";
export type CleanDateArray = readonly Date[];
export type DatesWithNullable = (Date | null | undefined)[] | readonly (Date | null | undefined)[];
/** Options for filtering values in last function */
export interface LastOptions {
    removeNull?: boolean;
    removeUndefined?: boolean;
}
/**
 * Get the last value in an array of numbers, dates, or other types
 *
 * @param values - Array of values, or single value
 * @param options - Optional object with removal flags
 * @param options.removeNull - If true, skips null values (default: false)
 * @param options.removeUndefined - If true, skips undefined values (default: false)
 * @returns The last value, or null if no valid values
 *
 * @example
 * ```ts
 * last(42) // Always returns 42 for single value
 * last([1, 2, 3, 4, 5]) // 5
 * last([1, 2, null]) // null (last value is null)
 * last([1, 2, null], { removeNull: true }) // 2 (skips null)
 * last([new Date('2024-01-01'), new Date('2024-01-02')]) // new Date('2024-01-02')
 * ```
 */
export declare function last<T>(value: T): T;
export declare function last<T>(values: readonly T[], options?: LastOptions): T;
export declare function last<T>(values: T[], options?: LastOptions): T;
export declare function last(values: readonly Date[], options?: LastOptions): Date;
export declare function last(values: Date[], options?: LastOptions): Date;
export declare function last(values: readonly number[], options?: LastOptions): number;
export declare function last(values: number[], options?: LastOptions): number;
export declare function last(values: Iterable<number>, options?: LastOptions): number;
export declare function last<T>(values: (T | null | undefined)[], options: {
    removeNull: true;
    removeUndefined: true;
}): T;
export declare function last(values: DatesWithNullable, options: {
    removeNull: true;
    removeUndefined: true;
}): Date;
export declare function last(values: NumbersWithNullable, options: {
    removeNull: true;
    removeUndefined: true;
}): number;
export declare function last(values: NumbersWithNullableIterable, options: {
    removeNull: true;
    removeUndefined: true;
}): number;
export declare function last<T>(values: (T | null)[] | readonly (T | null)[], options: {
    removeNull: true;
    removeUndefined?: boolean;
}): T;
export declare function last(values: (Date | null)[] | readonly (Date | null)[], options: {
    removeNull: true;
    removeUndefined?: boolean;
}): Date;
export declare function last(values: (number | null)[] | readonly (number | null)[], options: {
    removeNull: true;
    removeUndefined?: boolean;
}): number;
export declare function last<T>(values: (T | undefined)[] | readonly (T | undefined)[], options: {
    removeUndefined: true;
    removeNull?: boolean;
}): T;
export declare function last(values: (Date | undefined)[] | readonly (Date | undefined)[], options: {
    removeUndefined: true;
    removeNull?: boolean;
}): Date;
export declare function last(values: (number | undefined)[] | readonly (number | undefined)[], options: {
    removeUndefined: true;
    removeNull?: boolean;
}): number;
export declare function last<T>(values: (T | null | undefined)[], options?: LastOptions): T | null;
export declare function last(values: DatesWithNullable, options?: LastOptions): Date | null;
export declare function last(values: NumbersWithNullable, options?: LastOptions): number | null;
export declare function last(values: NumbersWithNullableIterable, options?: LastOptions): number | null;
