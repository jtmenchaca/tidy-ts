// packages/dataframe/ts/types/verbs/extract.ts
import type { DataFrame } from "../../dataframe/index.ts";
import type {
  EmptyDataFrameExtract,
  RestrictEmptyDataFrame,
} from "../../dataframe/types/error-types.ts";

/**
 * Extract all values from a column as an array.
 */
export type ExtractMethod = {
  <R extends object, ColName extends keyof R>(
    this: DataFrame<R>,
    column: RestrictEmptyDataFrame<R, ColName, EmptyDataFrameExtract>,
  ): R[ColName][];
};

/**
 * Extract the first n values from a column.
 */
export type ExtractHeadMethod = {
  <R extends object, ColName extends keyof R>(
    this: DataFrame<R>,
    column: RestrictEmptyDataFrame<R, ColName, EmptyDataFrameExtract>,
    n: 1,
  ): R[ColName] | undefined;
  <R extends object, ColName extends keyof R>(
    this: DataFrame<R>,
    column: RestrictEmptyDataFrame<R, ColName, EmptyDataFrameExtract>,
    n: number,
  ): R[ColName][];
};

/**
 * Extract the last n values from a column.
 */
export type ExtractTailMethod = {
  <R extends object, ColName extends keyof R>(
    this: DataFrame<R>,
    column: RestrictEmptyDataFrame<R, ColName, EmptyDataFrameExtract>,
    n: 1,
  ): R[ColName] | undefined;
  <R extends object, ColName extends keyof R>(
    this: DataFrame<R>,
    column: RestrictEmptyDataFrame<R, ColName, EmptyDataFrameExtract>,
    n: number,
  ): R[ColName][];
};

/**
 * Extract the value at a specific index from a column.
 */
export type ExtractNthMethod = {
  <R extends object, ColName extends keyof R>(
    this: DataFrame<R>,
    column: RestrictEmptyDataFrame<R, ColName, EmptyDataFrameExtract>,
    index: number,
  ): R[ColName] | undefined;
};

/**
 * Extract a random sample of n values from a column.
 */
export type ExtractSampleMethod = {
  <R extends object, ColName extends keyof R>(
    this: DataFrame<R>,
    column: RestrictEmptyDataFrame<R, ColName, EmptyDataFrameExtract>,
    n: number,
  ): R[ColName][];
};

export type ExtractUniqueMethod = {
  <R extends object, ColName extends keyof R>(
    this: DataFrame<R>,
    column: RestrictEmptyDataFrame<R, ColName, EmptyDataFrameExtract>,
  ): R[ColName][];
};
