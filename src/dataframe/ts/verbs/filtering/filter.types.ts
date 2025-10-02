import type {
  DataFrame,
  GroupedDataFrame,
  Prettify,
} from "../../dataframe/index.ts";
import type {
  AnyPredicateIsAsync,
  PromisedDataFrame,
  PromisedGroupedDataFrame,
} from "../../promised-dataframe/index.ts";
import type { ConcurrencyOptions } from "../../promised-dataframe/concurrency-utils.ts";

type RowFilter<Row extends object> =
  | ((
    row: Row,
    index: number,
    df: DataFrame<Row>,
  ) => boolean | null | undefined)
  | readonly (boolean | null | undefined)[];

// Async version that allows Promise returns
type AsyncRowFilter<Row extends object> =
  | ((
    row: Row,
    index: number,
    df: DataFrame<Row>,
  ) => Promise<boolean | null | undefined> | boolean | null | undefined)
  | readonly (boolean | null | undefined)[];

// ============================================================================
// Type Predicate Support - Leveraging TypeScript's Built-in Narrowing
// ============================================================================

/**
 * Support for explicit type predicates in filter operations.
 *
 * While we cannot automatically detect function body patterns at compile time,
 * we can support explicit type predicates using TypeScript's built-in syntax:
 *
 * @example
 * const result = df.filter((row): row is RowType & { prop: NonNullable<RowType['prop']> } =>
 *   row.prop !== undefined
 * );
 *
 * For now, filtering preserves the original row shape unless explicit type predicates are used.
 * Future enhancements could leverage runtime pattern detection for common cases.
 */

/** Filtering preserves row shape (values change, shape doesn't). */
export type RowAfterFilter<Row extends object> = Prettify<Row>;

export type FilterRowsMethod<Row extends object> = {
  // ── Boolean array predicate (always sync) ──────────────────────────────
  (
    pred: readonly (boolean | null | undefined)[],
  ): DataFrame<RowAfterFilter<Row>>;

  // ── With concurrency options (forces async) ────────────────────────────
  (
    predicate: (
      row: Row,
      index: number,
      df: DataFrame<Row>,
    ) => Promise<boolean | null | undefined> | boolean | null | undefined,
    options: ConcurrencyOptions,
  ): PromisedDataFrame<RowAfterFilter<Row>>;

  // ── Grouped DataFrame with async detection ──────────────────────────────
  <GroupName extends keyof Row, Preds extends readonly AsyncRowFilter<Row>[]>(
    this: GroupedDataFrame<Row, GroupName>,
    ...filterPredicates: Preds
  ): AnyPredicateIsAsync<Preds> extends true
    ? PromisedGroupedDataFrame<RowAfterFilter<Row>, GroupName>
    : GroupedDataFrame<RowAfterFilter<Row>, GroupName>;

  // ── Regular DataFrame with async detection ──────────────────────────────
  <Preds extends readonly AsyncRowFilter<Row>[]>(
    ...filterPredicates: Preds
  ): AnyPredicateIsAsync<Preds> extends true
    ? PromisedDataFrame<RowAfterFilter<Row>>
    : DataFrame<RowAfterFilter<Row>>;
} & TypePredicateFilterMethods<Row>;

// Separate interface for type predicate support
interface TypePredicateFilterMethods<Row extends object> {
  // ── Type predicate support (explicit narrowing) ────────────────────────
  <Narrowed extends Row>(
    predicate: (row: Row, index: number, df: DataFrame<Row>) => row is Narrowed,
  ): DataFrame<Narrowed>;
}
