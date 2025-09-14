import type { DataFrame, GroupedDataFrame } from "../../dataframe/index.ts";
import type {
  EmptyDataFrameSlice,
  RestrictEmptyDataFrame,
} from "../../dataframe/types/error-types.ts";

export type SliceRowsMethod<Row extends object> = {
  <GroupName extends keyof Row>(
    this: GroupedDataFrame<Row, GroupName>,
    start: RestrictEmptyDataFrame<Row, number, EmptyDataFrameSlice>,
    end?: number,
  ): GroupedDataFrame<Row, GroupName>;
  (
    start: RestrictEmptyDataFrame<Row, number, EmptyDataFrameSlice>,
    end?: number,
  ): DataFrame<Row>;
};

export type SliceIndicesMethod<Row extends object> = {
  <GroupName extends keyof Row>(
    this: GroupedDataFrame<Row, GroupName>,
    ...indices: number[]
  ): GroupedDataFrame<Row, GroupName>;
  (...indices: number[]): DataFrame<Row>;
};

export type SliceHeadMethod<Row extends object> = {
  <GroupName extends keyof Row>(
    this: GroupedDataFrame<Row, GroupName>,
    count: RestrictEmptyDataFrame<Row, number, EmptyDataFrameSlice>,
  ): GroupedDataFrame<Row, GroupName>;
  (
    count: RestrictEmptyDataFrame<Row, number, EmptyDataFrameSlice>,
  ): DataFrame<Row>;
};

export type SliceTailMethod<Row extends object> = SliceHeadMethod<Row>;

export type SliceMinMethod<Row extends object> = {
  <GroupName extends keyof Row, ColName extends keyof Row>(
    this: GroupedDataFrame<Row, GroupName>,
    columnName: RestrictEmptyDataFrame<Row, ColName, EmptyDataFrameSlice>,
    count: number,
  ): GroupedDataFrame<Row, GroupName>;
  <ColName extends keyof Row>(
    columnName: RestrictEmptyDataFrame<Row, ColName, EmptyDataFrameSlice>,
    count: number,
  ): DataFrame<Row>;
};

export type SliceMaxMethod<Row extends object> = SliceMinMethod<Row>;

export type SliceSampleMethod<Row extends object> = {
  <GroupName extends keyof Row>(
    this: GroupedDataFrame<Row, GroupName>,
    count: RestrictEmptyDataFrame<Row, number, EmptyDataFrameSlice>,
    seed?: number,
  ): GroupedDataFrame<Row, GroupName>;
  (
    count: RestrictEmptyDataFrame<Row, number, EmptyDataFrameSlice>,
    seed?: number,
  ): DataFrame<Row>;
};
