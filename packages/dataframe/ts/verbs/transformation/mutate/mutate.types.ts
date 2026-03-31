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
type ColumnValueResult<
  Row extends object,
  Value,
> =
  // 1) Prefer our canonical (row, idx?, df?) function shape - unwrap Promise
  Value extends (row: Row, idx?: number, df?: DataFrame<Row>) => infer Result
    ? Awaited<Result>
    // 2) Fallback: *any* function collapses to its return type - unwrap Promise
    // deno-lint-ignore no-explicit-any
    : Value extends (...args: any[]) => infer Result ? Awaited<Result>
    // 3) Array literal → element type
    : Value extends readonly (infer Element)[] ? Element
    // 4) null deletes the column
    : Value extends null ? never
    // 5) Scalar literal → itself
    : Value;

/**
 * RowAfterMutation<Row, Assignments>
 * Given original row Row and column assignments (functions | arrays | scalars | null),
 * compute the resulting row type. Existing keys present in Assignments are replaced.
 *
 * Uses a single mapped type over `keyof Row | keyof Assignments` instead of
 * `Omit<Row, ...> & { ... }`. The Omit + intersection pattern produces deferred
 * `Exclude<keyof T, ...>` types when Row is a generic type parameter, which blocks
 * key assignability checks (e.g., `.select("id")` after `.mutate(...)` fails because
 * TS can't prove "id" is in `Exclude<keyof T, ...>`). The single mapped type gives
 * `keyof Result = keyof Row | keyof Assignments` directly, which TS can resolve.
 */
export type RowAfterMutation<
  Row extends object,
  // deno-lint-ignore no-explicit-any
  Assignments extends Record<string, any>,
> = Prettify<
  // Row-only keys: homomorphic over Row via `as` clause, preserves optional modifiers.
  // The `as` filter avoids `Exclude<keyof Row, keyof Assignments>` which defers on generics.
  & { [K in keyof Row as K extends keyof Assignments ? never : K]: Row[K] }
  // New/overwritten keys from Assignments
  & { [K in keyof Assignments]: ColumnValueResult<Row, Assignments[K]> }
>;

/** 🔁 Compatibility alias so existing runtime code can keep importing `AddColumns` */
export type AddColumns<
  Row extends object,
  // deno-lint-ignore no-explicit-any
  Assignments extends Record<string, any>,
> = RowAfterMutation<Row, Assignments>;

/* Convenience aliases if you like to name the case you're using */
export type RowAfterSingleCol<
  Row extends object,
  NewColName extends string,
  Value,
> = RowAfterMutation<Row, { [ColName in NewColName]: Value }>;

export type RowAfterFormulas<
  Row extends object,
  Formulas extends Record<
    string,
    (row: Row, idx?: number, df?: DataFrame<Row>) => unknown
  >,
> = RowAfterMutation<Row, Formulas>;

export type RowAfterAssignments<
  Row extends object,
  Assignments extends Record<string, ColumnValue<Row>>,
> = RowAfterMutation<Row, Assignments>;


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
 * Used as `Formulas & AllSync<Formulas>` in tier-2 overload constraints:
 * sync functions pass through, async functions become `never`.
 *
 * Uses NotAPromise (Awaited-based) instead of `extends Promise<any>` so that
 * generic return types (e.g., `T[K & keyof T]`) resolve correctly instead of
 * deferring the conditional (TS issue #52144).
 */
type AllSync<F> = {
  // deno-lint-ignore no-explicit-any
  [K in keyof F]: F[K] extends (...args: any[]) => infer R
    ? NotAPromise<R> extends true ? F[K] : never
    : F[K];
};

/**
 * Add new columns to a DataFrame using expressions, arrays, or scalar values.
 *
 * The `mutate` method allows you to add, modify, or delete columns in a DataFrame. It supports:
 * - **Functions**: `(row, idx, df) => value` - computed for each row
 * - **Arrays**: Fixed arrays of values (must match DataFrame length)
 * - **Scalars**: Single values repeated for all rows
 * - **null**: Deletes the column
 *
 * For async functions, the result becomes a `PromisedDataFrame` that you can `await`.
 * For grouped DataFrames, operations are applied to each group separately.
 *
 * @param formulas - Object mapping column names to expressions
 * @param assignments - Object mapping column names to values (functions, arrays, scalars, or null)
 * @param options - Concurrency options for async operations
 * @returns DataFrame, GroupedDataFrame, PromisedDataFrame, or PromisedGroupedDataFrame
 *
 * @example Basic usage
 * ```typescript
 * const people = createDataFrame([
 *   { id: 1, name: "Luke", mass: 77, height: 172 },
 *   { id: 2, name: "C-3PO", mass: 75, height: 167 },
 *   { id: 3, name: "R2-D2", mass: 32, height: 96 }
 * ]);
 *
 * const withBMI = people.mutate({
 *   bmi: (r) => r.mass / Math.pow(r.height / 100, 2),
 *   isHeavy: (r) => r.mass > 100,
 *   rowNum: (_r, idx) => idx + 1,
 *   constant: "fixed_value"
 * });
 * ```
 *
 * @example With arrays and scalars
 * ```typescript
 * const df = createDataFrame([{ a: 1 }, { a: 2 }]);
 *
 * const result = df.mutate({
 *   fromArray: [10, 20],           // Array values
 *   fromScalar: 100,               // Scalar repeated
 *   computed: (row) => row.a * 2,  // Computed function
 *   deleted: null                  // Delete column
 * });
 * ```
 *
 * @example Async operations
 * ```typescript
 * const promised = df.mutate({
 *   data: async (row) => await fetchUserData(row.id)
 * });
 *
 * const result = await promised; // Convert back to DataFrame
 * ```
 *
 * @example Grouped operations
 * ```typescript
 * const grouped = df.groupBy("category").mutate({
 *   groupSize: (_r, _idx, groupDf) => groupDf.nrows(),
 *   indexWithinGroup: (_r, idx) => idx + 1
 * });
 * ```
 */
export interface MutateMethod<Row extends object> {
  // ══════════════════════════════════════════════════════════════════════════
  // Async detection — three-tier overload pattern:
  //
  //   1. All-async param-split: every value returns Promise → PromisedDataFrame.
  //   2. All-sync constraint (AllSync<Formulas>): parameter is the mapped type
  //      directly, rejecting async functions via `never`. Sync-only calls match
  //      here → DataFrame. Generic Row calls also land here because AllSync uses
  //      NotAPromise (Awaited-based) which resolves for generic return types.
  //   3. Mixed-async fallback: catches anything tier 2 rejected (has at least one
  //      async property). Returns PromisedDataFrame unconditionally — no conditional
  //      return type, so no deferred union that would break .select() chaining.
  // ══════════════════════════════════════════════════════════════════════════

  // ── Tier 1: Grouped — all-async formulas ──────────────────────────────────
  <
    GroupName extends keyof Row,
    // deno-lint-ignore no-explicit-any
    Formulas extends Record<string, (row: Row, idx: number, df: DataFrame<Row>) => Promise<any>>,
  >(
    this: GroupedDataFrame<Row, GroupName>,
    formulas: Formulas,
  ): PromisedGroupedDataFrame<
    RowAfterMutation<Row, Formulas>,
    Extract<GroupName, keyof RowAfterMutation<Row, Formulas>>
  >;

  // ── Tier 1: Ungrouped — all-async formulas ────────────────────────────────
  <
    // deno-lint-ignore no-explicit-any
    Formulas extends Record<string, (row: Row, idx: number, df: DataFrame<Row>) => Promise<any>>,
  >(
    formulas: Formulas,
  ): PromisedDataFrame<RowAfterMutation<Row, Formulas>>;

  // ── Tier 2: Grouped — all-sync formulas ───────────────────────────────────
  <
    GroupName extends keyof Row,
    Formulas extends Record<
      string,
      (row: Row, idx: number, df: DataFrame<Row>) => unknown
    >,
  >(
    this: GroupedDataFrame<Row, GroupName>,
    formulas: Formulas & AllSync<Formulas>,
  ): GroupedDataFrame<
    RowAfterMutation<Row, Formulas>,
    Extract<GroupName, keyof RowAfterMutation<Row, Formulas>>
  >;

  // ── Tier 2: Ungrouped — all-sync formulas ─────────────────────────────────
  <
    Formulas extends Record<
      string,
      (row: Row, idx: number, df: DataFrame<Row>) => unknown
    >,
  >(
    formulas: Formulas & AllSync<Formulas>,
  ): DataFrame<RowAfterMutation<Row, Formulas>>;

  // ── Tier 3: Grouped — mixed-async fallback (unconditional PromisedGroupedDataFrame) ─
  <
    GroupName extends keyof Row,
    Formulas extends Record<
      string,
      (row: Row, idx: number, df: DataFrame<Row>) => unknown
    >,
  >(
    this: GroupedDataFrame<Row, GroupName>,
    formulas: Formulas,
  ): PromisedGroupedDataFrame<
    RowAfterMutation<Row, Formulas>,
    Extract<GroupName, keyof RowAfterMutation<Row, Formulas>>
  >;

  // ── Tier 3: Ungrouped — mixed-async fallback (unconditional PromisedDataFrame) ─
  <
    Formulas extends Record<
      string,
      (row: Row, idx: number, df: DataFrame<Row>) => unknown
    >,
  >(
    formulas: Formulas,
  ): PromisedDataFrame<RowAfterMutation<Row, Formulas>>;

  // ── Overloads with concurrency options ─────────────────────────────────────

  // ── Grouped — formulas with concurrency options ───────────────────────────

  /**
   * Add or modify columns using expressions.
   *
   * Creates new columns or modifies existing ones using functions, arrays, scalars, or null.
   * Functions receive `(row, idx, df)` parameters. For grouped DataFrames, operations apply
   * within each group. Async functions return a PromisedDataFrame.
   *
   * @example
   * // Add computed columns
   * df.mutate({
   *   bmi: (r) => r.mass / Math.pow(r.height / 100, 2),
   *   isAdult: (r) => r.age >= 18
   * })
   *
   * @example
   * // Mix functions, arrays, and scalars
   * df.mutate({
   *   computed: (row) => row.a * 2,
   *   fromArray: [10, 20, 30],
   *   constant: "fixed_value"
   * })
   *
   * @example
   * // Async operations with concurrency
   * await df.mutate({
   *   data: async (row) => await fetchData(row.id)
   * }, { concurrency: 10 })
   *
   * @example
   * // Grouped operations
   * df.groupBy("category").mutate({
   *   groupSize: (_r, _idx, groupDf) => groupDf.nrows()
   * })
   */
  <
    GroupName extends keyof Row,
    Formulas extends Record<
      string,
      (row: Row, idx: number, df: DataFrame<Row>) => unknown
    >,
  >(
    this: GroupedDataFrame<Row, GroupName>,
    formulas: Formulas,
    options: ConcurrencyOptions,
  ): Promise<
    GroupedDataFrame<
      RowAfterMutation<Row, Formulas>,
      Extract<GroupName, keyof RowAfterMutation<Row, Formulas>>
    >
  >;

  // ── Grouped — assignments with concurrency options ────────────────────────
  /**
   * Add or modify columns using expressions.
   *
   * Creates new columns or modifies existing ones using functions, arrays, scalars, or null.
   * Functions receive `(row, idx, df)` parameters. For grouped DataFrames, operations apply
   * within each group. Async functions return a PromisedDataFrame.
   *
   * @example
   * // Add computed columns
   * df.mutate({
   *   bmi: (r) => r.mass / Math.pow(r.height / 100, 2),
   *   isAdult: (r) => r.age >= 18
   * })
   *
   * @example
   * // Mix functions, arrays, and scalars
   * df.mutate({
   *   computed: (row) => row.a * 2,
   *   fromArray: [10, 20, 30],
   *   constant: "fixed_value"
   * })
   *
   * @example
   * // Async operations with concurrency
   * await df.mutate({
   *   data: async (row) => await fetchData(row.id)
   * }, { concurrency: 10 })
   *
   * @example
   * // Grouped operations
   * df.groupBy("category").mutate({
   *   groupSize: (_r, _idx, groupDf) => groupDf.nrows()
   * })
   */
  <
    GroupName extends keyof Row,
    Assignments extends Record<string, ColumnValue<Row>>,
  >(
    this: GroupedDataFrame<Row, GroupName>,
    assignments: Assignments,
    options: ConcurrencyOptions,
  ): Promise<
    GroupedDataFrame<
      RowAfterMutation<Row, Assignments>,
      Extract<GroupName, keyof RowAfterMutation<Row, Assignments>>
    >
  >;

  // ── Ungrouped — formulas with concurrency options ──────────────────────────
  /**
   * Add or modify columns using expressions.
   *
   * Creates new columns or modifies existing ones using functions, arrays, scalars, or null.
   * Functions receive `(row, idx, df)` parameters. For grouped DataFrames, operations apply
   * within each group. Async functions return a PromisedDataFrame.
   *
   * @example
   * // Add computed columns
   * df.mutate({
   *   bmi: (r) => r.mass / Math.pow(r.height / 100, 2),
   *   isAdult: (r) => r.age >= 18
   * })
   *
   * @example
   * // Mix functions, arrays, and scalars
   * df.mutate({
   *   computed: (row) => row.a * 2,
   *   fromArray: [10, 20, 30],
   *   constant: "fixed_value"
   * })
   *
   * @example
   * // Async operations with concurrency
   * await df.mutate({
   *   data: async (row) => await fetchData(row.id)
   * }, { concurrency: 10 })
   *
   * @example
   * // Grouped operations
   * df.groupBy("category").mutate({
   *   groupSize: (_r, _idx, groupDf) => groupDf.nrows()
   * })
   */
  <
    Formulas extends Record<
      string,
      (row: Row, idx: number, df: DataFrame<Row>) => unknown
    >,
  >(
    formulas: Formulas,
    options: ConcurrencyOptions,
  ): Promise<DataFrame<RowAfterMutation<Row, Formulas>>>;

  // ── Ungrouped — assignments with concurrency options ───────────────────────
  /**
   * Add or modify columns using expressions.
   *
   * Creates new columns or modifies existing ones using functions, arrays, scalars, or null.
   * Functions receive `(row, idx, df)` parameters. For grouped DataFrames, operations apply
   * within each group. Async functions return a PromisedDataFrame.
   *
   * @example
   * // Add computed columns
   * df.mutate({
   *   bmi: (r) => r.mass / Math.pow(r.height / 100, 2),
   *   isAdult: (r) => r.age >= 18
   * })
   *
   * @example
   * // Mix functions, arrays, and scalars
   * df.mutate({
   *   computed: (row) => row.a * 2,
   *   fromArray: [10, 20, 30],
   *   constant: "fixed_value"
   * })
   *
   * @example
   * // Async operations with concurrency
   * await df.mutate({
   *   data: async (row) => await fetchData(row.id)
   * }, { concurrency: 10 })
   *
   * @example
   * // Grouped operations
   * df.groupBy("category").mutate({
   *   groupSize: (_r, _idx, groupDf) => groupDf.nrows()
   * })
   */
  <Assignments extends Record<string, ColumnValue<Row>>>(
    assignments: Assignments,
    options: ConcurrencyOptions,
  ): Promise<DataFrame<RowAfterMutation<Row, Assignments>>>;
  // ── Grouped — assignments of ONLY functions (best inference for (row, idx, df)) ─
  /**
   * Add or modify columns using expressions.
   *
   * Creates new columns or modifies existing ones using functions, arrays, scalars, or null.
   * Functions receive `(row, idx, df)` parameters. For grouped DataFrames, operations apply
   * within each group. Async functions return a PromisedDataFrame.
   *
   * @example
   * // Add computed columns
   * df.mutate({
   *   bmi: (r) => r.mass / Math.pow(r.height / 100, 2),
   *   isAdult: (r) => r.age >= 18
   * })
   *
   * @example
   * // Mix functions, arrays, and scalars
   * df.mutate({
   *   computed: (row) => row.a * 2,
   *   fromArray: [10, 20, 30],
   *   constant: "fixed_value"
   * })
   *
   * @example
   * // Async operations with concurrency
   * await df.mutate({
   *   data: async (row) => await fetchData(row.id)
   * }, { concurrency: 10 })
   *
   * @example
   * // Grouped operations
   * df.groupBy("category").mutate({
   *   groupSize: (_r, _idx, groupDf) => groupDf.nrows()
   * })
   */
  <
    GroupName extends keyof Row,
    Formulas extends Record<
      string,
      (row: Row, idx: number, df: DataFrame<Row>) => unknown
    >,
  >(
    this: GroupedDataFrame<Row, GroupName>,
    formulas: Formulas,
  ): GroupedDataFrame<
    RowAfterMutation<Row, Formulas>,
    Extract<GroupName, keyof RowAfterMutation<Row, Formulas>>
  >;

  // ── Grouped — mixed assignments (functions | arrays | scalars | null) ───────────
  /**
   * Add or modify columns using expressions.
   *
   * Creates new columns or modifies existing ones using functions, arrays, scalars, or null.
   * Functions receive `(row, idx, df)` parameters. For grouped DataFrames, operations apply
   * within each group. Async functions return a PromisedDataFrame.
   *
   * @example
   * // Add computed columns
   * df.mutate({
   *   bmi: (r) => r.mass / Math.pow(r.height / 100, 2),
   *   isAdult: (r) => r.age >= 18
   * })
   *
   * @example
   * // Mix functions, arrays, and scalars
   * df.mutate({
   *   computed: (row) => row.a * 2,
   *   fromArray: [10, 20, 30],
   *   constant: "fixed_value"
   * })
   *
   * @example
   * // Async operations with concurrency
   * await df.mutate({
   *   data: async (row) => await fetchData(row.id)
   * }, { concurrency: 10 })
   *
   * @example
   * // Grouped operations
   * df.groupBy("category").mutate({
   *   groupSize: (_r, _idx, groupDf) => groupDf.nrows()
   * })
   */
  <
    GroupName extends keyof Row,
    Assignments extends Record<string, ColumnValue<Row>>,
  >(
    this: GroupedDataFrame<Row, GroupName>,
    assignments: Assignments,
  ): GroupedDataFrame<
    RowAfterMutation<Row, Assignments>,
    Extract<GroupName, keyof RowAfterMutation<Row, Assignments>>
  >;

  // ── Grouped — mixed without scalars (functions | arrays | null) for better inference ─
  /**
   * Add or modify columns using expressions.
   *
   * Creates new columns or modifies existing ones using functions, arrays, scalars, or null.
   * Functions receive `(row, idx, df)` parameters. For grouped DataFrames, operations apply
   * within each group. Async functions return a PromisedDataFrame.
   *
   * @example
   * // Add computed columns
   * df.mutate({
   *   bmi: (r) => r.mass / Math.pow(r.height / 100, 2),
   *   isAdult: (r) => r.age >= 18
   * })
   *
   * @example
   * // Mix functions, arrays, and scalars
   * df.mutate({
   *   computed: (row) => row.a * 2,
   *   fromArray: [10, 20, 30],
   *   constant: "fixed_value"
   * })
   *
   * @example
   * // Async operations with concurrency
   * await df.mutate({
   *   data: async (row) => await fetchData(row.id)
   * }, { concurrency: 10 })
   *
   * @example
   * // Grouped operations
   * df.groupBy("category").mutate({
   *   groupSize: (_r, _idx, groupDf) => groupDf.nrows()
   * })
   */
  <
    GroupName extends keyof Row,
    Assignments extends {
      [key: string]:
        | ((row: Row, idx: number, df: DataFrame<Row>) => unknown)
        | readonly unknown[]
        | null;
    },
  >(
    this: GroupedDataFrame<Row, GroupName>,
    assignments: Assignments,
  ): GroupedDataFrame<
    RowAfterMutation<Row, Assignments>,
    Extract<GroupName, keyof RowAfterMutation<Row, Assignments>>
  >;

  // ── Ungrouped — assignments of ONLY functions (best inference for (row, idx, df)) ─
  /**
   * Add or modify columns using expressions.
   *
   * Creates new columns or modifies existing ones using functions, arrays, scalars, or null.
   * Functions receive `(row, idx, df)` parameters. For grouped DataFrames, operations apply
   * within each group. Async functions return a PromisedDataFrame.
   *
   * @example
   * // Add computed columns
   * df.mutate({
   *   bmi: (r) => r.mass / Math.pow(r.height / 100, 2),
   *   isAdult: (r) => r.age >= 18
   * })
   *
   * @example
   * // Mix functions, arrays, and scalars
   * df.mutate({
   *   computed: (row) => row.a * 2,
   *   fromArray: [10, 20, 30],
   *   constant: "fixed_value"
   * })
   *
   * @example
   * // Async operations with concurrency
   * await df.mutate({
   *   data: async (row) => await fetchData(row.id)
   * }, { concurrency: 10 })
   *
   * @example
   * // Grouped operations
   * df.groupBy("category").mutate({
   *   groupSize: (_r, _idx, groupDf) => groupDf.nrows()
   * })
   */
  <
    Formulas extends Record<
      string,
      (row: Row, idx: number, df: DataFrame<Row>) => unknown
    >,
  >(
    formulas: Formulas,
  ): DataFrame<RowAfterMutation<Row, Formulas>>;

  // ── Ungrouped — mixed without scalars (functions | arrays | null) for better inference ─────
  /**
   * Add or modify columns using expressions.
   *
   * Creates new columns or modifies existing ones using functions, arrays, scalars, or null.
   * Functions receive `(row, idx, df)` parameters. For grouped DataFrames, operations apply
   * within each group. Async functions return a PromisedDataFrame.
   *
   * @example
   * // Add computed columns
   * df.mutate({
   *   bmi: (r) => r.mass / Math.pow(r.height / 100, 2),
   *   isAdult: (r) => r.age >= 18
   * })
   *
   * @example
   * // Mix functions, arrays, and scalars
   * df.mutate({
   *   computed: (row) => row.a * 2,
   *   fromArray: [10, 20, 30],
   *   constant: "fixed_value"
   * })
   *
   * @example
   * // Async operations with concurrency
   * await df.mutate({
   *   data: async (row) => await fetchData(row.id)
   * }, { concurrency: 10 })
   *
   * @example
   * // Grouped operations
   * df.groupBy("category").mutate({
   *   groupSize: (_r, _idx, groupDf) => groupDf.nrows()
   * })
   */
  <
    Assignments extends {
      [key: string]:
        | ((row: Row, idx: number, df: DataFrame<Row>) => unknown)
        | readonly unknown[]
        | null;
    },
  >(
    assignments: Assignments,
  ): DataFrame<RowAfterMutation<Row, Assignments>>;

  // ── Ungrouped — fallback for mixed assignments (functions | arrays | scalars | null) ─────────
  /**
   * Add or modify columns using expressions.
   *
   * Creates new columns or modifies existing ones using functions, arrays, scalars, or null.
   * Functions receive `(row, idx, df)` parameters. For grouped DataFrames, operations apply
   * within each group. Async functions return a PromisedDataFrame.
   *
   * @example
   * // Add computed columns
   * df.mutate({
   *   bmi: (r) => r.mass / Math.pow(r.height / 100, 2),
   *   isAdult: (r) => r.age >= 18
   * })
   *
   * @example
   * // Mix functions, arrays, and scalars
   * df.mutate({
   *   computed: (row) => row.a * 2,
   *   fromArray: [10, 20, 30],
   *   constant: "fixed_value"
   * })
   *
   * @example
   * // Async operations with concurrency
   * await df.mutate({
   *   data: async (row) => await fetchData(row.id)
   * }, { concurrency: 10 })
   *
   * @example
   * // Grouped operations
   * df.groupBy("category").mutate({
   *   groupSize: (_r, _idx, groupDf) => groupDf.nrows()
   * })
   */
  <Assignments extends Record<string, ColumnValue<Row>>>(
    assignments: Assignments,
  ): DataFrame<RowAfterMutation<Row, Assignments>>;

  // ── Ungrouped — broadest fallback (includes scalars) ────────────────────────
  // deno-lint-ignore no-explicit-any
  <Assignments extends Record<string, any>>(
    assignments: Assignments,
  ): DataFrame<RowAfterMutation<Row, Assignments>>;
}
