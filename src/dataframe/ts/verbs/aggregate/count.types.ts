import type { DataFrame } from "../../dataframe/index.ts";

/**
 * Count rows by unique combinations of column values.
 *
 * Groups by the specified columns and returns counts in a new column `n`.
 * Shorthand for `groupBy(...columns).summarise({ n: g => g.nrows() })`.
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
 * // Result includes grouping columns plus `n`
 * df.count("region")
 * // => { region: string, n: number }
 */
export type CountMethod<Row extends object> = <K extends keyof Row>(
  column: K,
  ...additionalColumns: K[]
) => DataFrame<Pick<Row, K> & { n: number }>;
