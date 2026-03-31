// packages/dataframe/ts/types/verbs/summarise.ts
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
  PromisedDataFrame,
} from "../../promised-dataframe/index.ts";

// Sync summary formula type
type SummaryFormula<Row extends object> = (
  df: DataFrame<Row>,
) => unknown;

// Async summary formula type that allows Promise returns
type AsyncSummaryFormula<Row extends object> = (
  df: DataFrame<Row>,
) => Promise<unknown> | unknown;

export type RowAfterSummariseUngrouped<
  Row extends object,
  SummaryFormulas extends Record<string, SummaryFormula<Row> | AsyncSummaryFormula<Row>>,
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
  SummaryFormulas extends Record<string, SummaryFormula<Row> | AsyncSummaryFormula<Row>>,
> = Prettify<
  & Pick<Row, GroupName>
  & {
    [ColName in keyof SummaryFormulas]: Awaited<
      ReturnType<SummaryFormulas[ColName]>
    >;
  }
>;

/**
 * Synchronous summarise — always returns DataFrame.
 * Use `summariseAsync` for async aggregation functions.
 */
export type SummariseMethod<Row extends object> =
  RestrictMethodForEmptyDataFrame<
    Row,
    EmptyDataFrameSummarise,
    {
      // ── Grouped DataFrame ─────────────────────────────────────────────
      <
        R extends object,
        SummaryFormulas extends Record<string, SummaryFormula<R>>,
        GroupName extends keyof R,
      >(
        this: GroupedDataFrame<R, GroupName>,
        summaryFormulas: SummaryFormulas,
      ): DataFrame<RowAfterSummariseGrouped<R, GroupName, SummaryFormulas>>;

      // ── Regular DataFrame ─────────────────────────────────────────────
      <R extends object, SummaryFormulas extends Record<string, SummaryFormula<R>>>(
        this: DataFrame<R>,
        summaryFormulas: SummaryFormulas,
      ): DataFrame<RowAfterSummariseUngrouped<R, SummaryFormulas>>;
    }
  >;

/**
 * Async summarise — always returns PromisedDataFrame.
 * Use this when any aggregation function is async.
 */
export type SummariseAsyncMethod<Row extends object> =
  RestrictMethodForEmptyDataFrame<
    Row,
    EmptyDataFrameSummarise,
    {
      // ── Grouped DataFrame ─────────────────────────────────────────────
      <
        R extends object,
        SummaryFormulas extends Record<string, AsyncSummaryFormula<R>>,
        GroupName extends keyof R,
      >(
        this: GroupedDataFrame<R, GroupName>,
        summaryFormulas: SummaryFormulas,
      ): PromisedDataFrame<RowAfterSummariseGrouped<R, GroupName, SummaryFormulas>>;

      // ── Regular DataFrame ─────────────────────────────────────────────
      <R extends object, SummaryFormulas extends Record<string, AsyncSummaryFormula<R>>>(
        this: DataFrame<R>,
        summaryFormulas: SummaryFormulas,
      ): PromisedDataFrame<RowAfterSummariseUngrouped<R, SummaryFormulas>>;
    }
  >;
