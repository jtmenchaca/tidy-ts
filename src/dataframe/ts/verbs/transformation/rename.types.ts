import type {
  DataFrame,
  GroupedDataFrame,
  PreserveGrouping,
  Prettify,
} from "../../dataframe/index.ts";

/** Strongly-typed rename result (same logic, centralized). */
export type RowAfterRename<
  Row extends object,
  RenameMap extends Record<string, keyof Row>,
> = Prettify<
  & Omit<Row, RenameMap[keyof RenameMap]>
  & { [NewName in keyof RenameMap]: Row[RenameMap[NewName]] }
>;

export type RenameMethod<Row extends object> = {
  <GroupName extends keyof Row, RenameMap extends Record<string, keyof Row>>(
    this: GroupedDataFrame<Row, GroupName>,
    mapping: RenameMap,
  ): PreserveGrouping<Row, GroupName, RowAfterRename<Row, RenameMap>>;

  <RenameMap extends Record<string, keyof Row>>(
    mapping: RenameMap,
  ): DataFrame<RowAfterRename<Row, RenameMap>>;
};
