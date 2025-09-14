// src/dataframe/ts/core/types.ts
// deno-lint-ignore-file no-explicit-any
// Shared generics and type utilities

import type { DataFrame, GroupedDataFrame } from "./dataframe.type.ts";

export type AddColumns<
  T,
  U extends object,
> = T & U;

export type ColumnValue<Row extends object> =
  | ((row: Row, index: number, df: any) => unknown)
  | unknown[]
  | unknown
  | null;

export type RowAfterMutation<
  Row extends object,
  Assignments extends Record<string, ColumnValue<Row>>,
> = AddColumns<
  Row,
  {
    [K in keyof Assignments]: Assignments[K] extends (
      row: Row,
      index: number,
      df: any,
    ) => infer R ? R
      : Assignments[K] extends unknown[] ? Assignments[K][number]
      : Assignments[K];
  }
>;

export type RowAfterFilter<Row extends object> = Row;

export type PromisedDataFrame<Row extends object> =
  & Promise<
    DataFrame<Row>
  >
  & {
    then: Promise<DataFrame<Row>>["then"];
    catch: Promise<DataFrame<Row>>["catch"];
    finally: Promise<DataFrame<Row>>["finally"];
  };

export type PromisedGroupedDataFrame<
  Row extends object,
  K extends keyof Row,
> = Promise<GroupedDataFrame<Row, K>> & {
  then: Promise<GroupedDataFrame<Row, K>>["then"];
  catch: Promise<GroupedDataFrame<Row, K>>["catch"];
  finally: Promise<GroupedDataFrame<Row, K>>["finally"];
};
