import { hasMixedTypes } from "../helpers.ts";

/**
 * Calculate the Pearson correlation coefficient between two arrays of values
 *
 * @param x - First array of numbers
 * @param y - Second array of numbers
 * @param remove_na - If true, guarantees a number return (throws if no valid pairs)
 * @returns Pearson correlation coefficient between x and y, or null if no valid pairs
 *
 * @example
 * ```ts
 * corr([1, 2, 3], [1, 2, 3]) // 1
 * corr([1, 2, 3], [3, 2, 1]) // -1
 * corr([1, null, 3], [1, 2, 3], false) // null (due to null)
 * corr([1, null, 3], [1, 2, 3], true) // 1 (ignoring null pair)
 * ```
 */
export function corr(x: number[], y: number[]): number;
export function corr(
  x: (number | null | undefined)[],
  y: (number | null | undefined)[],
  remove_na: true,
): number;
export function corr(
  x: (number | null | undefined)[],
  y: (number | null | undefined)[],
  remove_na?: false,
): number | null;
export function corr(x: Iterable<number>, y: Iterable<number>): number;
export function corr(
  x: Iterable<number | null | undefined>,
  y: Iterable<number | null | undefined>,
  remove_na: true,
): number;
// Accept mixed types for runtime filtering
export function corr(x: unknown[], y: unknown[]): number | null;
export function corr(x: unknown[], y: unknown[], remove_na: true): number;
export function corr(x: Iterable<unknown>, y: Iterable<unknown>): number | null;
export function corr(
  x: Iterable<unknown>,
  y: Iterable<unknown>,
  remove_na: true,
): number;
export function corr(
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
  remove_na: boolean = false,
): number | null {
  // Handle iterables by materializing to arrays
  const xArray = Array.isArray(x) ? x : Array.from(x);
  const yArray = Array.isArray(y) ? y : Array.from(y);

  if (xArray.length !== yArray.length) {
    throw new Error(
      "Arrays must have the same length for correlation calculation",
    );
  }

  // Check for mixed types first - return null unless remove_na is true
  if ((hasMixedTypes(xArray) || hasMixedTypes(yArray)) && !remove_na) {
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
      if (!remove_na) {
        return null;
      }
      continue;
    }

    validPairs.push([xVal as number, yVal as number]);
  }

  if (validPairs.length === 0) {
    if (remove_na) {
      throw new Error("No valid pairs found to calculate correlation");
    }
    return null;
  }

  if (validPairs.length === 1) {
    return NaN; // Single pair has undefined correlation
  }

  // Calculate means
  const xSum = validPairs.reduce((sum, [xVal, _]) => sum + xVal, 0);
  const ySum = validPairs.reduce((sum, [_, yVal]) => sum + yVal, 0);
  const xMean = xSum / validPairs.length;
  const yMean = ySum / validPairs.length;

  // Calculate sums for correlation formula
  let sumXY = 0;
  let sumX2 = 0;
  let sumY2 = 0;

  for (const [xVal, yVal] of validPairs) {
    const xDiff = xVal - xMean;
    const yDiff = yVal - yMean;

    sumXY += xDiff * yDiff;
    sumX2 += xDiff * xDiff;
    sumY2 += yDiff * yDiff;
  }

  // Handle case where one or both variables have zero variance
  if (sumX2 === 0 || sumY2 === 0) {
    return sumX2 === 0 && sumY2 === 0 ? NaN : 0;
  }

  // Calculate Pearson correlation coefficient
  return sumXY / Math.sqrt(sumX2 * sumY2);
}
