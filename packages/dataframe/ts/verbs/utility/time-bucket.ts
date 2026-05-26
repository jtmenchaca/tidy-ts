/**
 * Time bucketing utilities for time-series resampling.
 *
 * This module provides functions for converting frequency specifications to milliseconds
 * and rounding timestamps to time bucket boundaries.
 */

import type { Frequency } from "./resample.types.ts";
import {
  floorCalendarTemporal,
  isCalendarTemporal,
  isTemporalDuration,
  isWallClockTemporalWithoutCalendar,
  parseFrequencyForCalendar,
  toEpochMs,
} from "../../stats/temporal-helpers.ts";

const MS_PER_SECOND = 1000;
const MS_PER_MINUTE = 60 * MS_PER_SECOND;
const MS_PER_HOUR = 60 * MS_PER_MINUTE;
const MS_PER_DAY = 24 * MS_PER_HOUR;
const MS_PER_WEEK = 7 * MS_PER_DAY;
const MS_PER_MONTH_APPROX = 30 * MS_PER_DAY;
const MS_PER_YEAR_APPROX = 365 * MS_PER_DAY;

/**
 * Convert a frequency to milliseconds.
 *
 * Accepts three shapes:
 * - **Number** — milliseconds directly (passthrough).
 * - **String** — `<number><unit>` where unit is `S`, `min`, `H`, `D`, `W`, `M`,
 *   or `Y`. Month and Year use approximate fixed lengths (30 / 365 days);
 *   calendar-aware bucketing happens upstream in the calendar path.
 * - **`Temporal.Duration`** — the recommended form. Computed by summing each
 *   unit's contribution. Month is approximated as 30 days and Year as 365
 *   days on the epoch path; the calendar path uses real calendar arithmetic.
 *
 * @throws Error if the string format is unparseable or its unit is unknown.
 *
 * @example
 * frequencyToMs("1D")                                       // 86_400_000
 * frequencyToMs("15min")                                    // 900_000
 * frequencyToMs(5000)                                       // 5000
 * frequencyToMs(Temporal.Duration.from({ hours: 2 }))       // 7_200_000
 * frequencyToMs(Temporal.Duration.from({ minutes: 5 }))     // 300_000
 */
export function frequencyToMs(frequency: Frequency): number {
  // Direct milliseconds
  if (typeof frequency === "number") {
    return frequency;
  }

  // Temporal.Duration — sum the units we know about
  if (isTemporalDuration(frequency)) {
    const d = frequency as unknown as {
      years: number;
      months: number;
      weeks: number;
      days: number;
      hours: number;
      minutes: number;
      seconds: number;
      milliseconds: number;
      microseconds?: number;
      nanoseconds?: number;
    };
    return (
      d.years * MS_PER_YEAR_APPROX +
      d.months * MS_PER_MONTH_APPROX +
      d.weeks * MS_PER_WEEK +
      d.days * MS_PER_DAY +
      d.hours * MS_PER_HOUR +
      d.minutes * MS_PER_MINUTE +
      d.seconds * MS_PER_SECOND +
      d.milliseconds +
      (d.microseconds ?? 0) / 1000 +
      (d.nanoseconds ?? 0) / 1_000_000
    );
  }

  // String format: parse "1D", "15min", etc.
  const match = (frequency as string).match(/^(\d+)([A-Za-z]+)$/);
  if (!match) {
    throw new Error(`Invalid frequency format: ${frequency}`);
  }

  const value = parseInt(match[1], 10);
  const unit = match[2];

  const multipliers: Record<string, number> = {
    S: MS_PER_SECOND,
    min: MS_PER_MINUTE,
    H: MS_PER_HOUR,
    D: MS_PER_DAY,
    W: MS_PER_WEEK,
    M: MS_PER_MONTH_APPROX,
    Y: MS_PER_YEAR_APPROX,
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
  timestamp: Date | string | number | unknown,
  frequencyMs: number,
): number {
  // Accepts Date, string, number, and epoch-capable Temporal types (Instant, ZonedDateTime).
  // Wall-clock Temporal types (PlainDate, PlainDateTime, PlainTime) will produce NaN
  // because they have no inherent epoch value.
  const time = toEpochMs(timestamp);

  if (isNaN(time)) {
    throw new Error(`Invalid timestamp: ${timestamp}`);
  }

  // Round down to nearest bucket
  return Math.floor(time / frequencyMs) * frequencyMs;
}

/**
 * Get a calendar-path time bucket key for a CalendarTemporal value (PlainDate/PlainDateTime).
 * Returns an ISO string bucket key using native Temporal `with()`/`subtract()`.
 *
 * @param timestamp - A CalendarTemporal value (PlainDate or PlainDateTime)
 * @param frequency - Frequency specification (string or `Temporal.Duration`, NOT raw ms)
 * @returns ISO string bucket key
 * @throws Error if frequency can't be parsed or timestamp is PlainTime
 */
export function getCalendarTemporalBucket(
  timestamp: unknown,
  frequency: Frequency,
): string {
  if (isWallClockTemporalWithoutCalendar(timestamp)) {
    throw new Error(
      "PlainTime cannot be used for time-series bucketing (no date component).",
    );
  }

  if (!isCalendarTemporal(timestamp)) {
    throw new Error(
      `Expected a CalendarTemporal (PlainDate/PlainDateTime), got ${typeof timestamp}`,
    );
  }

  const freq = parseFrequencyForCalendar(frequency);
  if (!freq) {
    throw new Error(
      `Cannot use raw millisecond frequency with calendar Temporal types. Use a string frequency like "1D", "1M", etc.`,
    );
  }

  return floorCalendarTemporal(timestamp, freq).toString();
}
