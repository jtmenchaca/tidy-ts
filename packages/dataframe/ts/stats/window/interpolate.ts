/**
 * Interpolate null/undefined values in an array using linear or spline interpolation.
 * Requires an x-axis array to define spacing between points.
 *
 * @param values - Array of values (may contain nulls) - numbers or Dates
 * @param xValues - Array of numeric or Date values defining x-axis spacing (required)
 * @param method - Interpolation method: "linear" or "spline"
 * @returns Array with interpolated values (same length as input)
 *
 * @example
 * ```ts
 * import { stats } from "@tidy-ts/dataframe";
 *
 * // Linear interpolation with numbers
 * const interpolated = stats.interpolate(
 *   [100, null, null, 200],
 *   [1, 2, 3, 4],
 *   "linear"
 * );
 * // Returns: [100, 133.33, 166.67, 200]
 *
 * // Spline interpolation
 * const smooth = stats.interpolate(
 *   [100, null, null, 200],
 *   [1, 2, 3, 4],
 *   "spline"
 * );
 *
 * // With Dates
 * const dates = [
 *   new Date("2023-01-01"),
 *   null,
 *   null,
 *   new Date("2023-01-04")
 * ];
 * const interpolatedDates = stats.interpolate(
 *   dates,
 *   [1, 2, 3, 4],
 *   "linear"
 * );
 * ```
 *
 * @remarks
 * - Only interpolates values that have both previous and next non-null values
 * - Leading/trailing nulls remain null (can't interpolate without bounds)
 * - For spline: requires at least 4 points, falls back to linear if fewer
 * - Dates are converted to/from timestamps (milliseconds) for interpolation
 */
export function interpolate<T extends number | Date>(
  values: (T | null | undefined)[],
  xValues: (number | Date)[],
  method: "linear" | "spline",
): T[] {
  if (values.length !== xValues.length) {
    throw new Error(
      `interpolate: values and xValues arrays must have the same length (got ${values.length} and ${xValues.length})`,
    );
  }

  if (values.length === 0) {
    return [];
  }

  // Convert xValues to numbers (Dates -> getTime())
  const xNums = xValues.map((x) =>
    x instanceof Date ? x.getTime() : x
  ) as number[];

  // Check if we're working with Dates
  const isDateType = values.some(
    (v) => v !== null && v !== undefined && v instanceof Date,
  );

  // Convert values to numbers for interpolation
  const yNums = values.map((v) => {
    if (v === null || v === undefined) return null;
    if (v instanceof Date) return v.getTime();
    return v as number;
  });

  // Perform interpolation
  const interpolatedNums = method === "linear"
    ? linearInterpolate(yNums, xNums)
    : splineInterpolate(yNums, xNums);

  // Convert back to original type
  if (isDateType) {
    return interpolatedNums.map((v) =>
      v === null ? null : new Date(v) as T
    ) as T[];
  }

  return interpolatedNums as T[];
}

/**
 * Linear interpolation
 */
function linearInterpolate(
  values: (number | null)[],
  xValues: number[],
): (number | null)[] {
  const result: (number | null)[] = [];
  const n = values.length;

  for (let i = 0; i < n; i++) {
    const currentValue = values[i];
    const currentX = xValues[i];

    // If value exists, keep it
    if (currentValue !== null && currentValue !== undefined) {
      result.push(currentValue);
      continue;
    }

    // Find previous and next non-null values
    let prevIdx = i - 1;
    while (prevIdx >= 0 && values[prevIdx] === null) {
      prevIdx--;
    }

    let nextIdx = i + 1;
    while (nextIdx < n && values[nextIdx] === null) {
      nextIdx++;
    }

    // Can't interpolate without both bounds
    if (prevIdx < 0 || nextIdx >= n) {
      result.push(null);
      continue;
    }

    const prevValue = values[prevIdx]!;
    const nextValue = values[nextIdx]!;
    const prevX = xValues[prevIdx];
    const nextX = xValues[nextIdx];

    // Linear interpolation: y = y1 + (x - x1) * (y2 - y1) / (x2 - x1)
    const ratio = (currentX - prevX) / (nextX - prevX);
    const interpolated = prevValue + ratio * (nextValue - prevValue);
    result.push(interpolated);
  }

  return result;
}

/**
 * Spline interpolation (cubic splines)
 * Falls back to linear if fewer than 4 points
 */
function splineInterpolate(
  values: (number | null)[],
  xValues: number[],
): (number | null)[] {
  // Count non-null values
  const nonNullIndices: number[] = [];
  for (let i = 0; i < values.length; i++) {
    if (values[i] !== null && values[i] !== undefined) {
      nonNullIndices.push(i);
    }
  }

  // Need at least 4 points for cubic spline, fall back to linear
  if (nonNullIndices.length < 4) {
    return linearInterpolate(values, xValues);
  }

  // Extract non-null points
  const xPoints: number[] = [];
  const yPoints: number[] = [];
  for (const idx of nonNullIndices) {
    xPoints.push(xValues[idx]);
    yPoints.push(values[idx]!);
  }

  // Build cubic spline coefficients
  const n = xPoints.length;
  const h: number[] = []; // differences
  const alpha: number[] = [];
  const l: number[] = [];
  const mu: number[] = [];
  const z: number[] = [];
  const c: number[] = [];
  const b: number[] = [];
  const d: number[] = [];

  // Calculate h (differences between x points)
  for (let i = 0; i < n - 1; i++) {
    h.push(xPoints[i + 1] - xPoints[i]);
  }

  // Set up tridiagonal system for natural spline
  // Natural spline: second derivative = 0 at endpoints
  for (let i = 1; i < n - 1; i++) {
    alpha[i] = (3 / h[i]) * (yPoints[i + 1] - yPoints[i]) -
      (3 / h[i - 1]) * (yPoints[i] - yPoints[i - 1]);
  }

  l[0] = 1;
  mu[0] = 0;
  z[0] = 0;

  for (let i = 1; i < n - 1; i++) {
    l[i] = 2 * (xPoints[i + 1] - xPoints[i - 1]) - h[i - 1] * mu[i - 1];
    mu[i] = h[i] / l[i];
    z[i] = (alpha[i] - h[i - 1] * z[i - 1]) / l[i];
  }

  l[n - 1] = 1;
  z[n - 1] = 0;
  c[n - 1] = 0;

  // Back substitution
  for (let j = n - 2; j >= 0; j--) {
    c[j] = z[j] - mu[j] * c[j + 1];
    b[j] = (yPoints[j + 1] - yPoints[j]) / h[j] -
      h[j] * (c[j + 1] + 2 * c[j]) / 3;
    d[j] = (c[j + 1] - c[j]) / (3 * h[j]);
  }

  // Interpolate all points
  const result: (number | null)[] = [];

  for (let i = 0; i < values.length; i++) {
    const currentValue = values[i];
    const currentX = xValues[i];

    // If value exists, keep it
    if (currentValue !== null && currentValue !== undefined) {
      result.push(currentValue);
      continue;
    }

    // Find which segment this x falls into
    let segmentIdx = -1;
    for (let j = 0; j < n - 1; j++) {
      if (currentX >= xPoints[j] && currentX <= xPoints[j + 1]) {
        segmentIdx = j;
        break;
      }
    }

    // Can't interpolate outside bounds
    if (segmentIdx === -1) {
      result.push(null);
      continue;
    }

    // Evaluate spline at this point
    const dx = currentX - xPoints[segmentIdx];
    const y = yPoints[segmentIdx] +
      b[segmentIdx] * dx +
      c[segmentIdx] * dx * dx +
      d[segmentIdx] * dx * dx * dx;

    result.push(y);
  }

  return result;
}
