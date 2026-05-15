import type {
  DataFrame,
  GroupedDataFrame,
  PreserveGrouping,
} from "../../dataframe/index.ts";

export type YearMethod<Row extends object> = {
  <R extends object, GroupName extends keyof R>(
    this: GroupedDataFrame<R, GroupName>,
    column: keyof R,
  ): PreserveGrouping<R, GroupName, R>;

  (
    column: keyof Row,
  ): DataFrame<Row>;
};

export type MonthMethod<Row extends object> = {
  <R extends object, GroupName extends keyof R>(
    this: GroupedDataFrame<R, GroupName>,
    column: keyof R,
  ): PreserveGrouping<R, GroupName, R>;

  (
    column: keyof Row,
  ): DataFrame<Row>;
};

export type DayMethod<Row extends object> = {
  <R extends object, GroupName extends keyof R>(
    this: GroupedDataFrame<R, GroupName>,
    column: keyof R,
  ): PreserveGrouping<R, GroupName, R>;

  (
    column: keyof Row,
  ): DataFrame<Row>;
};
