import type { GraphOptions } from "../../graph/graph.ts";
import type { TidyGraphWidget } from "../../graph/graph-types.ts";
import type { RowLabel } from "./row-labels.ts";
import type { RemoveNAMethod, RemoveNullMethod, RemoveUndefinedMethod } from "../../verbs/filtering/remove-na.types.ts";
import type { SetRowLabelsMethod } from "./set-row-labels.types.ts";
// UnifyUnion removed from these signatures — Row is never a union in practice,
// and MergeUnionAllKeys is expensive for the type checker to evaluate on generics.

import type { MutateAsyncMethod, MutateMethod } from "../../verbs/transformation/mutate/mutate.types.ts";
import type { MutateOverGroupMethod } from "../../verbs/transformation/mutate/mutate-over-group.types.ts";
import type { MutateColumnsMethod } from "../../verbs/transformation/mutate-columns.types.ts";
import type { SummariseAsyncMethod, SummariseMethod } from "../../verbs/aggregate/summarise.types.ts";
import type { SummariseColumnsMethod } from "../../verbs/aggregate/summarise-columns.types.ts";
// import type { CrossTabulateMethod } from "../../verbs/aggregate/cross_tabulate.types.ts";
import type { CountMethod } from "../../verbs/aggregate/count.types.ts";
import type { RenameMethod } from "../../verbs/transformation/rename.types.ts";
import type { DummyColMethod } from "../../verbs/utility/dummy-col.types.ts";
import type {
  PivotLongerMethod,
  PivotWiderMethod,
} from "../../verbs/reshape/pivot-types.ts";
import type { TransposeMethod } from "../../verbs/reshape/transpose.types.ts";
import type {
  ForEachColAsyncMethod,
  ForEachColMethod,
  ForEachRowAsyncMethod,
  ForEachRowMethod,
} from "../../verbs/utility/for-each.types.ts";
import type { ProfileMethod } from "../../verbs/utility/profile.types.ts";
import type { SelectMethod } from "../../verbs/selection/select.types.ts";
import type { DropMethod } from "../../verbs/selection/drop.types.ts";
import type { ReorderMethod } from "../../verbs/transformation/reorder.types.ts";
import type { FilterAsyncMethod, FilterRowsMethod } from "../../verbs/filtering/filter.types.ts";
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
import type {
  ReplaceNaMethod,
  ReplaceNullMethod,
  ReplaceUndefinedMethod,
} from "../../verbs/missing-data/replace-na.types.ts";
import type { FillForwardMethod } from "../../verbs/missing-data/fill-forward.types.ts";
import type { FillBackwardMethod } from "../../verbs/missing-data/fill-backward.types.ts";
import type { InterpolateMethod } from "../../verbs/missing-data/interpolate.types.ts";
import type { ResampleMethod } from "../../verbs/utility/resample.types.ts";
import type { DownsampleMethod } from "../../verbs/utility/downsample.types.ts";
import type { UpsampleMethod } from "../../verbs/utility/upsample.types.ts";
// import type { FilterNaMethod } from "../../verbs/missing-data/filter-na.types.ts";
import type { AppendMethod } from "../../verbs/reshape/append.types.ts";
import type { PrependMethod } from "../../verbs/reshape/prepend.types.ts";
import type { ShuffleMethod } from "../../verbs/sorting/shuffle.types.ts";
import type { UnnestMethod } from "../../verbs/reshape/unnest.types.ts";

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
/** Nominal brand so tsc can short-circuit structural comparisons of DataFrame. */
declare const __df: unique symbol;

/**
 * Core DataFrame interface. Type relationships between interfaces are cached
 * by tsc (unlike intersection types), so all method signatures use this
 * interface directly — avoiding the uncacheable intersection that
 * DataFrameColumns would create.
 *
 * @see https://github.com/microsoft/TypeScript/wiki/Performance
 *      "Type relationships between interfaces are also cached,
 *       as opposed to intersection types as a whole."
 */
export interface DataFrameBase<Row extends object = object>
  extends Forbid<ForbiddenArrayMethods> {
  /** Phantom brand — never exists at runtime, enables nominal type identity. */
  readonly [__df]: Row;

  /** read-only random access (so df[0] works in TS) */
  readonly [index: number]: Row;

  [Symbol.iterator](): IterableIterator<Row>;

  at(index: number): Row | undefined;

  /** @deprecated Use toRows() instead */
  toArray(): readonly Row[];

  toRows(): Row[];

  toColumns(): { [K in keyof Row]: Row[K][] };

  toJSON(options?: { space?: number }): string;

  toString(
    options?: { maxRows?: number; maxWidth?: number; showIndex?: boolean },
  ): string;

  nrows(): number;

  ncols(): number;

  columns(): string[];

  isEmpty(): boolean;

  print(
    messageOrOpts?: string | {
      maxCols?: number;
      maxWidth?: number;
      transpose?: boolean;
      showIndex?: boolean;
      colorRows?: boolean;
      expand?: boolean;
    },
    opts?: {
      maxCols?: number;
      maxWidth?: number;
      transpose?: boolean;
      showIndex?: boolean;
      colorRows?: boolean;
      expand?: boolean;
    },
  ): this;

  profile: ProfileMethod<Row>;

  // ---------- Transformations ----------
  /**
   * Synchronous mutate — always returns DataFrame or GroupedDataFrame.
   *
   * Async formulas are rejected at compile time via AllSync on function overloads.
   * Use `mutateAsync` for async formulas.
   */
  mutate: MutateMethod<Row>;

  /**
   * Async mutate — always returns PromisedDataFrame or PromisedGroupedDataFrame.
   *
   * Use this when any formula is async (returns a Promise).
   * Supports optional concurrency control.
   */
  mutateAsync: MutateAsyncMethod<Row>;

  /**
   * Group-level mutate: each expression receives the group DataFrame and returns an array.
   * Called once per group (O(groups), not per row).
   *
   * On ungrouped DataFrames, the whole frame is treated as one group.
   *
   * Expressions are evaluated sequentially — later expressions can reference
   * columns created by earlier expressions in the same call.
   *
   * @example
   * df.groupBy("id")
   *   .mutateOverGroup({
   *     maxEndSoFar: (gdf) => s.cummax(gdf.extract("end")),
   *   })
   *   .mutateOverGroup({
   *     prevMaxEnd: (gdf) => s.lag(gdf.extract("maxEndSoFar"), 1),
   *   })
   */
  mutateOverGroup: MutateOverGroupMethod<Row>;

  /**
   * Mutate across multiple columns of the same type.
   *
   * Applies functions to individual **cell values** (not whole columns) across
   * several columns that share a `colType`. Each `newColumns` entry creates one
   * derived column per source column, using `{prefix}{column}{suffix}` naming.
   *
   * - Functions receive a single value, not a column array.
   * - Works on grouped DataFrames; operations apply within each group’s rows.
   *
   * @example
   * df.mutateColumns({
   *   colType: "number",
   *   columns: ["score1", "score2"],
   *   newColumns: [
   *     { prefix: "add_1_", fn: (col) => col + 1 },
   *     { prefix: "double_", fn: (col) => col * 2 },
   *   ],
   * })
   */
  mutateColumns: MutateColumnsMethod<Row>;

  /**
   * Synchronous filter — always returns DataFrame or GroupedDataFrame.
   * Use `filterAsync` for async predicates.
   *
   * Filtering preserves row shape (values do not change, only which rows are kept).
   *
   * You may pass a boolean mask array, one or more predicate functions, or use an
   * explicit type predicate so TypeScript narrows the row type.
   *
   * Support for explicit type predicates:
   *
   * @example
   * const result = df.filter((row): row is RowType & { prop: NonNullable<RowType['prop']> } =>
   *   row.prop !== undefined
   * );
   */
  filter: FilterRowsMethod<Row>;

  /**
   * Async filter — always returns PromisedDataFrame or PromisedGroupedDataFrame.
   * Use this when any predicate is async (returns a Promise).
   * Supports optional concurrency control.
   *
   * Filtering preserves row shape (values do not change, only which rows are kept).
   */
  filterAsync: FilterAsyncMethod<Row>;

  /**
   * Select one or more columns from the DataFrame.
   *
   * Returns a new DataFrame containing only the specified columns. Column order
   * is preserved as specified. Works with both regular and grouped DataFrames.
   *
   * @example
   * // Select a single column
   * df.select("name")
   *
   * @example
   * // Select multiple columns
   * df.select("name", "age", "email")
   *
   * @example
   * // Select on grouped DataFrames
   * df.groupBy("category").select("value", "price")
   */
  select: SelectMethod<Row>;

  /**
   * Extract all values from a column as a plain array.
   *
   * Values appear in row order—one entry per row, including duplicates and
   * nullish values. Handy when you want the column as a JavaScript array instead
   * of iterating the DataFrame yourself.
   *
   * @example
   * // All scores as a number[]
   * df.extract("score")
   *
   * @example
   * // Pass to a library expecting an array
   * const labels = df.extract("label")
   */
  extract: ExtractMethod<Row>;

  /**
   * Extract the first n values from a column.
   *
   * When `n` is `1`, returns a single value or `undefined` if the DataFrame is
   * empty. For `n > 1`, returns an array of up to n values in row order.
   *
   * @example
   * // First row only
   * df.extractHead("name", 1)
   *
   * @example
   * // First three values
   * df.extractHead("value", 3)
   */
  extractHead: ExtractHeadMethod<Row>;

  /**
   * Extract the last n values from a column.
   *
   * When `n` is `1`, returns a single value or `undefined` if the DataFrame is
   * empty. For `n > 1`, returns an array of up to n values from the end of the column.
   *
   * @example
   * // Most recent row only
   * df.extractTail("timestamp", 1)
   *
   * @example
   * // Last five observations
   * df.extractTail("reading", 5)
   */
  extractTail: ExtractTailMethod<Row>;

  /**
   * Extract the value at a specific index from a column.
   *
   * Indices follow row order (0-based). Returns `undefined` if the index is
   * out of range or the DataFrame is empty.
   *
   * @example
   * df.extractNth("id", 0)
   *
   * @example
   * df.extractNth("value", 42)
   */
  extractNth: ExtractNthMethod<Row>;

  /**
   * Extract a random sample of up to n values from a column.
   *
   * Sampling is **without replacement**: each picked value is removed from the
   * pool. Returns at most `n` values, or fewer if the column has fewer than `n`
   * rows. Order is random, not row order.
   *
   * @example
   * df.extractSample("name", 3)
   */
  extractSample: ExtractSampleMethod<Row>;

  /**
   * Extract unique values from a column as an array.
   *
   * Equivalent to deduplicating `extract(column)` while preserving first-seen
   * order (same idea as `[...new Set(df.extract(column))]`).
   *
   * @example
   * df.extractUnique("category")
   *
   * @example
   * df.extractUnique("age")
   */
  extractUnique: ExtractUniqueMethod<Row>;

  /**
   * Sort by one column, then read the value from another column at a given rank (1-based).
   *
   * Sorting uses all rows in the **current** view (same store/`__view` as the DataFrame).
   * To restrict to a subset (e.g. one category), narrow first with `filter` or similar.
   * Omit the rank argument to use `1`. Nullish values in the sort column are sorted to the end.
   * Returns `undefined` if there are no rows or rank is out of range.
   */
  extractNthWhereSorted: ExtractNthWhereSortedMethod<Row>;

  /**
   * Sort rows by one or more columns.
   *
   * Orders rows based on column values in ascending or descending order. Multiple columns
   * create nested sorting (first by column1, then by column2, etc.). For grouped DataFrames,
   * sorting is applied within each group.
   *
   * @example
   * df.arrange("age")
   *
   * @example
   * df.arrange("age", "desc")
   *
   * @example
   * df.arrange("lastName", "firstName")
   *
   * @example
   * df.arrange(["category", "price"], ["asc", "desc"])
   *
   * @example
   * df.groupBy("category").arrange("price", "desc")
   */
  arrange: ArrangeMethod<Row>;

  /** Same as `arrange` — sort rows by one or more columns. */
  sort: ArrangeMethod<Row>;

  /**
   * Get unique combinations of specified columns (SQL DISTINCT).
   *
   * Returns a DataFrame with only the specified columns, keeping the first occurrence
   * of each unique combination. Works like SQL's `SELECT DISTINCT col1, col2 FROM table`.
   * For grouped DataFrames, uniqueness is determined within each group.
   *
   * @example
   * df.distinct("region")
   *
   * @example
   * df.distinct("category", "region")
   *
   * @example
   * df.groupBy("year").distinct("product")
   */
  distinct: DistinctMethod<Row>;

  /**
   * Rename columns in the DataFrame.
   *
   * Provide a mapping object where keys are old names and values are new column names.
   * All other columns remain unchanged. Type-safe with full autocomplete support.
   *
   * @example
   * // Rename a single column
   * df.rename({ name: "firstName" })
   *
   * @example
   * // Rename multiple columns
   * df.rename({
   *   name: "fullName",
   *   age: "yearsOld",
   *   email: "emailAddr"
   * })
   *
   * @example
   * // Works with grouped DataFrames
   * df.groupBy("category").rename({ value: "val" })
   */
  rename: RenameMethod<Row>;

  /**
   * Remove one or more columns from the DataFrame.
   *
   * Returns a new DataFrame without the specified columns. The opposite of `select()`.
   * Works with both regular and grouped DataFrames.
   *
   * @example
   * df.drop("tempColumn")
   *
   * @example
   * df.drop("col1", "col2", "col3")
   *
   * @example
   * df.groupBy("category").drop("internalId")
   */
  drop: DropMethod<Row>;

  /**
   * Reorder columns explicitly.
   *
   * Changes the order of columns according to the specified list.
   * Columns not included in the list are placed after the listed columns
   * in their original order.
   *
   * @example
   * df.reorder(["city", "name"])
   */
  reorder: ReorderMethod<Row>;

  // ---------- Joins ----------
  /**
   * Join two DataFrames, keeping only matching rows from both.
   *
   * Returns rows where the join key(s) match in both DataFrames. Non-matching rows
   * are excluded. For overlapping column names (other than join keys), use the
   * `suffixes` option to disambiguate.
   *
   * @example
   * users.innerJoin(orders, "userId")
   *
   * @example
   * df1.innerJoin(df2, ["country", "year"])
   *
   * @example
   * df1.innerJoin(df2, {
   *   keys: { left: "userId", right: "user_id" },
   *   suffixes: { left: "_user", right: "_order" },
   * })
   */
  innerJoin: InnerJoinMethod<Row>;

  /**
   * Join two DataFrames, keeping all rows from the left DataFrame.
   *
   * Every left row appears once. Where keys match, right-hand columns are filled from the
   * right DataFrame; where there is no match, those right-hand cells are `undefined`.
   * Unmatched right-only rows are dropped.
   *
   * @example
   * users.leftJoin(orders, "userId")
   *
   * @example
   * df1.leftJoin(df2, ["country", "year"])
   *
   * @example
   * df1.leftJoin(df2, {
   *   keys: { left: "userId", right: "user_id" },
   *   suffixes: { left: "_user", right: "_order" },
   * })
   */
  leftJoin: LeftJoinMethod<Row>;

  /**
   * Join two DataFrames, keeping all rows from the right DataFrame.
   *
   * Every right row appears once. Where keys match, left-hand columns are filled from the
   * left DataFrame; where there is no match, those left-hand cells are `undefined`.
   * Unmatched left-only rows are dropped.
   *
   * @example
   * users.rightJoin(orders, "userId")
   *
   * @example
   * df1.rightJoin(df2, ["country", "year"])
   *
   * @example
   * df1.rightJoin(df2, {
   *   keys: { left: "userId", right: "user_id" },
   *   suffixes: { left: "_user", right: "_order" },
   * })
   */
  rightJoin: RightJoinMethod<Row>;

  /**
   * Join two DataFrames, keeping all rows from both (full outer join).
   *
   * Returns all rows from both DataFrames. For a row that only exists on one side,
   * columns from the other side are `undefined`. This is the union of left and right joins.
   *
   * @example
   * users.outerJoin(orders, "userId")
   *
   * @example
   * df1.outerJoin(df2, ["country", "year"])
   *
   * @example
   * df1.outerJoin(df2, {
   *   keys: { left: "userId", right: "user_id" },
   *   suffixes: { left: "_user", right: "_order" },
   * })
   */
  outerJoin: OuterJoinMethod<Row>;

  /**
   * Create a Cartesian product of two DataFrames.
   *
   * Returns all possible combinations of rows from both DataFrames (left_rows × right_rows).
   * Result size grows multiplicatively — use `maxRows` to cap output when needed.
   *
   * @example
   * products.crossJoin(colors)
   *
   * @example
   * df1.crossJoin(df2, 10000)
   *
   * @example
   * df1.crossJoin(df2, undefined, { left: "_a", right: "_b" })
   */
  crossJoin: CrossJoinMethod<Row>;

  /**
   * Join DataFrames by nearest key match (as-of join).
   *
   * Joins on a sorted column (typically timestamps), matching each left row with the
   * nearest right row for the chosen direction (`backward` / `forward` / `nearest`).
   *
   * @example
   * trades.asofJoin(quotes, "timestamp")
   *
   * @example
   * events.asofJoin(logs, "time", { direction: "forward", tolerance: 1000 })
   *
   * @example
   * trades.asofJoin(quotes, "timestamp", { group_by: ["symbol"] })
   */
  asofJoin: AsofJoinMethod<Row>;

  // ---------- Grouping / Aggregation ----------
  /**
   * Group DataFrame rows by one or more columns.
   *
   * Creates a GroupedDataFrame where subsequent operations (mutate, summarise, filter, etc.)
   * are applied within each group. Groups are determined by unique combinations of the
   * specified column values.
   *
   * @example
   * df.groupBy("category")
   *
   * @example
   * df.groupBy("category", "region")
   *
   * @example
   * df.groupBy("category").summarise({
   *   avgPrice: (g) => stats.mean(g.price),
   *   count: (g) => g.nrows(),
   * })
   *
   * @example
   * df.groupBy(["category", "region"])
   */
  groupBy: GroupByMethod<Row>;

  /**
   * Synchronous summarise — always returns DataFrame.
   * Use `summariseAsync` for async aggregation functions.
   */
  summarise: SummariseMethod<Row>;

  /** Same as `summarise`. */
  summarize: SummariseMethod<Row>;

  /**
   * Async summarise — always returns PromisedDataFrame.
   * Use this when any aggregation function is async.
   */
  summariseAsync: SummariseAsyncMethod<Row>;

  /** Same as `summariseAsync`. */
  summarizeAsync: SummariseAsyncMethod<Row>;

  /**
   * Summarise across multiple columns of the same type.
   *
   * Applies aggregation functions to **entire columns** (within each group when grouped)
   * for several columns sharing a `colType`. Each `newColumns` entry must use a `prefix`;
   * new names are `{prefix}{originalColumn}`.
   */
  summariseColumns: SummariseColumnsMethod<Row>;

  /** Same as `summariseColumns`. */
  summarizeColumns: SummariseColumnsMethod<Row>;
  // crossTabulate: CrossTabulateMethod<Row>;

  /**
   * Count rows by unique combinations of column values.
   *
   * Groups by the specified columns and returns counts in a new column `count`.
   * Shorthand for `groupBy(...columns).summarise({ count: g => g.nrows() })`.
   *
   * @param column - First column name to group by
   * @param additionalColumns - Additional column names to group by
   * @returns DataFrame with grouping columns plus a `count` column
   *
   * @example
   * df.count("category")
   *
   * @example
   * df.count("category", "status")
   *
   * @example
   * const df = createDataFrame([
   *   { region: "North", product: "A" },
   *   { region: "North", product: "A" },
   *   { region: "South", product: "B" },
   * ]);
   * df.count("region", "product")
   *
   * @remarks
   * - Returns a DataFrame with the grouping columns plus a `count` column
   * - Equivalent to `groupBy(...columns).summarise({ count: g => g.nrows() })`
   * - Always groups by the given columns on the underlying row set (same as chaining
   *   `groupBy` then `summarise`); it does not add a nested grouping on top of an
   *   existing `GroupedDataFrame`
   */
  count: CountMethod<Row>;

  // ---------- Utilities ----------
  /**
   * Create boolean dummy columns from a categorical column (one-hot encoding).
   *
   * By default drops the original column, derives categories from the data (first-seen order),
   * and skips null/undefined unless `include_na: true` (then `"null"` / `"undefined"` categories).
   *
   * Options include `expected_categories`, `prefix` / `suffix`, `drop_original`, and `include_na`.
   */
  dummyCol: DummyColMethod<Row>;

  /**
   * Combine DataFrames vertically (stack rows).
   *
   * Stacks rows from multiple DataFrames, creating a union of columns. Missing columns
   * in any DataFrame become optional and filled with undefined. Columns present in multiple
   * DataFrames have their types unioned.
   *
   * @example
   * df1.bindRows(df2)
   *
   * @example
   * users.bindRows(admins)
   *
   * @example
   * df1.bindRows(df2, df3, df4)
   */
  bindRows: BindRowsMethod<Row>;
  /** @deprecated Use bindRows instead */
  bind: BindRowsMethod<Row>;

  /**
   * Resample time-series data to a different frequency.
   *
   * Supports downsampling (aggregate into larger time buckets) and upsampling (fill finer buckets).
   * The time column must be `Date` (or `Date | null`). Pass a single args object with
   * `timeColumn`, `frequency`, and `metrics` (per-column aggregators and/or fill methods).
   *
   * @example
   * df.resample({
   *   timeColumn: "timestamp",
   *   frequency: "1D",
   *   metrics: { price: stats.mean, volume: stats.sum },
   * })
   */
  resample: ResampleMethod<Row>;

  /**
   * Downsample time-series data to a lower frequency.
   *
   * Groups rows into time buckets and applies per-column aggregation functions.
   * Preserves group columns when called on a grouped DataFrame.
   */
  downsample: DownsampleMethod<Row>;

  /**
   * Upsample time-series data to a higher frequency.
   *
   * Generates a complete time sequence and fills gaps with `"forward"` or `"backward"` fill.
   *
   * @example
   * df.upsample({
   *   timeColumn: "timestamp",
   *   frequency: "1H",
   *   fillMethod: "forward",
   * })
   */
  upsample: UpsampleMethod<Row>;

  // ---------- Missing Data ----------
  /**
   * Replace null values with fixed values in specified columns.
   *
   * Only `=== null` is replaced; `undefined` is left unchanged (use `replaceUndefined` for that).
   *
   * @param mapping - Object mapping column names to replacement values
   */
  replaceNull: ReplaceNullMethod<Row>;

  /**
   * Replace undefined values with fixed values in specified columns.
   *
   * Only `undefined` is replaced; `null` is left unchanged (use `replaceNull` for that).
   *
   * @param mapping - Object mapping column names to replacement values
   */
  replaceUndefined: ReplaceUndefinedMethod<Row>;

  /** @deprecated Use replaceNull and replaceUndefined instead. */
  replaceNA: ReplaceNaMethod<Row>;

  /**
   * Forward fill null/undefined values in specified columns.
   *
   * Replaces null/undefined with the last non-nullish value before them.
   *
   * @remarks
   * - Only fills null and undefined (preserves `0`, `false`, `""`)
   * - Leading nullish values stay nullish
   * - Creates a new DataFrame; walks rows in current view order (not group-aware)
   */
  fillForward: FillForwardMethod<Row>;

  /**
   * Backward fill null/undefined values in specified columns.
   *
   * Replaces null/undefined with the next non-nullish value after them.
   *
   * @remarks
   * - Only fills null and undefined (preserves `0`, `false`, `""`)
   * - Trailing nullish values stay nullish
   * - Creates a new DataFrame; walks rows in current view order (not group-aware)
   */
  fillBackward: FillBackwardMethod<Row>;

  /**
   * Interpolate null/undefined values in a column using linear or spline interpolation.
   * Requires an x-axis column to define spacing between points.
   *
   * @example
   * df.interpolate("value", "timestamp", "linear")
   *
   * @remarks
   * - Only fills gaps when both neighboring known values exist (null and undefined count as missing)
   * - Leading/trailing missing values stay missing (still `null` in the output array)
   * - Spline needs enough points; otherwise the implementation falls back to linear
   */
  interpolate: InterpolateMethod;

  /** @deprecated Use removeNull and removeUndefined, or filter, instead. */
  removeNA: RemoveNAMethod<Row>;

  /**
   * Remove rows where any listed field is `null` (`=== null`).
   * Narrows the row type to exclude `null` on those keys. `undefined` is not removed.
   */
  removeNull: RemoveNullMethod<Row>;

  /** Same behavior as `removeNull` (alias). */
  removeNulls: RemoveNullMethod<Row>;

  /**
   * Remove rows where any listed field is `undefined`.
   * Narrows the row type to exclude `undefined` on those keys. `null` is not removed.
   */
  removeUndefined: RemoveUndefinedMethod<Row>;

  // ---------- Convenience Verbs ----------
  /**
   * Append rows to the end of the DataFrame.
   * Accepts another DataFrame, a single row, an array of rows, or multiple row arguments.
   */
  append: AppendMethod<Row>;

  /**
   * Prepend rows to the beginning of the DataFrame.
   * Accepts another DataFrame, a single row, an array of rows, or multiple row arguments.
   */
  prepend: PrependMethod<Row>;

  /**
   * Randomize row order (Fisher–Yates). Optional `seed` for reproducibility.
   *
   * @remarks
   * - Returns a new DataFrame
   * - On grouped DataFrames, shuffles within each group and preserves grouping
   */
  shuffle: ShuffleMethod<Row>;

  // ---------- Pivoting ----------
  /**
   * Pivot DataFrame from long to wide format.
   *
   * Spreads key-value pairs from rows into multiple columns; optional `valuesFn` aggregates
   * multiple values per cell.
   */
  pivotWider: PivotWiderMethod<Row>;

  /**
   * Pivot DataFrame from wide to long format.
   *
   * Gathers selected columns into name/value columns (`namesTo`, `valuesTo`).
   */
  pivotLonger: PivotLongerMethod<Row>;

  /**
   * Transpose rows and columns using internal row-label metadata for a reversible result.
   *
   * Call as `transpose({ numberOfRows })` with the current row count (used for typing the
   * `row_0`, `row_1`, … columns when no row labels are set).
   *
   * If row labels exist (`setRowLabels`), their values become new column names; otherwise
   * new columns follow the `row_*` pattern. The result stores original column names in row-label metadata.
   */
  transpose: TransposeMethod<Row>;

  /**
   * Unnest one array column: one output row per non-empty array element; other columns are repeated.
   *
   * An empty array keeps a single row with `null` in that column. The type definitions also
   * describe a multi-column overload; the current runtime implementation accepts one column name.
   */
  unnest: UnnestMethod<Row>;

  // ---------- Slicing ----------
  /**
   * Extract rows by index range.
   *
   * Returns rows from start (inclusive) to end (exclusive), like `Array.prototype.slice`.
   * Negative indices count from the end. On grouped DataFrames, slicing applies within each group.
   *
   * @example
   * df.slice(0, 5)
   *
   * @example
   * df.slice(10, 20)
   *
   * @example
   * df.slice(-3)
   *
   * @example
   * df.groupBy("category").slice(0, 5)
   */
  slice: SliceRowsMethod<Row>;

  /**
   * Get the first N rows.
   *
   * On grouped DataFrames, takes the first N rows from each group.
   *
   * @example
   * df.sliceHead(10)
   *
   * @example
   * df.groupBy("category").sliceHead(3)
   */
  sliceHead: SliceHeadMethod<Row>;

  /**
   * Get the last N rows.
   *
   * On grouped DataFrames, takes the last N rows from each group.
   *
   * @example
   * df.sliceTail(5)
   *
   * @example
   * df.groupBy("category").sliceTail(2)
   */
  sliceTail: SliceTailMethod<Row>;

  /**
   * Get rows with the smallest values in a column.
   *
   * On grouped DataFrames, takes the N smallest rows per group.
   *
   * @example
   * df.sliceMin("price", 5)
   *
   * @example
   * df.groupBy("category").sliceMin("price", 3)
   */
  sliceMin: SliceMinMethod<Row>;

  /**
   * Get rows with the largest values in a column.
   *
   * On grouped DataFrames, takes the N largest rows per group.
   */
  sliceMax: SliceMaxMethod<Row>;

  /**
   * Random sample of N rows (without replacement within the sampled pool).
   *
   * Optional numeric `seed` for reproducibility. On grouped DataFrames, samples N rows per group.
   *
   * @example
   * df.sliceSample(10)
   *
   * @example
   * df.sliceSample(10, 42)
   *
   * @example
   * df.groupBy("category").sliceSample(5)
   */
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
  /**
   * Synchronous row iteration — returns the same DataFrame (or GroupedDataFrame).
   * Use `forEachRowAsync` when the callback is async.
   */
  forEach: ForEachRowMethod<Row>;
  /** @deprecated Use forEach instead */
  forEachRow: ForEachRowMethod<Row>;

  /**
   * Async row iteration — returns a Promise of the same DataFrame or GroupedDataFrame.
   */
  forEachRowAsync: ForEachRowAsyncMethod<Row>;

  /**
   * Synchronous column iteration — callback receives each column name and the DataFrame.
   * Use `forEachColAsync` for async callbacks.
   */
  forEachCol: ForEachColMethod<Row>;

  /**
   * Async column iteration — returns a Promise of the same DataFrame or GroupedDataFrame.
   */
  forEachColAsync: ForEachColAsyncMethod<Row>;

  // ---------- Grouping ----------
  /**
   * Remove grouping from a GroupedDataFrame.
   *
   * Returns a regular DataFrame with the same data but no group structure.
   * On an already ungrouped DataFrame, this is a no-op.
   *
   * @example
   * df.groupBy("category").summarise({ total: (g) => stats.sum(g.value) }).ungroup()
   *
   * @example
   * df.groupBy("region")
   *   .summarise({ count: (g) => g.nrows() })
   *   .ungroup()
   *   .arrange("count", "desc")
   */
  ungroup: UngroupMethod<Row>;

  // ---------- Row Labels ----------
  /**
   * Set row labels (string or number) for each row — same length as the DataFrame.
   * Used by `loc` and by `transpose()` when building column names. `iloc` delegates to
   * `loc` and also expects row labels (despite the name).
   */
  setRowLabels: SetRowLabelsMethod<Row>;

  getRowLabels(): RowLabel[];

  loc(label: RowLabel): Row | undefined;

  iloc(labels: RowLabel[]): this;

  // ---------- Tracing ----------
  getTrace(): unknown[];

  printTrace(): void;
}

/**
 * DataFrame with column accessors — used at API boundaries (createDataFrame)
 * where consumers access df.colName directly. Internal method signatures use
 * the DataFrame interface (cached) rather than this intersection (uncached).
 */
export type DataFrame<Row extends object = object> =
  & DataFrameBase<Row>
  & DataFrameColumns<Row>;

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
  __groups: {
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
