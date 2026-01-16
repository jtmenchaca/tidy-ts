// deno-lint-ignore-file no-explicit-any
import { stats } from "../../stats/stats.ts";
import type { GroupedDataFrame } from "../../dataframe/index.ts";

/**
 * Aggregation function type for downsampling.
 */
export type AggregationFunction<T extends object> = (
  group: GroupedDataFrame<T, keyof T>,
) => unknown;

/**
 * Fill method type for upsampling.
 */
export type FillMethod = <T>(values: T[] | Iterable<T>) => T[];

/**
 * Check if a function is stats.forwardFill.
 */
export function isForwardFill(fn: unknown): boolean {
  return fn === stats.forwardFill;
}

/**
 * Check if a function is stats.backwardFill.
 */
export function isBackwardFill(fn: unknown): boolean {
  return fn === stats.backwardFill;
}

/**
 * Apply aggregation function to a grouped DataFrame.
 */
export function applyAggregation<T extends object>(
  group: GroupedDataFrame<T, keyof T>,
  column: keyof T,
  aggregation: AggregationFunction<T>,
): unknown {
  const columnName = String(column);
  // Extract column values properly
  const values = group.extract(columnName as any) as unknown[];

  // Handle function aggregations (like stats.mean, stats.sum, or custom functions)
  if (typeof aggregation === "function") {
    // Check if it's a group function (takes GroupedDataFrame)
    if (aggregation.length === 1 && values.length === 0) {
      // Might be a group function - pass the group
      return (aggregation as (group: GroupedDataFrame<T, keyof T>) => unknown)(
        group,
      );
    }
    // Stats functions (stats.mean, stats.sum, etc.) accept arrays/values
    // They work directly with the values array
    return (aggregation as (values: unknown[] | unknown) => unknown)(values);
  }

  // All aggregations are functions - no string shortcuts
  throw new Error(
    "Aggregation must be a function (e.g., stats.mean, stats.sum)",
  );
}
