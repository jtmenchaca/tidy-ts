import type { DataFrame, DataFrameBase, DataFrameColumns, GroupedDataFrame } from "../../dataframe/index.ts";
/** Methods omitted from DataFrame and re-declared with PromisedDataFrame return types. */
type OmittedMethods = "mutate" | "mutateAsync" | "filter" | "filterAsync" | "select" | "arrange" | "sort" | "print" | "extract" | "extractHead" | "extractTail" | "extractNth" | "extractSample" | "extractUnique" | "extractNthWhereSorted" | "forEach" | "forEachRow" | "forEachRowAsync" | "forEachCol" | "forEachColAsync" | "graph" | "getRowLabels" | "setRowLabels" | "loc" | "iloc" | "getTrace" | "printTrace" | "distinct" | "summarise" | "summarize" | "summariseAsync" | "summarizeAsync" | "slice" | "sliceHead" | "sliceTail" | "sliceMin" | "sliceMax" | "sliceSample" | "sample" | "head" | "tail" | "shuffle" | "drop" | "rename" | "reorder" | "year" | "month" | "day";
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
export type PromisedDataFrame<Row extends object> = Omit<DataFrameBase<Row>, OmittedMethods> & DataFrameColumns<Row> & PromiseLike<DataFrame<Row>> & {
    distinct: {
        <Cols extends keyof Row>(column1: Cols, ...moreColumns: Cols[]): PromisedDataFrame<{
            [K in Cols]: Row[K];
        }>;
    };
    mutate: {
        <Formulas extends Record<string, (row: Row, idx?: number, df?: DataFrame<Row>) => unknown>>(formulas: Formulas): PromisedDataFrame<{
            [K in keyof Row | keyof Formulas]: K extends keyof Formulas ? Awaited<ReturnType<Formulas[K]>> : K extends keyof Row ? Row[K] : never;
        }>;
        <Assignments extends object>(assignments: Assignments): PromisedDataFrame<{
            [K in keyof Row | keyof Assignments]: K extends keyof Assignments ? Assignments[K] : K extends keyof Row ? Row[K] : never;
        }>;
    };
    filter: {
        (...predicates: Array<((row: Row, idx: number, df: DataFrame<Row>) => boolean | null | undefined) | ((row: Row, idx: number, df: DataFrame<Row>) => Promise<boolean | null | undefined>) | ReadonlyArray<boolean | null | undefined>>): PromisedDataFrame<Row>;
    };
    select: {
        <First extends keyof Row, const Rest extends readonly (keyof Row)[]>(columnName: First, ...columnNames: Rest): PromisedDataFrame<{
            [K in First | Rest[number]]: Row[K];
        }>;
        <ColName extends keyof Row>(columns: ColName[]): PromisedDataFrame<{
            [K in ColName]: Row[K];
        }>;
    };
    mutateAsync: {
        <Formulas extends Record<string, (row: Row, idx?: number, df?: DataFrame<Row>) => unknown>>(formulas: Formulas): PromisedDataFrame<{
            [K in keyof Row | keyof Formulas]: K extends keyof Formulas ? Awaited<ReturnType<Formulas[K]>> : K extends keyof Row ? Row[K] : never;
        }>;
    };
    filterAsync: {
        (...predicates: Array<((row: Row, idx: number, df: DataFrame<Row>) => boolean | null | undefined) | ((row: Row, idx: number, df: DataFrame<Row>) => Promise<boolean | null | undefined>) | ReadonlyArray<boolean | null | undefined>>): PromisedDataFrame<Row>;
    };
    summarise: {
        <SummaryFormulas extends Record<string, (df: DataFrame<Row>) => unknown>>(summaryFormulas: SummaryFormulas): PromisedDataFrame<{
            [K in keyof SummaryFormulas]: Awaited<ReturnType<SummaryFormulas[K]>>;
        }>;
    };
    summarize: {
        <SummaryFormulas extends Record<string, (df: DataFrame<Row>) => unknown>>(summaryFormulas: SummaryFormulas): PromisedDataFrame<{
            [K in keyof SummaryFormulas]: Awaited<ReturnType<SummaryFormulas[K]>>;
        }>;
    };
    summariseAsync: {
        <SummaryFormulas extends Record<string, (df: DataFrame<Row>) => unknown>>(summaryFormulas: SummaryFormulas): PromisedDataFrame<{
            [K in keyof SummaryFormulas]: Awaited<ReturnType<SummaryFormulas[K]>>;
        }>;
    };
    summarizeAsync: {
        <SummaryFormulas extends Record<string, (df: DataFrame<Row>) => unknown>>(summaryFormulas: SummaryFormulas): PromisedDataFrame<{
            [K in keyof SummaryFormulas]: Awaited<ReturnType<SummaryFormulas[K]>>;
        }>;
    };
    arrange: {
        (columns: (keyof Row)[], directions?: ("asc" | "desc")[]): PromisedDataFrame<Row>;
        (column: keyof Row, direction?: "asc" | "desc"): PromisedDataFrame<Row>;
    };
    slice: {
        (start: number, end?: number): PromisedDataFrame<Row>;
    };
    sliceHead: {
        (count: number): PromisedDataFrame<Row>;
    };
    sliceTail: {
        (count: number): PromisedDataFrame<Row>;
    };
    sliceMin: {
        (columnName: keyof Row, count: number): PromisedDataFrame<Row>;
    };
    sliceMax: {
        (columnName: keyof Row, count: number): PromisedDataFrame<Row>;
    };
    sliceSample: {
        (count: number, seed?: number): PromisedDataFrame<Row>;
    };
    sample: {
        (count: number, seed?: number): PromisedDataFrame<Row>;
    };
    head: {
        (count: number): PromisedDataFrame<Row>;
    };
    tail: {
        (count: number): PromisedDataFrame<Row>;
    };
    shuffle: {
        (seed?: number): PromisedDataFrame<Row>;
    };
    drop: {
        <ColName extends keyof Row>(...columns: ColName[]): PromisedDataFrame<{
            [K in keyof Row as K extends ColName ? never : K]: Row[K];
        }>;
        <ColName extends keyof Row>(columns: ColName[]): PromisedDataFrame<{
            [K in keyof Row as K extends ColName ? never : K]: Row[K];
        }>;
    };
    rename: {
        <RenameMap extends Partial<Record<keyof Row, string>>>(renameMap: RenameMap): PromisedDataFrame<{
            [K in Exclude<keyof Row, keyof RenameMap> | {
                [M in keyof RenameMap]: RenameMap[M] extends string ? RenameMap[M] : never;
            }[keyof RenameMap]]: K extends keyof Row ? Row[K] : K extends {
                [M in keyof RenameMap]: RenameMap[M] extends string ? RenameMap[M] : never;
            }[keyof RenameMap] ? Row[Extract<{
                [M in keyof RenameMap]: RenameMap[M] extends K ? M : never;
            }[keyof RenameMap], keyof Row>] : never;
        }>;
    };
    reorder: {
        (columns: (keyof Row)[]): PromisedDataFrame<Row>;
    };
    year: {
        (column: keyof Row): PromisedDataFrame<Row>;
    };
    month: {
        (column: keyof Row): PromisedDataFrame<Row>;
    };
    day: {
        (column: keyof Row): PromisedDataFrame<Row>;
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
 * @template GK - The keys that the DataFrame is grouped by
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
export type PromisedGroupedDataFrame<Row extends object, GK extends keyof Row> = Omit<DataFrameBase<Row>, OmittedMethods> & DataFrameColumns<Row> & PromiseLike<GroupedDataFrame<Row, GK>> & {
    distinct: {
        <Cols extends keyof Row>(column1: Cols, ...moreColumns: Cols[]): PromisedGroupedDataFrame<{
            [K in Cols]: Row[K];
        }, Extract<GK, Cols>>;
    };
    mutate: {
        <Formulas extends Record<string, (row: Row, idx?: number, df?: DataFrame<Row>) => unknown>>(formulas: Formulas): PromisedGroupedDataFrame<{
            [K in keyof Row | keyof Formulas]: K extends keyof Formulas ? ReturnType<Formulas[K]> : K extends keyof Row ? Row[K] : never;
        }, Extract<GK, keyof Row | keyof Formulas>>;
    };
    filter: {
        (...predicates: Array<((row: Row, idx: number, df: DataFrame<Row>) => boolean | null | undefined) | ((row: Row, idx: number, df: DataFrame<Row>) => Promise<boolean | null | undefined>) | ReadonlyArray<boolean | null | undefined>>): PromisedGroupedDataFrame<Row, GK>;
    };
    mutateAsync: {
        <Formulas extends Record<string, (row: Row, idx?: number, df?: DataFrame<Row>) => unknown>>(formulas: Formulas): PromisedGroupedDataFrame<{
            [K in keyof Row | keyof Formulas]: K extends keyof Formulas ? Awaited<ReturnType<Formulas[K]>> : K extends keyof Row ? Row[K] : never;
        }, Extract<GK, keyof Row | keyof Formulas>>;
    };
    filterAsync: {
        (...predicates: Array<((row: Row, idx: number, df: DataFrame<Row>) => boolean | null | undefined) | ((row: Row, idx: number, df: DataFrame<Row>) => Promise<boolean | null | undefined>) | ReadonlyArray<boolean | null | undefined>>): PromisedGroupedDataFrame<Row, GK>;
    };
    summarise: {
        <SummaryFormulas extends Record<string, (df: DataFrame<Row>) => unknown>>(summaryFormulas: SummaryFormulas): PromisedDataFrame<{
            [K in GK | keyof SummaryFormulas]: K extends keyof SummaryFormulas ? Awaited<ReturnType<SummaryFormulas[K]>> : K extends keyof Row ? Row[K] : never;
        }>;
    };
    summarize: {
        <SummaryFormulas extends Record<string, (df: DataFrame<Row>) => unknown>>(summaryFormulas: SummaryFormulas): PromisedDataFrame<{
            [K in GK | keyof SummaryFormulas]: K extends keyof SummaryFormulas ? Awaited<ReturnType<SummaryFormulas[K]>> : K extends keyof Row ? Row[K] : never;
        }>;
    };
    summariseAsync: {
        <SummaryFormulas extends Record<string, (df: DataFrame<Row>) => unknown>>(summaryFormulas: SummaryFormulas): PromisedDataFrame<{
            [K in GK | keyof SummaryFormulas]: K extends keyof SummaryFormulas ? Awaited<ReturnType<SummaryFormulas[K]>> : K extends keyof Row ? Row[K] : never;
        }>;
    };
    summarizeAsync: {
        <SummaryFormulas extends Record<string, (df: DataFrame<Row>) => unknown>>(summaryFormulas: SummaryFormulas): PromisedDataFrame<{
            [K in GK | keyof SummaryFormulas]: K extends keyof SummaryFormulas ? Awaited<ReturnType<SummaryFormulas[K]>> : K extends keyof Row ? Row[K] : never;
        }>;
    };
    slice: {
        (start: number, end?: number): PromisedGroupedDataFrame<Row, GK>;
    };
    sliceHead: {
        (count: number): PromisedGroupedDataFrame<Row, GK>;
    };
    sliceTail: {
        (count: number): PromisedGroupedDataFrame<Row, GK>;
    };
    sliceMin: {
        (columnName: keyof Row, count: number): PromisedGroupedDataFrame<Row, GK>;
    };
    sliceMax: {
        (columnName: keyof Row, count: number): PromisedGroupedDataFrame<Row, GK>;
    };
    sliceSample: {
        (count: number, seed?: number): PromisedGroupedDataFrame<Row, GK>;
    };
    sample: {
        (count: number, seed?: number): PromisedGroupedDataFrame<Row, GK>;
    };
    head: {
        (count: number): PromisedGroupedDataFrame<Row, GK>;
    };
    tail: {
        (count: number): PromisedGroupedDataFrame<Row, GK>;
    };
    shuffle: {
        (seed?: number): PromisedGroupedDataFrame<Row, GK>;
    };
    drop: {
        <ColName extends keyof Row>(...columns: ColName[]): PromisedGroupedDataFrame<Omit<Row, ColName>, Extract<GK, keyof Omit<Row, ColName>>>;
        <ColName extends keyof Row>(columns: ColName[]): PromisedGroupedDataFrame<Omit<Row, ColName>, Extract<GK, keyof Omit<Row, ColName>>>;
    };
    rename: {
        <RenameMap extends Partial<Record<keyof Row, string>>>(renameMap: RenameMap): PromisedGroupedDataFrame<{
            [K in Exclude<keyof Row, keyof RenameMap> | {
                [M in keyof RenameMap]: RenameMap[M] extends string ? RenameMap[M] : never;
            }[keyof RenameMap]]: K extends keyof Row ? Row[K] : K extends {
                [M in keyof RenameMap]: RenameMap[M] extends string ? RenameMap[M] : never;
            }[keyof RenameMap] ? Row[Extract<{
                [M in keyof RenameMap]: RenameMap[M] extends K ? M : never;
            }[keyof RenameMap], keyof Row>] : never;
        }, Extract<GK, Exclude<keyof Row, keyof RenameMap> | {
            [M in keyof RenameMap]: RenameMap[M] extends string ? RenameMap[M] : never;
        }[keyof RenameMap]>>;
    };
    reorder: {
        (columns: (keyof Row)[]): PromisedGroupedDataFrame<Row, GK>;
    };
    year: {
        (column: keyof Row): PromisedGroupedDataFrame<Row, GK>;
    };
    month: {
        (column: keyof Row): PromisedGroupedDataFrame<Row, GK>;
    };
    day: {
        (column: keyof Row): PromisedGroupedDataFrame<Row, GK>;
    };
};
export {};
