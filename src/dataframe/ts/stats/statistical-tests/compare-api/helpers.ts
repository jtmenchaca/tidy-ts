import { shapiroWilkTest } from "../shapiro-wilk.ts";
import type {
  NumberIterable,
  NumbersWithNullable,
  NumbersWithNullableIterable,
} from "../../helpers.ts";

/**
 * Utility functions for the compare API
 */

/**
 * Clean numeric data by filtering out null, undefined, and infinite values
 */
export function cleanNumeric(
  data:
    | readonly number[]
    | NumberIterable
    | NumbersWithNullable
    | NumbersWithNullableIterable
): number[] {
  const dataArray = Array.isArray(data) ? data : Array.from(data);
  return dataArray.filter((x): x is number =>
    typeof x === "number" && Number.isFinite(x)
  );
}

/**
 * Check if an array contains only boolean values
 */
export function isBinaryArray(
  data: readonly unknown[]
): data is readonly boolean[] {
  return data.every(x => typeof x === "boolean");
}

/**
 * Convert data to binary (0/1) format
 */
export function to01(value: unknown): 0 | 1 {
  if (value === 1 || value === true) return 1;
  if (value === 0 || value === false) return 0;
  throw new Error("Value must be binary (0/1 or boolean)");
}

/**
 * Choose alternative hypothesis with default
 */
export function chooseAlt(alternative?: "two-sided" | "less" | "greater"): "two-sided" | "less" | "greater" {
  return alternative ?? "two-sided";
}

/**
 * Choose alpha level with default
 */
export function chooseAlpha(alpha?: number): number {
  return alpha ?? 0.05;
}

/**
 * Check if sample size is suitable for Shapiro-Wilk test
 */
export function canShapiro(n: number): boolean {
  return n >= 3 && n <= 5000;
}

/**
 * Check if data has many ties (for choosing between tests)
 */
export function hasManyTies(x: number[], y: number[]): boolean {
  const combined = [...x, ...y];
  const uniqueCount = new Set(combined).size;
  return uniqueCount < combined.length * 0.8; // More than 20% ties
}

/**
 * Check if sample size is small for two-group tests
 */
export function smallSample2(x: number[], y: number[]): boolean {
  return Math.min(x.length, y.length) <= 8;
}

/**
 * Calculate expected counts for a 2x2 contingency table
 */
export function expectedCounts2x2(
  n11: number,
  n10: number, 
  n01: number,
  n00: number
): number[] {
  const n1_ = n11 + n10; // Row 1 total
  const n0_ = n01 + n00; // Row 2 total  
  const n_1 = n11 + n01; // Column 1 total
  const n_0 = n10 + n00; // Column 2 total
  const n = n1_ + n0_;    // Grand total
  
  return [
    (n1_ * n_1) / n, // Expected for [1,1]
    (n1_ * n_0) / n, // Expected for [1,0]
    (n0_ * n_1) / n, // Expected for [0,1]
    (n0_ * n_0) / n, // Expected for [0,0]
  ];
}

/**
 * Test if data is non-normal using Shapiro-Wilk test
 */
export function isNonNormal(data: number[], alpha = 0.05): boolean {
  if (!canShapiro(data.length)) {
    // If we can't test normality, assume normal (conservative approach)
    return false;
  }
  
  const result = shapiroWilkTest({ data, alpha });
  return (result.p_value ?? 1) < alpha;
}

/**
 * Check if group variances are approximately equal using simple variance ratio
 */
export function hasEqualVariances(groups: number[][]): boolean {
  const variances = groups.map(group => {
    if (group.length < 2) return 0;
    const mean = group.reduce((a, b) => a + b, 0) / group.length;
    return group.reduce((sum, x) => sum + (x - mean) ** 2, 0) / (group.length - 1);
  });
  
  const validVariances = variances.filter(v => v > 0);
  if (validVariances.length < 2) return true;
  
  const minVar = Math.min(...validVariances);
  const maxVar = Math.max(...validVariances);
  
  // Rule of thumb: max variance / min variance should be < 4
  return (maxVar / minVar) < 4;
}

/**
 * Check if group sizes are reasonably balanced
 */
export function hasBalancedSizes(groups: number[][]): boolean {
  const sizes = groups.map(group => group.length);
  const minSize = Math.min(...sizes);
  const maxSize = Math.max(...sizes);
  
  // Rule of thumb: size ratio should be < 1.5
  return (maxSize / minSize) < 1.5;
}