// src/dataframe/ts/types/verbs/group-by.ts
import type { GroupedDataFrame } from "../../dataframe/index.ts";
import type {
  EmptyDataFrameGroupBy,
  RestrictEmptyDataFrame,
} from "../../dataframe/types/error-types.ts";

/**
 * Group DataFrame rows by one or more columns.
 *
 * Creates a GroupedDataFrame where subsequent operations (mutate, summarise, filter, etc.)
 * are applied within each group. Groups are determined by unique combinations of the
 * specified column values.
 *
 * @example
 * // Group by a single column
 * df.groupBy("category")
 *
 * @example
 * // Group by multiple columns
 * df.groupBy("category", "region")
 *
 * @example
 * // Group and then aggregate
 * df.groupBy("category").summarise({
 *   avgPrice: (g) => s.mean(g.price),
 *   count: (g) => g.nrows()
 * })
 *
 * @example
 * // Array syntax
 * df.groupBy(["category", "region"])
 */
export type GroupByMethod<Row extends object> = {
  // No arguments - returns ungrouped
  /**
   * Group DataFrame rows by one or more columns.
   *
   * Creates a GroupedDataFrame where subsequent operations (mutate, summarise, filter, etc.)
   * are applied within each group. Groups are determined by unique combinations of the
   * specified column values.
   *
   * @example
   * // Group by a single column
   * df.groupBy("category")
   *
   * @example
   * // Group by multiple columns
   * df.groupBy("category", "region")
   *
   * @example
   * // Group and then aggregate
   * df.groupBy("category").summarise({
   *   avgPrice: (g) => s.mean(g.price),
   *   count: (g) => g.nrows()
   * })
   *
   * @example
   * // Array syntax
   * df.groupBy(["category", "region"])
   */
  (): GroupedDataFrame<Row, never>;

  // Rest parameters syntax
  /**
   * Group DataFrame rows by one or more columns.
   *
   * Creates a GroupedDataFrame where subsequent operations (mutate, summarise, filter, etc.)
   * are applied within each group. Groups are determined by unique combinations of the
   * specified column values.
   *
   * @example
   * // Group by a single column
   * df.groupBy("category")
   *
   * @example
   * // Group by multiple columns
   * df.groupBy("category", "region")
   *
   * @example
   * // Group and then aggregate
   * df.groupBy("category").summarise({
   *   avgPrice: (g) => s.mean(g.price),
   *   count: (g) => g.nrows()
   * })
   *
   * @example
   * // Array syntax
   * df.groupBy(["category", "region"])
   */
  <ColName extends keyof Row>(
    ...columnNames: RestrictEmptyDataFrame<
      Row,
      ColName[],
      EmptyDataFrameGroupBy
    >
  ): GroupedDataFrame<Row, ColName>;

  // Array syntax
  /**
   * Group DataFrame rows by one or more columns.
   *
   * Creates a GroupedDataFrame where subsequent operations (mutate, summarise, filter, etc.)
   * are applied within each group. Groups are determined by unique combinations of the
   * specified column values.
   *
   * @example
   * // Group by a single column
   * df.groupBy("category")
   *
   * @example
   * // Group by multiple columns
   * df.groupBy("category", "region")
   *
   * @example
   * // Group and then aggregate
   * df.groupBy("category").summarise({
   *   avgPrice: (g) => s.mean(g.price),
   *   count: (g) => g.nrows()
   * })
   *
   * @example
   * // Array syntax
   * df.groupBy(["category", "region"])
   */
  <ColName extends keyof Row>(
    columns: RestrictEmptyDataFrame<
      Row,
      ColName[],
      EmptyDataFrameGroupBy
    >,
  ): GroupedDataFrame<Row, ColName>;
};
