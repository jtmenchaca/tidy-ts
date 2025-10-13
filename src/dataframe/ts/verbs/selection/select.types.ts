import type {
  DataFrame,
  GroupedDataFrame,
  PreserveGrouping,
  Prettify,
} from "../../dataframe/index.ts";
import type {
  EmptyDataFrameSelect,
  RestrictEmptyDataFrame,
} from "../../dataframe/types/error-types.ts";

export type RowAfterSelect<
  Row extends object,
  ColName extends keyof Row,
> = Prettify<Pick<Row, ColName>>;

export type SelectMethod<Row extends object> = {
  // Rest parameters syntax
  /**
   * Select one or more columns from the DataFrame.
   *
   * Returns a new DataFrame containing only the specified columns. Column order
   * is preserved as specified. Works with both regular and grouped DataFrames.
   *
   * @example
   * // Select a single column
   * df.select("name")
   *
   * @example
   * // Select multiple columns
   * df.select("name", "age", "email")
   *
   * @example
   * // Select using array syntax
   * df.select(["name", "age", "email"])
   *
   * @example
   * // Select on grouped DataFrames
   * df.groupBy("category").select("value", "price")
   */
  <GroupName extends keyof Row, ColName extends keyof Row>(
    this: GroupedDataFrame<Row, GroupName>,
    columnName: RestrictEmptyDataFrame<Row, ColName, EmptyDataFrameSelect>,
    ...columnNames: RestrictEmptyDataFrame<Row, ColName[], EmptyDataFrameSelect>
  ): PreserveGrouping<Row, GroupName, RowAfterSelect<Row, ColName>>;
  /**
   * Select one or more columns from the DataFrame.
   *
   * Returns a new DataFrame containing only the specified columns. Column order
   * is preserved as specified. Works with both regular and grouped DataFrames.
   *
   * @example
   * // Select a single column
   * df.select("name")
   *
   * @example
   * // Select multiple columns
   * df.select("name", "age", "email")
   *
   * @example
   * // Select using array syntax
   * df.select(["name", "age", "email"])
   *
   * @example
   * // Select on grouped DataFrames
   * df.groupBy("category").select("value", "price")
   */
  <ColName extends keyof Row>(
    columnName: RestrictEmptyDataFrame<Row, ColName, EmptyDataFrameSelect>,
    ...columnNames: RestrictEmptyDataFrame<Row, ColName[], EmptyDataFrameSelect>
  ): DataFrame<RowAfterSelect<Row, ColName>>;

  // Array syntax
  /**
   * Select one or more columns from the DataFrame.
   *
   * Returns a new DataFrame containing only the specified columns. Column order
   * is preserved as specified. Works with both regular and grouped DataFrames.
   *
   * @example
   * // Select a single column
   * df.select("name")
   *
   * @example
   * // Select multiple columns
   * df.select("name", "age", "email")
   *
   * @example
   * // Select using array syntax
   * df.select(["name", "age", "email"])
   *
   * @example
   * // Select on grouped DataFrames
   * df.groupBy("category").select("value", "price")
   */
  <GroupName extends keyof Row, ColName extends keyof Row>(
    this: GroupedDataFrame<Row, GroupName>,
    columns: RestrictEmptyDataFrame<Row, ColName[], EmptyDataFrameSelect>,
  ): PreserveGrouping<Row, GroupName, RowAfterSelect<Row, ColName>>;

  /**
   * Select one or more columns from the DataFrame.
   *
   * Returns a new DataFrame containing only the specified columns. Column order
   * is preserved as specified. Works with both regular and grouped DataFrames.
   *
   * @example
   * // Select a single column
   * df.select("name")
   *
   * @example
   * // Select multiple columns
   * df.select("name", "age", "email")
   *
   * @example
   * // Select using array syntax
   * df.select(["name", "age", "email"])
   *
   * @example
   * // Select on grouped DataFrames
   * df.groupBy("category").select("value", "price")
   */
  <ColName extends keyof Row>(
    columns: RestrictEmptyDataFrame<Row, ColName[], EmptyDataFrameSelect>,
  ): DataFrame<RowAfterSelect<Row, ColName>>;
};
