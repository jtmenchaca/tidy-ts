import type {
  DataFrame,
  GroupedDataFrame,
  PreserveGrouping,
  Prettify,
} from "../../dataframe/index.ts";

type SortDirection = "asc" | "desc";

/** Arrange preserves row shape (ordering only). */
export type RowAfterArrange<Row extends object> = Prettify<
  Row
>;

/**
 * Sort rows by one or more columns.
 *
 * Orders rows based on column values in ascending or descending order. Multiple columns
 * create nested sorting (first by column1, then by column2, etc.). For grouped DataFrames,
 * sorting is applied within each group.
 *
 * @example
 * // Sort by single column (ascending by default)
 * df.arrange("age")
 *
 * @example
 * // Sort descending
 * df.arrange("age", "desc")
 *
 * @example
 * // Sort by multiple columns
 * df.arrange("lastName", "firstName")
 *
 * @example
 * // Multiple columns with directions
 * df.arrange(["category", "price"], ["asc", "desc"])
 *
 * @example
 * // Sort within groups
 * df.groupBy("category").arrange("price", "desc")
 */
export type ArrangeMethod<Row extends object> = {
  // Single column overloads
  /**
   * Sort rows by one or more columns.
   *
   * Orders rows based on column values in ascending or descending order. Multiple columns
   * create nested sorting (first by column1, then by column2, etc.). For grouped DataFrames,
   * sorting is applied within each group.
   *
   * @example
   * // Sort by single column (ascending by default)
   * df.arrange("age")
   *
   * @example
   * // Sort descending
   * df.arrange("age", "desc")
   *
   * @example
   * // Sort by multiple columns
   * df.arrange("lastName", "firstName")
   *
   * @example
   * // Multiple columns with directions
   * df.arrange(["category", "price"], ["asc", "desc"])
   *
   * @example
   * // Sort within groups
   * df.groupBy("category").arrange("price", "desc")
   */
  <R extends object, GroupName extends keyof R>(
    this: GroupedDataFrame<R, GroupName>,
    column: keyof R,
    direction?: "asc" | "desc",
  ): PreserveGrouping<R, GroupName, RowAfterArrange<R>>;
  /**
   * Sort rows by one or more columns.
   *
   * Orders rows based on column values in ascending or descending order. Multiple columns
   * create nested sorting (first by column1, then by column2, etc.). For grouped DataFrames,
   * sorting is applied within each group.
   *
   * @example
   * // Sort by single column (ascending by default)
   * df.arrange("age")
   *
   * @example
   * // Sort descending
   * df.arrange("age", "desc")
   *
   * @example
   * // Sort by multiple columns
   * df.arrange("lastName", "firstName")
   *
   * @example
   * // Multiple columns with directions
   * df.arrange(["category", "price"], ["asc", "desc"])
   *
   * @example
   * // Sort within groups
   * df.groupBy("category").arrange("price", "desc")
   */
  (
    column: keyof Row,
    direction?: "asc" | "desc",
  ): DataFrame<RowAfterArrange<Row>>;

  // Multiple columns overloads (legacy)
  /**
   * Sort rows by one or more columns.
   *
   * Orders rows based on column values in ascending or descending order. Multiple columns
   * create nested sorting (first by column1, then by column2, etc.). For grouped DataFrames,
   * sorting is applied within each group.
   *
   * @example
   * // Sort by single column (ascending by default)
   * df.arrange("age")
   *
   * @example
   * // Sort descending
   * df.arrange("age", "desc")
   *
   * @example
   * // Sort by multiple columns
   * df.arrange("lastName", "firstName")
   *
   * @example
   * // Multiple columns with directions
   * df.arrange(["category", "price"], ["asc", "desc"])
   *
   * @example
   * // Sort within groups
   * df.groupBy("category").arrange("price", "desc")
   */
  <R extends object, GroupName extends keyof R>(
    this: GroupedDataFrame<R, GroupName>,
    columns: (keyof R)[],
    directions?: ("asc" | "desc")[],
  ): PreserveGrouping<R, GroupName, RowAfterArrange<R>>;
  /**
   * Sort rows by one or more columns.
   *
   * Orders rows based on column values in ascending or descending order. Multiple columns
   * create nested sorting (first by column1, then by column2, etc.). For grouped DataFrames,
   * sorting is applied within each group.
   *
   * @example
   * // Sort by single column (ascending by default)
   * df.arrange("age")
   *
   * @example
   * // Sort descending
   * df.arrange("age", "desc")
   *
   * @example
   * // Sort by multiple columns
   * df.arrange("lastName", "firstName")
   *
   * @example
   * // Multiple columns with directions
   * df.arrange(["category", "price"], ["asc", "desc"])
   *
   * @example
   * // Sort within groups
   * df.groupBy("category").arrange("price", "desc")
   */
  (
    columns: (keyof Row)[],
    directions?: ("asc" | "desc")[],
  ): DataFrame<RowAfterArrange<Row>>;

  // New API: rest parameters
  /**
   * Sort rows by one or more columns.
   *
   * Orders rows based on column values in ascending or descending order. Multiple columns
   * create nested sorting (first by column1, then by column2, etc.). For grouped DataFrames,
   * sorting is applied within each group.
   *
   * @example
   * // Sort by single column (ascending by default)
   * df.arrange("age")
   *
   * @example
   * // Sort descending
   * df.arrange("age", "desc")
   *
   * @example
   * // Sort by multiple columns
   * df.arrange("lastName", "firstName")
   *
   * @example
   * // Multiple columns with directions
   * df.arrange(["category", "price"], ["asc", "desc"])
   *
   * @example
   * // Sort within groups
   * df.groupBy("category").arrange("price", "desc")
   */
  <R extends object, GroupName extends keyof R>(
    this: GroupedDataFrame<R, GroupName>,
    column1: keyof R,
    ...columns: (keyof R)[]
  ): PreserveGrouping<R, GroupName, RowAfterArrange<R>>;
  /**
   * Sort rows by one or more columns.
   *
   * Orders rows based on column values in ascending or descending order. Multiple columns
   * create nested sorting (first by column1, then by column2, etc.). For grouped DataFrames,
   * sorting is applied within each group.
   *
   * @example
   * // Sort by single column (ascending by default)
   * df.arrange("age")
   *
   * @example
   * // Sort descending
   * df.arrange("age", "desc")
   *
   * @example
   * // Sort by multiple columns
   * df.arrange("lastName", "firstName")
   *
   * @example
   * // Multiple columns with directions
   * df.arrange(["category", "price"], ["asc", "desc"])
   *
   * @example
   * // Sort within groups
   * df.groupBy("category").arrange("price", "desc")
   */
  (
    column1: keyof Row,
    ...columns: (keyof Row)[]
  ): DataFrame<RowAfterArrange<Row>>;

  // New API: array with directions
  /**
   * Sort rows by one or more columns.
   *
   * Orders rows based on column values in ascending or descending order. Multiple columns
   * create nested sorting (first by column1, then by column2, etc.). For grouped DataFrames,
   * sorting is applied within each group.
   *
   * @example
   * // Sort by single column (ascending by default)
   * df.arrange("age")
   *
   * @example
   * // Sort descending
   * df.arrange("age", "desc")
   *
   * @example
   * // Sort by multiple columns
   * df.arrange("lastName", "firstName")
   *
   * @example
   * // Multiple columns with directions
   * df.arrange(["category", "price"], ["asc", "desc"])
   *
   * @example
   * // Sort within groups
   * df.groupBy("category").arrange("price", "desc")
   */
  <R extends object, GroupName extends keyof R>(
    this: GroupedDataFrame<R, GroupName>,
    columns: (keyof R)[],
    directions?: SortDirection | SortDirection[],
  ): PreserveGrouping<R, GroupName, RowAfterArrange<R>>;
  /**
   * Sort rows by one or more columns.
   *
   * Orders rows based on column values in ascending or descending order. Multiple columns
   * create nested sorting (first by column1, then by column2, etc.). For grouped DataFrames,
   * sorting is applied within each group.
   *
   * @example
   * // Sort by single column (ascending by default)
   * df.arrange("age")
   *
   * @example
   * // Sort descending
   * df.arrange("age", "desc")
   *
   * @example
   * // Sort by multiple columns
   * df.arrange("lastName", "firstName")
   *
   * @example
   * // Multiple columns with directions
   * df.arrange(["category", "price"], ["asc", "desc"])
   *
   * @example
   * // Sort within groups
   * df.groupBy("category").arrange("price", "desc")
   */
  (
    columns: (keyof Row)[],
    directions?: SortDirection | SortDirection[],
  ): DataFrame<RowAfterArrange<Row>>;
};
