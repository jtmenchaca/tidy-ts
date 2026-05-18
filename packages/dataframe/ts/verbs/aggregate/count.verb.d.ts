import type { DataFrame } from "../../dataframe/index.ts";
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
export declare function count<T extends object, K extends keyof T>(column: K, ...additionalColumns: K[]): (df: DataFrame<T>) => DataFrame<any> | Promise<DataFrame<any>>;
