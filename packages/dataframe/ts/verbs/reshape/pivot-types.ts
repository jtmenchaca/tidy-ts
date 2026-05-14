// packages/dataframe/ts/types/verbs/pivot.ts
import type { DataFrame } from "../../dataframe/index.ts";

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
    {
      [K in
        | Exclude<keyof R, NamesFrom | ValuesFrom>
        | `${Prefix}${ExpectedCols[number]}`]: K extends keyof R ? R[K]
          : K extends `${Prefix}${ExpectedCols[number]}`
          // deno-lint-ignore no-explicit-any
            ? ValuesFn extends (values: any) => infer Result ? Result
            : R[ValuesFrom] | undefined
          : never;
    }
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
    & {
      // Keep all columns except names_from and values_from
      [K in Exclude<keyof R, NamesFrom | ValuesFrom>]: R[K];
    }
    & {
      // Add dynamic columns as unknown
      [key: string]: unknown;
    }
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
    {
      [K in Exclude<keyof R, ColNames[number]> | NamesTo | ValuesTo]:
        K extends NamesTo ? string
          : K extends ValuesTo ? R[ColNames[number]]
          : K extends keyof R ? R[K]
          : never;
    }
  >;
};
