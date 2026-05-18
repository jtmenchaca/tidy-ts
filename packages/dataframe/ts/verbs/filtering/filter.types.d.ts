import type { DataFrame, GroupedDataFrame } from "../../dataframe/index.ts";
import type { PromisedDataFrame, PromisedGroupedDataFrame } from "../../promised-dataframe/index.ts";
import type { ConcurrencyOptions } from "../../promised-dataframe/concurrency-utils.ts";
type RowFilter<Row extends object> = ((row: Row, index: number, df: DataFrame<Row>) => boolean | null | undefined) | readonly (boolean | null | undefined)[];
type AsyncRowFilter<Row extends object> = ((row: Row, index: number, df: DataFrame<Row>) => Promise<boolean | null | undefined> | boolean | null | undefined) | readonly (boolean | null | undefined)[];
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
/**
 * Synchronous filter — always returns DataFrame or GroupedDataFrame.
 * Use `filterAsync` for async predicates.
 *
 * Filter preserves row shape — values change, shape doesn't.
 */
export type FilterRowsMethod<Row extends object> = {
    <R extends object, Narrowed extends R>(this: DataFrame<R>, predicate: (row: R, index: number, df: DataFrame<R>) => row is Narrowed): DataFrame<Narrowed>;
    (pred: readonly (boolean | null | undefined)[]): DataFrame<Row>;
    <R extends object, GroupName extends keyof R, Preds extends readonly RowFilter<R>[]>(this: GroupedDataFrame<R, GroupName>, ...filterPredicates: Preds): GroupedDataFrame<R, GroupName>;
    <R extends object, Preds extends readonly RowFilter<R>[]>(this: DataFrame<R>, ...filterPredicates: Preds): DataFrame<R>;
};
/**
 * Async filter — always returns PromisedDataFrame or PromisedGroupedDataFrame.
 * Use this when any predicate is async (returns a Promise).
 * Supports optional concurrency control.
 */
export type FilterAsyncMethod<Row extends object> = {
    <R extends object>(this: DataFrame<R>, predicate: (row: R, index: number, df: DataFrame<R>) => Promise<boolean | null | undefined> | boolean | null | undefined, options: ConcurrencyOptions): PromisedDataFrame<R>;
    <R extends object, GroupName extends keyof R, Preds extends readonly AsyncRowFilter<R>[]>(this: GroupedDataFrame<R, GroupName>, ...filterPredicates: Preds): PromisedGroupedDataFrame<R, GroupName>;
    <R extends object, Preds extends readonly AsyncRowFilter<R>[]>(this: DataFrame<R>, ...filterPredicates: Preds): PromisedDataFrame<R>;
};
export {};
