import type { z } from "zod";
import type { ZodTemporal } from "./temporal-validator.ts";
import { Temporal } from "../../temporal-polyfill/impl.ts";
declare const PlainMonthDay: typeof Temporal.PlainMonthDay;
/**
 * Regex pattern for {@link Temporal.PlainMonthDay} ISO 8601 strings (e.g. `--01-15` or `01-15`).
 * Validates month (01–12) and day (01–31). The `--` prefix is optional per ISO 8601.
 */
export declare const PLAIN_MONTH_DAY_PATTERN = "^(--)?(0[1-9]|1[0-2])-(0[1-9]|[12]\\d|3[01])$";
/**
 * Validates or coerces a string to a {@link Temporal.PlainMonthDay}.
 */
export declare const zPlainMonthDay: ZodTemporal<typeof PlainMonthDay>;
/**
 * Validates that the value is an instance of {@link Temporal.PlainMonthDay}.
 */
export declare const zPlainMonthDayInstance: z.ZodType<Temporal.PlainMonthDay>;
export {};
