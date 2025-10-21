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
