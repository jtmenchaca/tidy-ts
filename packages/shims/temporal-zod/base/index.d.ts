/**
 * Base Temporal Zod validators **without** JSON Schema metadata.
 *
 * Import from `temporal-zod/base` for a smaller bundle when you don't need
 * `z.toJSONSchema()` support. The validators are functionally identical to
 * the main `temporal-zod` export — they just lack the `.meta()` registration.
 *
 * @example
 * ```typescript
 * import { zPlainDate, zInstant } from "temporal-zod/base";
 *
 * const result = zPlainDate.parse("2023-01-15");
 * // result is a Temporal.PlainDate instance
 * ```
 *
 * @module
 * @see {@link https://github.com/macalinao/temporal-utils/tree/master/packages/temporal-zod | temporal-zod on GitHub}
 */
export type { ZodTemporal } from "./temporal-validator.ts";
export * from "./duration.ts";
export * from "./instant.ts";
export * from "./plain-date.ts";
export * from "./plain-date-time.ts";
export * from "./plain-month-day.ts";
export * from "./plain-time.ts";
export * from "./plain-year-month.ts";
export * from "./zoned-date-time.ts";
