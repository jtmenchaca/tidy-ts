import type { DataFrame, GroupedDataFrame } from "../../dataframe/index.ts";
/**
 * shuffle method type for DataFrames - randomizes row order
 */
export type ShuffleMethod<Row extends object> = {
    <R extends object, GroupName extends keyof R>(this: GroupedDataFrame<R, GroupName>, seed?: number): DataFrame<R>;
    (seed?: number): DataFrame<Row>;
};
