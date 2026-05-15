import type {
  DataFrame,
  GroupedDataFrame,
} from "../../dataframe/index.ts";

export type SelectMethod = {
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
  ): GroupedDataFrame<{ [K in First | Rest[number]]: R[K] }, GroupName extends First | Rest[number] ? GroupName : never>;
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
  ): DataFrame<{ [K in First | Rest[number]]: R[K] }>;
};
