// src/dataframe/ts/core/guards.ts
// deno-lint-ignore-file no-explicit-any

import type {
  DataFrame,
  GroupedDataFrame,
} from "../dataframe/types/dataframe.type.ts";

/**
 * Robust DataFrame detection using __kind metadata
 */
export function isDataFrame(obj: unknown): obj is DataFrame<any> {
  return obj != null &&
    typeof obj === "object" &&
    (obj as any).__kind === "DataFrame";
}

/**
 * Robust GroupedDataFrame detection using __kind metadata
 */
export function isGroupedDataFrame(
  obj: unknown,
): obj is GroupedDataFrame<any, any> {
  return obj != null &&
    typeof obj === "object" &&
    (obj as any).__kind === "GroupedDataFrame";
}

/**
 * Check if object is any kind of DataFrame (regular or grouped)
 */
export function isAnyDataFrame(
  obj: unknown,
): obj is DataFrame<any> | GroupedDataFrame<any, any> {
  return isDataFrame(obj) || isGroupedDataFrame(obj);
}
