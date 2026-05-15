import type {
  DataFrame,
  GroupedDataFrame,
  PreserveGrouping,
} from "../../dataframe/index.ts";

/**
 * Get unique combinations of specified columns (SQL DISTINCT).
 *
 * Returns a DataFrame with only the specified columns, keeping the first occurrence
 * of each unique combination. Works like SQL's `SELECT DISTINCT col1, col2 FROM table`.
 * For grouped DataFrames, uniqueness is determined within each group.
 *
 * @example
 * // Get unique regions (returns only region column)
 * df.distinct("region")
 *
 * @example
 * // Get unique category/region combinations (returns only those 2 columns)
 * df.distinct("category", "region")
 *
 * @example
 * // Distinct within groups
 * df.groupBy("year").distinct("product")
 */
export type DistinctMethod<Row extends object> = {
  /**
   * Get unique combinations of specified columns (SQL DISTINCT).
   *
   * Returns a DataFrame with only the specified columns, keeping the first occurrence
   * of each unique combination. Works like SQL's `SELECT DISTINCT col1, col2 FROM table`.
   * For grouped DataFrames, uniqueness is determined within each group.
   *
   * @example
   * // Get unique regions (returns only region column)
   * df.distinct("region")
   *
   * @example
   * // Get unique category/region combinations (returns only those 2 columns)
   * df.distinct("category", "region")
   *
   * @example
   * // Distinct within groups
   * df.groupBy("year").distinct("product")
   */
  <R extends object, GroupName extends keyof R, Cols extends keyof R>(
    this: GroupedDataFrame<R, GroupName>,
    column1: Cols,
    ...moreColumns: Cols[]
  ): PreserveGrouping<R, GroupName, { [K in Cols]: R[K] }>;

  /**
   * Get unique combinations of specified columns (SQL DISTINCT).
   *
   * Returns a DataFrame with only the specified columns, keeping the first occurrence
   * of each unique combination. Works like SQL's `SELECT DISTINCT col1, col2 FROM table`.
   * For grouped DataFrames, uniqueness is determined within each group.
   *
   * @example
   * // Get unique regions (returns only region column)
   * df.distinct("region")
   *
   * @example
   * // Get unique category/region combinations (returns only those 2 columns)
   * df.distinct("category", "region")
   *
   * @example
   * // Distinct within groups
   * df.groupBy("year").distinct("product")
   */
  <R extends object, Cols extends keyof R>(
    this: DataFrame<R>,
    column1: Cols,
    ...moreColumns: Cols[]
  ): DataFrame<{ [K in Cols]: R[K] }>;
};
