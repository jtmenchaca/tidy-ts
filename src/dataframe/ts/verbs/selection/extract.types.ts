// src/dataframe/ts/types/verbs/extract.ts
import type {
  EmptyDataFrameExtract,
  RestrictEmptyDataFrame,
} from "../../dataframe/types/error-types.ts";

export type ExtractMethod<Row extends object> = {
  <ColName extends keyof Row>(
    column: RestrictEmptyDataFrame<Row, ColName, EmptyDataFrameExtract>,
  ): Row[ColName][];
};

export type ExtractHeadMethod<Row extends object> = {
  <ColName extends keyof Row>(
    column: RestrictEmptyDataFrame<Row, ColName, EmptyDataFrameExtract>,
    n: 1,
  ): Row[ColName] | undefined;
  <ColName extends keyof Row>(
    column: RestrictEmptyDataFrame<Row, ColName, EmptyDataFrameExtract>,
    n: number,
  ): Row[ColName][];
};

export type ExtractTailMethod<Row extends object> = {
  <ColName extends keyof Row>(
    column: RestrictEmptyDataFrame<Row, ColName, EmptyDataFrameExtract>,
    n: 1,
  ): Row[ColName] | undefined;
  <ColName extends keyof Row>(
    column: RestrictEmptyDataFrame<Row, ColName, EmptyDataFrameExtract>,
    n: number,
  ): Row[ColName][];
};

export type ExtractNthMethod<Row extends object> = {
  <ColName extends keyof Row>(
    column: RestrictEmptyDataFrame<Row, ColName, EmptyDataFrameExtract>,
    index: number,
  ): Row[ColName] | undefined;
};

export type ExtractSampleMethod<Row extends object> = {
  <ColName extends keyof Row>(
    column: RestrictEmptyDataFrame<Row, ColName, EmptyDataFrameExtract>,
    n: number,
  ): Row[ColName][];
};
