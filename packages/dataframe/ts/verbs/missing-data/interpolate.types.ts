import type { DataFrame, Prettify, UnifyUnion } from "../../dataframe/index.ts";

/**
 * Transform Row type after interpolate operation
 * Interpolation may replace null values with interpolated values, but the column type
 * remains the same (number | null or Date | null). UnifyUnion consolidates any union
 * types that TypeScript might infer from the operation.
 */
export type InterpolateResult<Row extends object> = UnifyUnion<Row>;

/**
 * Interpolate null/undefined values in a column using linear or spline interpolation.
 * Requires an x-axis column to define spacing between points.
 *
 * Interpolates missing values by estimating them based on surrounding known values.
 * Unlike forward/backward fill (which copy values), interpolation calculates intermediate
 * values using mathematical methods.
 *
 * @param valueColumn - Column name containing values to interpolate (numbers or Dates)
 * @param xColumn - Column name containing x-axis values (numeric or Date, required)
 * @param method - Interpolation method: "linear" or "spline"
 * @returns DataFrame with interpolated values replacing nulls
 *
 * @example
 * // Linear interpolation with numeric x-axis
 * df.interpolate("value", "timestamp", "linear")
 *
 * @example
 * // Linear interpolation with Date x-axis
 * df.interpolate("price", "date", "linear")
 *
 * @example
 * // Spline interpolation
 * df.interpolate("temperature", "timestamp", "spline")
 *
 * @example
 * // Interpolate missing values in time series
 * const df = createDataFrame([
 *   { timestamp: 1, value: 100 },
 *   { timestamp: 2, value: null },
 *   { timestamp: 3, value: null },
 *   { timestamp: 4, value: 200 },
 * ]);
 * df.interpolate("value", "timestamp", "linear")
 * // Results in interpolated values for the null entries
 *
 * @remarks
 * - Only interpolates values that have both previous and next non-null values
 * - Leading/trailing nulls remain null (can't interpolate without bounds)
 * - For spline: requires at least 4 points, falls back to linear if fewer
 * - Dates are converted to/from timestamps (milliseconds) for interpolation
 */
export type InterpolateMethod<Row extends object> = <
  ValueCol extends keyof Row & string,
  XCol extends keyof Row & string,
>(
  valueColumn: ValueCol,
  xColumn: XCol,
  method: "linear" | "spline",
) => DataFrame<Prettify<InterpolateResult<Row>>>;
