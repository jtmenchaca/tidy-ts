import type { DataFrame } from "../../dataframe/index.ts";

/**
 * Frequency specification for time-series operations.
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
 * Aggregation function for downsampling.
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
 * Map of column names to their aggregation functions.
 */
export type AggregationMap<T extends Record<string, unknown>> = {
  [K in string]: AggregationFunction<T>;
};

/**
 * Result row type after downsampling.
 */
type RowAfterDownsample<
  Row extends Record<string, unknown>,
  TimeCol extends keyof Row,
  Aggregations extends AggregationMap<Row>,
> =
  & {
    [K in keyof Aggregations]: unknown;
  }
  & {
    [K in TimeCol]: Date;
  };

/**
 * Arguments for downsample operation.
 */
export type DownsampleArgs<
  Row extends Record<string, unknown>,
  TimeCol extends keyof Row,
  Aggregations extends AggregationMap<Row>,
> = {
  timeColumn: TimeCol;
  frequency: Frequency;
  aggregations: Aggregations;
  startDate?: Date;
  endDate?: Date;
};

/**
 * Method signature for downsample on DataFrame.
 */
export type DownsampleMethod<Row extends object> = <
  TimeCol extends keyof Row,
  Aggregations extends AggregationMap<Row & Record<string, unknown>>,
>(
  args: DownsampleArgs<Row & Record<string, unknown>, TimeCol, Aggregations>,
  // deno-lint-ignore no-explicit-any
) => DataFrame<any>;
