import type {
  DataFrame,
  GroupedDataFrame,
  PreserveGrouping,
  Prettify,
} from "../../dataframe/index.ts";

type SortDirection = "asc" | "desc";

/** Arrange preserves row shape (ordering only). */
export type RowAfterArrange<Row extends object> = Prettify<
  Row
>;

export type ArrangeMethod<Row extends object> = {
  // Single column overloads
  <GroupName extends keyof Row>(
    this: GroupedDataFrame<Row, GroupName>,
    column: keyof Row,
    direction?: "asc" | "desc",
  ): PreserveGrouping<Row, GroupName, RowAfterArrange<Row>>;
  (
    column: keyof Row,
    direction?: "asc" | "desc",
  ): DataFrame<RowAfterArrange<Row>>;

  // Multiple columns overloads (legacy)
  <GroupName extends keyof Row>(
    this: GroupedDataFrame<Row, GroupName>,
    columns: (keyof Row)[],
    directions?: ("asc" | "desc")[],
  ): PreserveGrouping<Row, GroupName, RowAfterArrange<Row>>;
  (
    columns: (keyof Row)[],
    directions?: ("asc" | "desc")[],
  ): DataFrame<RowAfterArrange<Row>>;

  // New API: rest parameters
  <GroupName extends keyof Row>(
    this: GroupedDataFrame<Row, GroupName>,
    column1: keyof Row,
    ...columns: (keyof Row)[]
  ): PreserveGrouping<Row, GroupName, RowAfterArrange<Row>>;
  (
    column1: keyof Row,
    ...columns: (keyof Row)[]
  ): DataFrame<RowAfterArrange<Row>>;

  // New API: array with directions
  <GroupName extends keyof Row>(
    this: GroupedDataFrame<Row, GroupName>,
    columns: (keyof Row)[],
    directions?: SortDirection | SortDirection[],
  ): PreserveGrouping<Row, GroupName, RowAfterArrange<Row>>;
  (
    columns: (keyof Row)[],
    directions?: SortDirection | SortDirection[],
  ): DataFrame<RowAfterArrange<Row>>;
};
