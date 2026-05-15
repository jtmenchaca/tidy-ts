import type { DataFrame, GroupedDataFrame } from "../../dataframe/index.ts";

/**
 * shuffle method type for DataFrames - randomizes row order
 */
export type ShuffleMethod = {
  <R extends object, GroupName extends keyof R>(
    this: GroupedDataFrame<R, GroupName>,
    seed?: number,
  ): DataFrame<R>;
  <R extends object>(
    this: DataFrame<R>,
    seed?: number,
  ): DataFrame<R>;
};
