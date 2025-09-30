import type {
  DataFrame,
  GroupedDataFrame,
  PreserveGrouping,
  Prettify,
} from "../../dataframe/index.ts";
import type {
  EmptyDataFrameDrop,
  RestrictEmptyDataFrame,
} from "../../dataframe/types/error-types.ts";

export type RowAfterDrop<
  Row extends object,
  ColName extends keyof Row,
> = Prettify<Omit<Row, ColName>>;

export type DropMethod<Row extends object> = {
  // Rest parameters syntax
  <GroupName extends keyof Row, ColName extends keyof Row>(
    this: GroupedDataFrame<Row, GroupName>,
    ...columnNames: RestrictEmptyDataFrame<Row, ColName[], EmptyDataFrameDrop>
  ): PreserveGrouping<Row, GroupName, RowAfterDrop<Row, ColName>>;

  <ColName extends keyof Row>(
    ...columnNames: RestrictEmptyDataFrame<Row, ColName[], EmptyDataFrameDrop>
  ): DataFrame<RowAfterDrop<Row, ColName>>;

  // Array syntax
  <GroupName extends keyof Row, ColName extends keyof Row>(
    this: GroupedDataFrame<Row, GroupName>,
    columnNames: RestrictEmptyDataFrame<Row, ColName[], EmptyDataFrameDrop>,
  ): PreserveGrouping<Row, GroupName, RowAfterDrop<Row, ColName>>;

  <ColName extends keyof Row>(
    columnNames: RestrictEmptyDataFrame<Row, ColName[], EmptyDataFrameDrop>,
  ): DataFrame<RowAfterDrop<Row, ColName>>;
};
