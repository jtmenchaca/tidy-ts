import type {
  DataFrame,
  GroupedDataFrame,
  Prettify,
} from "../../dataframe/index.ts";
import type {
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

/**
 * Synchronous filter — always returns DataFrame or GroupedDataFrame.
 * Use `filterAsync` for async predicates.
 */
export type FilterRowsMethod<Row extends object> = {
  // ── Boolean array predicate (always sync) ──────────────────────────────
  (
    pred: readonly (boolean | null | undefined)[],
  ): DataFrame<RowAfterFilter<Row>>;

  // ── Grouped DataFrame — sync predicates ───────────────────────────────
  <R extends object, GroupName extends keyof R, Preds extends readonly RowFilter<R>[]>(
    this: GroupedDataFrame<R, GroupName>,
    ...filterPredicates: Preds
  ): GroupedDataFrame<RowAfterFilter<R>, GroupName>;

  // ── Regular DataFrame — sync predicates ───────────────────────────────
  <R extends object, Preds extends readonly RowFilter<R>[]>(
    this: DataFrame<R>,
    ...filterPredicates: Preds
  ): DataFrame<RowAfterFilter<R>>;

  // ── Type predicate support (explicit narrowing) ────────────────────────
  <R extends object, Narrowed extends R>(
    this: DataFrame<R>,
    predicate: (row: R, index: number, df: DataFrame<R>) => row is Narrowed,
  ): DataFrame<Narrowed>;
};

/**
 * Async filter — always returns PromisedDataFrame or PromisedGroupedDataFrame.
 * Use this when any predicate is async (returns a Promise).
 * Supports optional concurrency control.
 */
export type FilterAsyncMethod<Row extends object> = {
  // ── With concurrency options ────────────────────────────────────────────
  <R extends object>(
    this: DataFrame<R>,
    predicate: (
      row: R,
      index: number,
      df: DataFrame<R>,
    ) => Promise<boolean | null | undefined> | boolean | null | undefined,
    options: ConcurrencyOptions,
  ): PromisedDataFrame<RowAfterFilter<R>>;

  // ── Grouped DataFrame — async predicates ──────────────────────────────
  <R extends object, GroupName extends keyof R, Preds extends readonly AsyncRowFilter<R>[]>(
    this: GroupedDataFrame<R, GroupName>,
    ...filterPredicates: Preds
  ): PromisedGroupedDataFrame<RowAfterFilter<R>, GroupName>;

  // ── Regular DataFrame — async predicates ──────────────────────────────
  <R extends object, Preds extends readonly AsyncRowFilter<R>[]>(
    this: DataFrame<R>,
    ...filterPredicates: Preds
  ): PromisedDataFrame<RowAfterFilter<R>>;
};
