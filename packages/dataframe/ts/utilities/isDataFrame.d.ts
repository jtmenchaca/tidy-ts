import type { DataFrame, GroupedDataFrame } from "../dataframe/types/dataframe.type.ts";
/**
 * Robust DataFrame detection using __kind metadata
 */
export declare function isDataFrame(obj: unknown): obj is DataFrame<any>;
/**
 * Robust GroupedDataFrame detection using __kind metadata
 */
export declare function isGroupedDataFrame(obj: unknown): obj is GroupedDataFrame<any, any>;
