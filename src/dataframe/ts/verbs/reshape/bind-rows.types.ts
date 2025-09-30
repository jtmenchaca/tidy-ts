import type { DataFrame, Prettify } from "../../dataframe/index.ts";

/**
 * Helper to detect if a property is optional in a type
 */
type IsOptional<T, K extends keyof T> = undefined extends T[K] ? true : false;

/**
 * Helper type that properly merges two objects by creating unions for shared keys
 * and maintaining optional status for keys that don't exist in both types.
 *
 * This handles the complex case where fields might be optional in one type but required in another.
 */
type MergeRows<Row1, Row2> =
  & {
    // For keys that exist in both:
    // - If optional in either type, make the result optional
    // - Create union of the value types
    [
      K in keyof Row1 & keyof Row2 as IsOptional<Row1, K> extends true ? K
        : IsOptional<Row2, K> extends true ? K
        : never
    ]?: Row1[K] | Row2[K];
  }
  & {
    // For keys that exist in both and are required in both
    [
      K in keyof Row1 & keyof Row2 as IsOptional<Row1, K> extends false
        ? IsOptional<Row2, K> extends false ? K : never
        : never
    ]: Row1[K] | Row2[K];
  }
  & {
    // For keys only in Row1, keep them as-is
    [K in Exclude<keyof Row1, keyof Row2>]: Row1[K];
  }
  & {
    // For keys only in Row2, make them optional
    [K in Exclude<keyof Row2, keyof Row1>]?: Row2[K];
  };

/**
 * Type for the bind_rows method that combines DataFrames vertically.
 *
 * @template Row - The row type of the DataFrame
 */
export type BindRowsMethod<Row extends object> = {
  <OtherRow extends object>(
    other: DataFrame<OtherRow>,
  ): DataFrame<Prettify<MergeRows<Row, OtherRow>>>;

  <
    OtherRow1 extends object,
    OtherRow2 extends object,
  >(
    other1: DataFrame<OtherRow1>,
    other2: DataFrame<OtherRow2>,
  ): DataFrame<Prettify<MergeRows<MergeRows<Row, OtherRow1>, OtherRow2>>>;

  <
    OtherRow1 extends object,
    OtherRow2 extends object,
    OtherRow3 extends object,
  >(
    other1: DataFrame<OtherRow1>,
    other2: DataFrame<OtherRow2>,
    other3: DataFrame<OtherRow3>,
  ): DataFrame<
    Prettify<
      MergeRows<MergeRows<MergeRows<Row, OtherRow1>, OtherRow2>, OtherRow3>
    >
  >;

  <OtherRow extends object>(
    ...others: DataFrame<OtherRow>[]
  ): DataFrame<Prettify<MergeRows<Row, OtherRow>>>;
};
