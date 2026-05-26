import type { Temporal } from "@tidy-ts/shims/temporal-polyfill";
import type {
  DataFrame,
  GroupedDataFrame,
} from "../../dataframe/index.ts";

/**
 * Frequency specification for time-series operations.
 *
 * Three accepted shapes:
 * 1. **String** — `<number><unit>` where unit is one of `S`, `min`, `H`, `D`,
 *    `W`, `M`, `Y`. Examples: `"15min"`, `"1H"`, `"1D"`, `"1M"` (one month),
 *    `"1Y"`. Convenient for inline literals.
 * 2. **Number** — raw milliseconds.
 * 3. **`Temporal.Duration`** — unambiguous and recommended when working with
 *    Temporal time columns end-to-end. Examples:
 *    `Temporal.Duration.from({ minutes: 5 })`,
 *    `Temporal.Duration.from({ days: 1 })`,
 *    `Temporal.Duration.from({ months: 1 })`,
 *    `Temporal.Duration.from("PT15M")` (ISO 8601).
 *
 * Calendar-aware vs fixed-duration:
 * - `M` / `Y` (or Duration `months` / `years`) → calendar-aware bucketing on
 *   `Temporal.PlainDate` / `PlainDateTime` columns; on epoch types (`Date`,
 *   `Instant`, `ZonedDateTime`) they fall back to approximate fixed lengths
 *   (30 days / 365 days).
 * - `S` / `min` / `H` / `D` / `W` (or Duration `seconds` / `minutes` / `hours`
 *   / `days` / `weeks`) → fixed-duration on all column types.
 */
export type Frequency =
  | `${number}S`
  | `${number}min`
  | `${number}H`
  | `${number}D`
  | `${number}W`
  | `${number}M`
  | `${number}Y`
  | number
  | Temporal.Duration;

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
   * The time column keeps its input type (Date / Temporal.Instant /
   * Temporal.ZonedDateTime / Temporal.PlainDate / Temporal.PlainDateTime).
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
        K extends TimeCol ? NonNullable<R[K & keyof R]>
          : K extends keyof Aggregations ? SpecReturn<Aggregations[K]>
          : K extends keyof R ? R[K]
          : never;
    }
  >;

  /**
   * Downsample regular DataFrame.
   * The time column keeps its input type (Date / Temporal.Instant /
   * Temporal.ZonedDateTime / Temporal.PlainDate / Temporal.PlainDateTime).
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
        K extends TimeCol ? NonNullable<R[K & keyof R]>
          : K extends keyof Aggregations ? SpecReturn<Aggregations[K]>
          : never;
    }
  >;
}
