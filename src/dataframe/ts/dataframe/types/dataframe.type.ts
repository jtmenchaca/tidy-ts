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

    /**
     * Iterate over DataFrame rows.
     *
     * Enables using DataFrames in for...of loops and spread operators.
     * Each iteration yields a row object with all columns.
     *
     * @returns An iterator over DataFrame rows
     *
     * @example
     * // Iterate with for...of
     * for (const row of df) {
     *   console.log(row.name, row.age)
     * }
     *
     * @example
     * // Convert to array with spread
     * const rows = [...df]
     */
    [Symbol.iterator](): IterableIterator<Row>;

    /**
     * Access a row by index with bounds checking.
     *
     * Returns the row at the specified index, or undefined if the index
     * is out of bounds. Supports negative indices to access from the end.
     *
     * @param index - Row index (0-based). Negative indices count from the end.
     * @returns The row at the index, or undefined if out of bounds
     *
     * @example
     * // Get first row
     * const first = df.at(0)
     *
     * @example
     * // Get last row
     * const last = df.at(-1)
     */
    at(index: number): Row | undefined;

    /**
     * Convert DataFrame to a readonly array of row objects.
     *
     * Creates a shallow copy of all rows as a plain JavaScript array.
     * Each row is a plain object with column values. Useful for interop
     * with non-DataFrame code or when you need a snapshot of the data.
     *
     * @returns A readonly array containing all rows
     *
     * @example
     * // Convert to array
     * const rows = df.toArray()
     *
     * @example
     * // Use with array methods
     * const firstThree = df.toArray().slice(0, 3)
     *
     * @example
     * // Pass to external library
     * await externalAPI.send(df.toArray())
     */
    toArray(): readonly Row[];

    /**
     * Convert DataFrame to a JSON string.
     *
     * Serializes the DataFrame as a JSON array of objects. Each row becomes
     * a JSON object. Supports optional formatting with indentation for
     * pretty-printing. Handles nested DataFrames by converting them to arrays.
     *
     * @param options - Optional formatting configuration
     *   - `space`: Number of spaces for indentation (default: 0 for compact output)
     *
     * @returns JSON string representation of the DataFrame
     *
     * @example
     * // Compact JSON
     * const json = df.toJSON()
     * // '[{"name":"Alice","age":25},{"name":"Bob","age":30}]'
     *
     * @example
     * // Pretty-printed JSON
     * const prettyJson = df.toJSON({ space: 2 })
     *
     * @example
     * // Save to file
     * await Deno.writeTextFile("data.json", df.toJSON({ space: 2 }))
     */
    toJSON(options?: { space?: number }): string;

    /**
     * Get the number of rows in the DataFrame.
     *
     * Returns the total count of rows. For grouped DataFrames, returns
     * the total across all groups.
     *
     * @returns The number of rows
     *
     * @example
     * const count = df.nrows()
     * console.log(`DataFrame has ${count} rows`)
     *
     * @example
     * // Check if DataFrame is empty
     * if (df.nrows() === 0) {
     *   console.log("No data")
     * }
     */
    nrows(): number;

    /**
     * Get the number of columns in the DataFrame.
     *
     * Returns the count of columns (fields) in each row.
     *
     * @returns The number of columns
     *
     * @example
     * const colCount = df.ncols()
     * console.log(`DataFrame has ${colCount} columns`)
     */
    ncols(): number;

    /**
     * Get the column names as an array.
     *
     * Returns an array of all column names in the DataFrame.
     * The order matches the order columns were defined or created.
     *
     * @returns Array of column name strings
     *
     * @example
     * const cols = df.columns()
     * console.log(`Columns: ${cols.join(", ")}`)
     *
     * @example
     * // Check if column exists
     * if (df.columns().includes("age")) {
     *   console.log("Has age column")
     * }
     */
    columns(): string[];

    /**
     * Check if the DataFrame has zero rows.
     *
     * Returns true if the DataFrame contains no data rows, false otherwise.
     * More readable than checking `nrows() === 0`.
     *
     * @returns True if the DataFrame is empty, false otherwise
     *
     * @example
     * if (df.isEmpty()) {
     *   console.log("No data to process")
     * }
     *
     * @example
     * // Guard against empty data
     * const result = df.isEmpty() ? null : df.filter(r => r.active)
     */
    isEmpty(): boolean;

    /**
     * Print DataFrame contents to console with optional formatting.
     *
     * Displays a formatted table representation of the DataFrame in the console.
     * Useful for debugging and data inspection. Returns the original DataFrame
     * for chaining. Supports custom formatting options and optional messages.
     *
     * @param messageOrOpts - Optional message to print before the table, or formatting options
     * @param opts - Formatting options (only used if first parameter is a message)
     *   - `maxCols`: Maximum number of columns to display
     *   - `maxWidth`: Maximum width for each column
     *   - `transpose`: Display table transposed (rows as columns)
     *   - `showIndex`: Show row indices
     *   - `colorRows`: Alternate row background colors for better readability
     *
     * @returns The original DataFrame for chaining
     *
     * @example
     * // Simple print
     * df.print()
     *
     * @example
     * // Print with message
     * df.print("User data:")
     *
     * @example
     * // Print with formatting options
     * df.print({ showIndex: true, colorRows: true })
     *
     * @example
     * // Print with message and options
     * df.print("Debug output:", { maxCols: 5, showIndex: true })
     *
     * @example
     * // Chain with other operations
     * df.filter(row => row.age > 18)
     *   .print("Adults only:")
     *   .select("name", "email")
     */
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

    /**
     * Remove rows with NA values (null or undefined) in specified columns.
     *
     * Filters out rows where any of the specified columns contain null or undefined.
     * Returns a DataFrame with the affected columns typed as non-nullable.
     * Supports single field, multiple fields, or array syntax.
     *
     * @param field - Column name(s) to check for NA values
     * @returns DataFrame with rows containing NA values removed and types narrowed
     *
     * @example
     * // Remove rows where age is null/undefined
     * const cleaned = df.removeNA("age")
     *
     * @example
     * // Remove rows where any field is NA
     * const cleaned = df.removeNA("age", "email", "name")
     *
     * @example
     * // Array syntax
     * const cleaned = df.removeNA(["age", "email"])
     */
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

    /**
     * Remove rows with null values in specified columns.
     *
     * Filters out rows where any of the specified columns contain null
     * (but not undefined). Returns a DataFrame with the affected columns
     * typed to exclude null. More specific than removeNA.
     *
     * @param field - Column name(s) to check for null values
     * @returns DataFrame with rows containing null removed and types narrowed
     *
     * @example
     * // Remove rows where age is null
     * const cleaned = df.removeNull("age")
     *
     * @example
     * // Remove rows where any field is null
     * const cleaned = df.removeNull("age", "email")
     */
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

    /**
     * Remove rows with undefined values in specified columns.
     *
     * Filters out rows where any of the specified columns contain undefined
     * (but not null). Returns a DataFrame with the affected columns typed
     * to exclude undefined. More specific than removeNA.
     *
     * @param field - Column name(s) to check for undefined values
     * @returns DataFrame with rows containing undefined removed and types narrowed
     *
     * @example
     * // Remove rows where age is undefined
     * const cleaned = df.removeUndefined("age")
     *
     * @example
     * // Remove rows where any field is undefined
     * const cleaned = df.removeUndefined("age", "email")
     */
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
    /**
     * Create an interactive Vega-Lite visualization from the DataFrame.
     *
     * Generates a TidyGraph widget for data visualization. Supports scatter plots,
     * line charts, bar charts, and area charts. The widget can be displayed in
     * Jupyter notebooks, web applications, or saved as SVG/PNG.
     *
     * @param spec - Graph specification with type, mappings, and optional config
     *   - `type`: Chart type - "scatter", "line", "bar", or "area"
     *   - `mappings`: Column mappings - { x, y, color?, series?, size?, shape? }
     *   - `config`: Optional styling - layout, axes, grid, colors, legend, tooltip, etc.
     *
     * @returns A TidyGraph widget with display() and save methods
     *
     * @example
     * // Scatter plot with color encoding
     * df.graph({
     *   type: "scatter",
     *   mappings: { x: "age", y: "income", color: "category" }
     * })
     *
     * @example
     * // Line chart with custom styling
     * df.graph({
     *   type: "line",
     *   mappings: { x: "date", y: "value", series: "category" },
     *   config: {
     *     layout: { title: "Sales Over Time", width: 800, height: 400 },
     *     line: { style: "monotone", strokeWidth: 3 }
     *   }
     * })
     *
     * @example
     * // Bar chart with configuration
     * df.graph({
     *   type: "bar",
     *   mappings: { x: "category", y: "count" },
     *   config: {
     *     color: { scheme: "vibrant" },
     *     bar: { radius: 8 }
     *   }
     * })
     *
     * @example
     * // Save as PNG or SVG
     * const chart = df.graph({ type: "scatter", mappings: { x: "x", y: "y" } })
     * await chart.savePNG({ filename: "chart.png", width: 800, height: 600 })
     * await chart.saveSVG({ filename: "chart.png", width: 800, height: 600 })
     */
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
    /**
     * Set custom row labels for the DataFrame.
     *
     * Assigns string or number labels to each row, similar to pandas index.
     * Labels must be unique and match the DataFrame's row count. Preserves
     * literal types for compile-time label validation.
     *
     * @param labels - Array of unique labels, one per row
     * @returns DataFrame with row labels attached to the type
     *
     * @example
     * // Set string labels
     * const labeled = df.setRowLabels(["row1", "row2", "row3"])
     *
     * @example
     * // Use with loc to access by label
     * const labeled = df.setRowLabels(["alice", "bob", "charlie"])
     * const bobsRow = labeled.loc("bob")
     */
    setRowLabels<const Labels extends readonly RowLabel[]>(
      labels: Labels,
    ): DataFrame<Prettify<Row & { [K in typeof ROW_LABEL]: Labels[number] }>>;

    /**
     * Get the current row labels.
     *
     * Returns the array of row labels if they were set with setRowLabels(),
     * otherwise returns default numeric labels (0, 1, 2, ...).
     *
     * @returns Array of row labels
     *
     * @example
     * const labels = df.getRowLabels()
     * console.log("Row labels:", labels)
     */
    getRowLabels(): RowLabel[];

    /**
     * Access a single row by its label.
     *
     * Returns the row with the specified label, or undefined if the label
     * doesn't exist. Labels must be set with setRowLabels() first.
     *
     * @param label - The row label to look up
     * @returns The row with that label, or undefined if not found
     *
     * @example
     * const labeled = df.setRowLabels(["alice", "bob", "charlie"])
     * const bobsRow = labeled.loc("bob")
     * if (bobsRow) {
     *   console.log(bobsRow.age)
     * }
     */
    loc(label: RowLabel): Row | undefined;

    /**
     * Access multiple rows by their labels.
     *
     * Returns a DataFrame containing only the rows with the specified labels,
     * in the order requested. Labels must be set with setRowLabels() first.
     *
     * @param labels - Array of row labels to retrieve
     * @returns DataFrame with the selected rows
     *
     * @example
     * const labeled = df.setRowLabels(["alice", "bob", "charlie", "diana"])
     * const subset = labeled.iloc(["bob", "diana"])
     */
    iloc(labels: RowLabel[]): DataFrame<Row>;

    // ---------- Tracing ----------
    /**
     * Get performance tracing spans.
     *
     * Returns collected trace spans if tracing is enabled. Used for performance
     * profiling and debugging. Requires enabling tracing in DataFrame options.
     *
     * @returns Array of trace span objects
     *
     * @example
     * const spans = df.getTrace()
     * console.log("Operation spans:", spans)
     */
    getTrace(): unknown[];

    /**
     * Print trace information to console.
     *
     * Displays collected performance traces in a human-readable format.
     * Only outputs data if tracing was enabled. Useful for identifying
     * performance bottlenecks.
     *
     * @example
     * df.filter(row => row.age > 18)
     *   .groupBy("city")
     *   .summarise({ count: g => g.nrows() })
     *   .printTrace()
     */
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
