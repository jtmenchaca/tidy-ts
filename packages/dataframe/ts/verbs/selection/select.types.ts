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
  <R extends object, GroupName extends keyof R, First extends keyof R, const Rest extends readonly (keyof R)[]>(
    this: GroupedDataFrame<R, GroupName>,
    columnName: First,
    ...columnNames: Rest
  ): PreserveGrouping<R, GroupName, RowAfterSelect<R, First | Rest[number]>>;
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
  <R extends object, First extends keyof R, const Rest extends readonly (keyof R)[]>(
    this: DataFrame<R>,
    columnName: First,
    ...columnNames: Rest
  ): DataFrame<RowAfterSelect<R, First | Rest[number]>>;

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
  <R extends object, GroupName extends keyof R, ColName extends keyof R>(
    this: GroupedDataFrame<R, GroupName>,
    columns: RestrictEmptyDataFrame<R, ColName[], EmptyDataFrameSelect>,
  ): PreserveGrouping<R, GroupName, RowAfterSelect<R, ColName>>;

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
  <R extends object, ColName extends keyof R>(
    this: DataFrame<R>,
    columns: RestrictEmptyDataFrame<R, ColName[], EmptyDataFrameSelect>,
  ): DataFrame<RowAfterSelect<R, ColName>>;
};
