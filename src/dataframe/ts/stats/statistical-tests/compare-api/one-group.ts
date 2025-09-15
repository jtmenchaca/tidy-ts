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
 * Tests if the central tendency of a single group differs from a hypothesized value.
 * - For parametric tests: Tests if the sample mean differs from the hypothesized value using a t-test
 * - For non-parametric tests: Tests if the sample median differs from the hypothesized value using Wilcoxon signed-rank test
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
 * Tests if a proportion differs from an expected value.
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
 * Tests if data follows a normal distribution.
 * Uses Shapiro-Wilk test for normality.
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
