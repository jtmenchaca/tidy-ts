/**
 * Temporal Zod validators with JSON Schema metadata.
 *
 * This is the main entry point of `temporal-zod`. Every validator exported here
 * is a clone of the corresponding base validator with JSON Schema metadata
 * attached via Zod's `.meta()`, so `z.toJSONSchema()` works out of the box.
 *
 * If you don't need JSON Schema support, import from `temporal-zod/base` instead
 * for a smaller bundle without the metadata registration side effect.
 *
 * @module
 * @see {@link https://github.com/macalinao/temporal-utils/tree/master/packages/temporal-zod | temporal-zod on GitHub}
 */
import type * as z from "zod";
/**
 * Validates or coerces a string or `Date` to a {@link Temporal.Instant}.
 *
 * Accepts ISO 8601 instant strings with a required UTC offset
 * (e.g. `2023-01-15T13:45:30Z`), `Date` objects, or existing `Instant` instances.
 *
 * Includes JSON Schema metadata (`format: "date-time"`, `pattern`, `description`)
 * so `z.toJSONSchema()` produces a correct JSON Schema.
 */
declare const zInstant: z.ZodType<Temporal.Instant>;
/**
 * Validates that the value is an instance of {@link Temporal.Instant}.
 *
 * Unlike {@link zInstant}, this does **not** coerce strings or `Date` objects.
 * Use this when you expect a pre-parsed `Temporal.Instant` instance.
 *
 * Includes JSON Schema metadata so `z.toJSONSchema()` produces a correct JSON Schema.
 */
declare const zInstantInstance: z.ZodType<Temporal.Instant>;
/**
 * Validates or coerces a string to a {@link Temporal.PlainDate}.
 *
 * Accepts ISO 8601 date strings without time (e.g. `2023-01-15`)
 * or existing `PlainDate` instances.
 *
 * Includes JSON Schema metadata (`format: "date"`, `pattern`, `description`)
 * so `z.toJSONSchema()` produces a correct JSON Schema.
 */
declare const zPlainDate: z.ZodType<Temporal.PlainDate>;
/**
 * Validates that the value is an instance of {@link Temporal.PlainDate}.
 *
 * Unlike {@link zPlainDate}, this does **not** coerce strings.
 * Use this when you expect a pre-parsed `Temporal.PlainDate` instance.
 *
 * Includes JSON Schema metadata so `z.toJSONSchema()` produces a correct JSON Schema.
 */
declare const zPlainDateInstance: z.ZodType<Temporal.PlainDate>;
/**
 * Validates or coerces a string to a {@link Temporal.PlainTime}.
 *
 * Accepts ISO 8601 time strings without date or timezone
 * (e.g. `13:45:30`, `13:45:30.123456789`) or existing `PlainTime` instances.
 *
 * Includes JSON Schema metadata (`pattern`, `description`)
 * so `z.toJSONSchema()` produces a correct JSON Schema.
 */
declare const zPlainTime: z.ZodType<Temporal.PlainTime>;
/**
 * Validates that the value is an instance of {@link Temporal.PlainTime}.
 *
 * Unlike {@link zPlainTime}, this does **not** coerce strings.
 * Use this when you expect a pre-parsed `Temporal.PlainTime` instance.
 *
 * Includes JSON Schema metadata so `z.toJSONSchema()` produces a correct JSON Schema.
 */
declare const zPlainTimeInstance: z.ZodType<Temporal.PlainTime>;
/**
 * Validates or coerces a string to a {@link Temporal.PlainDateTime}.
 *
 * Accepts ISO 8601 date-time strings without timezone
 * (e.g. `2023-01-15T13:45:30`) or existing `PlainDateTime` instances.
 *
 * Includes JSON Schema metadata (`pattern`, `description`)
 * so `z.toJSONSchema()` produces a correct JSON Schema.
 */
declare const zPlainDateTime: z.ZodType<Temporal.PlainDateTime>;
/**
 * Validates that the value is an instance of {@link Temporal.PlainDateTime}.
 *
 * Unlike {@link zPlainDateTime}, this does **not** coerce strings.
 * Use this when you expect a pre-parsed `Temporal.PlainDateTime` instance.
 *
 * Includes JSON Schema metadata so `z.toJSONSchema()` produces a correct JSON Schema.
 */
declare const zPlainDateTimeInstance: z.ZodType<Temporal.PlainDateTime>;
/**
 * Validates or coerces a string to a {@link Temporal.PlainYearMonth}.
 *
 * Accepts ISO 8601 year-month strings (e.g. `2023-01`)
 * or existing `PlainYearMonth` instances.
 *
 * Includes JSON Schema metadata (`pattern`, `description`)
 * so `z.toJSONSchema()` produces a correct JSON Schema.
 */
declare const zPlainYearMonth: z.ZodType<Temporal.PlainYearMonth>;
/**
 * Validates that the value is an instance of {@link Temporal.PlainYearMonth}.
 *
 * Unlike {@link zPlainYearMonth}, this does **not** coerce strings.
 * Use this when you expect a pre-parsed `Temporal.PlainYearMonth` instance.
 *
 * Includes JSON Schema metadata so `z.toJSONSchema()` produces a correct JSON Schema.
 */
declare const zPlainYearMonthInstance: z.ZodType<Temporal.PlainYearMonth>;
/**
 * Validates or coerces a string to a {@link Temporal.PlainMonthDay}.
 *
 * Accepts ISO 8601 month-day strings (e.g. `--01-15` or `01-15`)
 * or existing `PlainMonthDay` instances.
 *
 * Includes JSON Schema metadata (`pattern`, `description`)
 * so `z.toJSONSchema()` produces a correct JSON Schema.
 */
declare const zPlainMonthDay: z.ZodType<Temporal.PlainMonthDay>;
/**
 * Validates that the value is an instance of {@link Temporal.PlainMonthDay}.
 *
 * Unlike {@link zPlainMonthDay}, this does **not** coerce strings.
 * Use this when you expect a pre-parsed `Temporal.PlainMonthDay` instance.
 *
 * Includes JSON Schema metadata so `z.toJSONSchema()` produces a correct JSON Schema.
 */
declare const zPlainMonthDayInstance: z.ZodType<Temporal.PlainMonthDay>;
/**
 * Validates or coerces a string to a {@link Temporal.ZonedDateTime}.
 *
 * Accepts ISO 8601 date-time strings with a timezone offset and IANA timezone
 * annotation (e.g. `2023-01-15T13:45:30+08:00[Asia/Manila]`)
 * or existing `ZonedDateTime` instances.
 *
 * Includes JSON Schema metadata (`pattern`, `description`)
 * so `z.toJSONSchema()` produces a correct JSON Schema.
 */
declare const zZonedDateTime: z.ZodType<Temporal.ZonedDateTime>;
/**
 * Validates that the value is an instance of {@link Temporal.ZonedDateTime}.
 *
 * Unlike {@link zZonedDateTime}, this does **not** coerce strings.
 * Use this when you expect a pre-parsed `Temporal.ZonedDateTime` instance.
 *
 * Includes JSON Schema metadata so `z.toJSONSchema()` produces a correct JSON Schema.
 */
declare const zZonedDateTimeInstance: z.ZodType<Temporal.ZonedDateTime>;
/**
 * Validates or coerces a string to a {@link Temporal.Duration}.
 *
 * Accepts ISO 8601 duration strings (e.g. `PT1H30M`, `P1Y2M3D`)
 * or existing `Duration` instances.
 *
 * Includes JSON Schema metadata (`format: "duration"`, `pattern`, `description`)
 * so `z.toJSONSchema()` produces a correct JSON Schema.
 */
declare const zDuration: z.ZodType<Temporal.Duration>;
/**
 * Validates that the value is an instance of {@link Temporal.Duration}.
 *
 * Unlike {@link zDuration}, this does **not** coerce strings.
 * Use this when you expect a pre-parsed `Temporal.Duration` instance.
 *
 * Includes JSON Schema metadata so `z.toJSONSchema()` produces a correct JSON Schema.
 */
declare const zDurationInstance: z.ZodType<Temporal.Duration>;
export { zDuration, zDurationInstance, zInstant, zInstantInstance, zPlainDate, zPlainDateInstance, zPlainDateTime, zPlainDateTimeInstance, zPlainMonthDay, zPlainMonthDayInstance, zPlainTime, zPlainTimeInstance, zPlainYearMonth, zPlainYearMonthInstance, zZonedDateTime, zZonedDateTimeInstance, };
export * from "./base/index.ts";
