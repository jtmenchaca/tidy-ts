import type { GraphOptions } from "../../graph/graph.ts";
import type { TidyGraphWidget } from "../../graph/graph-types.ts";
import type { RowLabel } from "./row-labels.ts";
import type { ROW_LABEL } from "../../verbs/reshape/transpose.types.ts";
import type { Prettify } from "./utility-types.ts";
import type { UnifyUnion } from "./utility-types.ts";

import type { MutateMethod } from "../../verbs/transformation/mutate/mutate.types.ts";
import type { MutateColumnsMethod } from "../../verbs/transformation/mutate-columns.types.ts";
import type { SummariseMethod } from "../../verbs/aggregate/summarise.types.ts";
import type { SummariseColumnsMethod } from "../../verbs/aggregate/summarise-columns.types.ts";
import type { CrossTabulateMethod } from "../../verbs/aggregate/cross_tabulate.types.ts";
import type { CountMethod } from "../../verbs/aggregate/count.types.ts";
import type { RenameMethod } from "../../verbs/transformation/rename.types.ts";
import type { DummyColMethod } from "../../verbs/utility/dummy-col.types.ts";
import type {
  PivotLongerMethod,
  PivotWiderMethod,
} from "../../verbs/reshape/pivot-types.ts";
import type { TransposeMethod } from "../../verbs/reshape/transpose.types.ts";
import type {
  ForEachColMethod,
  ForEachRowMethod,
} from "../../verbs/utility/for-each.types.ts";
import type { SelectMethod } from "../../verbs/selection/select.types.ts";
import type { DropMethod } from "../../verbs/selection/drop.types.ts";
import type { ReorderMethod } from "../../verbs/transformation/reorder.types.ts";
import type {
  DayMethod,
  MonthMethod,
  YearMethod,
} from "../../verbs/utility/dates.types.ts";
import type { FilterRowsMethod } from "../../verbs/filtering/filter.types.ts";
import type { ArrangeMethod } from "../../verbs/sorting/arrange.types.ts";
import type { DistinctMethod } from "../../verbs/filtering/distinct.types.ts";
import type {
  SliceHeadMethod,
  SliceMaxMethod,
  SliceMinMethod,
  SliceRowsMethod,
  SliceSampleMethod,
  SliceTailMethod,
} from "../../verbs/filtering/slice.types.ts";
import type { UngroupMethod } from "../../verbs/grouping/ungroup.types.ts";
import type {
  AsofJoinMethod,
  CrossJoinMethod,
  InnerJoinMethod,
  LeftJoinMethod,
  LeftJoinParallelMethod,
  OuterJoinMethod,
  RightJoinMethod,
} from "../../verbs/join/types/index.ts";
import type { GroupByMethod } from "../../verbs/grouping/group-by.types.ts";
import type {
  ExtractHeadMethod,
  ExtractMethod,
  ExtractNthMethod,
  ExtractSampleMethod,
  ExtractTailMethod,
  ExtractUniqueMethod,
} from "../../verbs/selection/extract.types.ts";
import type { ExtractNthWhereSortedMethod } from "../../verbs/selection/extract-nth-where-sorted.types.ts";
import type { BindRowsMethod } from "../../verbs/reshape/bind-rows.types.ts";
import type { ReplaceNaMethod } from "../../verbs/missing-data/replace-na.types.ts";
// import type { FilterNaMethod } from "../../verbs/missing-data/filter-na.types.ts";
import type { AppendMethod } from "../../verbs/reshape/append.types.ts";
import type { PrependMethod } from "../../verbs/reshape/prepend.types.ts";
import type { ShuffleMethod } from "../../verbs/sorting/shuffle.types.ts";

import type { Forbid, ForbiddenArrayMethods } from "./forbid.types.ts";

/** Dynamic column accessors mapping extracted for perf (pure type, no runtime). */
export type DataFrameColumns<Row extends object> = {
  /**
   * Only expose string-named keys from Row as column accessors,
   * and hide a few reserved names used by the DataFrame API.
   */
  [
    ColName in Extract<
      keyof Row,
      string
    > as ColName extends
      | "nrows"
      | "columns"
      | "groupKeys"
      | "isGrouped"
      | "get"
      | "has" ? never
      : ColName
  ]-?: readonly Row[ColName][];
};

/**
 * A DataFrame is a two-dimensional data structure with labeled columns, similar to a table or spreadsheet.
 *
 * DataFrames provide a fluent API for data manipulation including filtering, grouping, aggregation,
 * joins, pivoting, and statistical operations. All operations are type-safe and preserve TypeScript types.
 *
 * @template Row - The type of each row in the DataFrame
 *
 * @example
 * ```typescript
 * import { createDataFrame } from "@tidy-ts/dataframe";
 *
 * const df = createDataFrame([
 *   { name: "Alice", age: 25, city: "NYC" },
 *   { name: "Bob", age: 30, city: "LA" }
 * ]);
 *
 * // Type-safe column access
 * const names = df.name; // string[]
 * const ages = df.age;   // number[]
 *
 * // Fluent operations
 * const adults = df
 *   .filter(row => row.age >= 18)
 *   .mutate({ isAdult: () => true })
 *   .groupBy("city")
 *   .summarize({ avgAge: group => stats.mean(group.age) });
 * ```
 */
export type DataFrame<Row extends object = object> =
  & {
    /** read-only random access (so df[0] works in TS) */
    readonly [index: number]: Row;

    /** iteration */
    [Symbol.iterator](): IterableIterator<Row>;

    /** optional helper */
    at(index: number): Row | undefined;

    /** escape hatch to a copy */
    toArray(): readonly Row[];

    /** Convert DataFrame to JSON string with nested DataFrame support */
    toJSON(options?: { space?: number }): string;

    /** Get the number of rows in the DataFrame */
    nrows(): number;

    /** Get the number of columns in the DataFrame */
    ncols(): number;

    /** Get the column names as an array */
    columns(): string[];

    /** Get column type information */
    dtypes(): Record<string, string>;

    /** Check if the DataFrame has zero rows */
    isEmpty(): boolean;

    /** Print DataFrame as table to console with intelligent formatting */
    print(
      messageOrOpts?: string | {
        maxCols?: number;
        maxWidth?: number;
        transpose?: boolean;
        showIndex?: boolean;
        colorRows?: boolean;
      },
      opts?: {
        maxCols?: number;
        maxWidth?: number;
        transpose?: boolean;
        showIndex?: boolean;
        colorRows?: boolean;
      },
    ): DataFrame<Row>;

    /** Get table-friendly representation for console.table */
    toTable(
      opts?: { maxCols?: number; maxWidth?: number; transpose?: boolean },
    ): object[];

    // ---------- Transformations ----------
    /**
     * This is a mutate method.
     */
    mutate: MutateMethod<Row>;
    mutateColumns: MutateColumnsMethod<Row>;
    filter: FilterRowsMethod<Row>;
    select: SelectMethod<Row>;
    extract: ExtractMethod<Row>;
    extractHead: ExtractHeadMethod<Row>;
    extractTail: ExtractTailMethod<Row>;
    extractNth: ExtractNthMethod<Row>;
    extractSample: ExtractSampleMethod<Row>;
    extractUnique: ExtractUniqueMethod<Row>;

    extractNthWhereSorted: ExtractNthWhereSortedMethod<Row>;
    arrange: ArrangeMethod<Row>;
    sort: ArrangeMethod<Row>;
    distinct: DistinctMethod<Row>;
    rename: RenameMethod<Row>;
    drop: DropMethod<Row>;
    reorder: ReorderMethod<Row>;
    year: YearMethod<Row>;
    month: MonthMethod<Row>;
    day: DayMethod<Row>;

    // ---------- Joins ----------
    innerJoin: InnerJoinMethod<Row>;
    leftJoin: LeftJoinMethod<Row>;
    leftJoinParallel: LeftJoinParallelMethod<Row>;
    rightJoin: RightJoinMethod<Row>;
    outerJoin: OuterJoinMethod<Row>;
    crossJoin: CrossJoinMethod<Row>;
    asofJoin: AsofJoinMethod<Row>;

    // ---------- Grouping / Aggregation ----------
    groupBy: GroupByMethod<Row>;
    summarise: SummariseMethod<Row>;
    summarize: SummariseMethod<Row>;
    summariseColumns: SummariseColumnsMethod<Row>;
    summarizeColumns: SummariseColumnsMethod<Row>;
    crossTabulate: CrossTabulateMethod<Row>;
    count: CountMethod<Row>;

    // ---------- Utilities ----------
    dummyCol: DummyColMethod<Row>;
    bindRows: BindRowsMethod<Row>;
    /** @deprecated Use bindRows instead */
    bind: BindRowsMethod<Row>;

    // ---------- Missing Data ----------
    replaceNA: ReplaceNaMethod<Row>;
    removeNA: {
      <Field extends keyof Row>(
        field: Field,
      ): DataFrame<
        Prettify<
          & UnifyUnion<Row>
          & { [K in Field]: Exclude<UnifyUnion<Row>[K], null | undefined> }
        >
      >;
      <Field extends keyof Row>(
        field: Field,
        ...fields: Field[]
      ): DataFrame<
        Prettify<
          & UnifyUnion<Row>
          & { [K in Field]: Exclude<UnifyUnion<Row>[K], null | undefined> }
        >
      >;
      <Field extends keyof Row>(
        fields: Field[],
      ): DataFrame<
        Prettify<
          & UnifyUnion<Row>
          & { [K in Field]: Exclude<UnifyUnion<Row>[K], null | undefined> }
        >
      >;
    };
    removeNull: {
      <Field extends keyof Row>(
        field: Field,
      ): DataFrame<
        Prettify<
          UnifyUnion<Row> & { [K in Field]: Exclude<UnifyUnion<Row>[K], null> }
        >
      >;
      <Field extends keyof Row>(
        field: Field,
        ...fields: Field[]
      ): DataFrame<
        Prettify<
          UnifyUnion<Row> & { [K in Field]: Exclude<UnifyUnion<Row>[K], null> }
        >
      >;
      <Field extends keyof Row>(
        fields: Field[],
      ): DataFrame<
        Prettify<
          UnifyUnion<Row> & { [K in Field]: Exclude<UnifyUnion<Row>[K], null> }
        >
      >;
    };
    removeUndefined: {
      <Field extends keyof Row>(
        field: Field,
      ): DataFrame<
        Prettify<
          & UnifyUnion<Row>
          & { [K in Field]: Exclude<UnifyUnion<Row>[K], undefined> }
        >
      >;
      <Field extends keyof Row>(
        field: Field,
        ...fields: Field[]
      ): DataFrame<
        Prettify<
          & UnifyUnion<Row>
          & { [K in Field]: Exclude<UnifyUnion<Row>[K], undefined> }
        >
      >;
      <Field extends keyof Row>(
        fields: Field[],
      ): DataFrame<
        Prettify<
          & UnifyUnion<Row>
          & { [K in Field]: Exclude<UnifyUnion<Row>[K], undefined> }
        >
      >;
    };

    // ---------- Convenience Verbs ----------
    append: AppendMethod<Row>;
    prepend: PrependMethod<Row>;
    shuffle: ShuffleMethod<Row>;

    // ---------- Pivoting ----------
    pivotWider: PivotWiderMethod<Row>;
    pivotLonger: PivotLongerMethod<Row>;
    transpose: TransposeMethod<Row>;

    // ---------- Slicing ----------
    slice: SliceRowsMethod<Row>;
    sliceHead: SliceHeadMethod<Row>;
    sliceTail: SliceTailMethod<Row>;
    sliceMin: SliceMinMethod<Row>;
    sliceMax: SliceMaxMethod<Row>;
    sliceSample: SliceSampleMethod<Row>;
    /** @deprecated Use sliceSample instead */
    sample: SliceSampleMethod<Row>;
    /** @deprecated Use sliceHead instead */
    head: SliceHeadMethod<Row>;
    /** @deprecated Use sliceTail instead */
    tail: SliceTailMethod<Row>;

    // ---------- Graph ----------
    graph(spec: GraphOptions<Row>): TidyGraphWidget;

    // ---------- Side-effects ----------
    forEach: ForEachRowMethod<Row>;
    /** @deprecated Use forEach instead */
    forEachRow: ForEachRowMethod<Row>;
    forEachCol: ForEachColMethod<Row>;

    // ---------- Grouping ----------
    /** Remove grouping from a grouped DataFrame. */
    ungroup: UngroupMethod<Row>;

    // ---------- Row Labels ----------
    /** Set row labels for the DataFrame with literal type preservation */
    setRowLabels<const Labels extends readonly RowLabel[]>(
      labels: Labels,
    ): DataFrame<Prettify<Row & { [K in typeof ROW_LABEL]: Labels[number] }>>;

    /** Get current row labels (returns default numeric labels if none set) */
    getRowLabels(): RowLabel[];

    /** Access row by label - single row version */
    loc(label: RowLabel): Row | undefined;

    /** Access rows by labels - multiple rows version */
    iloc(labels: RowLabel[]): DataFrame<Row>;

    // ---------- Tracing ----------
    /** Get trace spans for performance profiling (if tracing enabled) */
    getTrace(): unknown[];

    /** Print trace information to console (if tracing enabled) */
    printTrace(): void;
  }
  & DataFrameColumns<Row>
  & Forbid<ForbiddenArrayMethods>;

/** DataFrameWithRowLabels adds row label metadata while keeping the DataFrame surface. */
export type DataFrameWithRowLabels<
  Row extends object,
  Labels extends readonly RowLabel[] = readonly RowLabel[],
> = DataFrame<Row> & {
  __rowLabels: Labels;
};

/**
 * A GroupedDataFrame is a DataFrame that has been grouped by one or more columns.
 *
 * GroupedDataFrames maintain all DataFrame functionality but operations like `summarize()`
 * will be applied to each group separately. This enables efficient group-wise operations
 * without materializing separate DataFrames for each group.
 *
 * @template Row - The type of each row in the DataFrame
 * @template GroupKeys - The keys that the DataFrame is grouped by
 *
 * @example
 * ```typescript
 * const df = createDataFrame([
 *   { category: "A", value: 10 },
 *   { category: "A", value: 20 },
 *   { category: "B", value: 30 }
 * ]);
 *
 * const grouped = df.groupBy("category");
 *
 * // Operations are applied per group
 * const summary = grouped.summarize({
 *   total: group => stats.sum(group.value),
 *   count: group => group.nrows()
 * });
 * // Results: [{ category: "A", total: 30, count: 2 }, { category: "B", total: 30, count: 1 }]
 * ```
 */
export type GroupedDataFrame<
  Row extends object,
  GroupKeys extends keyof Row = keyof Row,
> = DataFrame<Row> & {
  __groups?: {
    // Core grouping info
    groupingColumns: GroupKeys[];

    // Adjacency list structure (actual implementation)
    head: Int32Array; // adjacency list heads for each group
    next: Int32Array; // adjacency list next pointers
    count: Uint32Array; // group sizes
    keyRow: Uint32Array; // representative row per group
    size: number; // number of groups
    usesRawIndices: boolean; // whether we're using raw indices or materialized view

    // Legacy structure (for backwards compatibility)
    keys?: object[];
    rows?: number[][];
  };
};
