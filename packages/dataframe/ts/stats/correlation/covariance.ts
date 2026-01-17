/** Options for filtering values in covariance function */
export interface CovarianceOptions {
  removeNull?: boolean;
  removeUndefined?: boolean;
  removeNaN?: boolean;
}

/**
 * Calculate the sample covariance between two arrays of values
 *
 * @param x - First array of numbers
 * @param y - Second array of numbers
 * @param options - Optional object with removal flags
 * @param options.removeNull - If true, filters out pairs where either value is null (default: false)
 * @param options.removeUndefined - If true, filters out pairs where either value is undefined (default: false)
 * @param options.removeNaN - If true, filters out pairs where either value is NaN (default: false)
 * @returns Sample covariance between x and y, or null if no valid pairs
 *
 * @example
 * ```ts
 * covariance([1, 2, 3], [1, 2, 3]) // 1
 * covariance([1, 2, 3], [3, 2, 1]) // -1
 * covariance([1, null, 3], [1, 2, 3]) // null (null present)
 * covariance([1, null, 3], [1, 2, 3], { removeNull: true }) // covariance of pairs (1,1) and (3,3)
 * covariance([1, NaN, 3], [1, 2, 3]) // NaN (NaN propagates)
 * covariance([1, NaN, 3], [1, 2, 3], { removeNaN: true }) // covariance of pairs (1,1) and (3,3)
 * ```
 */

// Clean array overloads (no nulls/undefined)
export function covariance(
  x: number[],
  y: number[],
  options?: CovarianceOptions,
): number;
export function covariance(
  x: readonly number[],
  y: readonly number[],
  options?: CovarianceOptions,
): number;
export function covariance(
  x: Iterable<number>,
  y: Iterable<number>,
  options?: CovarianceOptions,
): number;

// Arrays with nullables - when all removal flags are true, return non-nullable
export function covariance(
  x: (number | null | undefined)[],
  y: (number | null | undefined)[],
  options: { removeNull: true; removeUndefined: true },
): number;

// Arrays with only null (no undefined) - removeNull sufficient
export function covariance(
  x: (number | null)[] | readonly (number | null)[],
  y: (number | null)[] | readonly (number | null)[],
  options: { removeNull: true; removeNaN?: boolean; removeUndefined?: boolean },
): number;

// Arrays with only undefined (no null) - removeUndefined sufficient
export function covariance(
  x: (number | undefined)[] | readonly (number | undefined)[],
  y: (number | undefined)[] | readonly (number | undefined)[],
  options: { removeUndefined: true; removeNaN?: boolean; removeNull?: boolean },
): number;

// Arrays with nullables - return nullable when not all flags are true
export function covariance(
  x: (number | null | undefined)[],
  y: (number | null | undefined)[],
  options?: CovarianceOptions,
): number | null;
export function covariance(
  x: Iterable<number | null | undefined>,
  y: Iterable<number | null | undefined>,
  options?: CovarianceOptions,
): number | null;

// Implementation
export function covariance(
  x:
    | number[]
    | readonly number[]
    | (number | null | undefined)[]
    | Iterable<number>
    | Iterable<number | null | undefined>,
  y:
    | number[]
    | readonly number[]
    | (number | null | undefined)[]
    | Iterable<number>
    | Iterable<number | null | undefined>,
  options: CovarianceOptions = {},
): number | null {
  const {
    removeNull = false,
    removeUndefined = false,
    removeNaN = false,
  } = options;

  // Handle iterables by materializing to arrays
  const xArray = Array.isArray(x) ? x : Array.from(x);
  const yArray = Array.isArray(y) ? y : Array.from(y);

  if (xArray.length !== yArray.length) {
    throw new Error(
      "Arrays must have the same length for covariance calculation",
    );
  }

  if (xArray.length === 0) {
    return null;
  }

  // Collect valid pairs with filtering
  const validPairs: [number, number][] = [];
  let foundNaN = false;

  for (let i = 0; i < xArray.length; i++) {
    const xVal = xArray[i];
    const yVal = yArray[i];

    // Check null
    if (xVal === null || yVal === null) {
      if (!removeNull) return null;
      continue;
    }

    // Check undefined
    if (xVal === undefined || yVal === undefined) {
      if (!removeUndefined) return null;
      continue;
    }

    // Check if both are numbers
    if (typeof xVal !== "number" || typeof yVal !== "number") {
      continue; // Skip non-numeric values
    }

    // Check NaN
    if (Number.isNaN(xVal) || Number.isNaN(yVal)) {
      if (!removeNaN) {
        foundNaN = true;
      }
      continue;
    }

    // Check Infinity - treat as invalid for covariance
    if (!Number.isFinite(xVal) || !Number.isFinite(yVal)) {
      continue;
    }

    validPairs.push([xVal, yVal]);
  }

  // If we found NaN and didn't remove it, return NaN
  if (foundNaN) {
    return NaN;
  }

  if (validPairs.length === 0) {
    return null;
  }

  if (validPairs.length === 1) {
    return NaN; // Single pair has undefined sample covariance
  }

  // Calculate means
  let xSum = 0;
  let ySum = 0;
  for (const [xv, yv] of validPairs) {
    xSum += xv;
    ySum += yv;
  }
  const xMean = xSum / validPairs.length;
  const yMean = ySum / validPairs.length;

  // Calculate covariance
  let covarSum = 0;
  for (const [xv, yv] of validPairs) {
    covarSum += (xv - xMean) * (yv - yMean);
  }

  return covarSum / (validPairs.length - 1); // Sample covariance (divide by N-1)
}
