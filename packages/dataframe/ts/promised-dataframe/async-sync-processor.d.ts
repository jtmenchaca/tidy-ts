import type { DataFrame, GroupedDataFrame } from "../dataframe/index.ts";
import { type ConcurrencyOptions } from "./concurrency-utils.ts";
/**
 * Check if a value is a Promise
 */
export declare function returnsPromise(value: unknown): value is Promise<unknown>;
/**
 * Row processor function signature for sync operations
 */
export type SyncRowProcessor<Row extends object, TResult> = (row: Row, logicalIndex: number, groupIndex: number, df: DataFrame<Row> | GroupedDataFrame<Row>) => TResult;
/**
 * Row processor function signature for async operations.
 * Uses `any` for the df parameter to avoid expensive structural comparisons
 * at call sites — callers already pass `any`-typed DataFrames.
 */
export type AsyncRowProcessor<Row extends object, TResult> = (rowSnapshot: Row, logicalIndex: number, groupIndex: number, df: any) => TResult | Promise<TResult>;
/**
 * Generic grouped data processor for async operations
 */
export declare function processGroupedRowsAsync<Row extends object, TResult>(df: any, processor: AsyncRowProcessor<Row, TResult>, options?: ConcurrencyOptions): Promise<{
    physicalIndex: number;
    result: TResult | Error;
}[]>;
/**
 * Generic ungrouped data processor for async operations
 */
export declare function processUngroupedRowsAsync<Row extends object, TResult>(df: any, processor: AsyncRowProcessor<Row, TResult>, options?: ConcurrencyOptions): Promise<{
    physicalIndex: number;
    logicalIndex: number;
    result: TResult | Error;
}[]>;
/**
 * Generic error handling wrapper for row processing
 */
export declare function withErrorHandling<T>(processor: () => T | Promise<T>, fallback: T, context?: string): T | Promise<T>;
