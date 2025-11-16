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
export function isCalendarFrequency(frequency: Frequency): boolean {
  if (typeof frequency === "number") return false;

  if (typeof frequency === "object") {
    return ["M", "Q", "Y"].includes(frequency.unit);
  }

  // String format: check if unit is M, Q, or Y
  const match = frequency.match(/^(\d+)([A-Za-z]+)$/);
  if (!match) return false;

  const unit = match[2];
  return ["M", "Q", "Y"].includes(unit);
}

/**
 * Parse calendar frequency into value and unit.
 */
export function parseCalendarFrequency(
  frequency: Frequency,
): { value: number; unit: "M" | "Q" | "Y" } | null {
  if (typeof frequency === "number") return null;

  if (typeof frequency === "object") {
    if (["M", "Q", "Y"].includes(frequency.unit)) {
      return {
        value: frequency.value,
        unit: frequency.unit as "M" | "Q" | "Y",
      };
    }
    return null;
  }

  const match = frequency.match(/^(\d+)([MQY])$/);
  if (!match) return null;

  return {
    value: parseInt(match[1], 10),
    unit: match[2] as "M" | "Q" | "Y",
  };
}

/**
 * Add calendar periods to a date.
 *
 * @param date - Starting date (UTC timestamp in milliseconds)
 * @param value - Number of periods to add
 * @param unit - Period unit ("M" for months, "Q" for quarters, "Y" for years)
 * @returns New date in milliseconds
 *
 * @example
 * addCalendarPeriod(new Date("2023-01-31").getTime(), 1, "M")
 * // Returns: 2023-02-28 (handles month-end correctly)
 */
export function addCalendarPeriod(
  date: number,
  value: number,
  unit: "M" | "Q" | "Y",
): number {
  const d = new Date(date);

  switch (unit) {
    case "M": // Months
      d.setUTCMonth(d.getUTCMonth() + value);
      break;
    case "Q": // Quarters (3 months)
      d.setUTCMonth(d.getUTCMonth() + (value * 3));
      break;
    case "Y": // Years
      d.setUTCFullYear(d.getUTCFullYear() + value);
      break;
  }

  return d.getTime();
}

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
export function getCalendarBucket(
  timestamp: number,
  unit: "M" | "Q" | "Y",
  periodValue: number = 1,
): number {
  const d = new Date(timestamp);

  switch (unit) {
    case "M": {
      // Round down to start of month
      const month = d.getUTCMonth();
      const year = d.getUTCFullYear();

      // If periodValue > 1, round to nearest multiple
      // e.g., "3M" groups into Jan/Apr/Jul/Oct
      const monthInPeriod = Math.floor(month / periodValue) * periodValue;

      return new Date(Date.UTC(year, monthInPeriod, 1, 0, 0, 0, 0)).getTime();
    }

    case "Q": {
      // Round down to start of quarter
      const month = d.getUTCMonth();
      const year = d.getUTCFullYear();

      // Quarters start in Jan (0), Apr (3), Jul (6), Oct (9)
      const quarterStartMonth = Math.floor(month / 3) * 3;

      // If periodValue > 1, round to nearest multiple
      const quarterInPeriod =
        Math.floor((quarterStartMonth / 3) / periodValue) * periodValue;
      const finalMonth = quarterInPeriod * 3;

      return new Date(Date.UTC(year, finalMonth, 1, 0, 0, 0, 0)).getTime();
    }

    case "Y": {
      // Round down to start of year
      const year = d.getUTCFullYear();

      // If periodValue > 1, round to nearest multiple
      const yearInPeriod = Math.floor(year / periodValue) * periodValue;

      return new Date(Date.UTC(yearInPeriod, 0, 1, 0, 0, 0, 0)).getTime();
    }
  }
}

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
export function generateCalendarBuckets(
  startTime: number,
  endTime: number,
  value: number,
  unit: "M" | "Q" | "Y",
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
