import type {
  DataFrame,
  GroupedDataFrame,
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
 * Aggregation spec for downsampling.
 *
 * Every entry uses the explicit `{ column, fn }` form so there is exactly
 * one way to write an aggregation and no implicit column-picking magic.
 *
 * - `column` — source column to read values from for each time bucket.
 * - `fn` — function applied to the bucket's values (e.g. `stats.mean`, `stats.sum`).
 * - The output column name is the key in the `aggregations` record.
 *
 * Example:
 * ```ts
 * df.downsample({
 *   timeColumn: "timestamp",
 *   frequency: "1D",
 *   aggregations: {
 *     // simple case: output column matches source column
 *     price:  { column: "price",  fn: stats.mean },
 *     volume: { column: "volume", fn: stats.sum },
 *     // multiple outputs from one source (OHLC)
 *     open:   { column: "price", fn: stats.first },
 *     high:   { column: "price", fn: stats.max },
 *     low:    { column: "price", fn: stats.min },
 *     close:  { column: "price", fn: stats.last },
 *   },
 * });
 * ```
 */
// deno-lint-ignore no-explicit-any
export type AggregationFn = (...args: any[]) => any;

export type AggregationSpec<SourceCol extends string = string> = {
  column: SourceCol;
  fn: AggregationFn;
};

/**
 * @deprecated Use AggregationFn / AggregationSpec instead.
 */
// deno-lint-ignore no-explicit-any
export type AggregationFunction<T extends object> = (...args: any[]) => any;

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
 * Helper: infer the value type produced by an aggregation spec's `fn`.
 */
// deno-lint-ignore no-explicit-any
type SpecReturn<Spec> = Spec extends { fn: (...args: any[]) => infer Ret } ? Ret
  : never;

/**
 * Method signature for downsample on DataFrame.
 * Uses the same pattern as resample to preserve function return types and group columns.
 */
export interface DownsampleMethod<Row extends object> {
  /**
   * Downsample grouped DataFrame - preserves group columns in result.
   */
  <
    R extends object,
    GroupName extends keyof R,
    TimeCol extends keyof R & string,
    Aggregations extends Record<string, AggregationSpec<keyof R & string>>,
  >(
    this: GroupedDataFrame<R, GroupName>,
    args: DownsampleArgs<R & Record<string, unknown>, TimeCol, Aggregations>,
  ): DataFrame<
    {
      [K in GroupName | Exclude<keyof Aggregations, TimeCol> | TimeCol]:
        K extends TimeCol ? Date
          : K extends keyof Aggregations ? SpecReturn<Aggregations[K]>
          : K extends keyof R ? R[K]
          : never;
    }
  >;

  /**
   * Downsample regular DataFrame.
   */
  <
    R extends object,
    TimeCol extends keyof R & string,
    Aggregations extends Record<string, AggregationSpec<keyof R & string>>,
  >(
    this: DataFrame<R>,
    args: DownsampleArgs<R & Record<string, unknown>, TimeCol, Aggregations>,
  ): DataFrame<
    {
      [K in Exclude<keyof Aggregations, TimeCol> | TimeCol]:
        K extends TimeCol ? Date
          : K extends keyof Aggregations ? SpecReturn<Aggregations[K]>
          : never;
    }
  >;
}
