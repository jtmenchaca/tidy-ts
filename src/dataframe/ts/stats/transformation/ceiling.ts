// src/dataframe/ts/descriptive/ceiling.ts

import { isNA } from "../../utilities/mod.ts";

/**
 * Apply ceiling function to a single numeric value.
 *
 * Returns the smallest integer greater than or equal to the value.
 *
 * @param value - Single number
 * @returns Ceiling of the number
 *
 * @example
 * ```typescript
 * ceiling(1.2)  // 2
 * ceiling(-1.2) // -1
 * ```
 */
export function ceiling(value: number): number;

/**
 * Apply ceiling function to numeric values.
 *
 * Returns the smallest integer greater than or equal to each value.
 * Handles null/undefined values by passing them through unchanged.
 *
 * @param values - Array of numbers (can include null/undefined)
 * @returns Array with ceiling applied to each value
 *
 * @example
 * ```typescript
 * ceiling([1.1, 2.7, 3.9])  // [2, 3, 4]
 * ceiling([-1.1, -2.7])     // [-1, -2]
 * ceiling([1.5, null, 2.3]) // [2, null, 3]
 * ```
 */
export function ceiling(values: number[]): number[];
export function ceiling(values: (number | null)[]): (number | null)[];
export function ceiling(values: Iterable<number>): number[];
export function ceiling(values: Iterable<number | null>): (number | null)[];

export function ceiling(
  valueOrValues:
    | number
    | number[]
    | (number | null)[]
    | Iterable<number>
    | Iterable<number | null>,
): number | number[] | (number | null)[] {
  // Handle single number case
  if (typeof valueOrValues === "number") {
    return Math.ceil(valueOrValues);
  }

  // Handle array/iterable case
  const processArray = Array.isArray(valueOrValues)
    ? valueOrValues
    : Array.from(valueOrValues);
  return processArray.map((value) => {
    if (isNA(value)) {
      return null;
    }
    return Math.ceil(value as number);
  });
}
