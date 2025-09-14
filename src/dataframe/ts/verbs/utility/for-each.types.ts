// src/dataframe/ts/types/verbs/foreach.ts
import type { DataFrame, GroupedDataFrame } from "../../dataframe/index.ts";
import type { IsAsyncFunction } from "../../promised-dataframe/index.ts";
import type {
  EmptyDataFrameForEach,
  RestrictEmptyDataFrame,
} from "../../dataframe/types/error-types.ts";

export type ForEachRowMethod<Row extends object> = {
  // ── Async versions (return Promise) ──────────────────────────────
  <
    GroupName extends keyof Row,
    Callback extends (
      row: Readonly<Row>,
      idx: number,
      df: DataFrame<Row>,
    ) => unknown,
  >(
    this: GroupedDataFrame<Row, GroupName>,
    callback: RestrictEmptyDataFrame<Row, Callback, EmptyDataFrameForEach>,
  ): IsAsyncFunction<Callback> extends true
    ? Promise<GroupedDataFrame<Row, GroupName>>
    : GroupedDataFrame<Row, GroupName>;

  <
    Callback extends (
      row: Readonly<Row>,
      idx: number,
      df: DataFrame<Row>,
    ) => unknown,
  >(
    callback: RestrictEmptyDataFrame<Row, Callback, EmptyDataFrameForEach>,
  ): IsAsyncFunction<Callback> extends true ? Promise<DataFrame<Row>>
    : DataFrame<Row>;
};

export type ForEachColMethod<Row extends object> = {
  // ── Async versions (return Promise) ──────────────────────────────
  <
    GroupName extends keyof Row,
    Callback extends (colName: keyof Row, df: DataFrame<Row>) => unknown,
  >(
    this: GroupedDataFrame<Row, GroupName>,
    callback: RestrictEmptyDataFrame<Row, Callback, EmptyDataFrameForEach>,
  ): IsAsyncFunction<Callback> extends true
    ? Promise<GroupedDataFrame<Row, GroupName>>
    : GroupedDataFrame<Row, GroupName>;

  <Callback extends (colName: keyof Row, df: DataFrame<Row>) => unknown>(
    callback: RestrictEmptyDataFrame<Row, Callback, EmptyDataFrameForEach>,
  ): IsAsyncFunction<Callback> extends true ? Promise<DataFrame<Row>>
    : DataFrame<Row>;
};
