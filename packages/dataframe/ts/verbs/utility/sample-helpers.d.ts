import type { GroupedDataFrame } from "../../dataframe/index.ts";
/**
 * Aggregation function type for downsampling.
 */
export type AggregationFunction<T extends object> = (group: GroupedDataFrame<T, keyof T>) => unknown;
/**
 * Fill method type for upsampling.
 */
export type FillMethod = <T>(values: T[] | Iterable<T>) => T[];
/**
 * Apply aggregation function to a grouped DataFrame.
 */
export declare function applyAggregation<T extends object>(group: GroupedDataFrame<T, keyof T>, column: keyof T, aggregation: AggregationFunction<T>): unknown;
