/**
 * Proportion Tests
 *
 * This module provides functions for performing proportion tests using WASM implementations.
 */

// Import WASM functions
import {
  proportion_test_one_sample,
  proportion_test_two_sample,
  type TestResult,
} from "../../wasm/wasm-loader.ts";

/** Proportion test specific result with only relevant fields */
export type ProportionTestResult = Pick<
  TestResult,
  | "test_type"
  | "test_statistic"
  | "p_value"
  | "confidence_interval_lower"
  | "confidence_interval_upper"
  | "confidence_level"
  | "effect_size"
  | "sample_size"
  | "mean_difference"
  | "standard_error"
  | "margin_of_error"
  | "sample_means"
  | "sample_std_devs"
  | "error_message"
>;

/**
 * One-sample proportion test
 *
 * Tests whether a sample proportion differs significantly from a hypothesized population proportion.
 *
 * @param data - Array of binary values (0 or 1) where 1 represents success
 * @param options - Test options including the null hypothesis proportion
 * @returns Test result with statistic, p-value, and other relevant information
 */
export function proportion_test(
  data: number[],
  p0: number = 0.5,
  alternative: "two-sided" | "less" | "greater" = "two-sided",
  alpha: number = 0.05,
): ProportionTestResult {
  const cleanData = data.filter((x) => x === 0 || x === 1);
  const n = cleanData.length;

  if (n === 0) {
    throw new Error(
      "One-sample proportion test requires at least 1 observation",
    );
  }

  if (p0 < 0 || p0 > 1) {
    throw new Error("Null hypothesis proportion must be between 0 and 1");
  }

  // Calculate sample proportion
  const successes = cleanData.reduce((sum, val) => sum + val, 0 as number);
  const _sampleProportion = successes / n;

  // Use WASM for the test
  return proportion_test_one_sample(
    successes,
    n,
    p0,
    alpha,
    alternative,
  ) as ProportionTestResult;
}

/**
 * Two-sample proportion test
 *
 * Tests whether the difference between two sample proportions is statistically significant.
 *
 * @param x - Array of binary values for the first group
 * @param y - Array of binary values for the second group
 * @param options - Test options including whether to use pooled variance
 * @returns Test result with statistic, p-value, and other relevant information
 */
export function proportion_test_ind(
  x: number[],
  y: number[],
  pooled: boolean = true,
  alternative: "two-sided" | "less" | "greater" = "two-sided",
  alpha: number = 0.05,
): ProportionTestResult {
  const cleanX = x.filter((val) => val === 0 || val === 1);
  const cleanY = y.filter((val) => val === 0 || val === 1);

  const n1 = cleanX.length;
  const n2 = cleanY.length;

  if (n1 === 0 || n2 === 0) {
    throw new Error(
      "Two-sample proportion test requires at least 1 observation in each group",
    );
  }

  // Calculate sample proportions
  const successes1 = cleanX.reduce((sum, val) => sum + val, 0 as number);
  const successes2 = cleanY.reduce((sum, val) => sum + val, 0 as number);
  const proportion1 = successes1 / n1;
  const proportion2 = successes2 / n2;
  const _proportionDifference = proportion1 - proportion2;

  // Use WASM for the test
  return proportion_test_two_sample(
    successes1,
    n1,
    successes2,
    n2,
    alpha,
    alternative,
    pooled,
  ) as ProportionTestResult;
}

/**
 * One-sample proportion test (WASM implementation)
 */
export function proportionTestOneSample(
  data: number[],
  popProportion: number,
): ProportionTestResult {
  const cleanData = data.filter((x) => x === 0 || x === 1);
  const n = cleanData.length;

  if (n === 0) {
    throw new Error(
      "One-sample proportion test requires at least 1 observation",
    );
  }

  if (popProportion < 0 || popProportion > 1) {
    throw new Error("Population proportion must be between 0 and 1");
  }

  const successes = cleanData.reduce((sum, val) => sum + val, 0 as number);

  return proportion_test_one_sample(
    successes,
    n,
    popProportion,
    0.05,
    "two-sided",
  ) as ProportionTestResult;
}

/**
 * Two-sample proportion test (WASM implementation)
 */
export function proportionTestTwoSample(
  data1: number[],
  data2: number[],
  pooled: boolean = true,
): ProportionTestResult {
  const cleanData1 = data1.filter((x) => x === 0 || x === 1);
  const cleanData2 = data2.filter((x) => x === 0 || x === 1);
  const n1 = cleanData1.length;
  const n2 = cleanData2.length;

  if (n1 === 0 || n2 === 0) {
    throw new Error(
      "Two-sample proportion test requires at least 1 observation in each group",
    );
  }

  const successes1 = cleanData1.reduce((sum, val) => sum + val, 0 as number);
  const successes2 = cleanData2.reduce((sum, val) => sum + val, 0 as number);

  return proportion_test_two_sample(
    successes1,
    n1,
    successes2,
    n2,
    0.05,
    "two-sided",
    pooled,
  ) as ProportionTestResult;
}
