/**
 * Temporal helpers for Temporal API types (Instant, ZonedDateTime, PlainDate,
 * PlainDateTime, PlainTime).
 *
 * Separated from numeric stats helpers because these are only consumed by
 * time-series verbs (downsample, upsample, time-bucket, interpolate, asof-join).
 */

import { isComparable } from "./helpers.ts";

// ---------------------------------------------------------------------------
// Epoch helpers (Instant, ZonedDateTime)
// ---------------------------------------------------------------------------

/**
 * Check if a value is an epoch-capable Temporal type (Instant or ZonedDateTime).
 * These are the only Temporal types that have an inherent epoch value.
 * Wall-clock types (PlainDate, PlainDateTime, PlainTime) do NOT have epoch
 * values — converting them would require assuming a timezone.
 */
export function hasEpochMilliseconds(
  value: unknown,
): value is { epochMilliseconds: number } {
  return (
    value != null &&
    typeof value === "object" &&
    "epochMilliseconds" in value &&
    typeof (value as Record<string, unknown>).epochMilliseconds === "number"
  );
}

/**
 * Convert a Temporal-like value to epoch milliseconds.
 *
 * Only supports exact-time Temporal types:
 *  - Instant: has `epochMilliseconds`
 *  - ZonedDateTime: has `epochMilliseconds`
 *
 * Returns NaN for wall-clock types (PlainDate, PlainDateTime, PlainTime)
 * because they have no inherent epoch — converting would require assuming
 * a timezone, which violates the Temporal spec's design intent.
 */
export function temporalToEpochMs(value: unknown): number {
  if (hasEpochMilliseconds(value)) {
    return value.epochMilliseconds;
  }
  return NaN;
}

/**
 * Convert a Date, number, string, or epoch-capable Temporal value to epoch milliseconds.
 *
 * Supports: Date, number (passthrough), ISO string, Instant, ZonedDateTime.
 * Returns NaN for wall-clock Temporal types (PlainDate, PlainDateTime, PlainTime).
 */
export function toEpochMs(value: unknown): number {
  if (value instanceof Date) return value.getTime();
  if (typeof value === "number") return value;
  if (typeof value === "string") return new Date(value).getTime();
  return temporalToEpochMs(value);
}

// ---------------------------------------------------------------------------
// Calendar-path Temporal helpers (PlainDate, PlainDateTime)
// ---------------------------------------------------------------------------

/**
 * Duck-typed interface for wall-clock Temporal types that support calendar
 * operations: PlainDate and PlainDateTime.
 *
 * PlainTime is excluded because it has no date component (no year/month/day),
 * making calendar bucketing by days/weeks/months meaningless.
 */
export interface CalendarTemporal {
  constructor: { compare(a: unknown, b: unknown): number };
  readonly year: number;
  readonly month: number;
  readonly day: number;
  toString(): string;
  with(fields: Record<string, unknown>): CalendarTemporal;
  add(duration: Record<string, number>): CalendarTemporal;
  subtract(duration: Record<string, number>): CalendarTemporal;
}

/**
 * Check if a value is a wall-clock Temporal type with calendar properties
 * (PlainDate or PlainDateTime). PlainTime is excluded (no year/month/day).
 */
export function isCalendarTemporal(
  value: unknown,
): value is CalendarTemporal {
  if (
    !isComparable(value) ||
    hasEpochMilliseconds(value)
  ) return false;
  const obj = value as object;
  return (
    "year" in obj &&
    "month" in obj &&
    "day" in obj &&
    "with" in obj && typeof (obj as { with: unknown }).with === "function" &&
    "add" in obj && typeof (obj as { add: unknown }).add === "function"
  );
}

/**
 * Check if a value is a wall-clock Temporal type WITHOUT calendar properties
 * (i.e., PlainTime — has compare but no year/month/day and no epoch).
 */
export function isWallClockTemporalWithoutCalendar(
  value: unknown,
): boolean {
  if (!isComparable(value) || hasEpochMilliseconds(value)) return false;
  return !("year" in (value as object));
}

/**
 * Parsed calendar frequency for Temporal calendar-path operations.
 */
export interface CalendarFrequencyParsed {
  unit: "S" | "min" | "H" | "D" | "W" | "M" | "Q" | "Y";
  value: number;
}

/**
 * Parse a Frequency into a unit + value for calendar-path operations.
 * Returns null if the frequency is a raw number (ms) which can't map
 * to calendar units without ambiguity.
 */
export function parseFrequencyForCalendar(
  frequency: string | number | { value: number; unit: string },
): CalendarFrequencyParsed | null {
  if (typeof frequency === "number") return null;

  if (typeof frequency === "object") {
    const unitMap: Record<string, CalendarFrequencyParsed["unit"]> = {
      s: "S",
      min: "min",
      h: "H",
      d: "D",
      w: "W",
      M: "M",
      Q: "Q",
      Y: "Y",
    };
    const mapped = unitMap[frequency.unit];
    if (!mapped) return null;
    return { unit: mapped, value: frequency.value };
  }

  const match = frequency.match(/^(\d+)([A-Za-z]+)$/);
  if (!match) return null;

  const value = parseInt(match[1], 10);
  const unit = match[2] as CalendarFrequencyParsed["unit"];
  if (!["S", "min", "H", "D", "W", "M", "Q", "Y"].includes(unit)) {
    return null;
  }
  return { unit, value };
}

/**
 * Floor a CalendarTemporal value to a bucket boundary for the given frequency.
 * Uses native Temporal `with()` and `subtract()` — no epoch conversion.
 */
export function floorCalendarTemporal(
  value: CalendarTemporal,
  freq: CalendarFrequencyParsed,
): CalendarTemporal {
  const { unit, value: n } = freq;

  switch (unit) {
    case "Y": {
      const flooredYear = Math.floor(value.year / n) * n;
      return value.with({
        year: flooredYear,
        month: 1,
        day: 1,
        hour: 0,
        minute: 0,
        second: 0,
        millisecond: 0,
        microsecond: 0,
        nanosecond: 0,
      });
    }
    case "Q": {
      // Quarter: months 1-3 → Q1, 4-6 → Q2, etc.
      const quarter = Math.floor((value.month - 1) / 3);
      const flooredQuarter = Math.floor(quarter / n) * n;
      const qMonth = flooredQuarter * 3 + 1;
      return value.with({
        month: qMonth,
        day: 1,
        hour: 0,
        minute: 0,
        second: 0,
        millisecond: 0,
        microsecond: 0,
        nanosecond: 0,
      });
    }
    case "M": {
      const flooredMonth = Math.floor((value.month - 1) / n) * n + 1;
      return value.with({
        month: flooredMonth,
        day: 1,
        hour: 0,
        minute: 0,
        second: 0,
        millisecond: 0,
        microsecond: 0,
        nanosecond: 0,
      });
    }
    case "W": {
      // Floor to start of week (Monday = 1 in ISO)
      const dow = (value as unknown as { dayOfWeek: number }).dayOfWeek;
      const daysBack = dow - 1; // Monday-based
      const mondayDate = value.subtract({ days: daysBack });
      const v = value as unknown as Record<string, unknown>;
      if ("hour" in v) {
        return mondayDate.with({
          hour: 0,
          minute: 0,
          second: 0,
          millisecond: 0,
          microsecond: 0,
          nanosecond: 0,
        });
      }
      return mondayDate;
    }
    case "D": {
      // For PlainDateTime, zero out time. For PlainDate, it's already day-level.
      const v = value as unknown as Record<string, unknown>;
      if ("hour" in v) {
        return value.with({
          hour: 0,
          minute: 0,
          second: 0,
          millisecond: 0,
          microsecond: 0,
          nanosecond: 0,
        });
      }
      return value;
    }
    case "H": {
      const v = value as unknown as Record<string, unknown>;
      if ("hour" in v) {
        const hour = (value as unknown as { hour: number }).hour;
        const flooredHour = Math.floor(hour / n) * n;
        return value.with({
          hour: flooredHour,
          minute: 0,
          second: 0,
          millisecond: 0,
          microsecond: 0,
          nanosecond: 0,
        });
      }
      return value; // PlainDate has no hours
    }
    case "min": {
      const v = value as unknown as Record<string, unknown>;
      if ("minute" in v) {
        const minute = (value as unknown as { minute: number }).minute;
        const flooredMinute = Math.floor(minute / n) * n;
        return value.with({
          minute: flooredMinute,
          second: 0,
          millisecond: 0,
          microsecond: 0,
          nanosecond: 0,
        });
      }
      return value;
    }
    case "S": {
      const v = value as unknown as Record<string, unknown>;
      if ("second" in v) {
        const second = (value as unknown as { second: number }).second;
        const flooredSecond = Math.floor(second / n) * n;
        return value.with({
          second: flooredSecond,
          millisecond: 0,
          microsecond: 0,
          nanosecond: 0,
        });
      }
      return value;
    }
  }
}

/**
 * Add one frequency period to a CalendarTemporal value.
 * Uses native Temporal `add()`.
 */
export function addCalendarTemporalPeriod(
  value: CalendarTemporal,
  freq: CalendarFrequencyParsed,
): CalendarTemporal {
  const { unit, value: n } = freq;
  switch (unit) {
    case "Y":
      return value.add({ months: n * 12 });
    case "Q":
      return value.add({ months: n * 3 });
    case "M":
      return value.add({ months: n });
    case "W":
      return value.add({ days: n * 7 });
    case "D":
      return value.add({ days: n });
    case "H":
      return value.add({ hours: n });
    case "min":
      return value.add({ minutes: n });
    case "S":
      return value.add({ seconds: n });
  }
}

/**
 * Generate a sequence of CalendarTemporal bucket keys from start to end (inclusive).
 * Uses `add()` and `constructor.compare()`.
 */
export function generateCalendarTemporalSequence(
  start: CalendarTemporal,
  end: CalendarTemporal,
  freq: CalendarFrequencyParsed,
): string[] {
  const keys: string[] = [];
  let current = start;
  while (current.constructor.compare(current, end) <= 0) {
    keys.push(current.toString());
    current = addCalendarTemporalPeriod(current, freq);
  }
  return keys;
}

/**
 * Compute numeric spacing between two CalendarTemporal values using `until().total()`.
 * Returns the distance in the specified Temporal unit (e.g., "days").
 * Used for interpolation x-spacing on the calendar path.
 */
export function calendarTemporalDistance(
  a: CalendarTemporal,
  b: CalendarTemporal,
  unit: string = "days",
): number {
  const aAny = a as unknown as {
    until(b: unknown, opts?: unknown): { total(opts: unknown): number };
  };
  return aAny.until(b, { largestUnit: unit }).total({ unit });
}
