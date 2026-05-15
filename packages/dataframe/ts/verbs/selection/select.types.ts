import type {
  DataFrame,
  GroupedDataFrame,
  PreserveGrouping,
  Prettify,
} from "../../dataframe/index.ts";

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
   * // Select on grouped DataFrames
   * df.groupBy("category").select("value", "price")
   */
  <R extends object, First extends keyof R, const Rest extends readonly (keyof R)[]>(
    this: DataFrame<R>,
    columnName: First,
    ...columnNames: Rest
  ): DataFrame<RowAfterSelect<R, First | Rest[number]>>;
};
