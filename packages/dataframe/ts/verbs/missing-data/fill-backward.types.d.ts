import type { DataFrame } from "../../dataframe/index.ts";
/**
 * Backward fill null/undefined values in specified columns.
 *
 * Replaces null/undefined values with the next non-null value after them.
 * Useful for time-series data where you want to carry backward the next known value.
 *
 * Row shape is preserved — fillBackward cannot guarantee null/undefined removal
 * because trailing nulls (no subsequent non-null value) remain unchanged at runtime.
 *
 * @param columnNames - Column name(s) to backward fill
 * @returns DataFrame with backward-filled values replacing nulls
 *
 * @example
 * // Backward fill a single column
 * df.fillBackward("price")
 *
 * @example
 * // Backward fill multiple columns
 * df.fillBackward("price", "volume")
 *
 * @example
 * // Backward fill missing values in time series
 * const df = createDataFrame([
 *   { timestamp: 1, price: null },
 *   { timestamp: 2, price: null },
 *   { timestamp: 3, price: 100 },
 *   { timestamp: 4, price: null },
 * ]);
 * df.fillBackward("price")
 * // Results in: [100, 100, 100, null]
 *
 * @remarks
 * - Only fills null and undefined values (preserves other falsy values like 0 or "")
 * - Values at the end that are null/undefined remain null/undefined (no next value to fill from)
 * - Creates a new DataFrame without modifying the original
 * - Works with grouped DataFrames (fills within each group)
 */
export type FillBackwardMethod<Row extends object> = <R extends object, Col extends keyof R & string>(this: DataFrame<R>, ...columnNames: Col[]) => DataFrame<R>;
