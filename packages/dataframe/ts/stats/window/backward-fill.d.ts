/**
 * Backward fill null/undefined values in an array.
 * Replaces null/undefined values with the next non-null value after them.
 *
 * @param values - Array or iterable of values to backward fill
 * @returns Array with backward-filled values (same length as input)
 *
 * @example
 * ```ts
 * import { stats } from "@tidy-ts/dataframe";
 *
 * // Array-based usage
 * const filled = stats.backwardFill([null, null, 10, null, 20]);
 * // Returns: [10, 10, 10, 20, 20]
 *
 * // Use in rolling window
 * df.mutate({
 *   filled_price: stats.rolling("price", 3, stats.backwardFill)
 * });
 *
 * // Use in resample
 * df.resample("timestamp", "1H", {
 *   price: stats.backwardFill
 * });
 * ```
 *
 * @remarks
 * - Only fills null and undefined values
 * - Values at the end that are null/undefined remain null/undefined
 * - Returns array of same length as input
 * - Works with any value type (numbers, strings, objects, etc.)
 */
export declare function backwardFill<T>(values: T[] | Iterable<T>): T[];
