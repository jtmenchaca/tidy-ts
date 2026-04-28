import type { z } from "zod";
import type { ZodTemporal } from "./temporal-validator.ts";
export declare const Duration: typeof Temporal.Duration;
/**
 * Regex pattern for {@link Temporal.Duration} ISO 8601 duration strings
 * (e.g. `PT1H30M`, `P1Y2M3DT4H5M6.5S`).
 * Supports years, months, weeks, days, hours, minutes, and decimal seconds.
 * A leading `-` is allowed for negative durations.
 */
export declare const DURATION_PATTERN = "^-?P(\\d+Y)?(\\d+M)?(\\d+W)?(\\d+D)?(T(\\d+H)?(\\d+M)?((\\d+(\\.\\d+)?)S)?)?$";
/**
 * Validates or coerces a string to a {@link Temporal.Duration}.
 */
export declare const zDuration: ZodTemporal<typeof Duration>;
/**
 * Validates that the value is an instance of {@link Temporal.Duration}.
 */
export declare const zDurationInstance: z.ZodType<Temporal.Duration>;
