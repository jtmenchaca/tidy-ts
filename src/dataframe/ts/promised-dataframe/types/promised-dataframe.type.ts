// src/dataframe/ts/core/thenable.ts
import type { DataFrame, GroupedDataFrame } from "../../dataframe/index.ts";

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
    DataFrame<Row>,
    | "mutate"
    | "filter"
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
    | "forEach"
    | "forEachRow"
    | "forEachCol"
    | "graph"
    | "getRowLabels"
    | "setRowLabels"
    | "loc"
    | "iloc"
    | "getTrace"
    | "printTrace"
  > // Remove original methods
  & PromiseLike<DataFrame<Row>>
  & {
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
      <ColName extends keyof Row>(
        ...columnNames: ColName[]
      ): PromisedDataFrame<Pick<Row, ColName>>;
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
    GroupedDataFrame<Row, K>,
    | "mutate"
    | "filter"
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
    | "forEach"
    | "forEachRow"
    | "forEachCol"
    | "graph"
    | "getRowLabels"
    | "setRowLabels"
    | "loc"
    | "iloc"
    | "getTrace"
    | "printTrace"
  > // Remove original methods
  & PromiseLike<GroupedDataFrame<Row, K>>
  & {
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
  };
