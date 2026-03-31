import type { GroupedDataFrame } from "../../dataframe/index.ts";
import type {
  EmptyDataFrameExtract,
  RestrictEmptyDataFrame,
} from "../../dataframe/types/error-types.ts";

/**
 * Type definition for the extractNthWhereSorted method on DataFrames.
 *
 * Provides overloads for single value extraction (rank = 1) and ranked value extraction (rank > 1).
 * Follows the same pattern as extractHead with proper type safety and error handling.
 */
export type ExtractNthWhereSortedMethod<Row extends object> = {
  <ColName extends keyof Row, SortColName extends keyof Row>(
    column: RestrictEmptyDataFrame<Row, ColName, EmptyDataFrameExtract>,
    sortBy: RestrictEmptyDataFrame<Row, SortColName, EmptyDataFrameExtract>,
    direction: "asc" | "desc",
  ): Row[ColName] | undefined;
  <ColName extends keyof Row, SortColName extends keyof Row>(
    column: RestrictEmptyDataFrame<Row, ColName, EmptyDataFrameExtract>,
    sortBy: RestrictEmptyDataFrame<Row, SortColName, EmptyDataFrameExtract>,
    direction: "asc" | "desc",
    rank: number,
  ): Row[ColName] | undefined;
};

/**
 * Type definition for the extractNthWhereSorted method on GroupedDataFrames.
 *
 * Provides the same overloads as the regular DataFrame method but operates within each group.
 * Returns a single value from the group after sorting by the specified column.
 */
export type ExtractNthWhereSortedGroupedMethod<Row extends object> = {
  <
    R extends object,
    GroupName extends keyof R,
    ColName extends keyof R,
    SortColName extends keyof R,
  >(
    this: GroupedDataFrame<R, GroupName>,
    column: RestrictEmptyDataFrame<R, ColName, EmptyDataFrameExtract>,
    sortBy: RestrictEmptyDataFrame<R, SortColName, EmptyDataFrameExtract>,
    direction: "asc" | "desc",
  ): R[ColName] | undefined;
  <
    R extends object,
    GroupName extends keyof R,
    ColName extends keyof R,
    SortColName extends keyof R,
  >(
    this: GroupedDataFrame<R, GroupName>,
    column: RestrictEmptyDataFrame<R, ColName, EmptyDataFrameExtract>,
    sortBy: RestrictEmptyDataFrame<R, SortColName, EmptyDataFrameExtract>,
    direction: "asc" | "desc",
    rank: number,
  ): R[ColName] | undefined;
};
