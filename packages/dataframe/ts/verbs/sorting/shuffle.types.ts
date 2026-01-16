import type { DataFrame, GroupedDataFrame } from "../../dataframe/index.ts";

/**
 * shuffle method type for DataFrames - randomizes row order
 */
export type ShuffleMethod<Row extends object> = {
  <GroupName extends keyof Row>(
    this: GroupedDataFrame<Row, GroupName>,
    seed?: number,
  ): DataFrame<Row>;
  (seed?: number): DataFrame<Row>;
};
