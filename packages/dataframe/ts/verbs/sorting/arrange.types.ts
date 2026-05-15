import type {
  DataFrame,
  GroupedDataFrame,
} from "../../dataframe/index.ts";

type SortDirection = "asc" | "desc";

// Arrange preserves row shape (ordering only) — Row is used directly below.

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
export type ArrangeMethod = {
  // Single column overloads
  <R extends object, GroupName extends keyof R>(
    this: GroupedDataFrame<R, GroupName>,
    column: keyof R,
    direction?: "asc" | "desc",
  ): GroupedDataFrame<R, GroupName>;
  <R extends object>(
    this: DataFrame<R>,
    column: keyof R,
    direction?: "asc" | "desc",
  ): DataFrame<R>;

  // Multiple columns overloads (legacy)
  <R extends object, GroupName extends keyof R>(
    this: GroupedDataFrame<R, GroupName>,
    columns: (keyof R)[],
    directions?: ("asc" | "desc")[],
  ): GroupedDataFrame<R, GroupName>;
  <R extends object>(
    this: DataFrame<R>,
    columns: (keyof R)[],
    directions?: ("asc" | "desc")[],
  ): DataFrame<R>;

  // New API: rest parameters
  <R extends object, GroupName extends keyof R>(
    this: GroupedDataFrame<R, GroupName>,
    column1: keyof R,
    ...columns: (keyof R)[]
  ): GroupedDataFrame<R, GroupName>;
  <R extends object>(
    this: DataFrame<R>,
    column1: keyof R,
    ...columns: (keyof R)[]
  ): DataFrame<R>;

  // New API: array with directions
  <R extends object, GroupName extends keyof R>(
    this: GroupedDataFrame<R, GroupName>,
    columns: (keyof R)[],
    directions?: SortDirection | SortDirection[],
  ): GroupedDataFrame<R, GroupName>;
  <R extends object>(
    this: DataFrame<R>,
    columns: (keyof R)[],
    directions?: SortDirection | SortDirection[],
  ): DataFrame<R>;
};
