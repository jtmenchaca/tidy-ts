/**
 * Interpolate null/undefined values in an array using linear or spline interpolation.
 * Requires an x-axis array to define spacing between points.
 *
 * @param values - Array of values (may contain nulls) - numbers or Dates
 * @param xValues - Array of numeric or Date values defining x-axis spacing (required)
 * @param method - Interpolation method: "linear" or "spline"
 * @returns Array with interpolated values (same length as input)
 *
 * @example
 * ```ts
 * import { stats } from "@tidy-ts/dataframe";
 *
 * // Linear interpolation with numbers
 * const interpolated = stats.interpolate(
 *   [100, null, null, 200],
 *   [1, 2, 3, 4],
 *   "linear"
 * );
 * // Returns: [100, 133.33, 166.67, 200]
 *
 * // Spline interpolation
 * const smooth = stats.interpolate(
 *   [100, null, null, 200],
 *   [1, 2, 3, 4],
 *   "spline"
 * );
 *
 * // With Dates
 * const dates = [
 *   new Date("2023-01-01"),
 *   null,
 *   null,
 *   new Date("2023-01-04")
 * ];
 * const interpolatedDates = stats.interpolate(
 *   dates,
 *   [1, 2, 3, 4],
 *   "linear"
 * );
 * ```
 *
 * @remarks
 * - Only interpolates values that have both previous and next non-null values
 * - Leading/trailing nulls remain null (can't interpolate without bounds)
 * - For spline: requires at least 4 points, falls back to linear if fewer
 * - Dates are converted to/from timestamps (milliseconds) for interpolation
 */
export declare function interpolate<T extends number | Date>(values: (T | null | undefined)[], xValues: (number | Date)[], method: "linear" | "spline"): T[];
