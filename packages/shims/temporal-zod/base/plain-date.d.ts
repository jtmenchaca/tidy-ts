import type { z } from "zod";
import type { ZodTemporal } from "./temporal-validator.ts";
import { Temporal } from "../../temporal-polyfill/impl.ts";
declare const PlainDate: typeof Temporal.PlainDate;
/**
 * Regex pattern for {@link Temporal.PlainDate} ISO 8601 strings (e.g. `2023-01-15`).
 * Validates month (01–12) and day (01–31).
 */
export declare const PLAIN_DATE_PATTERN = "^\\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\\d|3[01])$";
/**
 * Validates or coerces a string to a {@link Temporal.PlainDate}.
 */
export declare const zPlainDate: ZodTemporal<typeof PlainDate>;
/**
 * Validates that the value is an instance of {@link Temporal.PlainDate}.
 */
export declare const zPlainDateInstance: z.ZodType<Temporal.PlainDate>;
export {};
