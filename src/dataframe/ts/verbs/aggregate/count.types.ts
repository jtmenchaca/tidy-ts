import type { DataFrame } from "../../dataframe/index.ts";
import type { Prettify } from "../../dataframe/types/utility-types.ts";

/**
 * Count rows by unique combinations of column values.
 *
 * Groups by the specified columns and returns counts in a new column `count`.
 * Shorthand for `groupBy(...columns).summarise({ count: g => g.nrows() })`.
 *
 * @param column - First column name to group by
 * @param additionalColumns - Additional column names to group by
 * @returns DataFrame with grouping columns plus a `count` column
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
 * // Count with real data
 * const df = createDataFrame([
 *   { region: "North", product: "A" },
 *   { region: "North", product: "A" },
 *   { region: "South", product: "B" },
 * ]);
 * df.count("region", "product")
 * // Results in:
 * // [
 * //   { region: "North", product: "A", count: 2 },
 * //   { region: "South", product: "B", count: 1 }
 * // ]
 *
 * @remarks
 * - Returns a DataFrame with the grouping columns plus a `count` column
 * - Equivalent to `groupBy(...columns).summarise({ count: g => g.nrows() })`
 * - Works with grouped DataFrames (counts within each group)
 */
export type CountMethod<Row extends object> = <K extends keyof Row>(
  column: K,
  ...additionalColumns: K[]
) => DataFrame<Prettify<Pick<Row, K> & { count: number }>>;
