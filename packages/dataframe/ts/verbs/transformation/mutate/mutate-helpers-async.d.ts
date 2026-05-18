import type { ConcurrencyOptions } from "../../../promised-dataframe/concurrency-utils.ts";
/**
 * Process grouped data mutations for async operations
 */
export declare function processGroupedMutationsAsync(df: any, spec: any, _updates: Record<string, unknown[]>, asyncUpdates: Record<string, Promise<unknown>[]>, options?: ConcurrencyOptions): Promise<void>;
/**
 * Process ungrouped data mutations for async operations
 */
export declare function processUngroupedMutationsAsync(df: any, spec: any, _updates: Record<string, unknown[]>, asyncUpdates: Record<string, Promise<unknown>[]>, options?: ConcurrencyOptions): Promise<void>;
