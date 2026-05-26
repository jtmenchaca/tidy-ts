/**
 * Calendar-aware date utilities for time-series resampling.
 *
 * Handles calendar periods (months, years) that have variable lengths,
 * unlike fixed-duration periods (seconds, minutes, hours, days, weeks).
 */

import type { Frequency } from "./resample.types.ts";
import { isTemporalDuration } from "../../stats/temporal-helpers.ts";

/**
 * Determine if a frequency requires calendar-aware bucketing on epoch-based
 * time columns (`Date`, `Instant`, `ZonedDateTime`). Months and years have
 * variable lengths so they need calendar arithmetic; everything else is
 * a fixed millisecond duration.
 *
 * (Wall-clock Temporal columns like `PlainDate` / `PlainDateTime` always go
 * through the calendar path regardless of frequency — this helper is only
 * used on the epoch path.)
 */
export function isCalendarFrequency(frequency: Frequency): boolean {
  if (typeof frequency === "number") return false;

  if (isTemporalDuration(frequency)) {
    const d = frequency as unknown as { years: number; months: number };
    return d.years !== 0 || d.months !== 0;
  }

  if (typeof frequency !== "string") return false;

  // String format: check if unit is M or Y
  const match = frequency.match(/^(\d+)([A-Za-z]+)$/);
  if (!match) return false;
  return match[2] === "M" || match[2] === "Y";
}

/**
 * Parse a calendar-aware frequency into `{ value, unit }`.
 * Returns null for non-calendar frequencies, raw ms, or `Temporal.Duration`s
 * that mix multiple non-zero units.
 */
export function parseCalendarFrequency(
  frequency: Frequency,
): { value: number; unit: "M" | "Y" } | null {
  if (typeof frequency === "number") return null;

  if (isTemporalDuration(frequency)) {
    const d = frequency as unknown as { years: number; months: number };
    if (d.years !== 0 && d.months === 0) return { value: d.years, unit: "Y" };
    if (d.months !== 0 && d.years === 0) return { value: d.months, unit: "M" };
    return null;
  }

  if (typeof frequency !== "string") return null;

  const match = frequency.match(/^(\d+)([MY])$/);
  if (!match) return null;

  return {
    value: parseInt(match[1], 10),
    unit: match[2] as "M" | "Y",
  };
}

/**
 * Add calendar periods to a date.
 */
function addCalendarPeriod(
  date: number,
  value: number,
  unit: "M" | "Y",
): number {
  const d = new Date(date);

  switch (unit) {
    case "M":
      d.setUTCMonth(d.getUTCMonth() + value);
      break;
    case "Y":
      d.setUTCFullYear(d.getUTCFullYear() + value);
      break;
  }

  return d.getTime();
}

/**
 * Get the calendar bucket for a timestamp.
 *
 * Rounds down to the start of the period containing the timestamp.
 *  - `M`: rounds to 1st of the month at midnight UTC (with `periodValue > 1`,
 *         groups into multiples — `3M` → Jan/Apr/Jul/Oct).
 *  - `Y`: rounds to Jan 1st at midnight UTC.
 *
 * @example
 * getCalendarBucket(new Date("2023-04-15T10:30:00Z").getTime(), "M", 1)
 * // → 2023-04-01T00:00:00.000Z
 */
export function getCalendarBucket(
  timestamp: number,
  unit: "M" | "Y",
  periodValue: number = 1,
): number {
  const d = new Date(timestamp);

  switch (unit) {
    case "M": {
      const month = d.getUTCMonth();
      const year = d.getUTCFullYear();
      const monthInPeriod = Math.floor(month / periodValue) * periodValue;
      return new Date(Date.UTC(year, monthInPeriod, 1, 0, 0, 0, 0)).getTime();
    }

    case "Y": {
      const year = d.getUTCFullYear();
      const yearInPeriod = Math.floor(year / periodValue) * periodValue;
      return new Date(Date.UTC(yearInPeriod, 0, 1, 0, 0, 0, 0)).getTime();
    }
  }
}

/**
 * Generate calendar buckets from start to end (inclusive).
 */
export function generateCalendarBuckets(
  startTime: number,
  endTime: number,
  value: number,
  unit: "M" | "Y",
): number[] {
  const buckets: number[] = [];

  // Start from the bucket containing startTime
  let currentBucket = getCalendarBucket(startTime, unit, value);

  // Generate buckets until we exceed endTime
  while (currentBucket <= endTime) {
    buckets.push(currentBucket);
    currentBucket = addCalendarPeriod(currentBucket, value, unit);
  }

  return buckets;
}
