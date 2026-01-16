/**
 * Forward fill null/undefined values in an array.
 * Replaces null/undefined values with the last non-null value before them.
 *
 * @param values - Array or iterable of values to forward fill
 * @returns Array with forward-filled values (same length as input)
 *
 * @example
 * ```ts
 * import { stats } from "@tidy-ts/dataframe";
 *
 * // Array-based usage
 * const filled = stats.forwardFill([10, null, null, 20, null]);
 * // Returns: [10, 10, 10, 20, 20]
 *
 * // Use in rolling window
 * df.mutate({
 *   filled_price: stats.rolling("price", 3, stats.forwardFill)
 * });
 *
 * // Use in resample
 * df.resample("timestamp", "1H", {
 *   price: stats.forwardFill
 * });
 * ```
 *
 * @remarks
 * - Only fills null and undefined values
 * - Values at the start that are null/undefined remain null/undefined
 * - Returns array of same length as input
 * - Works with any value type (numbers, strings, objects, etc.)
 */
export function forwardFill<T>(
  values: T[] | Iterable<T>,
): T[] {
  const arr = Array.isArray(values) ? values : Array.from(values);
  const result: T[] = [];
  let lastValue: T | undefined = undefined;

  for (const value of arr) {
    if (value === null || value === undefined) {
      // Fill with last non-null value if available
      if (lastValue !== undefined) {
        result.push(lastValue);
      } else {
        // Keep null/undefined if no previous value
        result.push(value as T);
      }
    } else {
      // Update last value and keep current value
      lastValue = value;
      result.push(value);
    }
  }

  return result;
}
