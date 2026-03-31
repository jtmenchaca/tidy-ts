import type {
  DataFrame,
  GroupedDataFrame,
  Prettify,
  UnionToIntersection,
} from "../../dataframe/index.ts";

/** Element-wise types for mutate_columns (fn receives a single value) */
export type ElementColumnTypeMap = {
  number: number;
  string: string;
  boolean: boolean;
};

/** Compute generated column names + return types */
type GenerateColumnNamesWithTypes<
  ColNames extends readonly string[],
  NewColDefs extends readonly {
    prefix?: string;
    suffix?: string;
    // deno-lint-ignore no-explicit-any
    fn: (...args: any[]) => any;
  }[],
> = UnionToIntersection<
  {
    [Index in keyof NewColDefs]: NewColDefs[Index] extends {
      prefix?: infer Prefix;
      suffix?: infer Suffix;
      // deno-lint-ignore no-explicit-any
      fn: (...args: any[]) => infer Result;
    } ? Prefix extends string ? Suffix extends string ? {
            [ColName in ColNames[number] as `${Prefix}${ColName}${Suffix}`]:
              Result;
          }
        : { [ColName in ColNames[number] as `${Prefix}${ColName}`]: Result }
      : Suffix extends string
        ? { [ColName in ColNames[number] as `${ColName}${Suffix}`]: Result }
      : { [ColName in ColNames[number]]: Result }
      : never;
  }[number]
>;

export type MutateColumnsMethod<Row extends object> = {
  // Grouped
  <
    R extends object,
    ColType extends keyof ElementColumnTypeMap,
    const ColNames extends readonly Extract<keyof R, string>[],
    const NewColDefs extends readonly {
      prefix?: string;
      suffix?: string;
      fn: (col: ElementColumnTypeMap[ColType]) => unknown;
    }[],
    GroupName extends keyof R,
  >(
    this: GroupedDataFrame<R, GroupName>,
    config: {
      colType: ColType;
      columns: ColNames;
      newColumns: NewColDefs;
    },
  ): GroupedDataFrame<
    Prettify<R & GenerateColumnNamesWithTypes<ColNames, NewColDefs>>,
    Extract<
      GroupName,
      keyof Prettify<R & GenerateColumnNamesWithTypes<ColNames, NewColDefs>>
    >
  >;

  // Ungrouped
  <
    R extends object,
    ColType extends keyof ElementColumnTypeMap,
    const ColNames extends readonly Extract<keyof R, string>[],
    const NewColDefs extends readonly {
      prefix?: string;
      suffix?: string;
      fn: (col: ElementColumnTypeMap[ColType]) => unknown;
    }[],
  >(
    this: DataFrame<R>,
    config: {
      colType: ColType;
      columns: ColNames;
      newColumns: NewColDefs;
    },
  ): DataFrame<
    Prettify<R & GenerateColumnNamesWithTypes<ColNames, NewColDefs>>
  >;
};
