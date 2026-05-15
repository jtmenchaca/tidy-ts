import type {
  DataFrame,
  GroupedDataFrame,
  PreserveGrouping,
} from "../../dataframe/index.ts";
export type ReorderMethod<Row extends object> = {
  <R extends object, GroupName extends keyof R>(
    this: GroupedDataFrame<R, GroupName>,
    columnNames: Array<keyof R>,
  ): PreserveGrouping<R, GroupName, R>;

  <R extends object>(
    this: DataFrame<R>,
    columnNames: Array<keyof R>,
  ): DataFrame<R>;
};
