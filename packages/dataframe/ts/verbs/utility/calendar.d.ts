/**
 * Calendar-aware date utilities for time-series resampling.
 *
 * Handles calendar periods (months, quarters, years) that have variable lengths,
 * unlike fixed-duration periods (seconds, minutes, hours, days, weeks).
 */
import type { Frequency } from "./resample.types.ts";
/**
 * Determine if a frequency requires calendar-aware bucketing.
 *
 * Calendar-aware frequencies: "1M", "1Q", "1Y" (months, quarters, years)
 * Fixed-duration frequencies: "1S", "1min", "1H", "1D", "1W" (seconds through weeks)
 */
export declare function isCalendarFrequency(frequency: Frequency): boolean;
/**
 * Parse calendar frequency into value and unit.
 */
export declare function parseCalendarFrequency(frequency: Frequency): {
    value: number;
    unit: "M" | "Q" | "Y";
} | null;
/**
 * Get the calendar bucket for a timestamp.
 *
 * Rounds down to the start of the period containing the timestamp.
 * For months: rounds to 1st of the month at midnight UTC
 * For quarters: rounds to 1st of quarter (Jan/Apr/Jul/Oct) at midnight UTC
 * For years: rounds to Jan 1st at midnight UTC
 *
 * @param timestamp - Timestamp in milliseconds
 * @param unit - Period unit
 * @param periodValue - Number of periods (e.g., 1 for "1M", 3 for "3M")
 * @returns Bucket start time in milliseconds
 *
 * @example
 * getCalendarBucket(new Date("2023-04-15T10:30:00Z").getTime(), "M", 1)
 * // Returns: 2023-04-01T00:00:00.000Z
 */
export declare function getCalendarBucket(timestamp: number, unit: "M" | "Q" | "Y", periodValue?: number): number;
/**
 * Generate calendar buckets from start to end.
 *
 * @param startTime - Start time in milliseconds
 * @param endTime - End time in milliseconds
 * @param value - Number of periods
 * @param unit - Period unit
 * @returns Array of bucket timestamps in milliseconds
 *
 * @example
 * generateCalendarBuckets(
 *   new Date("2023-01-15").getTime(),
 *   new Date("2023-03-20").getTime(),
 *   1,
 *   "M"
 * )
 * // Returns: [2023-01-01, 2023-02-01, 2023-03-01]
 */
export declare function generateCalendarBuckets(startTime: number, endTime: number, value: number, unit: "M" | "Q" | "Y"): number[];
