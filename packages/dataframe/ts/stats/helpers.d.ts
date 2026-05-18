/**
 * Helper utilities for descriptive statistics functions
 * Provides standardized type checking and value filtering
 */
/**
 * Extract Float64Array from a column access result.
 * The Proxy attaches the underlying Float64Array as __typedArray
 * on frozen arrays returned from df.x access. This avoids the
 * expensive isAllFiniteNumbers scan + new Float64Array() copy.
 */
export declare function getTypedArray(values: unknown): Float64Array | null;
export type NumbersWithNullable = (number | null | undefined)[] | readonly (number | null | undefined)[];
export type NumberIterable = Iterable<number>;
export type NumbersWithNullableIterable = Iterable<number | null | undefined>;
export type CleanNumberArray = readonly number[];
export type CleanNumberIterable = NumberIterable;
/**
 * Checks if an array contains mixed types (non-numeric values)
 * Returns true if array contains strings, booleans, objects, etc. alongside numbers
 *
 * @param values - Array or iterable to check
 * @returns true if mixed types detected, false if all values are numbers/null/undefined/NaN
 */
export declare function hasMixedTypes(values: unknown[] | Iterable<unknown>): boolean;
/**
 * Fast path check for clean numeric arrays
 * Returns true if array contains only finite numbers (no null, undefined, NaN, Infinity, or non-numbers)
 *
 * @param values - Array to check
 * @returns True if array is clean numeric data
 */
export declare function isAllFiniteNumbers(values: unknown[]): values is number[];
/**
 * Splits an array into chunks of specified size
 *
 * @param arr - Array to split into chunks
 * @param size - Size of each chunk (must be positive integer)
 * @returns Array of chunks, where each chunk is an array of elements
 *
 * @example
 * ```typescript
 * const numbers = [1, 2, 3, 4, 5, 6, 7];
 * const chunked = chunk(numbers, 3);
 * // Returns: [[1, 2, 3], [4, 5, 6], [7]]
 * ```
 */
export declare function chunk<T>(arr: T[], size: number): T[][];
/**
 * Options for removal of special values in stats functions
 */
export interface RemovalOptions {
    removeNull?: boolean;
    removeUndefined?: boolean;
    removeNaN?: boolean;
}
/**
 * Determines if the fast path can be used for stats calculations.
 *
 * The fast path should ONLY be used when:
 * 1. No removal options are specified (we're not filtering anything), AND
 * 2. The array contains only finite numbers (verified by isAllFiniteNumbers)
 *
 * @param processArray - The array to check
 * @param options - Removal options (removeNull, removeUndefined, removeNaN)
 * @returns true if fast path can be used, false if slow path is required
 */
export declare function canUseFastPath(processArray: unknown[], options?: RemovalOptions): boolean;
/**
 * A value whose constructor exposes a static `compare(a, b)` method that
 * returns -1 | 0 | 1.  All TC39 Temporal types satisfy this:
 *   Temporal.PlainDate, Temporal.PlainDateTime, Temporal.PlainTime,
 *   Temporal.Instant, Temporal.ZonedDateTime
 */
export interface Comparable {
    constructor: {
        compare(a: unknown, b: unknown): number;
    };
}
/**
 * Runtime check: does `value` look like a Temporal-style comparable?
 * i.e. is it a non-null object whose constructor has a static `compare` fn?
 */
export declare function isComparable(value: unknown): value is Comparable;
/**
 * Find the min or max of an array of Comparable values (e.g. Temporal types)
 * using `constructor.compare`.
 *
 * @param values - array of unknown values (may contain null/undefined)
 * @param mode - "min" or "max"
 * @param removeNull - skip null values instead of returning null
 * @param removeUndefined - skip undefined values instead of returning null
 * @returns the min/max value, or null
 */
export declare function comparableMinMax(values: unknown[], mode: "min" | "max", removeNull: boolean, removeUndefined: boolean): unknown | null;
