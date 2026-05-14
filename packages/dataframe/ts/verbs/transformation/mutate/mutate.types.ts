// packages/dataframe/ts/types/verbs/mutate.ts
import type {
  DataFrame,
  GroupedDataFrame,
  Prettify,
} from "../../../dataframe/index.ts";
import type {
  PromisedDataFrame,
  PromisedGroupedDataFrame,
} from "../../../promised-dataframe/index.ts";
import type { ConcurrencyOptions } from "../../../promised-dataframe/concurrency-utils.ts";

/**
 * Column value types for mutate:
 * - function of (row, idx, df)
 * - array (length = df.length)
 * - scalar value (recycled)
 * - null for deletion
 */
export type ColumnValue<Row extends object> =
  | ((row: Row, idx: number, df: DataFrame<Row>) => unknown)
  | unknown[]
  | null;

/**
 * Assignments for mutate: per-column expression (fn | array | scalar | null)
 */
export type MutateAssignments<Row extends object> = Record<
  string,
  ColumnValue<Row>
>;

/** Return type for a single column value. */
export type ColumnValueResult<
  Row extends object,
  Value,
> =
  // 1) Prefer our canonical (row, idx?, df?) function shape
  Value extends (row: Row, idx?: number, df?: DataFrame<Row>) => infer Result
    ? Result
    // 2) Fallback: *any* function collapses to its return type
    // deno-lint-ignore no-explicit-any
    : Value extends (...args: any[]) => infer Result ? Result
    // 3) Array literal → element type
    : Value extends readonly (infer Element)[] ? Element
    // 4) null deletes the column
    : Value extends null ? never
    // 5) Scalar literal → itself
    : Value;

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
  // deno-lint-ignore no-explicit-any
  [K in keyof F]: F[K] extends (...args: any[]) => infer R
    ? NotAPromise<R> extends true ? F[K] : never
    : F[K];
};

/**
 * Synchronous mutate — always returns DataFrame or GroupedDataFrame.
 *
 * Async formulas are rejected at compile time via AllSync on function overloads.
 * Use `mutateAsync` for async formulas.
 *
 * Row composition rule (inlined everywhere in this file):
 *   Result = Prettify<
 *     & { [K in keyof R as K extends keyof A ? never : K]: R[K] }
 *     & { [K in keyof A]: ColumnValueResult<R, A[K]> }
 *   >
 *
 * Uses a single mapped type over `keyof Row | keyof Assignments` instead of
 * `Omit<Row, ...> & { ... }`. The Omit + intersection pattern produces deferred
 * `Exclude<keyof T, ...>` types when Row is a generic type parameter, which blocks
 * key assignability checks (e.g., `.select("id")` after `.mutate(...)` fails because
 * TS can't prove "id" is in `Exclude<keyof T, ...>`). The single mapped type gives
 * `keyof Result = keyof Row | keyof Assignments` directly, which TS can resolve.
 */
export interface MutateMethod<Row extends object> {
  // ══════════════════════════════════════════════════════════════════════════
  // Function formula overloads use AllSync to reject async at compile time.
  // AllSync defers on generic indexed access types (T[K]) — but that's fine
  // because the return type is always DataFrame, so deferral is harmless.
  // ══════════════════════════════════════════════════════════════════════════

  // ── Grouped — function formulas (AllSync guard) ─────────────────────────
  <
    R extends object,
    GroupName extends keyof R,
    Formulas extends Record<
      string,
      (row: R, idx: number, df: DataFrame<R>) => unknown
    >,
  >(
    this: GroupedDataFrame<R, GroupName>,
    formulas: Formulas & AllSync<Formulas>,
  ): GroupedDataFrame<
    Prettify<
      & { [K in keyof R as K extends keyof Formulas ? never : K]: R[K] }
      & { [K in keyof Formulas]: ColumnValueResult<R, Formulas[K]> }
    >,
    Extract<
      GroupName,
      keyof (
        & { [K in keyof R as K extends keyof Formulas ? never : K]: R[K] }
        & { [K in keyof Formulas]: ColumnValueResult<R, Formulas[K]> }
      )
    >
  >;

  // ── Ungrouped — function formulas (AllSync guard) ───────────────────────
  <
    R extends object,
    Formulas extends Record<
      string,
      (row: R, idx: number, df: DataFrame<R>) => unknown
    >,
  >(
    this: DataFrame<R>,
    formulas: Formulas & AllSync<Formulas>,
  ): DataFrame<
    Prettify<
      & { [K in keyof R as K extends keyof Formulas ? never : K]: R[K] }
      & { [K in keyof Formulas]: ColumnValueResult<R, Formulas[K]> }
    >
  >;

  // ── Grouped — function formulas (no AllSync, catches generic deferral) ──
  <
    R extends object,
    GroupName extends keyof R,
    Formulas extends Record<
      string,
      (row: R, idx: number, df: DataFrame<R>) => unknown
    >,
  >(
    this: GroupedDataFrame<R, GroupName>,
    formulas: Formulas,
  ): GroupedDataFrame<
    Prettify<
      & { [K in keyof R as K extends keyof Formulas ? never : K]: R[K] }
      & { [K in keyof Formulas]: ColumnValueResult<R, Formulas[K]> }
    >,
    Extract<
      GroupName,
      keyof (
        & { [K in keyof R as K extends keyof Formulas ? never : K]: R[K] }
        & { [K in keyof Formulas]: ColumnValueResult<R, Formulas[K]> }
      )
    >
  >;

  // ── Ungrouped — function formulas (no AllSync, catches generic deferral) ─
  <
    R extends object,
    Formulas extends Record<
      string,
      (row: R, idx: number, df: DataFrame<R>) => unknown
    >,
  >(
    this: DataFrame<R>,
    formulas: Formulas,
  ): DataFrame<
    Prettify<
      & { [K in keyof R as K extends keyof Formulas ? never : K]: R[K] }
      & { [K in keyof Formulas]: ColumnValueResult<R, Formulas[K]> }
    >
  >;

  // ── Grouped — mixed assignments (functions | arrays | scalars | null) ────
  <
    R extends object,
    GroupName extends keyof R,
    Assignments extends Record<string, ColumnValue<R>>,
  >(
    this: GroupedDataFrame<R, GroupName>,
    assignments: Assignments,
  ): GroupedDataFrame<
    Prettify<
      & { [K in keyof R as K extends keyof Assignments ? never : K]: R[K] }
      & { [K in keyof Assignments]: ColumnValueResult<R, Assignments[K]> }
    >,
    Extract<
      GroupName,
      keyof (
        & { [K in keyof R as K extends keyof Assignments ? never : K]: R[K] }
        & { [K in keyof Assignments]: ColumnValueResult<R, Assignments[K]> }
      )
    >
  >;

  // ── Grouped — mixed without scalars (functions | arrays | null) ──────────
  <
    R extends object,
    GroupName extends keyof R,
    Assignments extends {
      [key: string]:
        | ((row: R, idx: number, df: DataFrame<R>) => unknown)
        | readonly unknown[]
        | null;
    },
  >(
    this: GroupedDataFrame<R, GroupName>,
    assignments: Assignments,
  ): GroupedDataFrame<
    Prettify<
      & { [K in keyof R as K extends keyof Assignments ? never : K]: R[K] }
      & { [K in keyof Assignments]: ColumnValueResult<R, Assignments[K]> }
    >,
    Extract<
      GroupName,
      keyof (
        & { [K in keyof R as K extends keyof Assignments ? never : K]: R[K] }
        & { [K in keyof Assignments]: ColumnValueResult<R, Assignments[K]> }
      )
    >
  >;

  // ── Ungrouped — mixed without scalars (functions | arrays | null) ────────
  <
    R extends object,
    Assignments extends {
      [key: string]:
        | ((row: R, idx: number, df: DataFrame<R>) => unknown)
        | readonly unknown[]
        | null;
    },
  >(
    this: DataFrame<R>,
    assignments: Assignments,
  ): DataFrame<
    Prettify<
      & { [K in keyof R as K extends keyof Assignments ? never : K]: R[K] }
      & { [K in keyof Assignments]: ColumnValueResult<R, Assignments[K]> }
    >
  >;

  // ── Ungrouped — mixed assignments (functions | arrays | scalars | null) ──
  <R extends object, Assignments extends Record<string, ColumnValue<R>>>(
    this: DataFrame<R>,
    assignments: Assignments,
  ): DataFrame<
    Prettify<
      & { [K in keyof R as K extends keyof Assignments ? never : K]: R[K] }
      & { [K in keyof Assignments]: ColumnValueResult<R, Assignments[K]> }
    >
  >;

  // ── Ungrouped — broadest fallback (includes scalars) ────────────────────
  // deno-lint-ignore no-explicit-any
  <R extends object, Assignments extends Record<string, any>>(
    this: DataFrame<R>,
    assignments: Assignments,
  ): DataFrame<
    Prettify<
      & { [K in keyof R as K extends keyof Assignments ? never : K]: R[K] }
      & { [K in keyof Assignments]: ColumnValueResult<R, Assignments[K]> }
    >
  >;
}

/**
 * Async mutate — always returns PromisedDataFrame or PromisedGroupedDataFrame.
 *
 * Use this when any formula is async (returns a Promise).
 * Supports optional concurrency control.
 *
 * Row composition rule (Awaited variant, inlined everywhere):
 *   Result = Prettify<
 *     & { [K in keyof R as K extends keyof A ? never : K]: R[K] }
 *     & { [K in keyof A]: Awaited<ColumnValueResult<R, A[K]>> }
 *   >
 */
export interface MutateAsyncMethod<Row extends object> {
  // ── Grouped — function formulas ─────────────────────────────────────────
  <
    R extends object,
    GroupName extends keyof R,
    Formulas extends Record<
      string,
      (row: R, idx: number, df: DataFrame<R>) => unknown
    >,
  >(
    this: GroupedDataFrame<R, GroupName>,
    formulas: Formulas,
    options?: ConcurrencyOptions,
  ): PromisedGroupedDataFrame<
    Prettify<
      & { [K in keyof R as K extends keyof Formulas ? never : K]: R[K] }
      & {
        [K in keyof Formulas]: Awaited<ColumnValueResult<R, Formulas[K]>>;
      }
    >,
    Extract<
      GroupName,
      keyof (
        & { [K in keyof R as K extends keyof Formulas ? never : K]: R[K] }
        & {
          [K in keyof Formulas]: Awaited<ColumnValueResult<R, Formulas[K]>>;
        }
      )
    >
  >;

  // ── Ungrouped — function formulas ───────────────────────────────────────
  <
    R extends object,
    Formulas extends Record<
      string,
      (row: R, idx: number, df: DataFrame<R>) => unknown
    >,
  >(
    this: DataFrame<R>,
    formulas: Formulas,
    options?: ConcurrencyOptions,
  ): PromisedDataFrame<
    Prettify<
      & { [K in keyof R as K extends keyof Formulas ? never : K]: R[K] }
      & {
        [K in keyof Formulas]: Awaited<ColumnValueResult<R, Formulas[K]>>;
      }
    >
  >;

  // ── Grouped — mixed assignments ─────────────────────────────────────────
  <
    R extends object,
    GroupName extends keyof R,
    Assignments extends Record<string, ColumnValue<R>>,
  >(
    this: GroupedDataFrame<R, GroupName>,
    assignments: Assignments,
    options?: ConcurrencyOptions,
  ): PromisedGroupedDataFrame<
    Prettify<
      & { [K in keyof R as K extends keyof Assignments ? never : K]: R[K] }
      & {
        [K in keyof Assignments]: Awaited<
          ColumnValueResult<R, Assignments[K]>
        >;
      }
    >,
    Extract<
      GroupName,
      keyof (
        & { [K in keyof R as K extends keyof Assignments ? never : K]: R[K] }
        & {
          [K in keyof Assignments]: Awaited<
            ColumnValueResult<R, Assignments[K]>
          >;
        }
      )
    >
  >;

  // ── Ungrouped — mixed assignments ───────────────────────────────────────
  <R extends object, Assignments extends Record<string, ColumnValue<R>>>(
    this: DataFrame<R>,
    assignments: Assignments,
    options?: ConcurrencyOptions,
  ): PromisedDataFrame<
    Prettify<
      & { [K in keyof R as K extends keyof Assignments ? never : K]: R[K] }
      & {
        [K in keyof Assignments]: Awaited<
          ColumnValueResult<R, Assignments[K]>
        >;
      }
    >
  >;
}
