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
  /**
   * Rename columns in the DataFrame.
   *
   * Provide a mapping object where keys are new names and values are existing column names.
   * All other columns remain unchanged. Type-safe with full autocomplete support.
   *
   * @example
   * // Rename a single column
   * df.rename({ firstName: "name" })
   *
   * @example
   * // Rename multiple columns
   * df.rename({
   *   fullName: "name",
   *   yearsOld: "age",
   *   emailAddr: "email"
   * })
   *
   * @example
   * // Works with grouped DataFrames
   * df.groupBy("category").rename({ val: "value" })
   */
  <GroupName extends keyof Row, RenameMap extends Record<string, keyof Row>>(
    this: GroupedDataFrame<Row, GroupName>,
    mapping: RenameMap,
  ): PreserveGrouping<Row, GroupName, RowAfterRename<Row, RenameMap>>;

  /**
   * Rename columns in the DataFrame.
   *
   * Provide a mapping object where keys are new names and values are existing column names.
   * All other columns remain unchanged. Type-safe with full autocomplete support.
   *
   * @example
   * // Rename a single column
   * df.rename({ firstName: "name" })
   *
   * @example
   * // Rename multiple columns
   * df.rename({
   *   fullName: "name",
   *   yearsOld: "age",
   *   emailAddr: "email"
   * })
   *
   * @example
   * // Works with grouped DataFrames
   * df.groupBy("category").rename({ val: "value" })
   */
  <RenameMap extends Record<string, keyof Row>>(
    mapping: RenameMap,
  ): DataFrame<RowAfterRename<Row, RenameMap>>;
};
