import { isNA } from "../../utilities/mod.ts";

// Math.min/max with spread operator has a limit of ~125k arguments on V8
// Use a conservative limit to avoid stack overflow
const SPREAD_OPERATOR_SAFE_LIMIT = 100000;

/**
 * Normalize values to 0-1 range using min-max normalization
 *
 * @param values - Array of numbers
 * @param method - Normalization method: "minmax" (default) or "zscore"
 * @returns Array of normalized values (0-1 range for minmax, z-scores for zscore)
 *
 * @example
 * ```ts
 * normalize([10, 20, 30]) // [0, 0.5, 1] (min-max normalization)
 * normalize([10, 20, 30], "zscore") // z-scores with mean=0, std=1
 * ```
 */

/**
 * Find the normalized value of a specific target value within an array
 *
 * @param values - Array of numbers
 * @param target - The value to find the normalized value for
 * @param method - Normalization method: "minmax" (default) or "zscore"
 * @returns Normalized value of the target (0-1 range for minmax, z-score for zscore)
 *
 * @example
 * ```ts
 * normalize([10, 20, 30], 20) // 0.5 (20 is halfway between 10 and 30)
 * normalize([10, 20, 30], 20, "zscore") // z-score of 20
 * ```
 */

export function normalize(value: number): number;
export function normalize(values: number[]): number[];
export function normalize(
  values: (number | null | undefined)[],
  method?: "minmax" | "zscore",
): (number | null)[];
export function normalize(values: Iterable<number>): number[];
export function normalize(
  values: Iterable<number | null | undefined>,
  method?: "minmax" | "zscore",
): (number | null)[];

// Overload for finding normalized value of a specific target value
export function normalize(values: number[], target: number): number;
export function normalize(
  values: number[],
  target: number,
  method: "minmax" | "zscore",
): number;
export function normalize(
  values: (number | null | undefined)[],
  target: number,
): number | null;
export function normalize(
  values: (number | null | undefined)[],
  target: number,
  method: "minmax" | "zscore",
): number | null;
export function normalize(values: Iterable<number>, target: number): number;
export function normalize(
  values: Iterable<number>,
  target: number,
  method: "minmax" | "zscore",
): number;
export function normalize(
  values: Iterable<number | null | undefined>,
  target: number,
): number | null;
export function normalize(
  values: Iterable<number | null | undefined>,
  target: number,
  method: "minmax" | "zscore",
): number | null;

export function normalize(
  values:
    | number
    | number[]
    | (number | null | undefined)[]
    | Iterable<number>
    | Iterable<number | null | undefined>,
  methodOrTarget?: "minmax" | "zscore" | number,
  method?: "minmax" | "zscore",
): number | number[] | (number | null)[] | null {
  // Handle single number case
  if (typeof values === "number") {
    return 0; // Single value normalized is always 0
  }

  // Check if second parameter is a target value (number) or method
  const isTargetValue = typeof methodOrTarget === "number";
  const target = isTargetValue ? methodOrTarget : undefined;
  const normMethod = isTargetValue
    ? (method || "minmax")
    : (methodOrTarget as "minmax" | "zscore" | undefined) || "minmax";

  // Handle iterables by materializing to array
  let processArray: (number | null | undefined)[];
  if (Array.isArray(values)) {
    processArray = values;
  } else {
    processArray = Array.from(values as Iterable<number | null | undefined>);
  }

  // Filter out NA values for calculations
  const validValues = processArray.filter((val) => !isNA(val)) as number[];

  if (validValues.length === 0) {
    return null;
  }

  // If we're looking for a specific target value, find its normalized value
  if (isTargetValue && target !== undefined) {
    if (isNA(target)) {
      return null;
    }

    if (normMethod === "minmax") {
      const minVal = validValues.length > SPREAD_OPERATOR_SAFE_LIMIT
        ? validValues.reduce(
          (min, val) => val < min ? val : min,
          validValues[0],
        )
        : Math.min(...validValues);
      const maxVal = validValues.length > SPREAD_OPERATOR_SAFE_LIMIT
        ? validValues.reduce(
          (max, val) => val > max ? val : max,
          validValues[0],
        )
        : Math.max(...validValues);
      const range = maxVal - minVal;

      if (range === 0) {
        return 0; // All values are the same
      }

      return (target - minVal) / range;
    } else { // zscore
      const mean = validValues.reduce((sum, val) => sum + val, 0) /
        validValues.length;
      const variance = validValues.reduce((sum, val) =>
        sum + Math.pow(val - mean, 2), 0) / validValues.length;
      const std = Math.sqrt(variance);

      if (std === 0) {
        return 0; // All values are the same
      }

      return (target - mean) / std;
    }
  }

  // Calculate normalized values for all values
  const normalizedValues = new Array(processArray.length);

  if (normMethod === "minmax") {
    const minVal = validValues.length > SPREAD_OPERATOR_SAFE_LIMIT
      ? validValues.reduce((min, val) => val < min ? val : min, validValues[0])
      : Math.min(...validValues);
    const maxVal = validValues.length > SPREAD_OPERATOR_SAFE_LIMIT
      ? validValues.reduce((max, val) => val > max ? val : max, validValues[0])
      : Math.max(...validValues);
    const range = maxVal - minVal;

    if (range === 0) {
      // All values are the same, normalize to 0
      processArray.forEach((val, i) => {
        normalizedValues[i] = val != null ? 0 : null;
      });
    } else {
      processArray.forEach((val, i) => {
        if (val != null && !isNA(val)) {
          normalizedValues[i] = (val - minVal) / range;
        } else {
          normalizedValues[i] = null;
        }
      });
    }
  } else { // zscore
    const mean = validValues.reduce((sum, val) => sum + val, 0) /
      validValues.length;
    const variance = validValues.reduce((sum, val) =>
      sum + Math.pow(val - mean, 2), 0) / validValues.length;
    const std = Math.sqrt(variance);

    if (std === 0) {
      // All values are the same, normalize to 0
      processArray.forEach((val, i) => {
        normalizedValues[i] = val != null ? 0 : null;
      });
    } else {
      processArray.forEach((val, i) => {
        if (val != null && !isNA(val)) {
          normalizedValues[i] = (val - mean) / std;
        } else {
          normalizedValues[i] = null;
        }
      });
    }
  }

  return normalizedValues;
}
