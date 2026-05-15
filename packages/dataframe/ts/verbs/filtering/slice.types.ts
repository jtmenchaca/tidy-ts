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
export type SliceRowsMethod = {
  <R extends object, GroupName extends keyof R>(
    this: GroupedDataFrame<R, GroupName>,
    start: RestrictEmptyDataFrame<R, number, EmptyDataFrameSlice>,
    end?: number,
  ): GroupedDataFrame<R, GroupName>;
  <R extends object>(
    this: DataFrame<R>,
    start: RestrictEmptyDataFrame<R, number, EmptyDataFrameSlice>,
    end?: number,
  ): DataFrame<R>;
};

export type SliceIndicesMethod = {
  <R extends object, GroupName extends keyof R>(
    this: GroupedDataFrame<R, GroupName>,
    ...indices: number[]
  ): GroupedDataFrame<R, GroupName>;
  <R extends object>(
    this: DataFrame<R>,
    ...indices: number[]
  ): DataFrame<R>;
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
export type SliceHeadMethod = {
  <R extends object, GroupName extends keyof R>(
    this: GroupedDataFrame<R, GroupName>,
    count: RestrictEmptyDataFrame<R, number, EmptyDataFrameSlice>,
  ): GroupedDataFrame<R, GroupName>;
  <R extends object>(
    this: DataFrame<R>,
    count: RestrictEmptyDataFrame<R, number, EmptyDataFrameSlice>,
  ): DataFrame<R>;
};

export type SliceTailMethod = SliceHeadMethod;

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
 * // Get 3 cheapest items per category
 * df.groupBy("category").sliceMin("price", 3)
 */
export type SliceMinMethod = {
  <R extends object, GroupName extends keyof R, ColName extends keyof R>(
    this: GroupedDataFrame<R, GroupName>,
    columnName: RestrictEmptyDataFrame<R, ColName, EmptyDataFrameSlice>,
    count: number,
  ): GroupedDataFrame<R, GroupName>;
  <R extends object, ColName extends keyof R>(
    this: DataFrame<R>,
    columnName: RestrictEmptyDataFrame<R, ColName, EmptyDataFrameSlice>,
    count: number,
  ): DataFrame<R>;
};

export type SliceMaxMethod = SliceMinMethod;

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
 * df.sliceSample(10, 42)
 *
 * @example
 * // Sample 5 rows from each group
 * df.groupBy("category").sliceSample(5)
 */
export type SliceSampleMethod = {
  <R extends object, GroupName extends keyof R>(
    this: GroupedDataFrame<R, GroupName>,
    count: RestrictEmptyDataFrame<R, number, EmptyDataFrameSlice>,
    seed?: number,
  ): GroupedDataFrame<R, GroupName>;
  <R extends object>(
    this: DataFrame<R>,
    count: RestrictEmptyDataFrame<R, number, EmptyDataFrameSlice>,
    seed?: number,
  ): DataFrame<R>;
};
