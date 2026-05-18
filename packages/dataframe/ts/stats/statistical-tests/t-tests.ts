import {
  t_test_one_sample,
  t_test_paired,
  t_test_two_sample_independent,
} from "../../wasm/statistical-tests.ts";
import type {
  OneSampleTTestResult,
  PairedTTestResult,
  TwoSampleTTestResult,
} from "./types.ts";
import type { PrettifyDeep } from "../../dataframe/types/utility-types.ts";

/** WASM serializes f64::INFINITY as null; restore Infinity for CI bounds */
function fixCiBounds(result: { confidenceInterval: { lower: number | null; upper: number | null } }) {
  if (result.confidenceInterval.lower === null) {
    (result.confidenceInterval as { lower: number }).lower = -Infinity;
  }
  if (result.confidenceInterval.upper === null) {
    (result.confidenceInterval as { upper: number }).upper = Infinity;
  }
}

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
  data: readonly number[];
  mu?: number;
  alternative?: "two-sided" | "less" | "greater";
  alpha?: number;
}): PrettifyDeep<OneSampleTTestResult> {
  const cleanData = data.filter((x) => isFinite(x));

  if (cleanData.length < 2) {
    throw new Error("One-sample t-test requires at least 2 observations");
  }

  const result = t_test_one_sample(
    new Float64Array(cleanData),
    mu,
    alpha,
    alternative,
  ) as OneSampleTTestResult;
  fixCiBounds(result);
  return result;
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
  x: readonly number[];
  y: readonly number[];
  equalVar?: boolean;
  alternative?: "two-sided" | "less" | "greater";
  alpha?: number;
}): PrettifyDeep<TwoSampleTTestResult> {
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
  ) as TwoSampleTTestResult;
  fixCiBounds(result);
  return result;
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
  x: readonly number[];
  y: readonly number[];
  alternative?: "two-sided" | "less" | "greater";
  alpha?: number;
}): PrettifyDeep<PairedTTestResult> {
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
  ) as PairedTTestResult;
  fixCiBounds(result);
  return result;
}
