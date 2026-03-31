// packages/dataframe/ts/types/verbs/foreach.ts
import type { DataFrame, GroupedDataFrame } from "../../dataframe/index.ts";
import type { IsAsyncFunction } from "../../promised-dataframe/index.ts";
import type {
  EmptyDataFrameForEach,
  RestrictEmptyDataFrame,
} from "../../dataframe/types/error-types.ts";

/**
 * Execute a function for each row (side effects).
 *
 * Runs a callback for each row without modifying the DataFrame. Useful for logging,
 * external API calls, or other side effects. Returns the original DataFrame for chaining.
 * Supports async callbacks with automatic Promise handling.
 *
 * @param callback - Function to execute for each row. Receives:
 *   - `row`: The current row (readonly)
 *   - `idx`: Row index (0-based)
 *   - `df`: The DataFrame being iterated
 *
 * @returns The original DataFrame for chaining. If callback is async, returns Promise<DataFrame>.
 *
 * @example
 * // Log each row
 * df.forEachRow((row, idx) => {
 *   console.log(`Row ${idx}:`, row)
 * })
 *
 * @example
 * // Async side effects
 * await df.forEachRow(async (row) => {
 *   await sendToAPI(row)
 * })
 *
 * @example
 * // Chain after forEach
 * df.forEachRow(row => logger.info(row))
 *   .filter(row => row.active)
 */
export type ForEachRowMethod<Row extends object> = {
  // ── Async versions (return Promise) ──────────────────────────────
  /**
   * Execute a function for each row (side effects).
   *
   * Runs a callback for each row without modifying the DataFrame. Useful for logging,
   * external API calls, or other side effects. Returns the original DataFrame for chaining.
   * Supports async callbacks with automatic Promise handling.
   *
   * @param callback - Function to execute for each row. Receives:
   *   - `row`: The current row (readonly)
   *   - `idx`: Row index (0-based)
   *   - `df`: The DataFrame being iterated
   *
   * @returns The original DataFrame for chaining. If callback is async, returns Promise<DataFrame>.
   *
   * @example
   * // Log each row
   * df.forEachRow((row, idx) => {
   *   console.log(`Row ${idx}:`, row)
   * })
   *
   * @example
   * // Async side effects
   * await df.forEachRow(async (row) => {
   *   await sendToAPI(row)
   * })
   *
   * @example
   * // Chain after forEach
   * df.forEachRow(row => logger.info(row))
   *   .filter(row => row.active)
   */
  <
    R extends object,
    GroupName extends keyof R,
    Callback extends (
      row: Readonly<R>,
      idx: number,
      df: DataFrame<R>,
    ) => unknown,
  >(
    this: GroupedDataFrame<R, GroupName>,
    callback: RestrictEmptyDataFrame<R, Callback, EmptyDataFrameForEach>,
  ): IsAsyncFunction<Callback> extends true
    ? Promise<GroupedDataFrame<R, GroupName>>
    : GroupedDataFrame<R, GroupName>;

  /**
   * Execute a function for each row (side effects).
   *
   * Runs a callback for each row without modifying the DataFrame. Useful for logging,
   * external API calls, or other side effects. Returns the original DataFrame for chaining.
   * Supports async callbacks with automatic Promise handling.
   *
   * @param callback - Function to execute for each row. Receives:
   *   - `row`: The current row (readonly)
   *   - `idx`: Row index (0-based)
   *   - `df`: The DataFrame being iterated
   *
   * @returns The original DataFrame for chaining. If callback is async, returns Promise<DataFrame>.
   *
   * @example
   * // Log each row
   * df.forEachRow((row, idx) => {
   *   console.log(`Row ${idx}:`, row)
   * })
   *
   * @example
   * // Async side effects
   * await df.forEachRow(async (row) => {
   *   await sendToAPI(row)
   * })
   *
   * @example
   * // Chain after forEach
   * df.forEachRow(row => logger.info(row))
   *   .filter(row => row.active)
   */
  <
    R extends object,
    Callback extends (
      row: Readonly<R>,
      idx: number,
      df: DataFrame<R>,
    ) => unknown,
  >(
    this: DataFrame<R>,
    callback: RestrictEmptyDataFrame<R, Callback, EmptyDataFrameForEach>,
  ): IsAsyncFunction<Callback> extends true ? Promise<DataFrame<R>>
    : DataFrame<R>;
};

/**
 * Execute a function for each column (side effects).
 *
 * Runs a callback for each column without modifying the DataFrame. Useful for
 * inspecting column names, logging statistics, or other column-level side effects.
 * Returns the original DataFrame for chaining. Supports async callbacks.
 *
 * @param callback - Function to execute for each column. Receives:
 *   - `colName`: Name of the current column
 *   - `df`: The DataFrame being iterated
 *
 * @returns The original DataFrame for chaining. If callback is async, returns Promise<DataFrame>.
 *
 * @example
 * // Log each column name
 * df.forEachCol((colName, df) => {
 *   console.log(`Column ${colName} has ${df.nrows()} values`)
 * })
 *
 * @example
 * // Check column statistics
 * df.forEachCol((colName, df) => {
 *   const values = df[colName]
 *   console.log(`${colName}: mean = ${s.mean(values)}`)
 * })
 *
 * @example
 * // Async column processing
 * await df.forEachCol(async (colName, df) => {
 *   await logToDatabase(colName, df[colName])
 * })
 */
export type ForEachColMethod<Row extends object> = {
  // ── Async versions (return Promise) ──────────────────────────────
  /**
   * Execute a function for each column (side effects).
   *
   * Runs a callback for each column without modifying the DataFrame. Useful for
   * inspecting column names, logging statistics, or other column-level side effects.
   * Returns the original DataFrame for chaining. Supports async callbacks.
   *
   * @param callback - Function to execute for each column. Receives:
   *   - `colName`: Name of the current column
   *   - `df`: The DataFrame being iterated
   *
   * @returns The original DataFrame for chaining. If callback is async, returns Promise<DataFrame>.
   *
   * @example
   * // Log each column name
   * df.forEachCol((colName, df) => {
   *   console.log(`Column ${colName} has ${df.nrows()} values`)
   * })
   *
   * @example
   * // Check column statistics
   * df.forEachCol((colName, df) => {
   *   const values = df[colName]
   *   console.log(`${colName}: mean = ${s.mean(values)}`)
   * })
   *
   * @example
   * // Async column processing
   * await df.forEachCol(async (colName, df) => {
   *   await logToDatabase(colName, df[colName])
   * })
   */
  <
    R extends object,
    GroupName extends keyof R,
    Callback extends (colName: keyof R, df: DataFrame<R>) => unknown,
  >(
    this: GroupedDataFrame<R, GroupName>,
    callback: RestrictEmptyDataFrame<R, Callback, EmptyDataFrameForEach>,
  ): IsAsyncFunction<Callback> extends true
    ? Promise<GroupedDataFrame<R, GroupName>>
    : GroupedDataFrame<R, GroupName>;

  /**
   * Execute a function for each column (side effects).
   *
   * Runs a callback for each column without modifying the DataFrame. Useful for
   * inspecting column names, logging statistics, or other column-level side effects.
   * Returns the original DataFrame for chaining. Supports async callbacks.
   *
   * @param callback - Function to execute for each column. Receives:
   *   - `colName`: Name of the current column
   *   - `df`: The DataFrame being iterated
   *
   * @returns The original DataFrame for chaining. If callback is async, returns Promise<DataFrame>.
   *
   * @example
   * // Log each column name
   * df.forEachCol((colName, df) => {
   *   console.log(`Column ${colName} has ${df.nrows()} values`)
   * })
   *
   * @example
   * // Check column statistics
   * df.forEachCol((colName, df) => {
   *   const values = df[colName]
   *   console.log(`${colName}: mean = ${s.mean(values)}`)
   * })
   *
   * @example
   * // Async column processing
   * await df.forEachCol(async (colName, df) => {
   *   await logToDatabase(colName, df[colName])
   * })
   */
  <R extends object, Callback extends (colName: keyof R, df: DataFrame<R>) => unknown>(
    this: DataFrame<R>,
    callback: RestrictEmptyDataFrame<R, Callback, EmptyDataFrameForEach>,
  ): IsAsyncFunction<Callback> extends true ? Promise<DataFrame<R>>
    : DataFrame<R>;
};
