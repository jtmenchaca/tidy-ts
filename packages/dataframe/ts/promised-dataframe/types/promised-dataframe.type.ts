// packages/dataframe/ts/core/thenable.ts
import type {
  DataFrame,
  DataFrameBase,
  DataFrameColumns,
  GroupedDataFrame,
} from "../../dataframe/index.ts";

/*
 * CRITICAL TYPE SYSTEM DISCOVERY: How PromisedDataFrame Method Overriding Works
 * =============================================================================
 *
 * PROBLEM: When chaining sync operations after async operations on PromisedDataFrame,
 * TypeScript would incorrectly infer the result as DataFrame instead of PromisedDataFrame,
 * causing "'await' has no effect" warnings.
 *
 * ROOT CAUSE: The thenable proxy system bypasses normal TypeScript overload resolution.
 * - Normal overloads in verb files (e.g., mutate.overloads.ts) are IGNORED by the proxy
 * - The proxy calls resolveVerb() which doesn't use TypeScript's overload matching
 * - This means adding PromisedDataFrame overloads to verb files is INEFFECTIVE
 *
 * SOLUTION: Override method signatures directly in the PromisedDataFrame type definition
 * - Use Omit<DataFrame, 'method'> to remove original method signatures
 * - Add method overrides that always return PromisedDataFrame types
 * - This ensures TypeScript sees the correct return types regardless of proxy behavior
 *
 * KEY INSIGHT: Type-level overrides work where runtime overloads fail because:
 * 1. Type system sees the overridden signatures during compilation
 * 2. Runtime proxy behavior is irrelevant to TypeScript's type inference
 * 3. Awaited<ReturnType<...>> properly handles mixed sync/async function parameters
 *
 * DEBUGGING TECHNIQUE: Use `deno task intellisense file:line:char` to verify types
 * rather than relying on console.log which only shows runtime behavior.
 */

/**
 * A PromisedDataFrame is a Promise-like wrapper around DataFrame that enables async operations.
 *
 * PromisedDataFrames act like regular DataFrames but also implement PromiseLike, allowing you to
 * chain both synchronous and asynchronous operations seamlessly. When you have async operations
 * in your DataFrame pipeline, the result becomes a PromisedDataFrame.
 *
 * **Important**: To get back to a regular DataFrame, simply `await` the PromisedDataFrame.
 *
 * @template Row - The type of each row in the DataFrame
 *
 * @example
 * ```typescript
 * // Async operations return PromisedDataFrame
 * const promised = df.mutate({
 *   data: async (row) => await fetchUserData(row.id)
 * });
 *
 * // Chain more operations on the PromisedDataFrame
 * const filtered = promised.filter(row => row.data.active);
 *
 * // Await to get back to DataFrame
 * const result: DataFrame<RowType> = await filtered;
 *
 * // Or await directly
 * const result2 = await df
 *   .mutate({ data: async (row) => await fetchUserData(row.id) })
 *   .filter(row => row.data.active);
 * ```
 */
export type PromisedDataFrame<Row extends Record<string, unknown>> =
  & Omit<
    DataFrameBase<Row>,
    | "mutate"
    | "mutateAsync"
    | "filter"
    | "filterAsync"
    | "select"
    | "arrange"
    | "sort"
    | "print"
    | "extract"
    | "extractHead"
    | "extractTail"
    | "extractNth"
    | "extractSample"
    | "extractUnique"
    | "extractNthWhereSorted"
    | "forEach"
    | "forEachRow"
    | "forEachRowAsync"
    | "forEachCol"
    | "forEachColAsync"
    | "graph"
    | "getRowLabels"
    | "setRowLabels"
    | "loc"
    | "iloc"
    | "getTrace"
    | "printTrace"
    | "distinct"
    | "summarise"
    | "summarize"
    | "summariseAsync"
    | "summarizeAsync"
  >
  & DataFrameColumns<Row>
  & PromiseLike<DataFrame<Row>>
  & {
    // Override distinct to work without `this: DataFrame<R>` (PromisedDataFrame is not a DataFrame)
    distinct: {
      <Cols extends keyof Row>(
        column1: Cols,
        ...moreColumns: Cols[]
      ): PromisedDataFrame<Pick<Row, Cols>>;
    };

    // Override mutate to always return PromisedDataFrame with awaited types
    mutate: {
      <
        Formulas extends Record<
          string,
          (row: Row, idx?: number, df?: DataFrame<Row>) => unknown
        >,
      >(
        formulas: Formulas,
      ): PromisedDataFrame<
        Row & { [K in keyof Formulas]: Awaited<ReturnType<Formulas[K]>> }
      >;
      <Assignments extends Record<string, unknown>>(
        assignments: Assignments,
      ): PromisedDataFrame<Row & Assignments>;
    };

    // Override filter to always return PromisedDataFrame (supports both sync and async predicates)
    filter: {
      (
        ...predicates: Array<
          | ((
            row: Row,
            idx: number,
            df: DataFrame<Row>,
          ) => boolean | null | undefined)
          | ((
            row: Row,
            idx: number,
            df: DataFrame<Row>,
          ) => Promise<boolean | null | undefined>)
          | ReadonlyArray<boolean | null | undefined>
        >
      ): PromisedDataFrame<Row>;
    };

    // Override select to always return PromisedDataFrame
    select: {
      <First extends keyof Row, const Rest extends readonly (keyof Row)[]>(
        columnName: First,
        ...columnNames: Rest
      ): PromisedDataFrame<Pick<Row, First | Rest[number]>>;
      <ColName extends keyof Row>(
        columns: ColName[],
      ): PromisedDataFrame<Pick<Row, ColName>>;
    };

    // mutateAsync on PromisedDataFrame — same as mutate, always returns PromisedDataFrame
    mutateAsync: {
      <
        Formulas extends Record<
          string,
          (row: Row, idx?: number, df?: DataFrame<Row>) => unknown
        >,
      >(
        formulas: Formulas,
      ): PromisedDataFrame<
        Row & { [K in keyof Formulas]: Awaited<ReturnType<Formulas[K]>> }
      >;
    };

    // filterAsync on PromisedDataFrame — same as filter
    filterAsync: {
      (
        ...predicates: Array<
          | ((
            row: Row,
            idx: number,
            df: DataFrame<Row>,
          ) => boolean | null | undefined)
          | ((
            row: Row,
            idx: number,
            df: DataFrame<Row>,
          ) => Promise<boolean | null | undefined>)
          | ReadonlyArray<boolean | null | undefined>
        >
      ): PromisedDataFrame<Row>;
    };

    // Override summarise/summarize to always return PromisedDataFrame
    summarise: {
      <SummaryFormulas extends Record<string, (df: DataFrame<Row>) => unknown>>(
        summaryFormulas: SummaryFormulas,
      ): PromisedDataFrame<{ [K in keyof SummaryFormulas]: Awaited<ReturnType<SummaryFormulas[K]>> }>;
    };
    summarize: {
      <SummaryFormulas extends Record<string, (df: DataFrame<Row>) => unknown>>(
        summaryFormulas: SummaryFormulas,
      ): PromisedDataFrame<{ [K in keyof SummaryFormulas]: Awaited<ReturnType<SummaryFormulas[K]>> }>;
    };
    summariseAsync: {
      <SummaryFormulas extends Record<string, (df: DataFrame<Row>) => unknown>>(
        summaryFormulas: SummaryFormulas,
      ): PromisedDataFrame<{ [K in keyof SummaryFormulas]: Awaited<ReturnType<SummaryFormulas[K]>> }>;
    };
    summarizeAsync: {
      <SummaryFormulas extends Record<string, (df: DataFrame<Row>) => unknown>>(
        summaryFormulas: SummaryFormulas,
      ): PromisedDataFrame<{ [K in keyof SummaryFormulas]: Awaited<ReturnType<SummaryFormulas[K]>> }>;
    };

    // Override arrange to always return PromisedDataFrame
    arrange: {
      (
        columns: (keyof Row)[],
        directions?: ("asc" | "desc")[],
      ): PromisedDataFrame<Row>;
      (column: keyof Row, direction?: "asc" | "desc"): PromisedDataFrame<Row>;
    };
  };

/**
 * A PromisedGroupedDataFrame is a Promise-like wrapper around GroupedDataFrame for async operations.
 *
 * Similar to PromisedDataFrame, but maintains grouping metadata and applies operations to each group.
 * When you have async operations in your grouped DataFrame pipeline, the result becomes a PromisedGroupedDataFrame.
 *
 * **Important**: To get back to a regular GroupedDataFrame, simply `await` the PromisedGroupedDataFrame.
 *
 * @template Row - The type of each row in the DataFrame
 * @template K - The keys that the DataFrame is grouped by
 *
 * @example
 * ```typescript
 * // Group and apply async operations
 * const grouped = df.groupBy("category");
 *
 * const promised = grouped.mutate({
 *   enrichedData: async (row) => await enrichData(row.value)
 * });
 *
 * // Await to get back to GroupedDataFrame
 * const result: GroupedDataFrame<RowType, "category"> = await promised;
 *
 * // Or continue chaining and await at the end
 * const summary = await df
 *   .groupBy("category")
 *   .mutate({ enriched: async (row) => await enrichData(row) })
 *   .summarize({
 *     total: group => stats.sum(group.enriched.map(e => e.value))
 *   });
 * ```
 */
export type PromisedGroupedDataFrame<
  Row extends Record<string, unknown>,
  K extends keyof Row,
> =
  & Omit<
    DataFrameBase<Row>,
    | "mutate"
    | "mutateAsync"
    | "filter"
    | "filterAsync"
    | "select"
    | "arrange"
    | "sort"
    | "print"
    | "extract"
    | "extractHead"
    | "extractTail"
    | "extractNth"
    | "extractSample"
    | "extractUnique"
    | "extractNthWhereSorted"
    | "forEach"
    | "forEachRow"
    | "forEachRowAsync"
    | "forEachCol"
    | "forEachColAsync"
    | "graph"
    | "getRowLabels"
    | "setRowLabels"
    | "loc"
    | "iloc"
    | "getTrace"
    | "printTrace"
    | "distinct"
    | "summarise"
    | "summarize"
    | "summariseAsync"
    | "summarizeAsync"
  >
  & DataFrameColumns<Row>
  & PromiseLike<GroupedDataFrame<Row, K>>
  & {
    // Override distinct for PromisedGroupedDataFrame
    distinct: {
      <Cols extends keyof Row>(
        column1: Cols,
        ...moreColumns: Cols[]
      ): PromisedGroupedDataFrame<Pick<Row, Cols>, Extract<K, keyof Pick<Row, Cols>>>;
    };

    // Override mutate to always return PromisedGroupedDataFrame
    mutate: {
      <
        Formulas extends Record<
          string,
          (row: Row, idx?: number, df?: DataFrame<Row>) => unknown
        >,
      >(
        formulas: Formulas,
      ): PromisedGroupedDataFrame<
        Row & { [K in keyof Formulas]: ReturnType<Formulas[K]> },
        Extract<
          K,
          keyof (Row & { [K in keyof Formulas]: ReturnType<Formulas[K]> })
        >
      >;
    };

    // Override filter to always return PromisedGroupedDataFrame (supports both sync and async predicates)
    filter: {
      (
        ...predicates: Array<
          | ((
            row: Row,
            idx: number,
            df: DataFrame<Row>,
          ) => boolean | null | undefined)
          | ((
            row: Row,
            idx: number,
            df: DataFrame<Row>,
          ) => Promise<boolean | null | undefined>)
          | ReadonlyArray<boolean | null | undefined>
        >
      ): PromisedGroupedDataFrame<Row, K>;
    };

    mutateAsync: {
      <
        Formulas extends Record<
          string,
          (row: Row, idx?: number, df?: DataFrame<Row>) => unknown
        >,
      >(
        formulas: Formulas,
      ): PromisedGroupedDataFrame<
        Row & { [K in keyof Formulas]: Awaited<ReturnType<Formulas[K]>> },
        Extract<
          K,
          keyof (Row & { [K in keyof Formulas]: Awaited<ReturnType<Formulas[K]>> })
        >
      >;
    };

    filterAsync: {
      (
        ...predicates: Array<
          | ((
            row: Row,
            idx: number,
            df: DataFrame<Row>,
          ) => boolean | null | undefined)
          | ((
            row: Row,
            idx: number,
            df: DataFrame<Row>,
          ) => Promise<boolean | null | undefined>)
          | ReadonlyArray<boolean | null | undefined>
        >
      ): PromisedGroupedDataFrame<Row, K>;
    };

    summarise: {
      <SummaryFormulas extends Record<string, (df: DataFrame<Row>) => unknown>>(
        summaryFormulas: SummaryFormulas,
      ): PromisedDataFrame<Pick<Row, K> & { [F in keyof SummaryFormulas]: Awaited<ReturnType<SummaryFormulas[F]>> }>;
    };
    summarize: {
      <SummaryFormulas extends Record<string, (df: DataFrame<Row>) => unknown>>(
        summaryFormulas: SummaryFormulas,
      ): PromisedDataFrame<Pick<Row, K> & { [F in keyof SummaryFormulas]: Awaited<ReturnType<SummaryFormulas[F]>> }>;
    };
    summariseAsync: {
      <SummaryFormulas extends Record<string, (df: DataFrame<Row>) => unknown>>(
        summaryFormulas: SummaryFormulas,
      ): PromisedDataFrame<Pick<Row, K> & { [F in keyof SummaryFormulas]: Awaited<ReturnType<SummaryFormulas[F]>> }>;
    };
    summarizeAsync: {
      <SummaryFormulas extends Record<string, (df: DataFrame<Row>) => unknown>>(
        summaryFormulas: SummaryFormulas,
      ): PromisedDataFrame<Pick<Row, K> & { [F in keyof SummaryFormulas]: Awaited<ReturnType<SummaryFormulas[F]>> }>;
    };
  };
