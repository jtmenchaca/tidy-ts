import {
  type TestResult,
  z_test_one_sample,
  z_test_two_sample,
} from "../../wasm/wasm-loader.ts";
import type { TestName } from "../../wasm/statistical-tests.ts";

/** Z-test specific result with only relevant fields */
export type ZTestResult =
  & Pick<
    TestResult,
    | "test_type"
    | "test_statistic"
    | "p_value"
    | "confidence_interval_lower"
    | "confidence_interval_upper"
    | "confidence_level"
    | "effect_size"
    | "cohens_d"
    | "sample_size"
    | "mean_difference"
    | "standard_error"
    | "margin_of_error"
    | "sample_means"
    | "sample_std_devs"
    | "error_message"
  >
  & { test_name: TestName };

/**
 * Calculate sample standard deviation
 */
function calculateSampleStd(data: number[]): number {
  const mean = data.reduce((sum, x) => sum + x, 0) / data.length;
  const variance = data.reduce((sum, x) => sum + Math.pow(x - mean, 2), 0) /
    (data.length - 1);
  return Math.sqrt(variance);
}

/**
 * One-sample Z-test for comparing a sample mean to a hypothesized population mean
 *
 * Note: This function uses the sample standard deviation rather than a known population
 * standard deviation, making it technically a t-test approximation. For true Z-tests
 * with known population standard deviation, use the underlying WASM functions directly.
 *
 * @param data - Sample data
 * @param hypothesizedMean - Hypothesized population mean to test against (default: 0)
 * @param alpha - Significance level (default: 0.05)
 * @param alternative - Alternative hypothesis (default: "two-sided")
 * @returns Z-test results (technically a t-test approximation)
 */
export function z_test({
  data,
  hypothesizedMean = 0,
  alternative = "two-sided",
  alpha = 0.05,
}: {
  data: number[];
  hypothesizedMean?: number;
  alternative?: "two-sided" | "less" | "greater";
  alpha?: number;
}): ZTestResult {
  // Filter out non-finite values
  const cleanData = data.filter((x) => isFinite(x));

  if (cleanData.length === 0) {
    throw new Error("No valid data points");
  }

  // Calculate sample standard deviation
  const sampleStd = calculateSampleStd(cleanData);

  return z_test_one_sample(
    new Float64Array(cleanData),
    hypothesizedMean,
    sampleStd,
    alpha,
    alternative,
  ) as ZTestResult;
}

/**
 * Two-sample Z-test for comparing means of two independent samples
 *
 * @param data1 - First sample data
 * @param data2 - Second sample data
 * @param alpha - Significance level (default: 0.05)
 * @param alternative - Alternative hypothesis (default: "two-sided")
 * @returns Z-test results
 */
export function z_test_ind({
  data1,
  data2,
  alternative = "two-sided",
  alpha = 0.05,
}: {
  data1: number[];
  data2: number[];
  alternative?: "two-sided" | "less" | "greater";
  alpha?: number;
}): ZTestResult {
  // Filter out non-finite values
  const cleanData1 = data1.filter((x) => isFinite(x));
  const cleanData2 = data2.filter((x) => isFinite(x));

  if (cleanData1.length === 0 || cleanData2.length === 0) {
    throw new Error("No valid data points in one or both groups");
  }

  // Calculate sample standard deviations
  const sampleStd1 = calculateSampleStd(cleanData1);
  const sampleStd2 = calculateSampleStd(cleanData2);

  return z_test_two_sample(
    new Float64Array(cleanData1),
    new Float64Array(cleanData2),
    sampleStd1,
    sampleStd2,
    alpha,
    alternative,
  ) as ZTestResult;
}

/**
 * One-sample Z-test for means (WASM implementation)
 */
export function zTestOneSample({
  data,
  popMean,
  popStd,
  alternative = "two-sided",
  alpha = 0.05,
}: {
  data: number[];
  popMean: number;
  popStd: number;
  alternative?: "two-sided" | "less" | "greater";
  alpha?: number;
}): ZTestResult {
  const cleanData = data.filter((x) => isFinite(x));

  if (cleanData.length === 0) {
    throw new Error("One-sample Z-test requires at least 1 observation");
  }

  if (popStd <= 0) {
    throw new Error("Population standard deviation must be positive");
  }

  return z_test_one_sample(
    new Float64Array(cleanData),
    popMean,
    popStd,
    alpha,
    alternative,
  ) as ZTestResult;
}

/**
 * Two-sample Z-test for means (WASM implementation)
 */
export function zTestTwoSample({
  data1,
  data2,
  popStd1,
  popStd2,
  alternative = "two-sided",
  alpha = 0.05,
}: {
  data1: number[];
  data2: number[];
  popStd1: number;
  popStd2: number;
  alternative?: "two-sided" | "less" | "greater";
  alpha?: number;
}): ZTestResult {
  const cleanData1 = data1.filter((x) => isFinite(x));
  const cleanData2 = data2.filter((x) => isFinite(x));

  if (cleanData1.length === 0 || cleanData2.length === 0) {
    throw new Error(
      "Two-sample Z-test requires at least 1 observation in each group",
    );
  }

  if (popStd1 <= 0 || popStd2 <= 0) {
    throw new Error("Population standard deviations must be positive");
  }

  return z_test_two_sample(
    new Float64Array(cleanData1),
    new Float64Array(cleanData2),
    popStd1,
    popStd2,
    alpha,
    alternative,
  ) as ZTestResult;
}
