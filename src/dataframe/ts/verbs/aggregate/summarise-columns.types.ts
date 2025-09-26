// src/dataframe/ts/types/verbs/summarise-columns.ts
import type {
  DataFrame,
  GroupedDataFrame,
  Prettify,
  UnionToIntersection,
} from "../../dataframe/index.ts";
/** Column type map used by summarise_columns / mutate_columns. */
export type ColumnTypeMap = {
  number: number[]; // summarise_columns
  string: string[];
  boolean: boolean[];
};

/** Map columns with PREFIX only (e.g. "mean_" + "score"). */
export type MapColsWithPrefix<
  ColNames extends readonly string[],
  // deno-lint-ignore no-explicit-any
  NewColDefs extends readonly { prefix: string; fn: (...a: any[]) => any }[],
> = UnionToIntersection<
  {
    [Index in keyof NewColDefs]: NewColDefs[Index] extends {
      prefix: infer Prefix;
      // deno-lint-ignore no-explicit-any
      fn: (...a: any[]) => infer Result;
    }
      ? Prefix extends string
        ? { [ColName in ColNames[number] as `${Prefix}${ColName}`]: Result }
      : never
      : never;
  }[number]
>;

/** Map columns with optional PREFIX and SUFFIX ("pre" + col + "post"). */
export type MapColsWithPrefixSuffix<
  ColNames extends readonly string[],
  NewColDefs extends readonly {
    prefix?: string;
    suffix?: string;
    // deno-lint-ignore no-explicit-any
    fn: (...a: any[]) => any;
  }[],
> = UnionToIntersection<
  {
    [Index in keyof NewColDefs]: NewColDefs[Index] extends {
      prefix?: infer Prefix;
      suffix?: infer Suffix;
      // deno-lint-ignore no-explicit-any
      fn: (...a: any[]) => infer Result;
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

export type SummariseColumnsMethod<Row extends object> = {
  // Grouped: keep group keys, add generated columns
  <
    ColType extends keyof ColumnTypeMap,
    const ColNames extends readonly Extract<keyof Row, string>[],
    const NewColDefs extends readonly {
      prefix: string;
      // deno-lint-ignore no-explicit-any
      fn: (col: ColumnTypeMap[ColType]) => any;
    }[],
    GroupName extends keyof Row,
  >(
    this: GroupedDataFrame<Row, GroupName>,
    config: {
      colType: ColType;
      columns: ColNames;
      newColumns: NewColDefs;
    },
  ): DataFrame<
    Prettify<Pick<Row, GroupName> & MapColsWithPrefix<ColNames, NewColDefs>>
  >;

  // Ungrouped: keep all original columns, add generated columns
  <
    ColType extends keyof ColumnTypeMap,
    const ColNames extends readonly Extract<keyof Row, string>[],
    const NewColDefs extends readonly {
      prefix: string;
      // deno-lint-ignore no-explicit-any
      fn: (col: ColumnTypeMap[ColType]) => any;
    }[],
  >(
    config: {
      colType: ColType;
      columns: ColNames;
      newColumns: NewColDefs;
    },
  ): DataFrame<Prettify<Row & MapColsWithPrefix<ColNames, NewColDefs>>>;
};
