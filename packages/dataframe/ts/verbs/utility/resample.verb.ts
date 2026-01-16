// // deno-lint-ignore-file no-explicit-any
// import type { DataFrame, GroupedDataFrame } from "../../dataframe/index.ts";
// import { createDataFrame } from "../../dataframe/index.ts";
// import type {
//   AggregationFunction,
//   FillMethod,
//   ResampleArgs,
//   ResampleOptions,
// } from "./resample.types.ts";
// import { stats } from "../../stats/stats.ts";
// import { frequencyToMs, getTimeBucket } from "./time-bucket.ts";
// import {
//   generateCalendarBuckets,
//   getCalendarBucket,
//   isCalendarFrequency,
//   parseCalendarFrequency,
// } from "./calendar.ts";

// /**
//  * Resample time-series data to a different frequency.
//  *
//  * Resamples time-series data by either downsampling (aggregating) or upsampling (filling).
//  * The time column must be of type Date (or Date | null).
//  *
//  * **Downsampling** (aggregation): Groups rows by time buckets and applies aggregation functions.
//  * Use this when converting from higher frequency to lower frequency (e.g., hourly to daily).
//  *
//  * **Upsampling** (filling): Generates a time sequence and fills missing values.
//  * Use this when converting from lower frequency to higher frequency (e.g., daily to hourly).
//  *
//  * @param args - Named arguments object
//  * @param args.timeColumn - Name of the Date column to use for resampling
//  * @param args.frequency - Target frequency (e.g., "1D", "1H", "15min", "1W", "1M")
//  *   - Seconds: "1S", "5S", "15S", "30S"
//  *   - Minutes: "1min", "5min", "15min", "30min"
//  *   - Hours: "1H"
//  *   - Days: "1D"
//  *   - Weeks: "1W"
//  *   - Months: "1M"
//  *   - Quarters: "1Q"
//  *   - Years: "1Y"
//  *   - Custom: number (milliseconds) or { value: number, unit: "ms" | "s" | "min" | "h" | "d" | "w" | "M" | "Q" | "Y" }
//  * @param args.metrics - Resampling metrics
//  *   - For downsampling: object mapping column names to aggregation functions (e.g., `{ price: stats.mean, volume: stats.sum }`)
//  *   - For upsampling: object with `method` key (e.g., `{ method: stats.forwardFill }`) or per-column fill methods
//  * @param args.startDate - Optional: Start date for resampling period. If provided, always starts from this date (hard constraint).
//  *   - If data starts before startDate: truncates and starts from startDate
//  *   - If data starts after startDate: starts from startDate and forward-fills nulls until first data point
//  * @param args.endDate - Optional: End date for resampling period. If provided, always extends to this date.
//  *   - Forward-fills if needed when endDate is after last data point
//  * @returns A function that takes a DataFrame and returns a DataFrame with resampled data
//  *
//  * @example
//  * // Downsample hourly to daily
//  * const daily = df.resample({
//  *   timeColumn: "timestamp",
//  *   frequency: "1D",
//  *   metrics: {
//  *     price: stats.mean,
//  *     volume: stats.sum
//  *   }
//  * });
//  *
//  * @example
//  * // Upsample daily to hourly with forward fill
//  * const hourly = df.resample({
//  *   timeColumn: "timestamp",
//  *   frequency: "1H",
//  *   metrics: {
//  *     method: stats.forwardFill
//  *   }
//  * });
//  *
//  * @example
//  * // Downsample with startDate and endDate (fiscal year alignment)
//  * const fiscalQ2 = df.resample({
//  *   timeColumn: "timestamp",
//  *   frequency: "1M",
//  *   metrics: {
//  *     sales: stats.sum
//  *   },
//  *   startDate: new Date("2023-04-01"),
//  *   endDate: new Date("2023-06-30")
//  * });
//  *
//  * @example
//  * // Upsample with per-column fill methods
//  * const hourly = df.resample({
//  *   timeColumn: "timestamp",
//  *   frequency: "1H",
//  *   metrics: {
//  *     price: stats.forwardFill,
//  *     volume: stats.backwardFill
//  *   }
//  * });
//  *
//  * @example
//  * // Works with grouped DataFrames
//  * const result = df.groupBy("symbol").resample({
//  *   timeColumn: "timestamp",
//  *   frequency: "1D",
//  *   metrics: {
//  *     price: stats.mean
//  *   },
//  *   startDate: new Date("2023-01-01"),
//  *   endDate: new Date("2023-12-31")
//  * });
//  */
// export function resample<T extends Record<string, unknown>>(
//   args: ResampleArgs<T, keyof T, ResampleOptions<T>>,
// ) {
//   // Extract timeColumn as keyof T (the validation types are for compile-time only)
//   const timeColumn = args.timeColumn as keyof T;

//   return (df: DataFrame<T> | GroupedDataFrame<T, keyof T>): DataFrame<any> => {
//     const rows = Array.from(df);
//     if (rows.length === 0) {
//       return createDataFrame([]) as unknown as DataFrame<any>;
//     }

//     const hasGlobalMethod = typeof args.metrics === "object" && "method" in args.metrics;
//     const isUpsampling = hasGlobalMethod || Object.values(args.metrics).some(
//       (opt) =>
//         typeof opt === "function" &&
//         (isForwardFill(opt) || isBackwardFill(opt)),
//     );

//     const frequencyMs = frequencyToMs(args.frequency);

//     if (isUpsampling) {
//       return upsample(df, timeColumn, args.frequency, frequencyMs, args.metrics as any, args.startDate, args.endDate);
//     } else {
//       return downsample(df, timeColumn, args.frequency, frequencyMs, args.metrics as any, args.startDate, args.endDate);
//     }
//   };
// }
