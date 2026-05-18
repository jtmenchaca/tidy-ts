import type { DataFrame } from "../../dataframe/index.ts";
/**
 * append method type for DataFrames - adds rows to the end
 * Supports single object, array of objects, multiple individual objects, or another DataFrame
 */
export type AppendMethod<Row extends object> = {
    <R extends object, T extends object>(this: DataFrame<R>, dataframe: DataFrame<T>): DataFrame<R | T>;
    <R extends object>(this: DataFrame<R>, row: R): DataFrame<R>;
    <R extends object>(this: DataFrame<R>, rows: R[]): DataFrame<R>;
    <R extends object>(this: DataFrame<R>, ...rows: R[]): DataFrame<R>;
};
