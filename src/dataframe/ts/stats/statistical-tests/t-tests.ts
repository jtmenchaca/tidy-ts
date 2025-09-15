import {
  t_test_one_sample,
  t_test_paired,
  t_test_two_sample_independent,
  type TestResult,
} from "../../wasm/wasm-loader.ts";

/** T-test specific result with only relevant fields */
export type TTestResult = Pick<
  TestResult,
  | "test_type"
  | "test_statistic"
  | "p_value"
  | "confidence_interval_lower"
  | "confidence_interval_upper"
  | "confidence_level"
  | "effect_size"
  | "cohens_d"
  | "degrees_of_freedom"
  | "sample_size"
  | "mean_difference"
  | "standard_error"
  | "margin_of_error"
  | "sample_means"
  | "sample_std_devs"
  | "error_message"
>;

/**
 * One-sample t-test
 */
export function t_test(
  data: number[],
  mu: number = 0,
  alternative: "two-sided" | "less" | "greater" = "two-sided",
  alpha: number = 0.05,
): TTestResult {
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
 * Independent t-test for comparing two groups
 */
export function tTestIndependent(
  x: number[],
  y: number[],
  equalVar: boolean = true,
  alternative: "two-sided" | "less" | "greater" = "two-sided",
  alpha: number = 0.05,
): TTestResult {
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
 * Two-sample independent t-test
 */
export function t_test_ind(
  x: number[],
  y: number[],
  equalVar: boolean = true,
  alternative: "two-sided" | "less" | "greater" = "two-sided",
  alpha: number = 0.05,
): TTestResult {
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
 * Paired t-test for comparing two related samples
 */
export function tTestPaired(
  x: number[],
  y: number[],
  alternative: "two-sided" | "less" | "greater" = "two-sided",
  alpha: number = 0.05,
): TTestResult {
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
