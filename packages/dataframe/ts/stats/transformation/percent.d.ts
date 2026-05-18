/**
 * Calculate a percentage from a numerator and denominator, rounded to a given number of decimals.
 *
 * Returns 0 when denominator is 0 to handle division-by-zero gracefully.
 * Returns null if either numerator or denominator is null/undefined.
 *
 * @param numerator - The portion value
 * @param denominator - The total value
 * @param decimals - Number of decimal places to round to (default: 1)
 * @returns Percentage (0–100 scale), rounded, or null if inputs are null/undefined
 *
 * @example
 * ```ts
 * percent(25, 100); // 25.0
 * percent(1, 3); // 33.3
 * percent(2, 3, 2); // 66.67
 * percent(5, 0); // 0 (handles division by zero)
 * percent(0, 100); // 0.0
 * percent(null, 100); // null
 * percent(50, null); // null
 * ```
 */
export declare function percent(numerator: number | null | undefined, denominator: number | null | undefined, decimals?: number): number | null;
