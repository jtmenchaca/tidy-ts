// src/dataframe/ts/types/verbs/extract.ts
import type {
  EmptyDataFrameExtract,
  RestrictEmptyDataFrame,
} from "../../dataframe/types/error-types.ts";

/**
 * Extract all values from a column as an array.
 */
export type ExtractMethod<Row extends object> = {
  <ColName extends keyof Row>(
    column: RestrictEmptyDataFrame<Row, ColName, EmptyDataFrameExtract>,
  ): Row[ColName][];
};

/**
 * Extract the first n values from a column.
 */
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

/**
 * Extract the last n values from a column.
 */
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

/**
 * Extract the value at a specific index from a column.
 */
export type ExtractNthMethod<Row extends object> = {
  <ColName extends keyof Row>(
    column: RestrictEmptyDataFrame<Row, ColName, EmptyDataFrameExtract>,
    index: number,
  ): Row[ColName] | undefined;
};

/**
 * Extract a random sample of n values from a column.
 */
export type ExtractSampleMethod<Row extends object> = {
  <ColName extends keyof Row>(
    column: RestrictEmptyDataFrame<Row, ColName, EmptyDataFrameExtract>,
    n: number,
  ): Row[ColName][];
};

export type ExtractUniqueMethod<Row extends object> = {
  <ColName extends keyof Row>(
    column: RestrictEmptyDataFrame<Row, ColName, EmptyDataFrameExtract>,
  ): Row[ColName][];
};
