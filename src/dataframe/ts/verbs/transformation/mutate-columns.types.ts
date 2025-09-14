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
    ColType extends keyof ElementColumnTypeMap,
    const ColNames extends readonly Extract<keyof Row, string>[],
    const NewColDefs extends readonly {
      prefix?: string;
      suffix?: string;
      fn: (col: ElementColumnTypeMap[ColType]) => unknown;
    }[],
    GroupName extends keyof Row,
  >(
    this: GroupedDataFrame<Row, GroupName>,
    config: {
      col_type: ColType;
      columns: ColNames;
      new_columns: NewColDefs;
    },
  ): GroupedDataFrame<
    Prettify<Row & GenerateColumnNamesWithTypes<ColNames, NewColDefs>>,
    Extract<
      GroupName,
      keyof Prettify<Row & GenerateColumnNamesWithTypes<ColNames, NewColDefs>>
    >
  >;

  // Ungrouped
  <
    ColType extends keyof ElementColumnTypeMap,
    const ColNames extends readonly Extract<keyof Row, string>[],
    const NewColDefs extends readonly {
      prefix?: string;
      suffix?: string;
      fn: (col: ElementColumnTypeMap[ColType]) => unknown;
    }[],
  >(
    config: {
      col_type: ColType;
      columns: ColNames;
      new_columns: NewColDefs;
    },
  ): DataFrame<
    Prettify<Row & GenerateColumnNamesWithTypes<ColNames, NewColDefs>>
  >;
};
