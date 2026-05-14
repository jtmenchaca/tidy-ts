// packages/dataframe/ts/types/verbs/summarise-columns.ts
import type {
  DataFrame,
  GroupedDataFrame,
} from "../../dataframe/index.ts";
/** Column type map used by summarise_columns / mutate_columns. */
export type ColumnTypeMap = {
  number: number[]; // summarise_columns
  string: string[];
  boolean: boolean[];
};

/**
 * Map columns with PREFIX only (e.g. "mean_" + "score").
 *
 * Single mapped type rather than `UnionToIntersection<...>`. For each prefix
 * `P` in the user-supplied newColumns array, generate keys `${P}${ColName}`
 * for each input column, with value = the return type of the def whose
 * prefix matches `P`. Looks up the matching def via `Extract<...>`.
 */
export type MapColsWithPrefix<
  ColNames extends readonly string[],
  // deno-lint-ignore no-explicit-any
  NewColDefs extends readonly { prefix: string; fn: (...a: any[]) => any }[],
> = {
  [
    P in NewColDefs[number]["prefix"] as `${P}${ColNames[number]}`
  ]: Extract<NewColDefs[number], { prefix: P }> extends {
    // deno-lint-ignore no-explicit-any
    fn: (...a: any[]) => infer Result;
  } ? Result
    : never;
};

/**
 * Map columns with optional PREFIX and SUFFIX ("pre" + col + "post").
 *
 * Same single-mapped-type idea as above, but the discriminator key is the
 * (prefix, suffix) pair, since either can be absent. We model the pair by
 * extracting via a literal `{prefix, suffix}` shape on each def.
 */
export type MapColsWithPrefixSuffix<
  ColNames extends readonly string[],
  NewColDefs extends readonly {
    prefix?: string;
    suffix?: string;
    // deno-lint-ignore no-explicit-any
    fn: (...a: any[]) => any;
  }[],
> = {
  [
    Pair in NewColDefs[number] as Pair extends {
      prefix?: infer P;
      suffix?: infer S;
    } ? P extends string ? S extends string
          ? `${P}${ColNames[number]}${S}`
        : `${P}${ColNames[number]}`
        : S extends string ? `${ColNames[number]}${S}`
        : ColNames[number]
      : never
  ]: Pair extends {
    // deno-lint-ignore no-explicit-any
    fn: (...a: any[]) => infer Result;
  } ? Result
    : never;
};

export type SummariseColumnsMethod<Row extends object> = {
  // Grouped: keep group keys, add generated columns
  <
    R extends object,
    ColType extends keyof ColumnTypeMap,
    const ColNames extends readonly Extract<keyof R, string>[],
    const NewColDefs extends readonly {
      prefix: string;
      // deno-lint-ignore no-explicit-any
      fn: (col: ColumnTypeMap[ColType]) => any;
    }[],
    GroupName extends keyof R,
  >(
    this: GroupedDataFrame<R, GroupName>,
    config: {
      colType: ColType;
      columns: ColNames;
      newColumns: NewColDefs;
    },
  ): DataFrame<
    {
      [
        K in
          | GroupName
          | keyof MapColsWithPrefix<ColNames, NewColDefs>
      ]: K extends keyof MapColsWithPrefix<ColNames, NewColDefs>
        ? MapColsWithPrefix<ColNames, NewColDefs>[K]
        : K extends keyof R ? R[K]
        : never;
    }
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
  ): DataFrame<
    {
      [
        K in
          | keyof Row
          | keyof MapColsWithPrefix<ColNames, NewColDefs>
      ]: K extends keyof MapColsWithPrefix<ColNames, NewColDefs>
        ? MapColsWithPrefix<ColNames, NewColDefs>[K]
        : K extends keyof Row ? Row[K]
        : never;
    }
  >;
};
