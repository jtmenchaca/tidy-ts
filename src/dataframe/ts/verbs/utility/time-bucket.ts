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
export function frequencyToMs(frequency: Frequency): number {
  // Direct milliseconds
  if (typeof frequency === "number") {
    return frequency;
  }

  // Object format: { value, unit }
  if (typeof frequency === "object") {
    const { value, unit } = frequency;
    const multipliers: Record<string, number> = {
      ms: 1,
      s: 1000,
      min: 60 * 1000,
      h: 60 * 60 * 1000,
      d: 24 * 60 * 60 * 1000,
      w: 7 * 24 * 60 * 60 * 1000,
      M: 30 * 24 * 60 * 60 * 1000, // Approximate month
      Q: 90 * 24 * 60 * 60 * 1000, // Approximate quarter
      Y: 365 * 24 * 60 * 60 * 1000, // Approximate year
    };
    return value * (multipliers[unit] || 1000);
  }

  // String format: parse "1D", "15min", etc.
  const match = frequency.match(/^(\d+)([A-Za-z]+)$/);
  if (!match) {
    throw new Error(`Invalid frequency format: ${frequency}`);
  }

  const value = parseInt(match[1], 10);
  const unit = match[2];

  const multipliers: Record<string, number> = {
    S: 1000,
    min: 60 * 1000,
    H: 60 * 60 * 1000,
    D: 24 * 60 * 60 * 1000,
    W: 7 * 24 * 60 * 60 * 1000,
    M: 30 * 24 * 60 * 60 * 1000, // Approximate month
    Q: 90 * 24 * 60 * 60 * 1000, // Approximate quarter
    Y: 365 * 24 * 60 * 60 * 1000, // Approximate year
  };

  const multiplier = multipliers[unit];
  if (!multiplier) {
    throw new Error(`Unknown frequency unit: ${unit}`);
  }

  return value * multiplier;
}

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
export function getTimeBucket(
  timestamp: Date | string | number,
  frequencyMs: number,
): number {
  const time = timestamp instanceof Date
    ? timestamp.getTime()
    : typeof timestamp === "string"
    ? new Date(timestamp).getTime()
    : timestamp;

  if (isNaN(time)) {
    throw new Error(`Invalid timestamp: ${timestamp}`);
  }

  // Round down to nearest bucket
  return Math.floor(time / frequencyMs) * frequencyMs;
}
