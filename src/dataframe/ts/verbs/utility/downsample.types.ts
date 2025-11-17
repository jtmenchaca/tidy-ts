import type {
  DataFrame,
  GroupedDataFrame,
  Prettify,
} from "../../dataframe/index.ts";

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
 * Result row type after downsampling.
 * Uses ReturnType directly like summarise to properly infer return types.
 * The conditional type ensures ReturnType is properly evaluated.
 */
export type RowAfterDownsample<
  Row extends Record<string, unknown>,
  TimeCol extends keyof Row,
  // deno-lint-ignore no-explicit-any
  Aggregations extends Record<string, (...args: any[]) => any>,
> = Prettify<
  & {
    [K in keyof Aggregations]: Aggregations[K] extends (
      // deno-lint-ignore no-explicit-any
      ...args: any[]
    ) => infer R ? R
      : ReturnType<Aggregations[K]>;
  }
  & {
    [K in TimeCol]: Date;
  }
>;

/**
 * Arguments for downsample operation.
 */
export type DownsampleArgs<
  Row extends Record<string, unknown>,
  TimeCol extends keyof Row,
  Aggregations,
> = {
  timeColumn: TimeCol;
  frequency: Frequency;
  aggregations: Aggregations;
  startDate?: Date;
  endDate?: Date;
};

/**
 * Method signature for downsample on DataFrame.
 * Uses the same pattern as resample to preserve function return types and group columns.
 */
export interface DownsampleMethod<Row extends object> {
  /**
   * Downsample grouped DataFrame - preserves group columns in result.
   */
  <
    GroupName extends keyof Row,
    TimeCol extends keyof Row & string,
    Aggregations extends Record<
      string,
      // deno-lint-ignore no-explicit-any
      (...args: any[]) => any
    >,
  >(
    this: GroupedDataFrame<Row, GroupName>,
    args: DownsampleArgs<Row & Record<string, unknown>, TimeCol, Aggregations>,
  ): DataFrame<
    Prettify<
      & Pick<Row, GroupName> // Include group columns
      & RowAfterDownsample<
        Row & Record<string, unknown>,
        TimeCol,
        Aggregations
      > // Include downsampled columns
    >
  >;

  /**
   * Downsample regular DataFrame.
   */
  <
    TimeCol extends keyof Row & string,
    Aggregations extends Record<
      string,
      // deno-lint-ignore no-explicit-any
      (...args: any[]) => any
    >,
  >(
    args: DownsampleArgs<Row & Record<string, unknown>, TimeCol, Aggregations>,
  ): DataFrame<
    RowAfterDownsample<Row & Record<string, unknown>, TimeCol, Aggregations>
  >;
}
