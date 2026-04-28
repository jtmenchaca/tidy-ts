import * as z from "zod";
/**
 * Regex pattern for {@link Temporal.Instant} ISO 8601 strings
 * (e.g. `2023-01-15T13:45:30Z` or `2023-01-15T13:45:30+05:30`).
 * Validates month (01–12), day (01–31), hours (00–23), minutes/seconds (00–59),
 * up to 9 fractional digits, and a required UTC offset (Z or ±HH:MM).
 * An optional IANA timezone annotation in brackets is permitted.
 */
export declare const INSTANT_PATTERN = "^\\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\\d|3[01])T([01]\\d|2[0-3]):[0-5]\\d(:[0-5]\\d(\\.\\d{1,9})?)?(Z|[+-]([01]\\d|2[0-3]):[0-5]\\d)(\\[.+\\])?$";
/**
 * Validates or coerces a string or Date to a {@link Temporal.Instant}.
 */
export declare const zInstant: z.ZodType<Temporal.Instant>;
/**
 * Validates that the value is an instance of {@link Temporal.Instant}.
 */
export declare const zInstantInstance: z.ZodType<Temporal.Instant>;
