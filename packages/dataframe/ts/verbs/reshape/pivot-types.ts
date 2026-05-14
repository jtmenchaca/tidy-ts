// packages/dataframe/ts/types/verbs/pivot.ts
import type { DataFrame, Prettify } from "../../dataframe/index.ts";

/**
 * Pivot DataFrame from long to wide format.
 *
 * Transforms data by spreading key-value pairs from multiple rows into multiple columns.
 * Useful for converting normalized data into a more readable wide format.
 */
export type PivotWiderMethod<Row extends object> = {
  <
    R extends object,
    NamesFrom extends keyof R,
    ValuesFrom extends keyof R,
    const ExpectedCols extends readonly string[],
    ValuesFn extends ((values: R[ValuesFrom][]) => unknown) | undefined =
      undefined,
    const Prefix extends string = "",
  >(
    this: DataFrame<R>,
    pivotConfig: {
      namesFrom: NamesFrom;
      valuesFrom: ValuesFrom;
      expectedColumns: ExpectedCols;
      valuesFn?: ValuesFn;
      namesPrefix?: Prefix;
    },
  ): DataFrame<
    Prettify<
      // keep everything except the pivot axes
      & {
        [
          ColName in keyof R as ColName extends NamesFrom | ValuesFrom ? never
            : ColName
        ]: R[ColName];
      }
      // add the generated columns (optionally through an aggregator)
      & {
        [ColName in ExpectedCols[number] as `${Prefix}${ColName}`]:
          // deno-lint-ignore no-explicit-any
          ValuesFn extends (values: any) => infer Result ? Result
            : R[ValuesFrom] | undefined;
      }
    >
  >;

  <
    R extends object,
    NamesFrom extends keyof R,
    ValuesFrom extends keyof R,
  >(
    this: DataFrame<R>,
    pivotConfig: {
      namesFrom: NamesFrom;
      valuesFrom: ValuesFrom;
      valuesFn?: (values: R[ValuesFrom][]) => unknown;
      namesPrefix?: string;
    },
  ): DataFrame<
    Prettify<
      & {
        // Keep all columns except names_from and values_from
        [K in keyof R as K extends NamesFrom | ValuesFrom ? never : K]:
          R[K];
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
    R extends object,
    const ColNames extends readonly (keyof R)[],
    const NamesTo extends string,
    const ValuesTo extends string,
  >(
    this: DataFrame<R>,
    pivotConfig: {
      cols: ColNames;
      namesTo: NamesTo;
      valuesTo: ValuesTo;
      namesPrefix?: string;
      namesPattern?: RegExp;
    },
  ): DataFrame<
    Prettify<
      & {
        [
          ColName in keyof R as ColName extends ColNames[number] ? never
            : ColName
        ]: R[ColName];
      }
      & { [ColName in NamesTo]: string }
      & { [ColName in ValuesTo]: R[ColNames[number]] }
    >
  >;
};
