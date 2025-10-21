// src/dataframe/ts/types/verbs/summarise.ts
import type {
  DataFrame,
  GroupedDataFrame,
  Prettify,
} from "../../dataframe/index.ts";
import type {
  EmptyDataFrameSummarise,
  RestrictMethodForEmptyDataFrame,
} from "../../dataframe/types/error-types.ts";
import type {
  AnyPropertyIsAsync,
  PromisedDataFrame,
} from "../../promised-dataframe/index.ts";

// Async summary formula type that allows Promise returns
type AsyncSummaryFormula<Row extends object> = (
  df: DataFrame<Row>,
) => Promise<unknown> | unknown;

export type RowAfterSummariseUngrouped<
  Row extends object,
  SummaryFormulas extends Record<string, AsyncSummaryFormula<Row>>,
> = Prettify<
  {
    [ColName in keyof SummaryFormulas]: Awaited<
      ReturnType<SummaryFormulas[ColName]>
    >;
  }
>;

export type RowAfterSummariseGrouped<
  Row extends object,
  GroupName extends keyof Row,
  SummaryFormulas extends Record<string, AsyncSummaryFormula<Row>>,
> = Prettify<
  & Pick<Row, GroupName>
  & {
    [ColName in keyof SummaryFormulas]: Awaited<
      ReturnType<SummaryFormulas[ColName]>
    >;
  }
>;

/**
 * Aggregate data into summary statistics.
 *
 * Collapses rows into summary values using aggregation functions. For grouped DataFrames,
 * creates one row per group with the group columns plus summary columns. For ungrouped
 * DataFrames, returns a single row with summary values.
 *
 * @example
 * // Summarise entire DataFrame
 * df.summarise({
 *   avgAge: (df) => s.mean(df.age),
 *   count: (df) => df.nrows()
 * })
 *
 * @example
 * // Summarise by groups
 * df.groupBy("category").summarise({
 *   avgPrice: (g) => s.mean(g.price),
 *   total: (g) => s.sum(g.amount),
 *   count: (g) => g.nrows()
 * })
 *
 * @example
 * // Async aggregation
 * await df.groupBy("region").summarise({
 *   validated: async (g) => await validateGroup(g)
 * })
 */
export type SummariseMethod<Row extends object> =
  RestrictMethodForEmptyDataFrame<
    Row,
    EmptyDataFrameSummarise,
    {
      // ── Grouped DataFrame with async detection ──────────────────────────
      /**
       * Aggregate data into summary statistics.
       *
       * Collapses rows into summary values using aggregation functions. For grouped DataFrames,
       * creates one row per group with the group columns plus summary columns. For ungrouped
       * DataFrames, returns a single row with summary values.
       *
       * @example
       * // Summarise entire DataFrame
       * df.summarise({
       *   avgAge: (df) => s.mean(df.age),
       *   count: (df) => df.nrows()
       * })
       *
       * @example
       * // Summarise by groups
       * df.groupBy("category").summarise({
       *   avgPrice: (g) => s.mean(g.price),
       *   total: (g) => s.sum(g.amount),
       *   count: (g) => g.nrows()
       * })
       *
       * @example
       * // Async aggregation
       * await df.groupBy("region").summarise({
       *   validated: async (g) => await validateGroup(g)
       * })
       */
      <
        SummaryFormulas extends Record<string, AsyncSummaryFormula<Row>>,
        GroupName extends keyof Row,
      >(
        this: GroupedDataFrame<Row, GroupName>,
        summaryFormulas: SummaryFormulas,
      ): AnyPropertyIsAsync<SummaryFormulas> extends true ? PromisedDataFrame<
          RowAfterSummariseGrouped<Row, GroupName, SummaryFormulas>
        >
        : DataFrame<
          RowAfterSummariseGrouped<Row, GroupName, SummaryFormulas>
        >;

      // ── Regular DataFrame with async detection ──────────────────────────
      /**
       * Aggregate data into summary statistics.
       *
       * Collapses rows into summary values using aggregation functions. For grouped DataFrames,
       * creates one row per group with the group columns plus summary columns. For ungrouped
       * DataFrames, returns a single row with summary values.
       *
       * @example
       * // Summarise entire DataFrame
       * df.summarise({
       *   avgAge: (df) => s.mean(df.age),
       *   count: (df) => df.nrows()
       * })
       *
       * @example
       * // Summarise by groups
       * df.groupBy("category").summarise({
       *   avgPrice: (g) => s.mean(g.price),
       *   total: (g) => s.sum(g.amount),
       *   count: (g) => g.nrows()
       * })
       *
       * @example
       * // Async aggregation
       * await df.groupBy("region").summarise({
       *   validated: async (g) => await validateGroup(g)
       * })
       */
      <SummaryFormulas extends Record<string, AsyncSummaryFormula<Row>>>(
        summaryFormulas: SummaryFormulas,
      ): AnyPropertyIsAsync<SummaryFormulas> extends true
        ? PromisedDataFrame<RowAfterSummariseUngrouped<Row, SummaryFormulas>>
        : DataFrame<RowAfterSummariseUngrouped<Row, SummaryFormulas>>;
    }
  >;
