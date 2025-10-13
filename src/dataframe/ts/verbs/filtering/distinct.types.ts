import type {
  DataFrame,
  GroupedDataFrame,
  PreserveGrouping,
  Prettify,
} from "../../dataframe/index.ts";

/** Distinct preserves row shape (removes duplicates only). */
export type RowAfterDistinct<Row extends object> = Prettify<
  Row
>;

export type DistinctMethod<Row extends object> = {
  /**
   * Remove duplicate rows based on specified columns.
   *
   * Returns unique rows, keeping the first occurrence of each unique combination.
   * If no columns specified, uses all columns. For grouped DataFrames, uniqueness
   * is determined within each group.
   *
   * @example
   * // Remove all duplicate rows
   * df.distinct()
   *
   * @example
   * // Unique values based on specific columns
   * df.distinct("category", "region")
   *
   * @example
   * // Distinct within groups
   * df.groupBy("year").distinct("product")
   */
  <GroupName extends keyof Row>(
    this: GroupedDataFrame<Row, GroupName>,
    ...columnNames: Array<keyof Row>
  ): PreserveGrouping<Row, GroupName, RowAfterDistinct<Row>>;

  /**
   * Remove duplicate rows based on specified columns.
   *
   * Returns unique rows, keeping the first occurrence of each unique combination.
   * If no columns specified, uses all columns. For grouped DataFrames, uniqueness
   * is determined within each group.
   *
   * @example
   * // Remove all duplicate rows
   * df.distinct()
   *
   * @example
   * // Unique values based on specific columns
   * df.distinct("category", "region")
   *
   * @example
   * // Distinct within groups
   * df.groupBy("year").distinct("product")
   */
  (...columnNames: Array<keyof Row>): DataFrame<RowAfterDistinct<Row>>;
};
