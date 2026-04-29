import type { z } from "zod";
import type { ZodTemporal } from "./temporal-validator.ts";
declare const PlainYearMonth: typeof Temporal.PlainYearMonth;
/**
 * Regex pattern for {@link Temporal.PlainYearMonth} ISO 8601 strings (e.g. `2023-01`).
 * Validates month (01–12).
 */
export declare const PLAIN_YEAR_MONTH_PATTERN = "^\\d{4}-(0[1-9]|1[0-2])$";
/**
 * Validates or coerces a string to a {@link Temporal.PlainYearMonth}.
 */
export declare const zPlainYearMonth: ZodTemporal<typeof PlainYearMonth>;
/**
 * Validates that the value is an instance of {@link Temporal.PlainYearMonth}.
 */
export declare const zPlainYearMonthInstance: z.ZodType<Temporal.PlainYearMonth>;
export {};
