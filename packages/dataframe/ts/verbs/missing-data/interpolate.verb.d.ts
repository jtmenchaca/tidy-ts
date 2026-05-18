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
export declare function interpolate(valueColumn: string, xColumn: string, method: "linear" | "spline"): (df: any) => any;
