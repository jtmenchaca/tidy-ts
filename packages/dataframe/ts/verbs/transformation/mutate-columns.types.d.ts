import type { DataFrame, GroupedDataFrame } from "../../dataframe/index.ts";
/** Element-wise types for mutate_columns (fn receives a single value) */
export type ElementColumnTypeMap = {
    number: number;
    string: string;
    boolean: boolean;
};
/**
 * Compute generated column names + return types as a single mapped type.
 * For each def `{ prefix?, suffix?, fn }` in the array, generate keys
 * `${prefix}${col}${suffix}` (with prefix/suffix optional) for each input
 * column, with value = the return type of that def's `fn`.
 */
type GenerateColumnNamesWithTypes<ColNames extends readonly string[], NewColDefs extends readonly {
    prefix?: string;
    suffix?: string;
    fn: (...args: any[]) => any;
}[]> = {
    [Def in NewColDefs[number] as Def extends {
        prefix?: infer Prefix;
        suffix?: infer Suffix;
    } ? Prefix extends string ? Suffix extends string ? `${Prefix}${ColNames[number]}${Suffix}` : `${Prefix}${ColNames[number]}` : Suffix extends string ? `${ColNames[number]}${Suffix}` : ColNames[number] : never]: Def extends {
        fn: (...args: any[]) => infer Result;
    } ? Result : never;
};
export type MutateColumnsMethod<Row extends object> = {
    <R extends object, ColType extends keyof ElementColumnTypeMap, const ColNames extends readonly Extract<keyof R, string>[], const NewColDefs extends readonly {
        prefix?: string;
        suffix?: string;
        fn: (col: ElementColumnTypeMap[ColType]) => unknown;
    }[], GroupName extends keyof R>(this: GroupedDataFrame<R, GroupName>, config: {
        colType: ColType;
        columns: ColNames;
        newColumns: NewColDefs;
    }): GroupedDataFrame<{
        [K in keyof R | keyof GenerateColumnNamesWithTypes<ColNames, NewColDefs>]: K extends keyof GenerateColumnNamesWithTypes<ColNames, NewColDefs> ? GenerateColumnNamesWithTypes<ColNames, NewColDefs>[K] : K extends keyof R ? R[K] : never;
    }, Extract<GroupName, keyof R | keyof GenerateColumnNamesWithTypes<ColNames, NewColDefs>>>;
    <R extends object, ColType extends keyof ElementColumnTypeMap, const ColNames extends readonly Extract<keyof R, string>[], const NewColDefs extends readonly {
        prefix?: string;
        suffix?: string;
        fn: (col: ElementColumnTypeMap[ColType]) => unknown;
    }[]>(this: DataFrame<R>, config: {
        colType: ColType;
        columns: ColNames;
        newColumns: NewColDefs;
    }): DataFrame<{
        [K in keyof R | keyof GenerateColumnNamesWithTypes<ColNames, NewColDefs>]: K extends keyof GenerateColumnNamesWithTypes<ColNames, NewColDefs> ? GenerateColumnNamesWithTypes<ColNames, NewColDefs>[K] : K extends keyof R ? R[K] : never;
    }>;
};
export {};
