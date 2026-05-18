/**
 * Time bucketing utilities for time-series resampling.
 *
 * This module provides functions for converting frequency specifications to milliseconds
 * and rounding timestamps to time bucket boundaries.
 */
import type { Frequency } from "./resample.types.ts";
/**
 * Convert frequency string to milliseconds.
 *
 * Supports multiple frequency formats:
 * - Number: milliseconds directly
 * - Object: { value: number, unit: "ms" | "s" | "min" | "h" | "d" | "w" | "M" | "Q" | "Y" }
 * - String: "1S", "5min", "1H", "1D", "1W", "1M", "1Q", "1Y"
 *
 * Note: Month (M), Quarter (Q), and Year (Y) use approximate fixed durations:
 * - 1M = 30 days
 * - 1Q = 90 days
 * - 1Y = 365 days
 *
 * @param frequency - Frequency specification
 * @returns Frequency in milliseconds
 * @throws Error if frequency format is invalid or unit is unknown
 *
 * @example
 * frequencyToMs("1D")           // 86400000 (24 * 60 * 60 * 1000)
 * frequencyToMs("15min")        // 900000 (15 * 60 * 1000)
 * frequencyToMs(5000)           // 5000
 * frequencyToMs({ value: 2, unit: "h" })  // 7200000
 */
export declare function frequencyToMs(frequency: Frequency): number;
/**
 * Get time bucket key for a timestamp.
 *
 * Rounds a timestamp down to the nearest bucket boundary based on the frequency.
 * Uses floor division to ensure consistent bucketing.
 *
 * @param timestamp - Timestamp as Date, string, or number (milliseconds since epoch)
 * @param frequencyMs - Frequency in milliseconds (from frequencyToMs)
 * @returns Bucket timestamp in milliseconds (rounded down to nearest bucket boundary)
 * @throws Error if timestamp is invalid
 *
 * @example
 * // With 1-day frequency (86400000 ms)
 * getTimeBucket(new Date("2023-01-01T14:30:00"), 86400000)
 * // Returns timestamp for 2023-01-01T00:00:00 (UTC)
 *
 * @example
 * // With 1-hour frequency (3600000 ms)
 * getTimeBucket("2023-01-01T14:30:00", 3600000)
 * // Returns timestamp for 2023-01-01T14:00:00 (UTC)
 */
export declare function getTimeBucket(timestamp: Date | string | number | unknown, frequencyMs: number): number;
/**
 * Get a calendar-path time bucket key for a CalendarTemporal value (PlainDate/PlainDateTime).
 * Returns an ISO string bucket key using native Temporal `with()`/`subtract()`.
 *
 * @param timestamp - A CalendarTemporal value (PlainDate or PlainDateTime)
 * @param frequency - Frequency specification (string or object, NOT raw ms)
 * @returns ISO string bucket key
 * @throws Error if frequency can't be parsed or timestamp is PlainTime
 */
export declare function getCalendarTemporalBucket(timestamp: unknown, frequency: string | number | {
    value: number;
    unit: string;
}): string;
