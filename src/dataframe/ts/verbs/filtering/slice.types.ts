import type { DataFrame, GroupedDataFrame } from "../../dataframe/index.ts";
import type {
  EmptyDataFrameSlice,
  RestrictEmptyDataFrame,
} from "../../dataframe/types/error-types.ts";

/**
 * Extract rows by index range.
 *
 * Returns rows from start index (inclusive) to end index (exclusive), similar to
 * array slicing. Negative indices count from the end. For grouped DataFrames,
 * slicing is applied within each group.
 *
 * @example
 * // Get first 5 rows
 * df.slice(0, 5)
 *
 * @example
 * // Get rows 10-20
 * df.slice(10, 20)
 *
 * @example
 * // Get last 3 rows
 * df.slice(-3)
 *
 * @example
 * // Slice within groups
 * df.groupBy("category").slice(0, 5)
 */
export type SliceRowsMethod<Row extends object> = {
  /**
   * Extract rows by index range.
   *
   * Returns rows from start index (inclusive) to end index (exclusive), similar to
   * array slicing. Negative indices count from the end. For grouped DataFrames,
   * slicing is applied within each group.
   *
   * @example
   * // Get first 5 rows
   * df.slice(0, 5)
   *
   * @example
   * // Get rows 10-20
   * df.slice(10, 20)
   *
   * @example
   * // Get last 3 rows
   * df.slice(-3)
   *
   * @example
   * // Slice within groups
   * df.groupBy("category").slice(0, 5)
   */
  <GroupName extends keyof Row>(
    this: GroupedDataFrame<Row, GroupName>,
    start: RestrictEmptyDataFrame<Row, number, EmptyDataFrameSlice>,
    end?: number,
  ): GroupedDataFrame<Row, GroupName>;
  /**
   * Extract rows by index range.
   *
   * Returns rows from start index (inclusive) to end index (exclusive), similar to
   * array slicing. Negative indices count from the end. For grouped DataFrames,
   * slicing is applied within each group.
   *
   * @example
   * // Get first 5 rows
   * df.slice(0, 5)
   *
   * @example
   * // Get rows 10-20
   * df.slice(10, 20)
   *
   * @example
   * // Get last 3 rows
   * df.slice(-3)
   *
   * @example
   * // Slice within groups
   * df.groupBy("category").slice(0, 5)
   */
  (
    start: RestrictEmptyDataFrame<Row, number, EmptyDataFrameSlice>,
    end?: number,
  ): DataFrame<Row>;
};

export type SliceIndicesMethod<Row extends object> = {
  /**
   * Extract specific rows by their indices.
   *
   * Returns rows at the specified index positions. Useful when you need specific
   * rows by their positions rather than a range.
   *
   * @example
   * // Get rows at indices 0, 5, and 10
   * df.sliceIndices(0, 5, 10)
   *
   * @example
   * // Get specific rows
   * df.sliceIndices(1, 3, 5, 7, 9)
   *
   * @example
   * // Within groups
   * df.groupBy("category").sliceIndices(0, 1)
   */
  <GroupName extends keyof Row>(
    this: GroupedDataFrame<Row, GroupName>,
    ...indices: number[]
  ): GroupedDataFrame<Row, GroupName>;
  /**
   * Extract specific rows by their indices.
   *
   * Returns rows at the specified index positions. Useful when you need specific
   * rows by their positions rather than a range.
   *
   * @example
   * // Get rows at indices 0, 5, and 10
   * df.sliceIndices(0, 5, 10)
   *
   * @example
   * // Get specific rows
   * df.sliceIndices(1, 3, 5, 7, 9)
   *
   * @example
   * // Within groups
   * df.groupBy("category").sliceIndices(0, 1)
   */
  (...indices: number[]): DataFrame<Row>;
};

/**
 * Get the first N rows.
 *
 * Returns the specified number of rows from the beginning of the DataFrame.
 * For grouped DataFrames, returns the first N rows from each group.
 *
 * @example
 * // Get first 5 rows
 * df.sliceHead(5)
 *
 * @example
 * // First 10 rows from each group
 * df.groupBy("category").sliceHead(10)
 */
export type SliceHeadMethod<Row extends object> = {
  /**
   * Get the first N rows.
   *
   * Returns the specified number of rows from the beginning of the DataFrame.
   * For grouped DataFrames, returns the first N rows from each group.
   *
   * @example
   * // Get first 10 rows
   * df.sliceHead(10)
   *
   * @example
   * // Get first 5 rows
   * df.sliceHead(5)
   *
   * @example
   * // Get first 3 rows of each group
   * df.groupBy("category").sliceHead(3)
   */
  <GroupName extends keyof Row>(
    this: GroupedDataFrame<Row, GroupName>,
    count: RestrictEmptyDataFrame<Row, number, EmptyDataFrameSlice>,
  ): GroupedDataFrame<Row, GroupName>;
  /**
   * Get the first N rows.
   *
   * Returns the specified number of rows from the beginning of the DataFrame.
   * For grouped DataFrames, returns the first N rows from each group.
   *
   * @example
   * // Get first 10 rows
   * df.sliceHead(10)
   *
   * @example
   * // Get first 5 rows
   * df.sliceHead(5)
   *
   * @example
   * // Get first 3 rows of each group
   * df.groupBy("category").sliceHead(3)
   */
  (
    count: RestrictEmptyDataFrame<Row, number, EmptyDataFrameSlice>,
  ): DataFrame<Row>;
};

export type SliceTailMethod<Row extends object> = SliceHeadMethod<Row>;

/**
 * Get rows with the smallest values in a column.
 *
 * Returns the N rows with the smallest values in the specified column.
 * For grouped DataFrames, returns the N smallest rows from each group.
 *
 * @example
 * // Get 5 rows with lowest prices
 * df.sliceMin("price", 5)
 *
 * @example
 * // Get 10 youngest people
 * df.sliceMin("age", 10)
 *
 * @example
 * // Get 3 cheapest items per category
 * df.groupBy("category").sliceMin("price", 3)
 */
export type SliceMinMethod<Row extends object> = {
  /**
   * Get rows with the smallest values in a column.
   *
   * Returns the N rows with the smallest values in the specified column.
   * For grouped DataFrames, returns the N smallest rows from each group.
   *
   * @example
   * // Get 5 rows with lowest prices
   * df.sliceMin("price", 5)
   *
   * @example
   * // Get 10 youngest people
   * df.sliceMin("age", 10)
   *
   * @example
   * // Get 3 cheapest items per category
   * df.groupBy("category").sliceMin("price", 3)
   */
  <GroupName extends keyof Row, ColName extends keyof Row>(
    this: GroupedDataFrame<Row, GroupName>,
    columnName: RestrictEmptyDataFrame<Row, ColName, EmptyDataFrameSlice>,
    count: number,
  ): GroupedDataFrame<Row, GroupName>;
  /**
   * Get rows with the smallest values in a column.
   *
   * Returns the N rows with the smallest values in the specified column.
   * For grouped DataFrames, returns the N smallest rows from each group.
   *
   * @example
   * // Get 5 rows with lowest prices
   * df.sliceMin("price", 5)
   *
   * @example
   * // Get 10 youngest people
   * df.sliceMin("age", 10)
   *
   * @example
   * // Get 3 cheapest items per category
   * df.groupBy("category").sliceMin("price", 3)
   */
  <ColName extends keyof Row>(
    columnName: RestrictEmptyDataFrame<Row, ColName, EmptyDataFrameSlice>,
    count: number,
  ): DataFrame<Row>;
};

export type SliceMaxMethod<Row extends object> = SliceMinMethod<Row>;

/**
 * Get a random sample of rows.
 *
 * Returns a random sample of N rows from the DataFrame. Optionally provide
 * a seed for reproducible sampling. For grouped DataFrames, samples N rows
 * from each group.
 *
 * @example
 * // Get 10 random rows
 * df.sliceSample(10)
 *
 * @example
 * // Sample with seed for reproducibility
 * df.sliceSample(10, { seed: 42 })
 *
 * @example
 * // Sample 5 rows from each group
 * df.groupBy("category").sliceSample(5)
 */
export type SliceSampleMethod<Row extends object> = {
  /**
   * Get a random sample of rows.
   *
   * Returns a random sample of N rows from the DataFrame. Optionally provide
   * a seed for reproducible sampling. For grouped DataFrames, samples N rows
   * from each group.
   *
   * @example
   * // Get 10 random rows
   * df.sample(10)
   *
   * @example
   * // Get 5 random rows with reproducible seed
   * df.sample(5, 42)
   *
   * @example
   * // Get 3 random rows from each group
   * df.groupBy("category").sample(3)
   */
  <GroupName extends keyof Row>(
    this: GroupedDataFrame<Row, GroupName>,
    count: RestrictEmptyDataFrame<Row, number, EmptyDataFrameSlice>,
    seed?: number,
  ): GroupedDataFrame<Row, GroupName>;
  /**
   * Get a random sample of rows.
   *
   * Returns a random sample of N rows from the DataFrame. Optionally provide
   * a seed for reproducible sampling. For grouped DataFrames, samples N rows
   * from each group.
   *
   * @example
   * // Get 10 random rows
   * df.sample(10)
   *
   * @example
   * // Get 5 random rows with reproducible seed
   * df.sample(5, 42)
   *
   * @example
   * // Get 3 random rows from each group
   * df.groupBy("category").sample(3)
   */
  (
    count: RestrictEmptyDataFrame<Row, number, EmptyDataFrameSlice>,
    seed?: number,
  ): DataFrame<Row>;
};
