import type {
  DataFrame,
  GroupedDataFrame,
  Prettify,
} from "../../dataframe/index.ts";
import type {
  ColumnTypeMismatchDate,
  EmptyDataFrameResample,
  RestrictEmptyDataFrame,
  ValidateDateColumn,
} from "../../dataframe/types/error-types.ts";

/**
 * Frequency specification for resampling.
 *
 * Supports common time periods as strings (e.g., "1H", "6H", "15min")
 * or as objects (e.g., { value: 6, unit: "h" }) or as raw milliseconds (number).
 *
 * Pattern: `<number><unit>` where unit is:
 * - S: seconds
 * - min: minutes
 * - H: hours
 * - D: days
 * - W: weeks
 * - M: months (calendar-aware)
 * - Q: quarters (calendar-aware)
 * - Y: years (calendar-aware)
 */
export type Frequency =
  | `${number}S`
  | `${number}min`
  | `${number}H`
  | `${number}D`
  | `${number}W`
  | `${number}M`
  | `${number}Q`
  | `${number}Y`
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
 * Named arguments for resample method.
 */
export type ResampleArgs<
  Row extends object,
  TimeCol extends keyof Row,
  Options extends ResampleOptions<Row>,
> = {
  timeColumn: RestrictEmptyDataFrame<
    Row,
    ValidateDateColumn<Row, TimeCol, ColumnTypeMismatchDate>,
    EmptyDataFrameResample
  >;
  frequency: Frequency;
  metrics: Options;
  startDate?: Date;
  endDate?: Date;
};

/**
 * Resample method for DataFrame.
 *
 * Resamples time-series data to a different frequency. Supports both downsampling (aggregating)
 * and upsampling (filling). The time column must be of type Date (or Date | null).
 *
 * **Downsampling** (aggregation): Groups rows by time buckets and applies aggregation functions.
 * Use this when converting from higher frequency to lower frequency (e.g., hourly to daily).
 *
 * **Upsampling** (filling): Generates a time sequence and fills missing values.
 * Use this when converting from lower frequency to higher frequency (e.g., daily to hourly).
 *
 * @example
 * // Downsample hourly to daily
 * const daily = df.resample({
 *   timeColumn: "timestamp",
 *   frequency: "1D",
 *   metrics: {
 *     price: stats.mean,
 *     volume: stats.sum
 *   }
 * });
 *
 * @example
 * // Upsample daily to hourly with forward fill
 * const hourly = df.resample({
 *   timeColumn: "timestamp",
 *   frequency: "1H",
 *   metrics: {
 *     method: stats.forwardFill
 *   }
 * });
 *
 * @example
 * // Per-column fill methods
 * const hourly = df.resample({
 *   timeColumn: "timestamp",
 *   frequency: "1H",
 *   metrics: {
 *     price: stats.forwardFill,
 *     volume: stats.backwardFill
 *   }
 * });
 *
 * @example
 * // With startDate and endDate for fiscal year alignment
 * const fiscalQ2 = df.resample({
 *   timeColumn: "timestamp",
 *   frequency: "1M",
 *   metrics: {
 *     sales: stats.sum
 *   },
 *   startDate: new Date("2023-04-01"),
 *   endDate: new Date("2023-06-30")
 * });
 *
 * @example
 * // Works with grouped DataFrames
 * const result = df.groupBy("symbol").resample({
 *   timeColumn: "timestamp",
 *   frequency: "1D",
 *   metrics: {
 *     price: stats.mean
 *   },
 *   startDate: new Date("2023-01-01"),
 *   endDate: new Date("2023-12-31")
 * });
 */
export type ResampleMethod<Row extends object> = {
  /**
   * Resample time-series data to a different frequency (grouped DataFrame).
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
   * @param args - Named arguments object
   * @param args.timeColumn - Name of the Date column to use for resampling
   * @param args.frequency - Target frequency (e.g., "1D", "1H", "15min", "1W", "1M")
   * @param args.metrics - Resampling metrics
   *   - For downsampling: object mapping column names to aggregation functions (e.g., `{ price: stats.mean, volume: stats.sum }`)
   *   - For upsampling: object with `method` key (e.g., `{ method: stats.forwardFill }`) or per-column fill methods
   * @param args.startDate - Optional: Start date for resampling period
   * @param args.endDate - Optional: End date for resampling period
   * @returns Grouped DataFrame with resampled data (preserves grouping)
   *
   * @example
   * // Resample grouped data with consistent date ranges
   * const result = df.groupBy("symbol").resample({
   *   timeColumn: "timestamp",
   *   frequency: "1D",
   *   metrics: {
   *     price: stats.mean
   *   },
   *   startDate: new Date("2023-01-01"),
   *   endDate: new Date("2023-12-31")
   * });
   */
  <
    GroupName extends keyof Row,
    TimeCol extends keyof Row,
    Options extends ResampleOptions<Row>,
  >(
    this: GroupedDataFrame<Row, GroupName>,
    args: ResampleArgs<Row, TimeCol, Options>,
  ): DataFrame<
    Prettify<
      & Pick<Row, GroupName> // Include group columns
      & RowAfterResample<Row, TimeCol, Options> // Include resampled columns
    >
  >;

  /**
   * Resample time-series data to a different frequency (regular DataFrame).
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
   * @param args - Named arguments object
   * @param args.timeColumn - Name of the Date column to use for resampling
   * @param args.frequency - Target frequency (e.g., "1D", "1H", "15min", "1W", "1M")
   * @param args.metrics - Resampling metrics
   *   - For downsampling: object mapping column names to aggregation functions (e.g., `{ price: stats.mean, volume: stats.sum }`)
   *   - For upsampling: object with `method` key (e.g., `{ method: stats.forwardFill }`) or per-column fill methods
   * @param args.startDate - Optional: Start date for resampling period. If provided, always starts from this date (hard constraint).
   *   - If data starts before startDate: truncates and starts from startDate
   *   - If data starts after startDate: starts from startDate and forward-fills nulls until first data point
   * @param args.endDate - Optional: End date for resampling period. If provided, always extends to this date.
   *   - Forward-fills if needed when endDate is after last data point
   * @returns DataFrame with resampled data
   *
   * @example
   * // Downsample hourly to daily
   * const daily = df.resample({
   *   timeColumn: "timestamp",
   *   frequency: "1D",
   *   metrics: {
   *     price: stats.mean,
   *     volume: stats.sum
   *   }
   * });
   *
   * @example
   * // Upsample daily to hourly with forward fill
   * const hourly = df.resample({
   *   timeColumn: "timestamp",
   *   frequency: "1H",
   *   metrics: {
   *     method: stats.forwardFill
   *   }
   * });
   *
   * @example
   * // With startDate and endDate for consistent date ranges
   * const result = df.resample({
   *   timeColumn: "timestamp",
   *   frequency: "1D",
   *   metrics: {
   *     price: stats.mean
   *   },
   *   startDate: new Date("2023-01-01"),
   *   endDate: new Date("2023-12-31")
   * });
   */
  <
    TimeCol extends keyof Row,
    Options extends ResampleOptions<Row>,
  >(
    args: ResampleArgs<Row, TimeCol, Options>,
  ): DataFrame<RowAfterResample<Row, TimeCol, Options>>;
};
