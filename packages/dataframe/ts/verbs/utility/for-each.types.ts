// packages/dataframe/ts/types/verbs/foreach.ts
import type { DataFrame, GroupedDataFrame } from "../../dataframe/index.ts";
import type {
  EmptyDataFrameForEach,
  RestrictEmptyDataFrame,
} from "../../dataframe/types/error-types.ts";

/**
 * Synchronous forEachRow — always returns DataFrame or GroupedDataFrame.
 * Use `forEachRowAsync` for async callbacks.
 */
export type ForEachRowMethod<Row extends object> = {
  <
    R extends object,
    GroupName extends keyof R,
    Callback extends (
      row: Readonly<R>,
      idx: number,
      df: DataFrame<R>,
    ) => void,
  >(
    this: GroupedDataFrame<R, GroupName>,
    callback: RestrictEmptyDataFrame<R, Callback, EmptyDataFrameForEach>,
  ): GroupedDataFrame<R, GroupName>;

  <
    R extends object,
    Callback extends (
      row: Readonly<R>,
      idx: number,
      df: DataFrame<R>,
    ) => void,
  >(
    this: DataFrame<R>,
    callback: RestrictEmptyDataFrame<R, Callback, EmptyDataFrameForEach>,
  ): DataFrame<R>;
};

/**
 * Async forEachRow — always returns Promise<DataFrame> or Promise<GroupedDataFrame>.
 * Use this when the callback is async.
 */
export type ForEachRowAsyncMethod<Row extends object> = {
  <
    R extends object,
    GroupName extends keyof R,
    Callback extends (
      row: Readonly<R>,
      idx: number,
      df: DataFrame<R>,
    ) => unknown,
  >(
    this: GroupedDataFrame<R, GroupName>,
    callback: RestrictEmptyDataFrame<R, Callback, EmptyDataFrameForEach>,
  ): Promise<GroupedDataFrame<R, GroupName>>;

  <
    R extends object,
    Callback extends (
      row: Readonly<R>,
      idx: number,
      df: DataFrame<R>,
    ) => unknown,
  >(
    this: DataFrame<R>,
    callback: RestrictEmptyDataFrame<R, Callback, EmptyDataFrameForEach>,
  ): Promise<DataFrame<R>>;
};

/**
 * Synchronous forEachCol — always returns DataFrame or GroupedDataFrame.
 * Use `forEachColAsync` for async callbacks.
 */
export type ForEachColMethod<Row extends object> = {
  <
    R extends object,
    GroupName extends keyof R,
    Callback extends (colName: keyof R, df: DataFrame<R>) => void,
  >(
    this: GroupedDataFrame<R, GroupName>,
    callback: RestrictEmptyDataFrame<R, Callback, EmptyDataFrameForEach>,
  ): GroupedDataFrame<R, GroupName>;

  <R extends object, Callback extends (colName: keyof R, df: DataFrame<R>) => void>(
    this: DataFrame<R>,
    callback: RestrictEmptyDataFrame<R, Callback, EmptyDataFrameForEach>,
  ): DataFrame<R>;
};

/**
 * Async forEachCol — always returns Promise<DataFrame> or Promise<GroupedDataFrame>.
 * Use this when the callback is async.
 */
export type ForEachColAsyncMethod<Row extends object> = {
  <
    R extends object,
    GroupName extends keyof R,
    Callback extends (colName: keyof R, df: DataFrame<R>) => unknown,
  >(
    this: GroupedDataFrame<R, GroupName>,
    callback: RestrictEmptyDataFrame<R, Callback, EmptyDataFrameForEach>,
  ): Promise<GroupedDataFrame<R, GroupName>>;

  <R extends object, Callback extends (colName: keyof R, df: DataFrame<R>) => unknown>(
    this: DataFrame<R>,
    callback: RestrictEmptyDataFrame<R, Callback, EmptyDataFrameForEach>,
  ): Promise<DataFrame<R>>;
};
