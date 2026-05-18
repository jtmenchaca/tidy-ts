import type { DataFrame } from "../../dataframe/index.ts";
/**
 * prepend method type for DataFrames - adds rows to the beginning
 * Supports single object, array of objects, multiple individual objects, or another DataFrame
 */
export type PrependMethod<Row extends object> = {
    <R extends object, T extends object>(this: DataFrame<R>, dataframe: DataFrame<T>): DataFrame<R | T>;
    <R extends object>(this: DataFrame<R>, row: R): DataFrame<R>;
    <R extends object>(this: DataFrame<R>, rows: R[]): DataFrame<R>;
    <R extends object>(this: DataFrame<R>, ...rows: R[]): DataFrame<R>;
};
