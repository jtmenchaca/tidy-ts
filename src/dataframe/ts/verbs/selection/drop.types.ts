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
  <GroupName extends keyof Row, ColName extends keyof Row>(
    this: GroupedDataFrame<Row, GroupName>,
    ...columnNames: RestrictEmptyDataFrame<Row, ColName[], EmptyDataFrameDrop>
  ): PreserveGrouping<Row, GroupName, RowAfterDrop<Row, ColName>>;

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
  <ColName extends keyof Row>(
    ...columnNames: RestrictEmptyDataFrame<Row, ColName[], EmptyDataFrameDrop>
  ): DataFrame<RowAfterDrop<Row, ColName>>;

  // Array syntax
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
  <GroupName extends keyof Row, ColName extends keyof Row>(
    this: GroupedDataFrame<Row, GroupName>,
    columnNames: RestrictEmptyDataFrame<Row, ColName[], EmptyDataFrameDrop>,
  ): PreserveGrouping<Row, GroupName, RowAfterDrop<Row, ColName>>;

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
  <ColName extends keyof Row>(
    columnNames: RestrictEmptyDataFrame<Row, ColName[], EmptyDataFrameDrop>,
  ): DataFrame<RowAfterDrop<Row, ColName>>;
};
