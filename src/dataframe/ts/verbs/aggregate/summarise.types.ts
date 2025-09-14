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

export type SummariseMethod<Row extends object> =
  RestrictMethodForEmptyDataFrame<
    Row,
    EmptyDataFrameSummarise,
    {
      // ── Grouped DataFrame with async detection ──────────────────────────
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
      <SummaryFormulas extends Record<string, AsyncSummaryFormula<Row>>>(
        summaryFormulas: SummaryFormulas,
      ): AnyPropertyIsAsync<SummaryFormulas> extends true
        ? PromisedDataFrame<RowAfterSummariseUngrouped<Row, SummaryFormulas>>
        : DataFrame<RowAfterSummariseUngrouped<Row, SummaryFormulas>>;
    }
  >;
