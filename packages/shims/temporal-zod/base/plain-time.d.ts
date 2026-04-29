import type { z } from "zod";
import type { ZodTemporal } from "./temporal-validator.ts";
declare const PlainTime: typeof Temporal.PlainTime;
/**
 * Regex pattern for {@link Temporal.PlainTime} ISO 8601 strings
 * (e.g. `13:45:30` or `13:45:30.123456789`).
 * Validates hours (00–23), minutes (00–59), seconds (00–59), and up to 9 fractional digits.
 * Note: Unlike RFC 3339 "full-time", PlainTime has no timezone offset.
 */
export declare const PLAIN_TIME_PATTERN = "^([01]\\d|2[0-3]):[0-5]\\d(:[0-5]\\d(\\.\\d{1,9})?)?$";
/**
 * Validates or coerces a string to a {@link Temporal.PlainTime}.
 */
export declare const zPlainTime: ZodTemporal<typeof PlainTime>;
/**
 * Validates that the value is an instance of {@link Temporal.PlainTime}.
 */
export declare const zPlainTimeInstance: z.ZodType<Temporal.PlainTime>;
export {};
