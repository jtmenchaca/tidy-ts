import type {
  DataFrame,
  GroupedDataFrame,
  Prettify,
} from "../../dataframe/index.ts";
import type { PreserveGrouping } from "../../dataframe/index.ts";
import type {
  ColumnTypeMismatchDate,
  EmptyDataFrameResample,
  RestrictEmptyDataFrame,
  ValidateDateColumn,
} from "../../dataframe/types/error-types.ts";

/**
 * Frequency specification for resampling.
 *
 * Supports common time periods:
 * - Seconds: "1S", "5S", "15S", "30S"
 * - Minutes: "1min", "5min", "15min", "30min"
 * - Hours: "1H"
 * - Days: "1D"
 * - Weeks: "1W"
 * - Months: "1M"
 * - Quarters: "1Q"
 * - Years: "1Y"
 *
 * Or custom milliseconds as a number.
 */
export type Frequency =
  | "1S"
  | "5S"
  | "15S"
  | "30S"
  | "1min"
  | "5min"
  | "15min"
  | "30min"
  | "1H"
  | "1D"
  | "1W"
  | "1M"
  | "1Q"
  | "1Y"
  | number
  | {
    value: number;
    unit: "ms" | "s" | "min" | "h" | "d" | "w" | "M" | "Q" | "Y";
  };

/**
 * Aggregation function for resampling.
 * Must be a function that receives values and returns a single aggregated value.
 *
 * Examples:
 * - stats.mean, stats.sum, stats.min, stats.max, stats.first, stats.last (takes array/values)
 * - Custom function: (values: unknown[]) => value (receives array of values)
 * - Custom function: (group: GroupedDataFrame) => value (receives grouped DataFrame)
 */
// deno-lint-ignore no-explicit-any
export type AggregationFunction<T extends object> = (...args: any[]) => any;

/**
 * Fill method for upsampling.
 * Must be a function that receives an array of values and returns a filled array.
 *
 * Examples:
 * - stats.forwardFill (takes array, returns array with forward-filled values)
 * - stats.backwardFill (takes array, returns array with backward-filled values)
 * - Custom function: (values: unknown[]) => unknown[]
 */
export type FillMethod = (values: unknown[]) => unknown[]; // Stats functions like stats.forwardFill, stats.backwardFill

/**
 * Resample options - can specify aggregations per column or a global fill method.
 * Allows creating new columns (keys don't have to exist in T).
 */
export type ResampleOptions<T extends object> =
  | {
    [K: string]:
      | AggregationFunction<T>
      | FillMethod
      | number
      | null
      | undefined;
    method?: FillMethod;
  }
  | {
    method?: FillMethod;
  };

/**
 * Infer the return type of an aggregation function.
 * For stats functions, we can't infer perfectly, so we use unknown.
 * For custom functions, we try to infer from the return type.
 */
// deno-lint-ignore no-explicit-any
type AggregationReturnType<Fn> = Fn extends (...args: any[]) => infer R ? R
  : unknown;

/**
 * Infer the return type for a fill method.
 * Fill methods return arrays, but we extract a single value, so we use unknown.
 */
type FillReturnType<Fn> = Fn extends (values: unknown[]) => infer R
  ? R extends unknown[] ? R[number] : unknown
  : unknown;

/**
 * Compute the result row type after resampling.
 * Maps each key in options to its computed return type.
 * Similar to RowAfterMutation but for resampling operations.
 */
type RowAfterResample<
  Row extends object,
  TimeCol extends keyof Row,
  Options extends ResampleOptions<Row>,
> = Prettify<
  & Pick<Row, TimeCol> // Always preserve time column
  & {
    // Map each key in options (excluding "method" and time column) to its return type
    [K in keyof Options as K extends "method" | TimeCol ? never : K]:
      Options[K] extends AggregationFunction<Row>
        ? AggregationReturnType<Options[K]>
        : Options[K] extends FillMethod ? FillReturnType<Options[K]>
        : Options[K] extends number | null ? Options[K]
        : unknown;
  }
  // For upsampling with global method, preserve other columns
  & (Options extends { method?: FillMethod } ? {
      [K in keyof Row as K extends TimeCol ? never : K]?: FillReturnType<
        Options["method"]
      >;
    }
    // deno-lint-ignore ban-types
    : {})
>;

/**
 * Resample method for DataFrame.
 *
 * Resamples time-series data to a different frequency.
 *
 * @example
 * // Downsample hourly to daily (using stats functions like rolling)
 * df.resample("timestamp", "1D", {
 *   price: stats.mean,
 *   volume: stats.sum
 * })
 *
 * @example
 * // Upsample daily to hourly with forward fill
 * df.resample("timestamp", "1H", {
 *   method: stats.forwardFill
 * })
 *
 * @example
 * // Per-column fill methods
 * df.resample("timestamp", "1H", {
 *   price: stats.forwardFill,
 *   volume: stats.backwardFill
 * })
 */
export type ResampleMethod<Row extends object> = {
  /**
   * Resample time-series data to a different frequency (grouped DataFrame overload).
   *
   * Resamples time-series data by either downsampling (aggregating) or upsampling (filling).
   * The time column must be of type Date (or Date | null).
   *
   * **Downsampling** (aggregation): Groups rows by time buckets and applies aggregation functions.
   * Use this when converting from higher frequency to lower frequency (e.g., hourly to daily).
   *
   * **Upsampling** (filling): Generates a time sequence and fills missing values.
   * Use this when converting from lower frequency to higher frequency (e.g., daily to hourly).
   *
   * @param timeColumn - Name of the Date column to use for resampling
   * @param frequency - Target frequency (e.g., "1D", "1H", "15min", "1W", "1M")
   * @param options - Resampling options
   *   - For downsampling: object mapping column names to aggregation functions (e.g., `{ price: stats.mean, volume: stats.sum }`)
   *   - For upsampling: object with `method` key (e.g., `{ method: stats.forwardFill }`) or per-column fill methods
   * @returns Grouped DataFrame with resampled data (preserves grouping)
   *
   * @example
   * // Resample grouped data
   * const result = df.groupBy("symbol").resample("timestamp", "1D", {
   *   price: stats.mean
   * });
   */
  <
    GroupName extends keyof Row,
    TimeCol extends keyof Row,
    Options extends ResampleOptions<Row>,
  >(
    this: GroupedDataFrame<Row, GroupName>,
    timeColumn: RestrictEmptyDataFrame<
      Row,
      ValidateDateColumn<Row, TimeCol, ColumnTypeMismatchDate>,
      EmptyDataFrameResample
    >,
    frequency: Frequency,
    options: Options,
  ): PreserveGrouping<
    Row,
    GroupName,
    RowAfterResample<Row, TimeCol, Options>
  >;

  /**
   * Resample time-series data to a different frequency (regular DataFrame overload).
   *
   * Resamples time-series data by either downsampling (aggregating) or upsampling (filling).
   * The time column must be of type Date (or Date | null).
   *
   * **Downsampling** (aggregation): Groups rows by time buckets and applies aggregation functions.
   * Use this when converting from higher frequency to lower frequency (e.g., hourly to daily).
   *
   * **Upsampling** (filling): Generates a time sequence and fills missing values.
   * Use this when converting from lower frequency to higher frequency (e.g., daily to hourly).
   *
   * @param timeColumn - Name of the Date column to use for resampling
   * @param frequency - Target frequency (e.g., "1D", "1H", "15min", "1W", "1M")
   * @param options - Resampling options
   *   - For downsampling: object mapping column names to aggregation functions (e.g., `{ price: stats.mean, volume: stats.sum }`)
   *   - For upsampling: object with `method` key (e.g., `{ method: stats.forwardFill }`) or per-column fill methods
   * @returns DataFrame with resampled data
   *
   * @example
   * // Downsample hourly to daily
   * const daily = df.resample("timestamp", "1D", {
   *   price: stats.mean,
   *   volume: stats.sum
   * });
   *
   * @example
   * // Upsample daily to hourly with forward fill
   * const hourly = df.resample("timestamp", "1H", {
   *   method: stats.forwardFill
   * });
   */
  <
    TimeCol extends keyof Row,
    Options extends ResampleOptions<Row>,
  >(
    timeColumn: RestrictEmptyDataFrame<
      Row,
      ValidateDateColumn<Row, TimeCol, ColumnTypeMismatchDate>,
      EmptyDataFrameResample
    >,
    frequency: Frequency,
    options: Options,
  ): DataFrame<RowAfterResample<Row, TimeCol, Options>>;
};
