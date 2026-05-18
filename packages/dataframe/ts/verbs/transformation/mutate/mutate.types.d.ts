import type { DataFrame, GroupedDataFrame } from "../../../dataframe/index.ts";
import type { PromisedDataFrame, PromisedGroupedDataFrame } from "../../../promised-dataframe/index.ts";
import type { ConcurrencyOptions } from "../../../promised-dataframe/concurrency-utils.ts";
/**
 * Column value types for mutate:
 * - function of (row, idx, df)
 * - array (length = df.length)
 * - scalar value (recycled)
 * - null for deletion
 */
export type ColumnValue<Row extends object> = ((row: Row, idx: number, df: DataFrame<Row>) => unknown) | unknown[] | null;
/**
 * Assignments for mutate: per-column expression (fn | array | scalar | null)
 */
export type MutateAssignments<Row extends object> = Record<string, ColumnValue<Row>>;
/** Return type for a single column value. */
export type ColumnValueResult<Row extends object, Value> = Value extends (row: Row, idx?: number, df?: DataFrame<Row>) => infer Result ? Result : Value extends (...args: any[]) => infer Result ? Result : Value extends readonly (infer Element)[] ? Element : Value extends null ? never : Value;
/**
 * NotAPromise<T> — resolves to `true` when T is definitely not a Promise.
 *
 * Uses `[Awaited<T>] extends [T]` instead of `T extends Promise<any>`:
 * - For `Promise<X>`:  Awaited = X, and [X] does NOT extend [Promise<X>] → false
 * - For `number`:      Awaited = number, and [number] extends [number] → true
 * - For generic `T[K]`: Awaited<T[K]> resolves and extends T[K] → true
 *
 * The key advantage: `T extends Promise<any>` defers on generic type params
 * (TS issue #52144), but `[Awaited<T>] extends [T]` resolves even for generics.
 */
type NotAPromise<T> = [Awaited<T>] extends [T] ? true : false;
/**
 * Maps each function property to `never` if it returns a Promise.
 * Used as `Formulas & AllSync<Formulas>` on mutate() formula overloads to reject
 * async functions at compile time. For concrete async returns (Promise<X>), the
 * property becomes `never` → type error. For generic returns (T[K]), the conditional
 * defers — but that's harmless because mutate() always returns DataFrame regardless.
 */
type AllSync<F> = {
    [K in keyof F]: F[K] extends (...args: any[]) => infer R ? NotAPromise<R> extends true ? F[K] : never : F[K];
};
/**
 * Synchronous mutate — always returns DataFrame or GroupedDataFrame.
 *
 * Async formulas are rejected at compile time via AllSync on function overloads.
 * Use `mutateAsync` for async formulas.
 *
 * Row composition rule (inlined everywhere in this file as a single mapped type
 * — no Prettify needed because inline mapped types display flat in hover):
 *
 *   Result = {
 *     [K in keyof R | keyof A]:
 *       K extends keyof A ? ColumnValueResult<R, A[K]>
 *         : K extends keyof R ? R[K]
 *         : never;
 *   }
 *
 * Uses a single mapped type over `keyof R | keyof A` rather than the older
 * `Omit<R, ...> & { ... }` pattern. The Omit + intersection pattern produces
 * deferred `Exclude<keyof T, ...>` types when R is a generic type parameter,
 * which blocks key assignability checks (e.g., `.select("id")` after `.mutate(...)`
 * failing because TS can't prove "id" is in `Exclude<keyof T, ...>`). The single
 * mapped type gives `keyof Result = keyof R | keyof A` directly.
 */
export interface MutateMethod<Row extends object> {
    <R extends object, GroupName extends keyof R, Formulas extends Record<string, (row: R, idx: number, df: DataFrame<R>) => unknown>>(this: GroupedDataFrame<R, GroupName>, formulas: Formulas & AllSync<Formulas>): GroupedDataFrame<{
        [K in keyof R | keyof Formulas]: K extends keyof Formulas ? ColumnValueResult<R, Formulas[K]> : K extends keyof R ? R[K] : never;
    }, Extract<GroupName, keyof R | keyof Formulas>>;
    <R extends object, Formulas extends Record<string, (row: R, idx: number, df: DataFrame<R>) => unknown>>(this: DataFrame<R>, formulas: Formulas & AllSync<Formulas>): DataFrame<{
        [K in keyof R | keyof Formulas]: K extends keyof Formulas ? ColumnValueResult<R, Formulas[K]> : K extends keyof R ? R[K] : never;
    }>;
    <R extends object, GroupName extends keyof R, Formulas extends Record<string, (row: R, idx: number, df: DataFrame<R>) => unknown>>(this: GroupedDataFrame<R, GroupName>, formulas: Formulas): GroupedDataFrame<{
        [K in keyof R | keyof Formulas]: K extends keyof Formulas ? ColumnValueResult<R, Formulas[K]> : K extends keyof R ? R[K] : never;
    }, Extract<GroupName, keyof R | keyof Formulas>>;
    <R extends object, Formulas extends Record<string, (row: R, idx: number, df: DataFrame<R>) => unknown>>(this: DataFrame<R>, formulas: Formulas): DataFrame<{
        [K in keyof R | keyof Formulas]: K extends keyof Formulas ? ColumnValueResult<R, Formulas[K]> : K extends keyof R ? R[K] : never;
    }>;
    <R extends object, GroupName extends keyof R, Assignments extends Record<string, ColumnValue<R>>>(this: GroupedDataFrame<R, GroupName>, assignments: Assignments): GroupedDataFrame<{
        [K in keyof R | keyof Assignments]: K extends keyof Assignments ? ColumnValueResult<R, Assignments[K]> : K extends keyof R ? R[K] : never;
    }, Extract<GroupName, keyof R | keyof Assignments>>;
    <R extends object, GroupName extends keyof R, Assignments extends {
        [key: string]: ((row: R, idx: number, df: DataFrame<R>) => unknown) | readonly unknown[] | null;
    }>(this: GroupedDataFrame<R, GroupName>, assignments: Assignments): GroupedDataFrame<{
        [K in keyof R | keyof Assignments]: K extends keyof Assignments ? ColumnValueResult<R, Assignments[K]> : K extends keyof R ? R[K] : never;
    }, Extract<GroupName, keyof R | keyof Assignments>>;
    <R extends object, Assignments extends {
        [key: string]: ((row: R, idx: number, df: DataFrame<R>) => unknown) | readonly unknown[] | null;
    }>(this: DataFrame<R>, assignments: Assignments): DataFrame<{
        [K in keyof R | keyof Assignments]: K extends keyof Assignments ? ColumnValueResult<R, Assignments[K]> : K extends keyof R ? R[K] : never;
    }>;
    <R extends object, Assignments extends Record<string, ColumnValue<R>>>(this: DataFrame<R>, assignments: Assignments): DataFrame<{
        [K in keyof R | keyof Assignments]: K extends keyof Assignments ? ColumnValueResult<R, Assignments[K]> : K extends keyof R ? R[K] : never;
    }>;
    <R extends object, Assignments extends Record<string, any>>(this: DataFrame<R>, assignments: Assignments): DataFrame<{
        [K in keyof R | keyof Assignments]: K extends keyof Assignments ? ColumnValueResult<R, Assignments[K]> : K extends keyof R ? R[K] : never;
    }>;
}
/**
 * Async mutate — always returns PromisedDataFrame or PromisedGroupedDataFrame.
 *
 * Use this when any formula is async (returns a Promise).
 * Supports optional concurrency control.
 *
 * Row composition rule (Awaited variant, inlined everywhere — single mapped
 * type, no Prettify needed):
 *
 *   Result = {
 *     [K in keyof R | keyof A]:
 *       K extends keyof A ? Awaited<ColumnValueResult<R, A[K]>>
 *         : K extends keyof R ? R[K]
 *         : never;
 *   }
 */
export interface MutateAsyncMethod<Row extends object> {
    <R extends object, GroupName extends keyof R, Formulas extends Record<string, (row: R, idx: number, df: DataFrame<R>) => unknown>>(this: GroupedDataFrame<R, GroupName>, formulas: Formulas, options?: ConcurrencyOptions): PromisedGroupedDataFrame<{
        [K in keyof R | keyof Formulas]: K extends keyof Formulas ? Awaited<ColumnValueResult<R, Formulas[K]>> : K extends keyof R ? R[K] : never;
    }, Extract<GroupName, keyof R | keyof Formulas>>;
    <R extends object, Formulas extends Record<string, (row: R, idx: number, df: DataFrame<R>) => unknown>>(this: DataFrame<R>, formulas: Formulas, options?: ConcurrencyOptions): PromisedDataFrame<{
        [K in keyof R | keyof Formulas]: K extends keyof Formulas ? Awaited<ColumnValueResult<R, Formulas[K]>> : K extends keyof R ? R[K] : never;
    }>;
    <R extends object, GroupName extends keyof R, Assignments extends Record<string, ColumnValue<R>>>(this: GroupedDataFrame<R, GroupName>, assignments: Assignments, options?: ConcurrencyOptions): PromisedGroupedDataFrame<{
        [K in keyof R | keyof Assignments]: K extends keyof Assignments ? Awaited<ColumnValueResult<R, Assignments[K]>> : K extends keyof R ? R[K] : never;
    }, Extract<GroupName, keyof R | keyof Assignments>>;
    <R extends object, Assignments extends Record<string, ColumnValue<R>>>(this: DataFrame<R>, assignments: Assignments, options?: ConcurrencyOptions): PromisedDataFrame<{
        [K in keyof R | keyof Assignments]: K extends keyof Assignments ? Awaited<ColumnValueResult<R, Assignments[K]>> : K extends keyof R ? R[K] : never;
    }>;
}
export {};
