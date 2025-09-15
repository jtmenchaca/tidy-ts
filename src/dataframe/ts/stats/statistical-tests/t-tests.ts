import {
  t_test_one_sample,
  t_test_paired,
  t_test_two_sample_independent,
  type TestResult,
} from "../../wasm/wasm-loader.ts";
import type { TestName } from "../../wasm/statistical-tests.ts";

/** T-test specific result with only relevant fields */
export type TTestResult =
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
    cohens_d: number;
    degrees_of_freedom: number;
    test_name: TestName;
  };

/**
 * One-sample t-test for comparing sample mean to hypothesized population mean
 * @param data - Sample data
 * @param mu - Hypothesized population mean (default: 0)
 * @param alternative - Alternative hypothesis: 'two-sided', 'less', or 'greater' (default: 'two-sided')
 * @param alpha - Significance level (default: 0.05)
 * @returns Test statistic, p-value, and confidence interval
 */
export function t_test({
  data,
  mu = 0,
  alternative = "two-sided",
  alpha = 0.05,
}: {
  data: number[];
  mu?: number;
  alternative?: "two-sided" | "less" | "greater";
  alpha?: number;
}): TTestResult {
  const cleanData = data.filter((x) => isFinite(x));

  if (cleanData.length < 2) {
    throw new Error("One-sample t-test requires at least 2 observations");
  }

  return t_test_one_sample(
    new Float64Array(cleanData),
    mu,
    alpha,
    alternative,
  ) as TTestResult;
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
}): TTestResult {
  const cleanX = x.filter((x) => isFinite(x));
  const cleanY = y.filter((x) => isFinite(x));

  if (cleanX.length < 2 || cleanY.length < 2) {
    throw new Error("Each group must have at least 2 observations");
  }

  return t_test_two_sample_independent(
    new Float64Array(cleanX),
    new Float64Array(cleanY),
    alpha,
    alternative,
    equalVar,
  ) as TTestResult;
}

/**
 * Two-sample independent t-test for comparing means of two independent groups
 * @param x - First group data
 * @param y - Second group data
 * @param equalVar - Assume equal variances (default: true)
 * @param alternative - Alternative hypothesis: 'two-sided', 'less', or 'greater' (default: 'two-sided')
 * @param alpha - Significance level (default: 0.05)
 * @returns Test statistic, p-value, and confidence interval
 */
export function t_test_ind({
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
}): TTestResult {
  const cleanX = x.filter((val) => isFinite(val));
  const cleanY = y.filter((val) => isFinite(val));

  if (cleanX.length < 2 || cleanY.length < 2) {
    throw new Error("Each group must have at least 2 observations");
  }

  return t_test_two_sample_independent(
    new Float64Array(cleanX),
    new Float64Array(cleanY),
    alpha,
    alternative,
    equalVar,
  ) as TTestResult;
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
}): TTestResult {
  const cleanX = x.filter((val) => isFinite(val));
  const cleanY = y.filter((val) => isFinite(val));

  if (cleanX.length !== cleanY.length) {
    throw new Error("Paired t-test requires samples of equal length");
  }

  if (cleanX.length < 2) {
    throw new Error("Paired t-test requires at least 2 observations");
  }

  return t_test_paired(
    new Float64Array(cleanX),
    new Float64Array(cleanY),
    alpha,
    alternative,
  ) as TTestResult;
}
