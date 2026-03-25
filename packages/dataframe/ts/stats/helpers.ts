/**
 * Helper utilities for descriptive statistics functions
 * Provides standardized type checking and value filtering
 */

import { isNA } from "../utilities/mod.ts";

// Re-export isNA for convenience
export { isNA };

// Type aliases for clear overload signatures
export type NumbersWithNullable =
  | (number | null | undefined)[]
  | readonly (number | null | undefined)[];
export type NumberIterable = Iterable<number>;
export type NumbersWithNullableIterable = Iterable<number | null | undefined>;

// Backward compatibility aliases
export type CleanNumberArray = readonly number[];
export type CleanNumberIterable = NumberIterable;

/**
 * Checks if an array contains mixed types (non-numeric values)
 * Returns true if array contains strings, booleans, objects, etc. alongside numbers
 *
 * @param values - Array or iterable to check
 * @returns true if mixed types detected, false if all values are numbers/null/undefined/NaN
 */
export function hasMixedTypes(values: unknown[] | Iterable<unknown>): boolean {
  const processArray = Array.isArray(values) ? values : Array.from(values);

  for (let i = 0; i < processArray.length; i++) {
    const v = processArray[i];

    // Skip NA values (null, undefined, NaN, "NA") - these are acceptable
    if (isNA(v)) continue;

    // If we find anything that's not a number, it's mixed types
    if (typeof v !== "number") {
      return true;
    }
  }

  return false;
}

/**
 * Filters an array to only include valid numeric values
 * Excludes: null, undefined, NaN, "NA", and non-numeric types (strings, booleans, objects)
 *
 * @param values - Array or iterable of potentially mixed types
 * @returns Array of valid numbers only
 */
export function extractValidNumbers(
  values: unknown[] | Iterable<unknown>,
): number[] {
  // Handle iterables by materializing to array
  const processArray = Array.isArray(values) ? values : Array.from(values);

  const validValues: number[] = [];

  for (let i = 0; i < processArray.length; i++) {
    const v = processArray[i];

    // Skip NA values (null, undefined, NaN, "NA")
    if (isNA(v)) continue;

    // Only include actual numbers (not strings or booleans that might coerce)
    if (typeof v === "number" && Number.isFinite(v)) {
      validValues.push(v);
    }
  }

  return validValues;
}

/**
 * Filters an array to include numeric values, handling NaN and Infinity
 * Similar to extractValidNumbers but allows NaN and Infinity through
 *
 * @param values - Array or iterable of potentially mixed types
 * @param excludeNaN - If true, filters out NaN values
 * @param excludeInfinity - If true, filters out Infinity and -Infinity
 * @returns Array of numbers
 */
export function extractNumbersWithOptions(
  values: unknown[] | Iterable<unknown>,
  excludeNaN: boolean = false,
  excludeInfinity: boolean = false,
): number[] {
  // Handle iterables by materializing to array
  const processArray = Array.isArray(values) ? values : Array.from(values);

  const validValues: number[] = [];

  for (let i = 0; i < processArray.length; i++) {
    const v = processArray[i];

    // Skip null, undefined, and "NA"
    if (v === null || v === undefined || v === "NA") continue;

    // Only process actual numbers
    if (typeof v === "number") {
      // Handle NaN
      if (Number.isNaN(v)) {
        if (!excludeNaN) validValues.push(v);
        continue;
      }

      // Handle Infinity
      if (!Number.isFinite(v)) {
        if (!excludeInfinity) validValues.push(v);
        continue;
      }

      // Regular number
      validValues.push(v);
    }
  }

  return validValues;
}

/**
 * Processes values for sum operations
 * Returns sum and whether any valid values were found
 *
 * @param values - Array or iterable of potentially mixed types
 * @returns Object with sum and hasValidValues flag
 */
export function computeNumericSum(
  values: unknown[] | Iterable<unknown>,
): { sum: number; hasValidValues: boolean } {
  // Handle iterables by materializing to array
  const processArray = Array.isArray(values) ? values : Array.from(values);

  let sum = 0;
  let hasValidValues = false;

  for (let i = 0; i < processArray.length; i++) {
    const v = processArray[i];

    // Skip NA values
    if (isNA(v)) continue;

    // Only add actual numbers
    if (typeof v === "number") {
      sum += v;
      hasValidValues = true;
    }
  }

  return { sum, hasValidValues };
}

/**
 * Type guard to check if a value is a valid number for statistics
 * Excludes null, undefined, NaN (optionally), Infinity (optionally), and non-numbers
 *
 * @param value - Value to check
 * @param allowNaN - If true, NaN is considered valid
 * @param allowInfinity - If true, Infinity/-Infinity are considered valid
 * @returns True if value is a valid number for statistical operations
 */
export function isStatisticalNumber(
  value: unknown,
  allowNaN: boolean = false,
  allowInfinity: boolean = false,
): value is number {
  if (typeof value !== "number") return false;
  if (!allowNaN && Number.isNaN(value)) return false;
  if (!allowInfinity && !Number.isFinite(value)) return false;
  return true;
}

/**
 * Fast path check for clean numeric arrays
 * Returns true if array contains only finite numbers (no null, undefined, NaN, Infinity, or non-numbers)
 *
 * @param values - Array to check
 * @returns True if array is clean numeric data
 */
export function isAllFiniteNumbers(values: unknown[]): values is number[] {
  if (!Array.isArray(values) || values.length === 0) return false;

  for (let i = 0; i < values.length; i++) {
    const v = values[i];
    if (typeof v !== "number" || !Number.isFinite(v)) {
      return false;
    }
  }

  return true;
}

/**
 * Convert array to Float64Array for WASM operations
 * Only includes valid finite numbers
 *
 * @param values - Array or iterable of potentially mixed types
 * @returns Float64Array of valid numbers
 */
export function prepareForWASM(
  values: unknown[] | Iterable<unknown>,
): Float64Array {
  const numericValues = extractValidNumbers(values);
  return new Float64Array(numericValues);
}

/**
 * Splits an array into chunks of specified size
 *
 * @param arr - Array to split into chunks
 * @param size - Size of each chunk (must be positive integer)
 * @returns Array of chunks, where each chunk is an array of elements
 *
 * @example
 * ```typescript
 * const numbers = [1, 2, 3, 4, 5, 6, 7];
 * const chunked = chunk(numbers, 3);
 * // Returns: [[1, 2, 3], [4, 5, 6], [7]]
 * ```
 */
export function chunk<T>(arr: T[], size: number): T[][] {
  if (size <= 0 || !Number.isInteger(size)) {
    throw new Error("Chunk size must be a positive integer");
  }
  if (!Array.isArray(arr)) {
    throw new Error("First argument must be an array");
  }

  return Array.from(
    { length: Math.ceil(arr.length / size) },
    (_, i) => arr.slice(i * size, i * size + size),
  );
}

/**
 * Options for removal of special values in stats functions
 */
export interface RemovalOptions {
  removeNull?: boolean;
  removeUndefined?: boolean;
  removeNaN?: boolean;
}

/**
 * Determines if the fast path can be used for stats calculations.
 *
 * The fast path should ONLY be used when:
 * 1. No removal options are specified (we're not filtering anything), AND
 * 2. The array contains only finite numbers (verified by isAllFiniteNumbers)
 *
 * @param processArray - The array to check
 * @param options - Removal options (removeNull, removeUndefined, removeNaN)
 * @returns true if fast path can be used, false if slow path is required
 */
export function canUseFastPath(
  processArray: unknown[],
  options: RemovalOptions = {},
): boolean {
  const { removeNull = false, removeUndefined = false, removeNaN = false } =
    options;

  // If ANY removal option is set, we must use the slow path
  if (removeNull || removeUndefined || removeNaN) {
    return false;
  }

  return isAllFiniteNumbers(processArray);
}

/**
 * Standard error messages for descriptive statistics
 */
export const ERROR_MESSAGES = {
  NO_VALID_VALUES: "No valid numeric values found",
  NO_VALID_VALUES_MEAN: "No valid numeric values found to calculate mean",
  NO_VALID_VALUES_SUM: "No valid numeric values found to calculate sum",
  NO_VALID_VALUES_MAX: "No valid numeric values found to calculate max",
  NO_VALID_VALUES_MIN: "No valid numeric values found to calculate min",
  NO_VALID_VALUES_MEDIAN: "No valid numeric values found to calculate median",
  NO_VALID_VALUES_MODE: "No valid numeric values found to calculate mode",
  NO_VALID_VALUES_VARIANCE:
    "No valid numeric values found to calculate variance",
  NO_VALID_VALUES_SD:
    "No valid numeric values found to calculate standard deviation",
  INSUFFICIENT_DATA_VARIANCE:
    "Insufficient data to calculate variance (need at least 2 values)",
  INSUFFICIENT_DATA_SD:
    "Insufficient data to calculate standard deviation (need at least 2 values)",
} as const;

// ---------------------------------------------------------------------------
// Temporal helpers
// ---------------------------------------------------------------------------

/**
 * A value whose constructor exposes a static `compare(a, b)` method that
 * returns -1 | 0 | 1.  All TC39 Temporal types satisfy this:
 *   Temporal.PlainDate, Temporal.PlainDateTime, Temporal.PlainTime,
 *   Temporal.Instant, Temporal.ZonedDateTime
 */
export interface Comparable {
  constructor: { compare(a: unknown, b: unknown): number };
}

/**
 * Runtime check: does `value` look like a Temporal-style comparable?
 * i.e. is it a non-null object whose constructor has a static `compare` fn?
 */
export function isComparable(value: unknown): value is Comparable {
  return (
    value != null &&
    typeof value === "object" &&
    typeof (value as Comparable).constructor?.compare === "function"
  );
}

/**
 * Find the min or max of an array of Comparable values (e.g. Temporal types)
 * using `constructor.compare`.
 *
 * @param values - array of unknown values (may contain null/undefined)
 * @param mode - "min" or "max"
 * @param removeNull - skip null values instead of returning null
 * @param removeUndefined - skip undefined values instead of returning null
 * @returns the min/max value, or null
 */
export function comparableMinMax(
  values: unknown[],
  mode: "min" | "max",
  removeNull: boolean,
  removeUndefined: boolean,
): unknown | null {
  const target = mode === "min" ? -1 : 1;
  let best: Comparable | null = null;

  for (const v of values) {
    if (v === null) {
      if (!removeNull) return null;
      continue;
    }
    if (v === undefined) {
      if (!removeUndefined) return null;
      continue;
    }
    if (!isComparable(v)) continue;
    if (best === null || best.constructor.compare(v, best) === target) {
      best = v;
    }
  }

  return best;
}

/**
 * Check if a value is an epoch-capable Temporal type (Instant or ZonedDateTime).
 * These are the only Temporal types that have an inherent epoch value.
 * Wall-clock types (PlainDate, PlainDateTime, PlainTime) do NOT have epoch
 * values — converting them would require assuming a timezone.
 */
export function hasEpochMilliseconds(
  value: unknown,
): value is { epochMilliseconds: number } {
  return (
    value != null &&
    typeof value === "object" &&
    "epochMilliseconds" in value &&
    typeof (value as Record<string, unknown>).epochMilliseconds === "number"
  );
}

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
export function temporalToEpochMs(value: unknown): number {
  if (hasEpochMilliseconds(value)) {
    return value.epochMilliseconds;
  }
  return NaN;
}

/**
 * Convert a Date, number, string, or epoch-capable Temporal value to epoch milliseconds.
 *
 * Supports: Date, number (passthrough), ISO string, Instant, ZonedDateTime.
 * Returns NaN for wall-clock Temporal types (PlainDate, PlainDateTime, PlainTime).
 */
export function toEpochMs(value: unknown): number {
  if (value instanceof Date) return value.getTime();
  if (typeof value === "number") return value;
  if (typeof value === "string") return new Date(value).getTime();
  return temporalToEpochMs(value);
}

// ---------------------------------------------------------------------------
// Calendar-path Temporal helpers (PlainDate, PlainDateTime)
// ---------------------------------------------------------------------------

/**
 * Duck-typed interface for wall-clock Temporal types that support calendar
 * operations: PlainDate and PlainDateTime.
 *
 * PlainTime is excluded because it has no date component (no year/month/day),
 * making calendar bucketing by days/weeks/months meaningless.
 */
export interface CalendarTemporal {
  constructor: { compare(a: unknown, b: unknown): number };
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
export function isCalendarTemporal(
  value: unknown,
): value is CalendarTemporal {
  if (
    !isComparable(value) ||
    hasEpochMilliseconds(value)
  ) return false;
  const obj = value as object;
  return (
    "year" in obj &&
    "month" in obj &&
    "day" in obj &&
    "with" in obj && typeof (obj as { with: unknown }).with === "function" &&
    "add" in obj && typeof (obj as { add: unknown }).add === "function"
  );
}

/**
 * Check if a value is a wall-clock Temporal type WITHOUT calendar properties
 * (i.e., PlainTime — has compare but no year/month/day and no epoch).
 */
export function isWallClockTemporalWithoutCalendar(
  value: unknown,
): boolean {
  if (!isComparable(value) || hasEpochMilliseconds(value)) return false;
  return !("year" in (value as object));
}

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
export function parseFrequencyForCalendar(
  frequency: string | number | { value: number; unit: string },
): CalendarFrequencyParsed | null {
  if (typeof frequency === "number") return null;

  if (typeof frequency === "object") {
    const unitMap: Record<string, CalendarFrequencyParsed["unit"]> = {
      s: "S",
      min: "min",
      h: "H",
      d: "D",
      w: "W",
      M: "M",
      Q: "Q",
      Y: "Y",
    };
    const mapped = unitMap[frequency.unit];
    if (!mapped) return null;
    return { unit: mapped, value: frequency.value };
  }

  const match = frequency.match(/^(\d+)([A-Za-z]+)$/);
  if (!match) return null;

  const value = parseInt(match[1], 10);
  const unit = match[2] as CalendarFrequencyParsed["unit"];
  if (!["S", "min", "H", "D", "W", "M", "Q", "Y"].includes(unit)) {
    return null;
  }
  return { unit, value };
}

/**
 * Floor a CalendarTemporal value to a bucket boundary for the given frequency.
 * Uses native Temporal `with()` and `subtract()` — no epoch conversion.
 */
export function floorCalendarTemporal(
  value: CalendarTemporal,
  freq: CalendarFrequencyParsed,
): CalendarTemporal {
  const { unit, value: n } = freq;

  switch (unit) {
    case "Y": {
      const flooredYear = Math.floor(value.year / n) * n;
      return value.with({
        year: flooredYear,
        month: 1,
        day: 1,
        hour: 0,
        minute: 0,
        second: 0,
        millisecond: 0,
        microsecond: 0,
        nanosecond: 0,
      });
    }
    case "Q": {
      // Quarter: months 1-3 → Q1, 4-6 → Q2, etc.
      const quarter = Math.floor((value.month - 1) / 3);
      const flooredQuarter = Math.floor(quarter / n) * n;
      const qMonth = flooredQuarter * 3 + 1;
      return value.with({
        month: qMonth,
        day: 1,
        hour: 0,
        minute: 0,
        second: 0,
        millisecond: 0,
        microsecond: 0,
        nanosecond: 0,
      });
    }
    case "M": {
      const flooredMonth = Math.floor((value.month - 1) / n) * n + 1;
      return value.with({
        month: flooredMonth,
        day: 1,
        hour: 0,
        minute: 0,
        second: 0,
        millisecond: 0,
        microsecond: 0,
        nanosecond: 0,
      });
    }
    case "W": {
      // Floor to start of week (Monday = 1 in ISO)
      const dow = (value as unknown as { dayOfWeek: number }).dayOfWeek;
      const daysBack = dow - 1; // Monday-based
      const mondayDate = value.subtract({ days: daysBack });
      const v = value as unknown as Record<string, unknown>;
      if ("hour" in v) {
        return mondayDate.with({
          hour: 0,
          minute: 0,
          second: 0,
          millisecond: 0,
          microsecond: 0,
          nanosecond: 0,
        });
      }
      return mondayDate;
    }
    case "D": {
      // For PlainDateTime, zero out time. For PlainDate, it's already day-level.
      const v = value as unknown as Record<string, unknown>;
      if ("hour" in v) {
        return value.with({
          hour: 0,
          minute: 0,
          second: 0,
          millisecond: 0,
          microsecond: 0,
          nanosecond: 0,
        });
      }
      return value;
    }
    case "H": {
      const v = value as unknown as Record<string, unknown>;
      if ("hour" in v) {
        const hour = (value as unknown as { hour: number }).hour;
        const flooredHour = Math.floor(hour / n) * n;
        return value.with({
          hour: flooredHour,
          minute: 0,
          second: 0,
          millisecond: 0,
          microsecond: 0,
          nanosecond: 0,
        });
      }
      return value; // PlainDate has no hours
    }
    case "min": {
      const v = value as unknown as Record<string, unknown>;
      if ("minute" in v) {
        const minute = (value as unknown as { minute: number }).minute;
        const flooredMinute = Math.floor(minute / n) * n;
        return value.with({
          minute: flooredMinute,
          second: 0,
          millisecond: 0,
          microsecond: 0,
          nanosecond: 0,
        });
      }
      return value;
    }
    case "S": {
      const v = value as unknown as Record<string, unknown>;
      if ("second" in v) {
        const second = (value as unknown as { second: number }).second;
        const flooredSecond = Math.floor(second / n) * n;
        return value.with({
          second: flooredSecond,
          millisecond: 0,
          microsecond: 0,
          nanosecond: 0,
        });
      }
      return value;
    }
  }
}

/**
 * Add one frequency period to a CalendarTemporal value.
 * Uses native Temporal `add()`.
 */
export function addCalendarTemporalPeriod(
  value: CalendarTemporal,
  freq: CalendarFrequencyParsed,
): CalendarTemporal {
  const { unit, value: n } = freq;
  switch (unit) {
    case "Y":
      return value.add({ months: n * 12 });
    case "Q":
      return value.add({ months: n * 3 });
    case "M":
      return value.add({ months: n });
    case "W":
      return value.add({ days: n * 7 });
    case "D":
      return value.add({ days: n });
    case "H":
      return value.add({ hours: n });
    case "min":
      return value.add({ minutes: n });
    case "S":
      return value.add({ seconds: n });
  }
}

/**
 * Generate a sequence of CalendarTemporal bucket keys from start to end (inclusive).
 * Uses `add()` and `constructor.compare()`.
 */
export function generateCalendarTemporalSequence(
  start: CalendarTemporal,
  end: CalendarTemporal,
  freq: CalendarFrequencyParsed,
): string[] {
  const keys: string[] = [];
  let current = start;
  while (current.constructor.compare(current, end) <= 0) {
    keys.push(current.toString());
    current = addCalendarTemporalPeriod(current, freq);
  }
  return keys;
}

/**
 * Compute numeric spacing between two CalendarTemporal values using `until().total()`.
 * Returns the distance in the specified Temporal unit (e.g., "days").
 * Used for interpolation x-spacing on the calendar path.
 */
export function calendarTemporalDistance(
  a: CalendarTemporal,
  b: CalendarTemporal,
  unit: string = "days",
): number {
  const aAny = a as unknown as {
    until(b: unknown, opts?: unknown): { total(opts: unknown): number };
  };
  return aAny.until(b, { largestUnit: unit }).total({ unit });
}
