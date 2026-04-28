import * as z from "zod";
import type { ZodTemporal } from "./temporal-validator.ts";

import { temporalValidators } from "./temporal-validator.ts";

export const PlainDateTime: typeof Temporal.PlainDateTime =
  Temporal.PlainDateTime;

/**
 * Regex pattern for {@link Temporal.PlainDateTime} ISO 8601 strings (e.g. `2023-01-15T13:45:30`).
 * Validates month (01–12), day (01–31), hours (00–23), minutes/seconds (00–59),
 * and up to 9 fractional digits. No timezone offset.
 */
export const PLAIN_DATE_TIME_PATTERN =
  "^\\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\\d|3[01])T([01]\\d|2[0-3]):[0-5]\\d(:[0-5]\\d(\\.\\d{1,9})?)?$";

const validators = temporalValidators(PlainDateTime, [
  // Accept a JS Date by reading its UTC components as the wall clock.
  // This is the convention used when reading zoneless database DATE columns
  // (e.g. Oracle DATE via node-oracledb with ORA_SDTZ=UTC), where the driver
  // produces a Date whose UTC components equal the stored wall clock.
  z.date().transform((d) =>
    Temporal.PlainDateTime.from({
      year: d.getUTCFullYear(),
      month: d.getUTCMonth() + 1,
      day: d.getUTCDate(),
      hour: d.getUTCHours(),
      minute: d.getUTCMinutes(),
      second: d.getUTCSeconds(),
      millisecond: d.getUTCMilliseconds(),
    })
  ),
]);

/**
 * Validates or coerces a string to a {@link Temporal.PlainDateTime}.
 */
export const zPlainDateTime: ZodTemporal<typeof PlainDateTime> =
  validators.coerce;

/**
 * Validates that the value is an instance of {@link Temporal.PlainDateTime}.
 */
export const zPlainDateTimeInstance: z.ZodType<Temporal.PlainDateTime> =
  validators.instance;
