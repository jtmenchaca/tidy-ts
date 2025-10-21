// src/dataframe/ts/types/verbs/pivot.ts
import type { DataFrame, Prettify } from "../../dataframe/index.ts";

export type RowAfterPivotWider<
  Row extends object,
  NamesFrom extends keyof Row,
  ValuesFrom extends keyof Row,
  ColNames extends readonly string[],
  ValuesFn,
  Prefix extends string = "",
> = Prettify<
  // keep everything except the pivot axes
  & {
    [
      ColName in keyof Row as ColName extends NamesFrom | ValuesFrom ? never
        : ColName
    ]: Row[ColName];
  }
  // add the generated columns (optionally through an aggregator)
  & {
    [ColName in ColNames[number] as `${Prefix}${ColName}`]:
      // deno-lint-ignore no-explicit-any
      ValuesFn extends (values: any) => infer Result ? Result : Row[ValuesFrom];
  }
>;

export type RowAfterPivotLonger<
  Row extends object,
  ColNames extends readonly (keyof Row)[],
  NamesTo extends string,
  ValuesTo extends string,
> = Prettify<
  & {
    [
      ColName in keyof Row as ColName extends ColNames[number] ? never : ColName
    ]: Row[ColName];
  }
  & { [ColName in NamesTo]: string }
  & { [ColName in ValuesTo]: Row[ColNames[number]] }
>;

/**
 * Pivot DataFrame from long to wide format.
 *
 * Transforms data by spreading key-value pairs from multiple rows into multiple columns.
 * Useful for converting normalized data into a more readable wide format.
 */
export type PivotWiderMethod<Row extends object> = {
  <
    NamesFrom extends keyof Row,
    ValuesFrom extends keyof Row,
    const ExpectedCols extends readonly string[],
    ValuesFn extends ((values: Row[ValuesFrom][]) => unknown) | undefined =
      undefined,
    const Prefix extends string = "",
  >(
    pivotConfig: {
      namesFrom: NamesFrom;
      valuesFrom: ValuesFrom;
      expectedColumns: ExpectedCols;
      valuesFn?: ValuesFn;
      namesPrefix?: Prefix;
    },
  ): DataFrame<
    Prettify<
      RowAfterPivotWider<
        Row,
        NamesFrom,
        ValuesFrom,
        ExpectedCols,
        ValuesFn,
        Prefix
      >
    >
  >;

  <
    NamesFrom extends keyof Row,
    ValuesFrom extends keyof Row,
  >(pivotConfig: {
    namesFrom: NamesFrom;
    valuesFrom: ValuesFrom;
    valuesFn?: (values: Row[ValuesFrom][]) => unknown;
    namesPrefix?: string;
  }): DataFrame<
    Prettify<
      & {
        // Keep all columns except names_from and values_from
        [K in keyof Row as K extends NamesFrom | ValuesFrom ? never : K]:
          Row[K];
      }
      & {
        // Add dynamic columns as unknown
        [key: string]: unknown;
      }
    >
  >;
};

/**
 * Pivot DataFrame from wide to long format.
 *
 * Transforms data by gathering multiple columns into key-value pairs.
 * Useful for converting wide data into a normalized long format.
 */
export type PivotLongerMethod<Row extends object> = {
  <
    const ColNames extends readonly (keyof Row)[],
    const NamesTo extends string,
    const ValuesTo extends string,
  >(pivotConfig: {
    cols: ColNames;
    namesTo: NamesTo;
    valuesTo: ValuesTo;
    namesPrefix?: string;
    namesPattern?: RegExp;
  }): DataFrame<
    Prettify<RowAfterPivotLonger<Row, ColNames, NamesTo, ValuesTo>>
  >;
};
