import type { DataFrame, Prettify } from "../../dataframe/index.ts";

/**
 * Helper type to replace null/undefined types with non-null type from the same column
 */
type FillBackwardType<T> = T extends null | undefined ? never
  : T extends null | undefined | infer U ? U
  : T;

/**
 * Transform Row type after fillBackward operation
 */
type FillBackwardResult<
  Row extends object,
  Columns extends readonly (keyof Row & string)[],
> = {
  [K in keyof Row]: K extends Columns[number] ? FillBackwardType<Row[K]>
    : Row[K];
};

/**
 * Backward fill null/undefined values in specified columns.
 *
 * Replaces null/undefined values with the next non-null value after them.
 * Useful for time-series data where you want to carry backward the next known value.
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
export type FillBackwardMethod<Row extends object> = <
  Col extends keyof Row & string,
>(
  ...columnNames: Col[]
) => DataFrame<Prettify<FillBackwardResult<Row, [Col]>>>;
