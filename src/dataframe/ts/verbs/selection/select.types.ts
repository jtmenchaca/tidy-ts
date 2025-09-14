import type {
  DataFrame,
  GroupedDataFrame,
  PreserveGrouping,
  Prettify,
} from "../../dataframe/index.ts";
import type {
  EmptyDataFrameSelect,
  RestrictEmptyDataFrame,
} from "../../dataframe/types/error-types.ts";

export type RowAfterSelect<
  Row extends object,
  ColName extends keyof Row,
> = Prettify<Pick<Row, ColName>>;

export type SelectMethod<Row extends object> = {
  // Rest parameters syntax
  <GroupName extends keyof Row, ColName extends keyof Row>(
    this: GroupedDataFrame<Row, GroupName>,
    columnName: RestrictEmptyDataFrame<Row, ColName, EmptyDataFrameSelect>,
    ...columnNames: RestrictEmptyDataFrame<Row, ColName[], EmptyDataFrameSelect>
  ): PreserveGrouping<Row, GroupName, RowAfterSelect<Row, ColName>>;

  <ColName extends keyof Row>(
    columnName: RestrictEmptyDataFrame<Row, ColName, EmptyDataFrameSelect>,
    ...columnNames: RestrictEmptyDataFrame<Row, ColName[], EmptyDataFrameSelect>
  ): DataFrame<RowAfterSelect<Row, ColName>>;

  // Array syntax
  <GroupName extends keyof Row, ColName extends keyof Row>(
    this: GroupedDataFrame<Row, GroupName>,
    columns: RestrictEmptyDataFrame<Row, ColName[], EmptyDataFrameSelect>,
  ): PreserveGrouping<Row, GroupName, RowAfterSelect<Row, ColName>>;

  <ColName extends keyof Row>(
    columns: RestrictEmptyDataFrame<Row, ColName[], EmptyDataFrameSelect>,
  ): DataFrame<RowAfterSelect<Row, ColName>>;
};
