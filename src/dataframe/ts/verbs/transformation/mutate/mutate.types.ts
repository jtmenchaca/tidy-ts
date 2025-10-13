// src/dataframe/ts/types/verbs/mutate.ts
import type {
  DataFrame,
  GroupedDataFrame,
  Prettify,
} from "../../../dataframe/index.ts";
import type {
  AnyPropertyIsAsync,
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
 */
export type RowAfterMutation<
  Row extends object,
  // deno-lint-ignore no-explicit-any
  Assignments extends Record<string, any>,
> = Prettify<
  & Omit<Row, keyof Assignments & keyof Row>
  & {
    [ColName in keyof Assignments]: ColumnValueResult<
      Row,
      Assignments[ColName]
    >;
  }
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
 * WithContextForFunctions<Row, A>
 * Refines an arbitrary assignments object A so that any function-valued
 * properties are contextually typed with the precise `(row: Row, idx, df)` signature.
 * Non-function properties are left unchanged. This enables strong parameter
 * inference for function literals even when mixed with arrays/scalars.
 */
type WithContextForFunctions<
  Row extends object,
  // deno-lint-ignore no-explicit-any
  A extends Record<string, any>,
> = {
  [K in keyof A]: A[K] extends (...args: unknown[]) => unknown ? (
      row: Row,
      idx: number,
      df: DataFrame<Row>,
    ) => Awaited<ReturnType<Extract<A[K], (...args: unknown[]) => unknown>>>
    : A[K];
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
  // ── Async versions (return Promise<DataFrame>) ──────────────────────────────

  // ── Grouped — async formulas ───────────────────────────────────────────────
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
  ): AnyPropertyIsAsync<Formulas> extends true ? PromisedGroupedDataFrame<
      Prettify<RowAfterMutation<Row, Formulas>>,
      Extract<GroupName, keyof Prettify<RowAfterMutation<Row, Formulas>>>
    >
    : GroupedDataFrame<
      Prettify<RowAfterMutation<Row, Formulas>>,
      Extract<GroupName, keyof Prettify<RowAfterMutation<Row, Formulas>>>
    >;

  // ── Grouped — async mixed assignments ──────────────────────────────────────

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
  ): AnyPropertyIsAsync<Assignments> extends true ? PromisedGroupedDataFrame<
      Prettify<RowAfterMutation<Row, Assignments>>,
      Extract<GroupName, keyof Prettify<RowAfterMutation<Row, Assignments>>>
    >
    : GroupedDataFrame<
      Prettify<RowAfterMutation<Row, Assignments>>,
      Extract<GroupName, keyof Prettify<RowAfterMutation<Row, Assignments>>>
    >;

  // ── Ungrouped — async formulas ──────────────────────────────────────────────

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
  ): AnyPropertyIsAsync<Formulas> extends true
    ? PromisedDataFrame<Prettify<RowAfterMutation<Row, Formulas>>>
    : DataFrame<Prettify<RowAfterMutation<Row, Formulas>>>;

  // ── Ungrouped — async mixed assignments ─────────────────────────────────────

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
  ): AnyPropertyIsAsync<Assignments> extends true
    ? PromisedDataFrame<Prettify<RowAfterMutation<Row, Assignments>>>
    : DataFrame<Prettify<RowAfterMutation<Row, Assignments>>>;

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
      Prettify<RowAfterMutation<Row, Formulas>>,
      Extract<GroupName, keyof Prettify<RowAfterMutation<Row, Formulas>>>
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
      Prettify<RowAfterMutation<Row, Assignments>>,
      Extract<GroupName, keyof Prettify<RowAfterMutation<Row, Assignments>>>
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
  ): Promise<DataFrame<Prettify<RowAfterMutation<Row, Formulas>>>>;

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
  ): Promise<DataFrame<Prettify<RowAfterMutation<Row, Assignments>>>>;
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
    Prettify<RowAfterMutation<Row, Formulas>>,
    Extract<GroupName, keyof Prettify<RowAfterMutation<Row, Formulas>>>
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
    Prettify<RowAfterMutation<Row, Assignments>>,
    Extract<GroupName, keyof Prettify<RowAfterMutation<Row, Assignments>>>
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
    Prettify<RowAfterMutation<Row, Assignments>>,
    Extract<GroupName, keyof Prettify<RowAfterMutation<Row, Assignments>>>
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
  ): DataFrame<Prettify<RowAfterMutation<Row, Formulas>>>;

  // ── Ungrouped — mixed assignments with contextual function typing ─────────
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
  <A extends Record<string, unknown>>(
    assignments: WithContextForFunctions<Row, A>,
  ): AnyPropertyIsAsync<A> extends true
    ? PromisedDataFrame<Prettify<RowAfterMutation<Row, A>>>
    : DataFrame<Prettify<RowAfterMutation<Row, A>>>;

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
  ): DataFrame<Prettify<RowAfterMutation<Row, Assignments>>>;

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
  ): DataFrame<Prettify<RowAfterMutation<Row, Assignments>>>;
}
