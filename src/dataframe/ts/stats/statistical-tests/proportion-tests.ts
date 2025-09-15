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
import type { TestName } from "../../wasm/statistical-tests.ts";

/** Proportion test specific result with only relevant fields */
export type ProportionTestResult =
  & Pick<
    TestResult,
    | "test_type"
    | "sample_size"
    | "mean_difference"
    | "standard_error"
    | "margin_of_error"
    | "sample_means"
    | "sample_std_devs"
    | "error_message"
  >
  & {
    test_statistic: number;
    p_value: number;
    confidence_interval_lower: number;
    confidence_interval_upper: number;
    confidence_level: number;
    effect_size: number;
    test_name: TestName;
  };

/**
 * One-sample proportion test
 *
 * Tests whether a sample proportion differs significantly from a hypothesized population proportion.
 *
 * @param data - Array of binary values (0 or 1) where 1 represents success
 * @param options - Test options including the null hypothesis proportion
 * @returns Test result with statistic, p-value, and other relevant information
 */
export function proportion_test({
  data,
  p0 = 0.5,
  alternative = "two-sided",
  alpha = 0.05,
}: {
  data: number[];
  p0?: number;
  alternative?: "two-sided" | "less" | "greater";
  alpha?: number;
}): ProportionTestResult {
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
export function proportion_test_ind({
  x,
  y,
  pooled = true,
  alternative = "two-sided",
  alpha = 0.05,
}: {
  x: number[];
  y: number[];
  pooled?: boolean;
  alternative?: "two-sided" | "less" | "greater";
  alpha?: number;
}): ProportionTestResult {
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
export function proportionTestOneSample({
  data,
  popProportion,
  alternative = "two-sided",
  alpha = 0.05,
}: {
  data: number[];
  popProportion: number;
  alternative?: "two-sided" | "less" | "greater";
  alpha?: number;
}): ProportionTestResult {
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
    alpha,
    alternative,
  ) as ProportionTestResult;
}

/**
 * Two-sample proportion test (WASM implementation)
 */
export function proportionTestTwoSample({
  data1,
  data2,
  pooled = true,
  alternative = "two-sided",
  alpha = 0.05,
}: {
  data1: number[];
  data2: number[];
  pooled?: boolean;
  alternative?: "two-sided" | "less" | "greater";
  alpha?: number;
}): ProportionTestResult {
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
    alpha,
    alternative,
    pooled,
  ) as ProportionTestResult;
}
