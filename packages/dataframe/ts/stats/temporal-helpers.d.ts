/**
 * Temporal helpers for Temporal API types (Instant, ZonedDateTime, PlainDate,
 * PlainDateTime, PlainTime).
 *
 * Separated from numeric stats helpers because these are only consumed by
 * time-series verbs (downsample, upsample, time-bucket, interpolate, asof-join).
 */
/**
 * Check if a value is an epoch-capable Temporal type (Instant or ZonedDateTime).
 * These are the only Temporal types that have an inherent epoch value.
 * Wall-clock types (PlainDate, PlainDateTime, PlainTime) do NOT have epoch
 * values — converting them would require assuming a timezone.
 */
export declare function hasEpochMilliseconds(value: unknown): value is {
    epochMilliseconds: number;
};
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
export declare function temporalToEpochMs(value: unknown): number;
/**
 * Convert a Date, number, string, or epoch-capable Temporal value to epoch milliseconds.
 *
 * Supports: Date, number (passthrough), ISO string, Instant, ZonedDateTime.
 * Returns NaN for wall-clock Temporal types (PlainDate, PlainDateTime, PlainTime).
 */
export declare function toEpochMs(value: unknown): number;
/**
 * Duck-typed interface for wall-clock Temporal types that support calendar
 * operations: PlainDate and PlainDateTime.
 *
 * PlainTime is excluded because it has no date component (no year/month/day),
 * making calendar bucketing by days/weeks/months meaningless.
 */
export interface CalendarTemporal {
    constructor: {
        compare(a: unknown, b: unknown): number;
    };
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
export declare function isCalendarTemporal(value: unknown): value is CalendarTemporal;
/**
 * Check if a value is a wall-clock Temporal type WITHOUT calendar properties
 * (i.e., PlainTime — has compare but no year/month/day and no epoch).
 */
export declare function isWallClockTemporalWithoutCalendar(value: unknown): boolean;
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
export declare function parseFrequencyForCalendar(frequency: string | number | {
    value: number;
    unit: string;
}): CalendarFrequencyParsed | null;
/**
 * Floor a CalendarTemporal value to a bucket boundary for the given frequency.
 * Uses native Temporal `with()` and `subtract()` — no epoch conversion.
 */
export declare function floorCalendarTemporal(value: CalendarTemporal, freq: CalendarFrequencyParsed): CalendarTemporal;
/**
 * Generate a sequence of CalendarTemporal bucket keys from start to end (inclusive).
 * Uses `add()` and `constructor.compare()`.
 */
export declare function generateCalendarTemporalSequence(start: CalendarTemporal, end: CalendarTemporal, freq: CalendarFrequencyParsed): string[];
/**
 * Compute numeric spacing between two CalendarTemporal values using `until().total()`.
 * Returns the distance in the specified Temporal unit (e.g., "days").
 * Used for interpolation x-spacing on the calendar path.
 */
export declare function calendarTemporalDistance(a: CalendarTemporal, b: CalendarTemporal, unit?: string): number;
