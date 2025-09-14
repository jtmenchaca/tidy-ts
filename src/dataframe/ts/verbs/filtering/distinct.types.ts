import type {
  DataFrame,
  GroupedDataFrame,
  PreserveGrouping,
  Prettify,
} from "../../dataframe/index.ts";

/** Distinct preserves row shape (removes duplicates only). */
export type RowAfterDistinct<Row extends object> = Prettify<
  Row
>;

export type DistinctMethod<Row extends object> = {
  <GroupName extends keyof Row>(
    this: GroupedDataFrame<Row, GroupName>,
    ...columnNames: Array<keyof Row>
  ): PreserveGrouping<Row, GroupName, RowAfterDistinct<Row>>;

  (...columnNames: Array<keyof Row>): DataFrame<RowAfterDistinct<Row>>;
};
