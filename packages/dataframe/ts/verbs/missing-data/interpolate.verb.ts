import {
  createDataFrame,
  type DataFrame,
  type UnifyUnion,
} from "../../dataframe/index.ts";
import { interpolate as statsInterpolate } from "../../stats/window/interpolate.ts";
import {
  calendarTemporalDistance,
  isCalendarTemporal,
  isComparable,
  isWallClockTemporalWithoutCalendar,
  temporalToEpochMs,
} from "../../stats/helpers.ts";

/**
 * Interpolate null/undefined values in a column using linear or spline interpolation.
 * Requires an x-axis column to define spacing between points.
 *
 * @param valueColumn - Column name containing values to interpolate (numbers or Dates)
 * @param xColumn - Column name containing x-axis values (numeric or Date, required)
 * @param method - Interpolation method: "linear" or "spline"
 * @returns A function that takes a DataFrame and returns a DataFrame with interpolated values
 *
 * @example
 * ```ts
 * const df = createDataFrame([
 *   { timestamp: 1, value: 100 },
 *   { timestamp: 2, value: null },
 *   { timestamp: 3, value: null },
 *   { timestamp: 4, value: 200 },
 * ]);
 *
 * const interpolated = pipe(df, interpolate("value", "timestamp", "linear"));
 * // Results in:
 * // [
 * //   { timestamp: 1, value: 100 },
 * //   { timestamp: 2, value: 133.33 },  // interpolated
 * //   { timestamp: 3, value: 166.67 },  // interpolated
 * //   { timestamp: 4, value: 200 },
 * // ]
 * ```
 *
 * @remarks
 * - Only interpolates values that have both previous and next non-null values
 * - Leading/trailing nulls remain null (can't interpolate without bounds)
 * - For spline: requires at least 4 points, falls back to linear if fewer
 * - Dates are converted to/from timestamps (milliseconds) for interpolation
 */
export function interpolate<T extends Record<string, unknown>>(
  valueColumn: keyof T & string,
  xColumn: keyof T & string,
  method: "linear" | "spline",
) {
  return (df: DataFrame<T>): DataFrame<UnifyUnion<T>> => {
    const result: T[] = [];

    // Extract arrays from DataFrame
    const values: (unknown)[] = [];
    const xValues: (number | Date)[] = [];
    let calendarBaseValue:
      | import("../../stats/helpers.ts").CalendarTemporal
      | null = null;

    for (const row of df) {
      values.push(row[valueColumn as keyof T]);
      const xValue = row[xColumn as keyof T];
      if (xValue instanceof Date) {
        xValues.push(xValue);
      } else if (typeof xValue === "number") {
        xValues.push(xValue);
      } else if (isCalendarTemporal(xValue)) {
        // Calendar path: use until().total() for numeric spacing relative to first value
        if (!calendarBaseValue) {
          calendarBaseValue = xValue;
          xValues.push(0);
        } else {
          xValues.push(
            calendarTemporalDistance(calendarBaseValue, xValue, "days"),
          );
        }
      } else if (isWallClockTemporalWithoutCalendar(xValue)) {
        throw new Error(
          `interpolate: xColumn "${xColumn}" contains a PlainTime which has no date component. Use PlainDate, PlainDateTime, Instant, or ZonedDateTime.`,
        );
      } else if (isComparable(xValue)) {
        // Epoch-capable Temporal types (Instant, ZonedDateTime)
        const ms = temporalToEpochMs(xValue);
        if (isNaN(ms)) {
          throw new Error(
            `interpolate: xColumn "${xColumn}" contains a wall-clock Temporal type which has no epoch value. Use Instant or ZonedDateTime for time-series interpolation.`,
          );
        }
        xValues.push(ms);
      } else {
        throw new Error(
          `interpolate: xColumn "${xColumn}" must be numeric, Date, or Temporal, got ${typeof xValue}`,
        );
      }
    }

    // Perform interpolation
    const interpolated = statsInterpolate(
      values as (number | Date | null | undefined)[],
      xValues,
      method,
    );

    // Build result DataFrame
    let idx = 0;
    for (const row of df) {
      const newRow = { ...row };
      newRow[valueColumn as keyof T] = interpolated[idx] as T[keyof T];
      result.push(newRow);
      idx++;
    }

    return createDataFrame(result) as unknown as DataFrame<UnifyUnion<T>>;
  };
}
