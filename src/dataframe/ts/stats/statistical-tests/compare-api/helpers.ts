import { shapiroWilkTest } from "../shapiro-wilk.ts";
import { dagostinoPearsonTest } from "../dagostino-pearson.ts";
import { andersonDarlingTest } from "../anderson-darling.ts";
import { leveneTest } from "../levene.ts";
import type {
  NumberIterable,
  NumbersWithNullable,
  NumbersWithNullableIterable,
} from "../../helpers.ts";

/**
 * Utility functions for the compare API
 */

// Evidence-based approach constants
const N_SMALL_MAX = 50;
const N_MODERATE_MAX = 300;
const ALPHA = 0.05;

/**
 * Clean numeric data by filtering out null, undefined, and infinite values
 */
export function cleanNumeric(
  data:
    | readonly number[]
    | NumberIterable
    | NumbersWithNullable
    | NumbersWithNullableIterable,
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
  data: readonly unknown[],
): data is readonly boolean[] {
  return data.every((x) => typeof x === "boolean");
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
export function chooseAlt(
  alternative?: "two-sided" | "less" | "greater",
): "two-sided" | "less" | "greater" {
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
  n00: number,
): number[] {
  const n1_ = n11 + n10; // Row 1 total
  const n0_ = n01 + n00; // Row 2 total
  const n_1 = n11 + n01; // Column 1 total
  const n_0 = n10 + n00; // Column 2 total
  const n = n1_ + n0_; // Grand total

  return [
    (n1_ * n_1) / n, // Expected for [1,1]
    (n1_ * n_0) / n, // Expected for [1,0]
    (n0_ * n_1) / n, // Expected for [0,1]
    (n0_ * n_0) / n, // Expected for [0,0]
  ];
}

/**
 * Test if data is non-normal using appropriate test based on sample size
 *
 * Based on the evidence-based approach:
 * - n < 7: Cannot test, assume normal (conservative)
 * - 7 ≤ n ≤ 50: Use Shapiro-Wilk (best power for small samples)
 * - 50 < n ≤ 300: Use D'Agostino-Pearson K² (omnibus test for skewness + kurtosis)
 * - n > 300: Use Anderson-Darling (tail-sensitive, good for large samples)
 *
 * Note: For n > 200, normality tests become oversensitive; consider using
 * robust methods (Welch t-test) by default for large samples.
 */
export function isNonNormal(data: number[], alpha = 0.05): boolean {
  const n = data.length;

  // Cannot reliably test normality with very small samples
  if (n < 7) {
    // Conservative approach: assume normal when we can't test
    return false;
  }

  // Small-moderate samples (7-50): Shapiro-Wilk has best power
  if (n <= 50) {
    if (canShapiro(n)) {
      const result = shapiroWilkTest({ data, alpha });
      return (result.p_value ?? 1) < alpha;
    }
    // Fallback for edge cases
    return false;
  }

  // Moderate samples (50-300): D'Agostino-Pearson K² for omnibus testing
  if (n <= 300) {
    // D'Agostino-Pearson requires n ≥ 20, but we're already > 50
    const result = dagostinoPearsonTest({ data, alpha });
    return (result.p_value ?? 1) < alpha;
  }

  // Large samples (>300): Anderson-Darling for tail sensitivity
  // Note: For very large samples, consider defaulting to robust methods
  const result = andersonDarlingTest({ data, alpha });
  return (result.p_value ?? 1) < alpha;
}

/**
 * Check if group variances are approximately equal using Brown-Forsythe test
 *
 * Uses the Brown-Forsythe modification of Levene's test (deviations from medians)
 * which is more robust to non-normality than the original Levene's test.
 */
export function hasEqualVariances(groups: number[][], alpha = 0.05): boolean {
  try {
    // Use Brown-Forsythe test (already implemented in leveneTest)
    const result = leveneTest(groups, alpha);
    return result.p_value >= alpha;
  } catch {
    // If test fails, assume unequal variances (conservative approach)
    return false;
  }
}

/**
 * Check if group sizes are reasonably balanced
 */
export function hasBalancedSizes(groups: number[][]): boolean {
  const sizes = groups.map((group) => group.length);
  const minSize = Math.min(...sizes);
  const maxSize = Math.max(...sizes);

  // Rule of thumb: size ratio should be < 1.5
  return (maxSize / minSize) < 1.5;
}

// ---------- Residual Helper Functions (Evidence-Based Approach) ----------

/**
 * Compute residuals for one-sample test (data minus hypothesized value)
 */
export function residuals_oneSample(data: number[], value: number): number[] {
  return data.map((d) => d - value);
}

/**
 * Compute residuals for two-sample test (each group's deviations from their own mean)
 */
export function residuals_twoSample(
  x: number[],
  y: number[],
): { rx: number[]; ry: number[] } {
  const xMean = x.reduce((a, b) => a + b, 0) / x.length;
  const yMean = y.reduce((a, b) => a + b, 0) / y.length;
  const rx = x.map((d) => d - xMean);
  const ry = y.map((d) => d - yMean);
  return { rx, ry };
}

/**
 * Compute residuals for multiple groups (each group's deviations from their own mean)
 */
export function residuals_groups(groups: number[][]): number[][] {
  return groups.map((g) => {
    const mean = g.reduce((a, b) => a + b, 0) / g.length;
    return g.map((d) => d - mean);
  });
}

/**
 * Test normality using appropriate method based on sample size (evidence-based approach)
 */
export function normalityOK(vec: number[], alpha = ALPHA): boolean {
  const n = vec.length;

  if (n <= N_SMALL_MAX) {
    // Small samples: Use Shapiro-Wilk (best power for small samples)
    if (canShapiro(n)) {
      const result = shapiroWilkTest({ data: vec, alpha });
      return (result.p_value ?? 1) >= alpha;
    }
    return true; // Assume normal if we can't test
  } else if (n <= N_MODERATE_MAX) {
    // Moderate samples: Use D'Agostino-Pearson K² (omnibus test)
    const result = dagostinoPearsonTest({ data: vec, alpha });
    return (result.p_value ?? 1) >= alpha;
  } else {
    // Large samples: Always return true (use robust methods regardless)
    return true;
  }
}

/**
 * Check if all groups pass normality test on their residuals
 */
export function allGroupsNormal(groups: number[][], alpha = ALPHA): boolean {
  const residualGroups = residuals_groups(groups);
  for (const r of residualGroups) {
    if (!normalityOK(r, alpha)) {
      return false;
    }
  }
  return true;
}

/**
 * Calculate skewness z-score for a sample
 */
export function skewnessZScore(data: number[]): number {
  const n = data.length;
  const mean = data.reduce((a, b) => a + b, 0) / n;

  let m2 = 0;
  let m3 = 0;
  for (const x of data) {
    const diff = x - mean;
    const diff2 = diff * diff;
    m2 += diff2;
    m3 += diff2 * diff;
  }
  m2 /= n;
  m3 /= n;

  const skewness = m3 / Math.pow(m2, 1.5);
  const se_skew = Math.sqrt(6 / n);

  return skewness / se_skew;
}

/**
 * Calculate kurtosis z-score for a sample
 */
export function kurtosisZScore(data: number[]): number {
  const n = data.length;
  const mean = data.reduce((a, b) => a + b, 0) / n;

  let m2 = 0;
  let m4 = 0;
  for (const x of data) {
    const diff = x - mean;
    const diff2 = diff * diff;
    m2 += diff2;
    m4 += diff2 * diff2;
  }
  m2 /= n;
  m4 /= n;

  const kurtosis = m4 / (m2 * m2) - 3; // Excess kurtosis
  const se_kurt = Math.sqrt(24 / n);

  return kurtosis / se_kurt;
}
