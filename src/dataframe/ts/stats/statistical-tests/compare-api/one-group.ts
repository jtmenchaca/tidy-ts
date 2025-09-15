import { t_test } from "../t-tests.ts";
import { wilcoxonSignedRankTest } from "../wilcoxon.ts";
import { proportionTestOneSample } from "../proportion-tests.ts";
import { shapiroWilkTest } from "../shapiro-wilk.ts";
import type {
  ProportionTestResult,
  ShapiroWilkTestResult,
  TTestResult,
  WilcoxonTestResult,
} from "../types.ts";
import type {
  NumberIterable,
  NumbersWithNullable,
  NumbersWithNullableIterable,
} from "../../helpers.ts";

/**
 * Test if a single group's central tendency differs from a hypothesized value.
 * 
 * Compares the center of a single sample against a known or expected value,
 * using either parametric (one-sample t-test) or non-parametric (Wilcoxon signed-rank) methods.
 * 
 * Assumptions:
 * - For parametric: Data is approximately normally distributed
 * - For non-parametric: Data is continuous and symmetric around the median
 * - Set `parametric: "auto"` to automatically choose based on Shapiro-Wilk normality test
 * 
 * @param data - Sample values to test
 * @param hypothesizedValue - The value to compare against (population mean/median)
 * @param alternative - Direction of the test ("two-sided", "less", "greater")
 * @param alpha - Significance level (default: 0.05)
 * @param parametric - Test type selection (true, false, or "auto")
 * @returns Test results with statistic, p-value, and confidence intervals
 */
export function centralTendencyToValue({
  data,
  hypothesizedValue,
  alternative,
  alpha,
  parametric,
}: {
  data: readonly number[];
  hypothesizedValue: number;
  alternative?: "two-sided" | "less" | "greater";
  alpha?: number;
  parametric: true;
}): TTestResult;

export function centralTendencyToValue({
  data,
  hypothesizedValue,
  alternative,
  alpha,
  parametric,
}: {
  data: readonly number[];
  hypothesizedValue: number;
  alternative?: "two-sided" | "less" | "greater";
  alpha?: number;
  parametric: false;
}): WilcoxonTestResult;

export function centralTendencyToValue({
  data,
  hypothesizedValue,
  alternative,
  alpha,
  parametric,
}: {
  data: readonly number[];
  hypothesizedValue: number;
  alternative?: "two-sided" | "less" | "greater";
  alpha?: number;
  parametric?: "auto" | boolean;
}): TTestResult | WilcoxonTestResult;

export function centralTendencyToValue({
  data,
  hypothesizedValue,
  alternative = "two-sided",
  alpha = 0.05,
  parametric = "auto",
}: {
  data:
    | readonly number[]
    | NumberIterable
    | NumbersWithNullable
    | NumbersWithNullableIterable;
  hypothesizedValue: number;
  alternative?: "two-sided" | "less" | "greater";
  alpha?: number;
  parametric?: "auto" | boolean;
}): TTestResult | WilcoxonTestResult {
  // Convert data to a regular array for processing and filter out null/undefined values
  const dataArray = Array.isArray(data) ? data : Array.from(data);
  const cleanData = dataArray.filter((x): x is number =>
    typeof x === "number" && !isNaN(x)
  );

  // Determine whether to use parametric test
  let useParametric: boolean;
  if (parametric === "auto") {
    // Use Shapiro-Wilk test to determine normality
    const normalityTest = shapiroWilkTest({ data: cleanData, alpha: 0.05 });
    useParametric = normalityTest.p_value! > 0.05; // If p > 0.05, assume normal distribution
  } else {
    useParametric = parametric === true;
  }

  if (useParametric) {
    // Use one-sample t-test for parametric data
    const result = t_test({
      data: cleanData,
      mu: hypothesizedValue,
      alternative,
      alpha,
    });
    return {
      test_statistic: result.test_statistic!,
      p_value: result.p_value!,
      confidence_interval_lower: result.confidence_interval_lower!,
      confidence_interval_upper: result.confidence_interval_upper!,
      confidence_level: result.confidence_level!,
      degrees_of_freedom: result.degrees_of_freedom!,
      mean_difference: result.mean_difference,
      standard_error: result.standard_error,
      effect_size: result.effect_size,
      cohens_d: result.cohens_d,
      test_type: result.test_type,
      test_name: result.test_name,
      alpha: alpha,
      error_message: result.error_message,
    };
  } else {
    // Use Wilcoxon signed-rank test for non-parametric data
    const result = wilcoxonSignedRankTest({
      x: cleanData,
      y: cleanData.map(() => hypothesizedValue),
      alternative,
      alpha,
    });
    return {
      test_statistic: result.test_statistic!,
      p_value: result.p_value!,
      effect_size: result.effect_size,
      test_type: result.test_type,
      test_name: result.test_name,
      alpha: alpha,
      error_message: result.error_message,
    };
  }
}

/**
 * Test if a sample proportion differs from a hypothesized population proportion.
 * 
 * Compares the proportion of successes in a binary sample against an expected proportion,
 * using the one-sample proportion z-test.
 * 
 * Assumptions:
 * - Sample is randomly drawn from the population
 * - Observations are independent
 * - Sample size is large enough (np ≥ 5 and n(1-p) ≥ 5)
 * 
 * @param data - Binary data (0/1 or boolean values)
 * @param p - Hypothesized population proportion (default: 0.5)
 * @param alternative - Direction of the test ("two-sided", "less", "greater")
 * @param alpha - Significance level (default: 0.05)
 * @returns Test results with z-statistic, p-value, and confidence intervals
 */
export function proportionsToValue({
  data,
  p = 0.5,
  alternative = "two-sided",
  alpha = 0.05,
}: {
  data: boolean[] | number[] | readonly boolean[] | readonly number[];
  p?: number;
  alternative?: "two-sided" | "less" | "greater";
  alpha?: number;
  parametric?: "auto" | boolean;
}): ProportionTestResult {
  // Convert data to regular array and boolean/number array to 0/1 array for the test
  const dataArray = Array.isArray(data)
    ? data
    : Array.from(data as Iterable<boolean | number>);
  const numericData = dataArray.map((x) =>
    typeof x === "boolean" ? (x ? 1 : 0) : (typeof x === "number" ? x : 0)
  );
  const result = proportionTestOneSample({
    data: numericData,
    popProportion: p,
    alternative,
    alpha,
  });
  return {
    test_statistic: result.test_statistic!,
    p_value: result.p_value!,
    confidence_interval_lower: result.confidence_interval_lower!,
    confidence_interval_upper: result.confidence_interval_upper!,
    confidence_level: result.confidence_level!,
    effect_size: result.effect_size,
    test_type: result.test_type,
    test_name: result.test_name,
    alpha: alpha,
    error_message: result.error_message,
  };
}

/**
 * Test if data follows a normal distribution (Shapiro-Wilk test).
 * 
 * Assesses whether a sample comes from a normally distributed population.
 * Most reliable for small to medium sample sizes (n < 5000).
 * 
 * Assumptions:
 * - Data is continuous
 * - Observations are independent and identically distributed
 * - Null hypothesis: Data is normally distributed
 * 
 * @param data - Sample values to test for normality
 * @param alpha - Significance level (default: 0.05)
 * @returns Test results with W statistic and p-value (reject null if p < alpha)
 */
export function distributionToNormal({
  data,
  alpha = 0.05,
}: {
  data:
    | readonly number[]
    | NumberIterable
    | NumbersWithNullable
    | NumbersWithNullableIterable;
  alpha?: number;
}): ShapiroWilkTestResult {
  // Convert data to a regular array for processing and filter out null/undefined values
  const dataArray = Array.isArray(data) ? data : Array.from(data);
  const cleanData = dataArray.filter((x): x is number =>
    typeof x === "number" && !isNaN(x)
  );
  const result = shapiroWilkTest({
    data: cleanData,
    alpha,
  });
  return {
    test_statistic: result.test_statistic!,
    p_value: result.p_value!,
    sample_size: result.sample_size!,
    test_type: result.test_type,
    test_name: result.test_name,
    alpha: alpha,
    error_message: result.error_message,
  };
}

// Export the one-group test functions as a namespace
export const oneGroup = {
  centralTendency: {
    toValue: centralTendencyToValue,
  },
  proportions: {
    toValue: proportionsToValue,
  },
  distribution: {
    toNormal: distributionToNormal,
  },
};
