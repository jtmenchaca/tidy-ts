import type { DataFrame, Prettify } from "../../dataframe/index.ts";

/**
 * Helper type to replace null/undefined types with non-null type from the same column
 */
type FillForwardType<T> = T extends null | undefined ? never
  : T extends null | undefined | infer U ? U
  : T;

/**
 * Transform Row type after fillForward operation
 */
type FillForwardResult<
  Row extends object,
  Columns extends readonly (keyof Row & string)[],
> = {
  [K in keyof Row]: K extends Columns[number] ? FillForwardType<Row[K]>
    : Row[K];
};

/**
 * Forward fill null/undefined values in specified columns.
 *
 * Replaces null/undefined values with the last non-null value before them.
 * Useful for time-series data where you want to carry forward the last known value.
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
export type FillForwardMethod<Row extends object> = <
  Col extends keyof Row & string,
>(
  ...columnNames: Col[]
) => DataFrame<Prettify<FillForwardResult<Row, [Col]>>>;
