import type {
  DataFrame,
  GroupedDataFrame,
} from "../../dataframe/index.ts";
export type ReorderMethod = {
  <R extends object, GroupName extends keyof R>(
    this: GroupedDataFrame<R, GroupName>,
    columnNames: Array<keyof R>,
  ): GroupedDataFrame<R, GroupName>;

  <R extends object>(
    this: DataFrame<R>,
    columnNames: Array<keyof R>,
  ): DataFrame<R>;
};
