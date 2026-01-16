import type {
  DataFrame,
  GroupedDataFrame,
  PreserveGrouping,
} from "../../dataframe/index.ts";

export type YearMethod<Row extends object> = {
  <GroupName extends keyof Row>(
    this: GroupedDataFrame<Row, GroupName>,
    column: keyof Row,
  ): PreserveGrouping<Row, GroupName, Row>;

  (
    column: keyof Row,
  ): DataFrame<Row>;
};

export type MonthMethod<Row extends object> = {
  <GroupName extends keyof Row>(
    this: GroupedDataFrame<Row, GroupName>,
    column: keyof Row,
  ): PreserveGrouping<Row, GroupName, Row>;

  (
    column: keyof Row,
  ): DataFrame<Row>;
};

export type DayMethod<Row extends object> = {
  <GroupName extends keyof Row>(
    this: GroupedDataFrame<Row, GroupName>,
    column: keyof Row,
  ): PreserveGrouping<Row, GroupName, Row>;

  (
    column: keyof Row,
  ): DataFrame<Row>;
};
