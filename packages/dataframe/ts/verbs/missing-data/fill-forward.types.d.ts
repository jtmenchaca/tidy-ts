import type { DataFrame } from "../../dataframe/index.ts";
/**
 * Forward fill null/undefined values in specified columns.
 *
 * Replaces null/undefined values with the last non-null value before them.
 * Useful for time-series data where you want to carry forward the last known value.
 *
 * Row shape is preserved — fillForward cannot guarantee null/undefined removal
 * because leading nulls (no prior non-null value) remain unchanged at runtime.
 *
 * @param columnNames - Column name(s) to forward fill
 * @returns DataFrame with forward-filled values replacing nulls
 *
 * @example
 * // Forward fill a single column
 * df.fillForward("price")
 *
 * @example
 * // Forward fill multiple columns
 * df.fillForward("price", "volume")
 *
 * @example
 * // Forward fill missing values in time series
 * const df = createDataFrame([
 *   { timestamp: 1, price: 100 },
 *   { timestamp: 2, price: null },
 *   { timestamp: 3, price: null },
 *   { timestamp: 4, price: 200 },
 * ]);
 * df.fillForward("price")
 * // Results in: [100, 100, 100, 200]
 *
 * @remarks
 * - Only fills null and undefined values (preserves other falsy values like 0 or "")
 * - Values at the start that are null/undefined remain null/undefined (no previous value to fill from)
 * - Creates a new DataFrame without modifying the original
 * - Works with grouped DataFrames (fills within each group)
 */
export type FillForwardMethod<Row extends object> = <R extends object, Col extends keyof R & string>(this: DataFrame<R>, ...columnNames: Col[]) => DataFrame<R>;
