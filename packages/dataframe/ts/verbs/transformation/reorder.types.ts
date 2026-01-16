import type {
  DataFrame,
  GroupedDataFrame,
  PreserveGrouping,
} from "../../dataframe/index.ts";
export type ReorderMethod<Row extends object> = {
  <GroupName extends keyof Row>(
    this: GroupedDataFrame<Row, GroupName>,
    columnNames: Array<keyof Row>,
  ): PreserveGrouping<Row, GroupName, Row>;

  (
    columnNames: Array<keyof Row>,
  ): DataFrame<Row>;
};
