import type {
  DataFrame,
  GroupedDataFrame,
} from "../../dataframe/index.ts";

export type YearMethod = {
  <R extends object, GroupName extends keyof R>(
    this: GroupedDataFrame<R, GroupName>,
    column: keyof R,
  ): GroupedDataFrame<R, GroupName>;
  <R extends object>(
    this: DataFrame<R>,
    column: keyof R,
  ): DataFrame<R>;
};

export type MonthMethod = {
  <R extends object, GroupName extends keyof R>(
    this: GroupedDataFrame<R, GroupName>,
    column: keyof R,
  ): GroupedDataFrame<R, GroupName>;
  <R extends object>(
    this: DataFrame<R>,
    column: keyof R,
  ): DataFrame<R>;
};

export type DayMethod = {
  <R extends object, GroupName extends keyof R>(
    this: GroupedDataFrame<R, GroupName>,
    column: keyof R,
  ): GroupedDataFrame<R, GroupName>;
  <R extends object>(
    this: DataFrame<R>,
    column: keyof R,
  ): DataFrame<R>;
};
