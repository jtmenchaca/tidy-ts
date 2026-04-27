/**
 * Parallel minimum — elementwise min of an array against a scalar or another array.
 *
 * Equivalent to R's `pmin()`. Each element of the input is compared against
 * the corresponding element (or scalar), and the smaller value is returned.
 *
 * Null/undefined values pass through as null. NaN propagates as NaN.
 *
 * @param values - Array of numbers (may include null/undefined)
 * @param other - Scalar number or array of numbers to compare against
 * @returns Array of elementwise minimums
 *
 * @example
 * ```ts
 * pmin([1, 5, 3], 4)          // [1, 4, 3]
 * pmin([10, 2, 30], 5)        // [5, 2, 5]
 * pmin([1, 5, 3], [2, 3, 7])  // [1, 3, 3]
 * pmin([1, null, 3], 0)       // [0, null, 0]
 * ```
 */

/** @internal Check for null/undefined without treating NaN as missing */
function isMissing(v: unknown): v is null | undefined {
  return v === null || v === undefined;
}

// --- Scalar comparand overloads ---

// Clean arrays → clean output
export function pmin(values: number[], other: number): number[];
export function pmin(values: readonly number[], other: number): number[];

// Nullable arrays → nullable output
export function pmin(
  values: (number | null)[] | readonly (number | null)[],
  other: number,
): (number | null)[];
export function pmin(
  values: (number | undefined)[] | readonly (number | undefined)[],
  other: number,
): (number | null)[];
export function pmin(
  values:
    | (number | null | undefined)[]
    | readonly (number | null | undefined)[],
  other: number,
): (number | null)[];

// Iterable overloads
export function pmin(values: Iterable<number>, other: number): number[];
export function pmin(
  values: Iterable<number | null | undefined>,
  other: number,
): (number | null)[];

// --- Array comparand overloads ---

// Clean arrays → clean output
export function pmin(values: number[], other: number[]): number[];
export function pmin(
  values: readonly number[],
  other: readonly number[],
): number[];

// Nullable arrays → nullable output
export function pmin(
  values:
    | (number | null | undefined)[]
    | readonly (number | null | undefined)[],
  other:
    | (number | null | undefined)[]
    | readonly (number | null | undefined)[],
): (number | null)[];

// Implementation
export function pmin(
  values:
    | number[]
    | readonly number[]
    | (number | null | undefined)[]
    | readonly (number | null | undefined)[]
    | Iterable<number>
    | Iterable<number | null | undefined>,
  other:
    | number
    | number[]
    | readonly number[]
    | (number | null | undefined)[]
    | readonly (number | null | undefined)[],
): number[] | (number | null)[] {
  const arr = Array.isArray(values) ? values : Array.from(values);

  if (arr.length === 0) {
    return [];
  }

  // Scalar comparand
  if (typeof other === "number") {
    if (Number.isNaN(other)) {
      return arr.map((v) => (isMissing(v) ? null : NaN));
    }

    return arr.map((v) => {
      if (isMissing(v)) return null;
      const n = v as number;
      if (Number.isNaN(n)) return NaN;
      return Math.min(n, other);
    });
  }

  // Array comparand
  const otherArr = Array.isArray(other) ? other : Array.from(other);
  if (arr.length !== otherArr.length) {
    throw new Error(
      `pmin: arrays must be the same length (got ${arr.length} and ${otherArr.length})`,
    );
  }

  return arr.map((v, i) => {
    const o = otherArr[i];
    if (isMissing(v) || isMissing(o)) return null;
    const nv = v as number;
    const no = o as number;
    if (Number.isNaN(nv) || Number.isNaN(no)) return NaN;
    return Math.min(nv, no);
  });
}
