import type {
  DataFrame,
  GroupedDataFrame,
  PreserveGrouping,
  Prettify,
} from "../../dataframe/index.ts";

/** Distinct returns only the specified columns (SQL-like behavior). */
export type RowAfterDistinct<
  Row extends object,
  Cols extends keyof Row,
> = Prettify<
  Pick<Row, Cols>
>;

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
  <GroupName extends keyof Row, Cols extends keyof Row>(
    this: GroupedDataFrame<Row, GroupName>,
    column1: Cols,
    ...moreColumns: Cols[]
  ): PreserveGrouping<Row, GroupName, RowAfterDistinct<Row, Cols>>;

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
  <Cols extends keyof Row>(
    column1: Cols,
    ...moreColumns: Cols[]
  ): DataFrame<RowAfterDistinct<Row, Cols>>;
};
