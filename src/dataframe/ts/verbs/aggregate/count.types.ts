import type { DataFrame } from "../../dataframe/index.ts";
import type { Prettify } from "../../dataframe/types/utility-types.ts";

/**
 * Count rows by unique combinations of column values.
 *
 * Groups by the specified columns and returns counts in a new column `count`.
 * Shorthand for `groupBy(...columns).summarise({ count: g => g.nrows() })`.
 *
 * @example
 * // Count by single column
 * df.count("category")
 *
 * @example
 * // Count by multiple columns
 * df.count("category", "status")
 *
 * @example
 * // Result includes grouping columns plus `count`
 * df.count("region")
 * // => { region: string, count: number }
 */
export type CountMethod<Row extends object> = <K extends keyof Row>(
  column: K,
  ...additionalColumns: K[]
) => DataFrame<Prettify<Pick<Row, K> & { count: number }>>;
