// deno-lint-ignore-file no-explicit-any
import type { DataFrame } from "../../dataframe/index.ts";
import { groupBy } from "../grouping/group-by.verb.ts";
import { summarise } from "./summarise.verb.ts";

/**
 * Count rows grouped by one or more columns.
 *
 * This is a convenience function that combines groupBy and summarise.
 * Requires at least one column (matches tidyverse behavior).
 *
 * @example
 * ```typescript
 * // Count by category
 * df.count("category")
 * // => DataFrame<{ category: string, count: number }>
 *
 * // Count by multiple columns
 * df.count("category", "status")
 * // => DataFrame<{ category: string, status: string, count: number }>
 * ```
 */
export function count<T extends object, K extends keyof T>(
  column: K,
  ...additionalColumns: K[]
) {
  return (df: DataFrame<T>): DataFrame<any> | Promise<DataFrame<any>> => {
    const columns = [column, ...additionalColumns];
    const grouped = groupBy(...(columns as any))(df as any);
    return summarise({ count: (g) => g.nrows() })(grouped as any);
  };
}
