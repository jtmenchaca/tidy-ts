import type { DataFrame, GroupedDataFrame } from "../../../dataframe/index.ts";
import type { ColumnValue, ColumnValueResult } from "./mutate.types.ts";
import type { ConcurrencyOptions } from "../../../promised-dataframe/concurrency-utils.ts";
export declare function mutate<Row extends Record<string, unknown>, GroupName extends keyof Row, Formulas extends Record<string, (...a: any[]) => any>>(spec: Formulas & {
    [ColName in keyof Formulas]: (row: Row, idx: number, df: DataFrame<Row>) => ReturnType<Formulas[ColName]>;
}): (df: GroupedDataFrame<Row, GroupName>) => GroupedDataFrame<{
    [K in keyof Row | keyof Formulas]: K extends keyof Formulas ? ReturnType<Formulas[K]> : K extends keyof Row ? Row[K] : never;
}, Extract<GroupName, keyof Row | keyof Formulas>>;
export declare function mutate<Row extends Record<string, unknown>, GroupName extends keyof Row, Assignments extends Record<string, ColumnValue<Row>>>(spec: Assignments): (df: GroupedDataFrame<Row, GroupName>) => GroupedDataFrame<{
    [K in keyof Row | keyof Assignments]: K extends keyof Assignments ? ColumnValueResult<Row, Assignments[K]> : K extends keyof Row ? Row[K] : never;
}, Extract<GroupName, keyof Row | keyof Assignments>>;
export declare function mutate<Row extends Record<string, unknown>, Formulas extends Record<string, (...a: any[]) => any>>(spec: Formulas & {
    [ColName in keyof Formulas]: (row: Row, idx: number, df: DataFrame<Row>) => ReturnType<Formulas[ColName]>;
}): (df: DataFrame<Row>) => DataFrame<{
    [K in keyof Row | keyof Formulas]: K extends keyof Formulas ? ReturnType<Formulas[K]> : K extends keyof Row ? Row[K] : never;
}>;
export declare function mutate<Row extends Record<string, unknown>, Assignments extends Record<string, ColumnValue<Row>>>(spec: Assignments): (df: DataFrame<Row>) => DataFrame<{
    [K in keyof Row | keyof Assignments]: K extends keyof Assignments ? ColumnValueResult<Row, Assignments[K]> : K extends keyof Row ? Row[K] : never;
}>;
export declare function mutateAsync<Row extends Record<string, unknown>, GroupName extends keyof Row, Formulas extends Record<string, (...a: any[]) => any>>(spec: Formulas & {
    [ColName in keyof Formulas]: (row: Row, idx: number, df: DataFrame<Row>) => ReturnType<Formulas[ColName]>;
}, options?: ConcurrencyOptions): (df: GroupedDataFrame<Row, GroupName>) => Promise<GroupedDataFrame<{
    [K in keyof Row | keyof Formulas]: K extends keyof Formulas ? Awaited<ReturnType<Formulas[K]>> : K extends keyof Row ? Row[K] : never;
}, Extract<GroupName, keyof Row | keyof Formulas>>>;
export declare function mutateAsync<Row extends Record<string, unknown>, Formulas extends Record<string, (...a: any[]) => any>>(spec: Formulas & {
    [ColName in keyof Formulas]: (row: Row, idx: number, df: DataFrame<Row>) => ReturnType<Formulas[ColName]>;
}, options?: ConcurrencyOptions): (df: DataFrame<Row>) => Promise<DataFrame<{
    [K in keyof Row | keyof Formulas]: K extends keyof Formulas ? Awaited<ReturnType<Formulas[K]>> : K extends keyof Row ? Row[K] : never;
}>>;
export declare function mutateAsync<Row extends Record<string, unknown>, GroupName extends keyof Row, Assignments extends Record<string, ColumnValue<Row>>>(spec: Assignments, options?: ConcurrencyOptions): (df: GroupedDataFrame<Row, GroupName>) => Promise<GroupedDataFrame<{
    [K in keyof Row | keyof Assignments]: K extends keyof Assignments ? ColumnValueResult<Row, Assignments[K]> : K extends keyof Row ? Row[K] : never;
}, Extract<GroupName, keyof Row | keyof Assignments>>>;
export declare function mutateAsync<Row extends Record<string, unknown>, Assignments extends Record<string, ColumnValue<Row>>>(spec: Assignments, options?: ConcurrencyOptions): (df: DataFrame<Row>) => Promise<DataFrame<{
    [K in keyof Row | keyof Assignments]: K extends keyof Assignments ? ColumnValueResult<Row, Assignments[K]> : K extends keyof Row ? Row[K] : never;
}>>;
