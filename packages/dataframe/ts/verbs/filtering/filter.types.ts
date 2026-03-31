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

/**
 * Filter rows based on one or more predicates.
 *
 * Returns rows where all predicates evaluate to true. Supports both synchronous and
 * asynchronous predicates, boolean arrays, and multiple predicates with AND logic.
 * Null and undefined predicate results are treated as false.
 *
 * @param filterPredicates - One or more predicates to filter rows. Can be:
 *   - A function `(row, index, df) => boolean` that returns true to keep the row
 *   - An async function for dynamic filtering (e.g., API calls, database lookups)
 *   - Multiple predicates (combined with AND logic)
 *
 * @returns A new DataFrame containing only rows that match all predicates.
 *   For async predicates, returns a PromisedDataFrame. For grouped DataFrames,
 *   filtering is applied within each group.
 *
 * @example
 * // Basic filtering with a predicate function
 * df.filter(row => row.age > 18)
 *
 * @example
 * // Multiple predicates (AND logic)
 * df.filter(
 *   row => row.age > 18,
 *   row => row.status === "active"
 * )
 *
 * @example
 * // Async filtering with concurrency control
 * await df.filter(
 *   async (row) => await validateUser(row.id),
 *   { concurrency: 10 }
 * )
 *
 * @example
 * // Type narrowing with type predicates
 * const filtered = df.filter((row): row is Row & { age: number } =>
 *   typeof row.age === 'number'
 * )
 */
export type FilterRowsMethod<Row extends object> = {
  // ── Boolean array predicate (always sync) ──────────────────────────────
  // No Row in contravariant position — unchanged.
  (
    pred: readonly (boolean | null | undefined)[],
  ): DataFrame<RowAfterFilter<Row>>;

  // ── With concurrency options (forces async) ────────────────────────────
  // R inferred from `this` removes Row from contravariant callback position.
  <R extends object>(
    this: DataFrame<R>,
    predicate: (
      row: R,
      index: number,
      df: DataFrame<R>,
    ) => Promise<boolean | null | undefined> | boolean | null | undefined,
    options: ConcurrencyOptions,
  ): PromisedDataFrame<RowAfterFilter<R>>;

  // ── Grouped DataFrame with async detection ──────────────────────────────
  // R inferred from `this` replaces Row in AsyncRowFilter callbacks.
  <R extends object, GroupName extends keyof R, Preds extends readonly AsyncRowFilter<R>[]>(
    this: GroupedDataFrame<R, GroupName>,
    ...filterPredicates: Preds
  ): AnyPredicateIsAsync<Preds> extends true
    ? PromisedGroupedDataFrame<RowAfterFilter<R>, GroupName>
    : GroupedDataFrame<RowAfterFilter<R>, GroupName>;

  // ── Regular DataFrame with async detection ──────────────────────────────
  // R inferred from `this` replaces Row in AsyncRowFilter callbacks.
  <R extends object, Preds extends readonly AsyncRowFilter<R>[]>(
    this: DataFrame<R>,
    ...filterPredicates: Preds
  ): AnyPredicateIsAsync<Preds> extends true
    ? PromisedDataFrame<RowAfterFilter<R>>
    : DataFrame<RowAfterFilter<R>>;

  // ── Type predicate support (explicit narrowing) ────────────────────────
  // R inferred from `this` removes Row from contravariant callback position.
  <R extends object, Narrowed extends R>(
    this: DataFrame<R>,
    predicate: (row: R, index: number, df: DataFrame<R>) => row is Narrowed,
  ): DataFrame<Narrowed>;
};
