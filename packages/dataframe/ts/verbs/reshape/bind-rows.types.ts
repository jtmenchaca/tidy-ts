import type { DataFrame } from "../../dataframe/index.ts";

/**
 * Merge two row types for bindRows. Written as a single mapped type so the
 * result displays flat in hover without needing `Prettify<...>`.
 *
 * Rule:
 *   - Key in both Row1 and Row2: value is `Row1[K] | Row2[K]` (undefined
 *     propagates naturally if either side allows it).
 *   - Key only in Row1: value is `Row1[K] | undefined` — runtime rows from
 *     Row2 won't have the key set, so callers must handle undefined.
 *   - Key only in Row2: symmetric.
 *
 * Compared to an intersection of 4 mapped types with the `?:` modifier on
 * optional-in-either keys, this form makes those keys required-with-undefined
 * instead of optional. The JAMIA audit assertions (`b: string | undefined`,
 * `c: boolean | undefined`) match this form exactly. The optional `?:` modifier
 * cannot be applied conditionally per-key in a single mapped type without
 * splitting back into an intersection.
 */
type MergeRows<Row1, Row2> = {
  [K in keyof Row1 | keyof Row2]: K extends keyof Row1
    ? K extends keyof Row2 ? Row1[K] | Row2[K]
    : Row1[K] | undefined
    : K extends keyof Row2 ? Row2[K] | undefined
    : never;
};

/**
 * Type for the bind_rows method that combines DataFrames vertically.
 *
 * @template Row - The row type of the DataFrame
 */
export type BindRowsMethod<Row extends object> = {
  /**
   * Combine DataFrames vertically (stack rows).
   *
   * Stacks rows from multiple DataFrames, creating a union of columns. Missing columns
   * in any DataFrame become optional and filled with undefined. Columns present in multiple
   * DataFrames have their types unioned.
   *
   * @example
   * // Combine two DataFrames with same columns
   * df1.bindRows(df2)
   *
   * @example
   * // Combine DataFrames with different columns
   * users.bindRows(admins)
   * // Result has all columns from both, missing values are undefined
   *
   * @example
   * // Combine multiple DataFrames
   * df1.bindRows(df2, df3, df4)
   */
  <R extends object, OtherRow extends object>(
    this: DataFrame<R>,
    other: DataFrame<OtherRow>,
  ): DataFrame<MergeRows<R, OtherRow>>;

  /**
   * Combine DataFrames vertically (stack rows).
   *
   * @example
   * df1.bindRows(df2, df3)
   */
  <
    R extends object,
    OtherRow1 extends object,
    OtherRow2 extends object,
  >(
    this: DataFrame<R>,
    other1: DataFrame<OtherRow1>,
    other2: DataFrame<OtherRow2>,
  ): DataFrame<MergeRows<MergeRows<R, OtherRow1>, OtherRow2>>;

  /**
   * Combine DataFrames vertically (stack rows).
   *
   * @example
   * df1.bindRows(df2, df3, df4)
   */
  <
    R extends object,
    OtherRow1 extends object,
    OtherRow2 extends object,
    OtherRow3 extends object,
  >(
    this: DataFrame<R>,
    other1: DataFrame<OtherRow1>,
    other2: DataFrame<OtherRow2>,
    other3: DataFrame<OtherRow3>,
  ): DataFrame<
    MergeRows<MergeRows<MergeRows<R, OtherRow1>, OtherRow2>, OtherRow3>
  >;

  /**
   * Combine DataFrames vertically (stack rows) — variadic fallback.
   *
   * @example
   * df1.bindRows(...others)
   */
  <R extends object, OtherRow extends object>(
    this: DataFrame<R>,
    ...others: DataFrame<OtherRow>[]
  ): DataFrame<MergeRows<R, OtherRow>>;
};

/**
 * Type for the standalone concatDataFrames function.
 * Mirrors BindRowsMethod overloads but takes an array/tuple instead of variadic args.
 */
export type ConcatDataFramesFunction = {
  <R1 extends object, R2 extends object>(
    dataFrames: [DataFrame<R1>, DataFrame<R2>],
  ): DataFrame<MergeRows<R1, R2>>;

  <R1 extends object, R2 extends object, R3 extends object>(
    dataFrames: [DataFrame<R1>, DataFrame<R2>, DataFrame<R3>],
  ): DataFrame<MergeRows<MergeRows<R1, R2>, R3>>;

  <
    R1 extends object,
    R2 extends object,
    R3 extends object,
    R4 extends object,
  >(
    dataFrames: [DataFrame<R1>, DataFrame<R2>, DataFrame<R3>, DataFrame<R4>],
  ): DataFrame<MergeRows<MergeRows<MergeRows<R1, R2>, R3>, R4>>;

  <R extends object>(
    dataFrames: DataFrame<R>[],
  ): DataFrame<R>;
};
