import {
  serializeTestResult,
  t_test_one_sample,
  t_test_paired,
  t_test_two_sample_independent,
} from "../../wasm/statistical-tests.ts";
import type {
  OneSampleTTestResult,
  PairedTTestResult,
  TwoSampleTTestResult,
} from "../../../lib/tidy_ts_dataframe.js";

/**
 * One-sample t-test for comparing sample mean to hypothesized population mean
 * @param data - Sample data
 * @param mu - Hypothesized population mean (default: 0)
 * @param alternative - Alternative hypothesis: 'two-sided', 'less', or 'greater' (default: 'two-sided')
 * @param alpha - Significance level (default: 0.05)
 * @returns Test statistic, p-value, and confidence interval
 */
export function tTestOneSample({
  data,
  mu = 0,
  alternative = "two-sided",
  alpha = 0.05,
}: {
  data: number[];
  mu?: number;
  alternative?: "two-sided" | "less" | "greater";
  alpha?: number;
}): OneSampleTTestResult {
  const cleanData = data.filter((x) => isFinite(x));

  if (cleanData.length < 2) {
    throw new Error("One-sample t-test requires at least 2 observations");
  }

  const result = t_test_one_sample(
    new Float64Array(cleanData),
    mu,
    alpha,
    alternative,
  );
  return serializeTestResult(result) as OneSampleTTestResult;
}

/**
 * Independent t-test for comparing means of two independent groups
 * @param x - First group data
 * @param y - Second group data
 * @param equalVar - Assume equal variances (default: true)
 * @param alternative - Alternative hypothesis: 'two-sided', 'less', or 'greater' (default: 'two-sided')
 * @param alpha - Significance level (default: 0.05)
 * @returns Test statistic, p-value, and confidence interval
 */
export function tTestIndependent({
  x,
  y,
  equalVar = true,
  alternative = "two-sided",
  alpha = 0.05,
}: {
  x: number[];
  y: number[];
  equalVar?: boolean;
  alternative?: "two-sided" | "less" | "greater";
  alpha?: number;
}): TwoSampleTTestResult {
  const cleanX = x.filter((x) => isFinite(x));
  const cleanY = y.filter((x) => isFinite(x));

  if (cleanX.length < 2 || cleanY.length < 2) {
    throw new Error("Each group must have at least 2 observations");
  }

  const result = t_test_two_sample_independent(
    new Float64Array(cleanX),
    new Float64Array(cleanY),
    alpha,
    alternative,
    equalVar,
  );
  return serializeTestResult(result) as TwoSampleTTestResult;
}

/**
 * Paired t-test for comparing means of two related samples
 * @param x - First sample data
 * @param y - Second sample data
 * @param alternative - Alternative hypothesis: 'two-sided', 'less', or 'greater' (default: 'two-sided')
 * @param alpha - Significance level (default: 0.05)
 * @returns Test statistic, p-value, and confidence interval
 */
export function tTestPaired({
  x,
  y,
  alternative = "two-sided",
  alpha = 0.05,
}: {
  x: number[];
  y: number[];
  alternative?: "two-sided" | "less" | "greater";
  alpha?: number;
}): PairedTTestResult {
  const cleanX = x.filter((val) => isFinite(val));
  const cleanY = y.filter((val) => isFinite(val));

  if (cleanX.length !== cleanY.length) {
    throw new Error("Paired t-test requires samples of equal length");
  }

  if (cleanX.length < 2) {
    throw new Error("Paired t-test requires at least 2 observations");
  }

  const result = t_test_paired(
    new Float64Array(cleanX),
    new Float64Array(cleanY),
    alpha,
    alternative,
  );
  return serializeTestResult(result) as PairedTTestResult;
}
