// src/dataframe/ts/types/verbs/group-by.ts
import type { GroupedDataFrame } from "../../dataframe/index.ts";
import type {
  EmptyDataFrameGroupBy,
  RestrictEmptyDataFrame,
} from "../../dataframe/types/error-types.ts";

export type GroupByMethod<Row extends object> = {
  // No arguments - returns ungrouped
  (): GroupedDataFrame<Row, never>;

  // Rest parameters syntax
  <ColName extends keyof Row>(
    ...columnNames: RestrictEmptyDataFrame<
      Row,
      ColName[],
      EmptyDataFrameGroupBy
    >
  ): GroupedDataFrame<Row, ColName>;

  // Array syntax
  <ColName extends keyof Row>(
    columns: RestrictEmptyDataFrame<
      Row,
      ColName[],
      EmptyDataFrameGroupBy
    >,
  ): GroupedDataFrame<Row, ColName>;
};
