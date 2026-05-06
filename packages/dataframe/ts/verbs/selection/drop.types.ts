import type {
  DataFrame,
  GroupedDataFrame,
  PreserveGrouping,
  Prettify,
} from "../../dataframe/index.ts";
import type {
  EmptyDataFrameDrop,
  RestrictEmptyDataFrame,
} from "../../dataframe/types/error-types.ts";

export type RowAfterDrop<
  Row extends object,
  ColName extends keyof Row,
> = Prettify<Omit<Row, ColName>>;

/**
 * Remove one or more columns from the DataFrame.
 *
 * Returns a new DataFrame without the specified columns. The opposite of `select()`.
 * Works with both regular and grouped DataFrames.
 *
 * @example
 * // Drop a single column
 * df.drop("tempColumn")
 *
 * @example
 * // Drop multiple columns
 * df.drop("col1", "col2", "col3")
 *
 * @example
 * // Drop from grouped DataFrames
 * df.groupBy("category").drop("internalId")
 */
export type DropMethod<Row extends object> = {
  // Rest parameters syntax
  /**
   * Remove one or more columns from the DataFrame.
   *
   * Returns a new DataFrame without the specified columns. The opposite of `select()`.
   * Works with both regular and grouped DataFrames.
   *
   * @example
   * // Drop a single column
   * df.drop("tempColumn")
   *
   * @example
   * // Drop multiple columns
   * df.drop("col1", "col2", "col3")
   *
   * @example
   * // Array syntax
   * df.drop(["col1", "col2"])
   *
   * @example
   * // Drop from grouped DataFrames
   * df.groupBy("category").drop("internalId")
   */
  <R extends object, GroupName extends keyof R, ColName extends keyof R>(
    this: GroupedDataFrame<R, GroupName>,
    ...columnNames: RestrictEmptyDataFrame<R, ColName[], EmptyDataFrameDrop>
  ): PreserveGrouping<R, GroupName, RowAfterDrop<R, ColName>>;

  /**
   * Remove one or more columns from the DataFrame.
   *
   * Returns a new DataFrame without the specified columns. The opposite of `select()`.
   * Works with both regular and grouped DataFrames.
   *
   * @example
   * // Drop a single column
   * df.drop("tempColumn")
   *
   * @example
   * // Drop multiple columns
   * df.drop("col1", "col2", "col3")
   *
   * @example
   * // Array syntax
   * df.drop(["col1", "col2"])
   *
   * @example
   * // Drop from grouped DataFrames
   * df.groupBy("category").drop("internalId")
   */
  <R extends object, ColName extends keyof R>(
    this: DataFrame<R>,
    ...columnNames: RestrictEmptyDataFrame<R, ColName[], EmptyDataFrameDrop>
  ): DataFrame<RowAfterDrop<R, ColName>>;
};
