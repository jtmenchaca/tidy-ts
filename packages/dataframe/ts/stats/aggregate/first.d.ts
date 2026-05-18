import type { NumbersWithNullable, NumbersWithNullableIterable } from "../helpers.ts";
export type CleanDateArray = readonly Date[];
export type DatesWithNullable = (Date | null | undefined)[] | readonly (Date | null | undefined)[];
/** Options for filtering values in first function */
export interface FirstOptions {
    removeNull?: boolean;
    removeUndefined?: boolean;
}
/**
 * Get the first value in an array of numbers, dates, or other types
 *
 * @param values - Array of values, or single value
 * @param options - Optional object with removal flags
 * @param options.removeNull - If true, skips null values (default: false)
 * @param options.removeUndefined - If true, skips undefined values (default: false)
 * @returns The first value, or null if no valid values
 *
 * @example
 * ```ts
 * first(42) // Always returns 42 for single value
 * first([1, 2, 3, 4, 5]) // 1
 * first([null, 2, 3]) // null (first value is null)
 * first([null, 2, 3], { removeNull: true }) // 2 (skips null)
 * first([new Date('2024-01-01'), new Date('2024-01-02')]) // new Date('2024-01-01')
 * ```
 */
export declare function first<T>(value: T): T;
export declare function first<T>(values: readonly T[], options?: FirstOptions): T;
export declare function first<T>(values: T[], options?: FirstOptions): T;
export declare function first(values: readonly Date[], options?: FirstOptions): Date;
export declare function first(values: Date[], options?: FirstOptions): Date;
export declare function first(values: readonly number[], options?: FirstOptions): number;
export declare function first(values: number[], options?: FirstOptions): number;
export declare function first(values: Iterable<number>, options?: FirstOptions): number;
export declare function first<T>(values: (T | null | undefined)[], options: {
    removeNull: true;
    removeUndefined: true;
}): T;
export declare function first(values: DatesWithNullable, options: {
    removeNull: true;
    removeUndefined: true;
}): Date;
export declare function first(values: NumbersWithNullable, options: {
    removeNull: true;
    removeUndefined: true;
}): number;
export declare function first(values: NumbersWithNullableIterable, options: {
    removeNull: true;
    removeUndefined: true;
}): number;
export declare function first<T>(values: (T | null)[] | readonly (T | null)[], options: {
    removeNull: true;
    removeUndefined?: boolean;
}): T;
export declare function first(values: (Date | null)[] | readonly (Date | null)[], options: {
    removeNull: true;
    removeUndefined?: boolean;
}): Date;
export declare function first(values: (number | null)[] | readonly (number | null)[], options: {
    removeNull: true;
    removeUndefined?: boolean;
}): number;
export declare function first<T>(values: (T | undefined)[] | readonly (T | undefined)[], options: {
    removeUndefined: true;
    removeNull?: boolean;
}): T;
export declare function first(values: (Date | undefined)[] | readonly (Date | undefined)[], options: {
    removeUndefined: true;
    removeNull?: boolean;
}): Date;
export declare function first(values: (number | undefined)[] | readonly (number | undefined)[], options: {
    removeUndefined: true;
    removeNull?: boolean;
}): number;
export declare function first<T>(values: (T | null | undefined)[], options?: FirstOptions): T | null;
export declare function first(values: DatesWithNullable, options?: FirstOptions): Date | null;
export declare function first(values: NumbersWithNullable, options?: FirstOptions): number | null;
export declare function first(values: NumbersWithNullableIterable, options?: FirstOptions): number | null;
