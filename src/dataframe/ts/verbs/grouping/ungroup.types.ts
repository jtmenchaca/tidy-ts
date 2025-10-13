// src/dataframe/ts/types/verbs/ungroup.ts
import type { DataFrame, GroupedDataFrame } from "../../dataframe/index.ts";

export type UngroupMethod<Row extends object> = {
  // Ungroup a GroupedDataFrame, returning a regular DataFrame
  /**
   * Remove grouping from a GroupedDataFrame.
   *
   * Returns a regular DataFrame with the same data but no group structure.
   * Calling ungroup on an already ungrouped DataFrame is a no-op.
   *
   * @example
   * // Remove grouping after aggregation
   * const grouped = df.groupBy("category")
   * const summarized = grouped.summarise({ total: g => s.sum(g.value) })
   * const ungrouped = summarized.ungroup()
   *
   * @example
   * // Chain operations after ungrouping
   * df.groupBy("region")
   *   .summarise({ count: g => g.nrows() })
   *   .ungroup()
   *   .arrange("count", "desc")
   */
  <GroupName extends keyof Row>(
    this: GroupedDataFrame<Row, GroupName>,
  ): DataFrame<Row>;

  // Regular DataFrame ungroup is a no-op, returns itself
  /**
   * Remove grouping from a GroupedDataFrame.
   *
   * Returns a regular DataFrame with the same data but no group structure.
   * Calling ungroup on an already ungrouped DataFrame is a no-op.
   *
   * @example
   * // Remove grouping after aggregation
   * const grouped = df.groupBy("category")
   * const summarized = grouped.summarise({ total: g => s.sum(g.value) })
   * const ungrouped = summarized.ungroup()
   *
   * @example
   * // Chain operations after ungrouping
   * df.groupBy("region")
   *   .summarise({ count: g => g.nrows() })
   *   .ungroup()
   *   .arrange("count", "desc")
   */
  (): DataFrame<Row>;
};
