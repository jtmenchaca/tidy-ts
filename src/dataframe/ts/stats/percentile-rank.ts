import { isNA } from "../utilities/mod.ts";

/**
 * Calculate the percentile rank of a value within an array
 * Returns a value between 0 and 1 representing the percentile rank
 *
 * @param values - Array of numbers
 * @param target - The value to find the percentile rank for
 * @returns Percentile rank between 0 and 1, or null if no valid values
 *
 * @example
 * ```ts
 * percentile_rank([1, 2, 3, 4, 5], 3) // 0.6 (3 is at 60th percentile)
 * percentile_rank([10, 20, 30, 40, 50], 25) // 0.4 (25 is at 40th percentile)
 * ```
 */
export function percentile_rank(values: number[], target: number): number;
export function percentile_rank(
  values: (number | null | undefined)[],
  target: number,
): number | null;
export function percentile_rank(
  values: Iterable<number>,
  target: number,
): number;
export function percentile_rank(
  values: Iterable<number | null | undefined>,
  target: number,
): number | null;
export function percentile_rank(
  values:
    | number[]
    | (number | null | undefined)[]
    | Iterable<number>
    | Iterable<number | null | undefined>,
  target: number,
): number | null {
  // Handle iterables by materializing to array
  let processArray: (number | null | undefined)[];
  if (Array.isArray(values)) {
    processArray = values;
  } else {
    processArray = Array.from(values as Iterable<number | null | undefined>);
  }

  // Filter out NA values
  const validValues = processArray.filter((val) => !isNA(val)) as number[];

  // Count how many values are less than or equal to the target
  const below = validValues.filter((val) => val <= target).length;

  // Return percentile rank between 0 and 1
  return below / validValues.length;
}
