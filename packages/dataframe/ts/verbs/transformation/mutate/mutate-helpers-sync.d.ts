import type { DataFrame, GroupedDataFrame } from "../../../dataframe/index.ts";
import type { MutateAssignments } from "./mutate.types.ts";
/**
 * Create a new DataFrame with updated columns using copy-on-write
 */
export declare function createUpdatedDataFrame<Row extends Record<string, unknown>>(df: DataFrame<Row> | GroupedDataFrame<Row>, updates: Record<string, unknown[]>, drops?: Set<string>): any;
/**
 * Process grouped data mutations
 */
export declare function processGroupedMutations<Row extends Record<string, unknown>>(df: DataFrame<Row> | GroupedDataFrame<Row>, spec: MutateAssignments<Row>, updates: Record<string, unknown[]>): void;
/**
 * Process ungrouped data mutations
 */
export declare function processUngroupedMutations<Row extends Record<string, unknown>>(df: DataFrame<Row> | GroupedDataFrame<Row>, spec: MutateAssignments<Row>, updates: Record<string, unknown[]>): void;
