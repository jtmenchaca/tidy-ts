import { hasMixedTypes } from "../helpers.ts";

/**
 * Calculate the sample covariance between two arrays of values
 *
 * @param x - First array of numbers
 * @param y - Second array of numbers
 * @param removeNA - If true, guarantees a number return (throws if no valid pairs)
 * @returns Sample covariance between x and y, or null if no valid pairs
 *
 * @example
 * ```ts
 * covariance([1, 2, 3], [1, 2, 3]) // 1
 * covariance([1, 2, 3], [3, 2, 1]) // -1
 * covariance([1, null, 3], [1, 2, 3], false) // null (due to null)
 * covariance([1, null, 3], [1, 2, 3], true) // 2 (ignoring null pair)
 * ```
 */
export function covariance(x: number[], y: number[]): number;
export function covariance(
  x: (number | null | undefined)[],
  y: (number | null | undefined)[],
  removeNA: true,
): number;
export function covariance(
  x: (number | null | undefined)[],
  y: (number | null | undefined)[],
  removeNA?: false,
): number | null;
export function covariance(x: Iterable<number>, y: Iterable<number>): number;
export function covariance(
  x: Iterable<number | null | undefined>,
  y: Iterable<number | null | undefined>,
  removeNA: true,
): number;
// Accept mixed types for runtime filtering
export function covariance(x: unknown[], y: unknown[]): number | null;
export function covariance(x: unknown[], y: unknown[], removeNA: true): number;
export function covariance(
  x: Iterable<unknown>,
  y: Iterable<unknown>,
): number | null;
export function covariance(
  x: Iterable<unknown>,
  y: Iterable<unknown>,
  removeNA: true,
): number;
export function covariance(
  x:
    | number[]
    | (number | null | undefined)[]
    | Iterable<number>
    | Iterable<number | null | undefined>
    | unknown[]
    | Iterable<unknown>,
  y:
    | number[]
    | (number | null | undefined)[]
    | Iterable<number>
    | Iterable<number | null | undefined>
    | unknown[]
    | Iterable<unknown>,
  removeNA: boolean = false,
): number | null {
  // Handle iterables by materializing to arrays
  const xArray = Array.isArray(x) ? x : Array.from(x);
  const yArray = Array.isArray(y) ? y : Array.from(y);

  if (xArray.length !== yArray.length) {
    throw new Error(
      "Arrays must have the same length for covariance calculation",
    );
  }

  // Check for mixed types first - return null unless removeNA is true
  if ((hasMixedTypes(xArray) || hasMixedTypes(yArray)) && !removeNA) {
    return null;
  }

  // Collect valid pairs
  const validPairs: [number, number][] = [];

  for (let i = 0; i < xArray.length; i++) {
    const xVal = xArray[i];
    const yVal = yArray[i];

    // Check if both values are valid numbers
    const xIsValid = typeof xVal === "number" && Number.isFinite(xVal);
    const yIsValid = typeof yVal === "number" && Number.isFinite(yVal);

    if (!xIsValid || !yIsValid) {
      if (!removeNA) {
        return null;
      }
      continue;
    }

    validPairs.push([xVal as number, yVal as number]);
  }

  if (validPairs.length === 0) {
    if (removeNA) {
      throw new Error("No valid pairs found to calculate covariance");
    }
    return null;
  }

  if (validPairs.length === 1) {
    return NaN; // Single pair has undefined sample covariance
  }

  // Calculate means
  const xSum = validPairs.reduce((sum, [xVal, _]) => sum + xVal, 0);
  const ySum = validPairs.reduce((sum, [_, yVal]) => sum + yVal, 0);
  const xMean = xSum / validPairs.length;
  const yMean = ySum / validPairs.length;

  // Calculate covariance
  const covarSum = validPairs.reduce((sum, [xVal, yVal]) => {
    return sum + (xVal - xMean) * (yVal - yMean);
  }, 0);

  return covarSum / (validPairs.length - 1); // Sample covariance (divide by N-1)
}
