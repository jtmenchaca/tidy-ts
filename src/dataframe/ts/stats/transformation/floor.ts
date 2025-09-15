// src/dataframe/ts/descriptive/floor.ts

import { isNA } from "../../utilities/mod.ts";

/**
 * Apply floor function to a single numeric value.
 *
 * Returns the largest integer less than or equal to the value.
 *
 * @param value - Single number
 * @returns Floor of the number
 *
 * @example
 * ```typescript
 * floor(1.7)  // 1
 * floor(-1.7) // -2
 * ```
 */
export function floor(value: number): number;

/**
 * Apply floor function to numeric values.
 *
 * Returns the largest integer less than or equal to each value.
 * Handles null/undefined values by passing them through unchanged.
 *
 * @param values - Array of numbers (can include null/undefined)
 * @returns Array with floor applied to each value
 *
 * @example
 * ```typescript
 * floor([1.1, 2.7, 3.9])  // [1, 2, 3]
 * floor([-1.1, -2.7])     // [-2, -3]
 * floor([1.5, null, 2.3]) // [1, null, 2]
 * ```
 */
export function floor(values: number[]): number[];
export function floor(values: (number | null)[]): (number | null)[];
export function floor(values: Iterable<number>): number[];
export function floor(values: Iterable<number | null>): (number | null)[];

export function floor(
  valueOrValues:
    | number
    | number[]
    | (number | null)[]
    | Iterable<number>
    | Iterable<number | null>,
): number | number[] | (number | null)[] {
  // Handle single number case
  if (typeof valueOrValues === "number") {
    return Math.floor(valueOrValues);
  }

  // Handle array/iterable case
  const processArray = Array.isArray(valueOrValues)
    ? valueOrValues
    : Array.from(valueOrValues);
  return processArray.map((value) => {
    if (isNA(value)) {
      return null;
    }
    return Math.floor(value as number);
  });
}
