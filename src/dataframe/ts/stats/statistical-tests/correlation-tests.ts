import {
  kendall_correlation_test,
  pearson_correlation_test,
  spearman_correlation_test,
  type TestResult,
} from "../../wasm/wasm-loader.ts";
import type { TestName } from "../../wasm/statistical-tests.ts";

/** Correlation test specific result with only relevant fields */
export type CorrelationTestResult =
  & Pick<
    TestResult,
    | "test_type"
    | "test_statistic"
    | "p_value"
    | "confidence_interval_lower"
    | "confidence_interval_upper"
    | "confidence_level"
    | "effect_size"
    | "correlation"
    | "degrees_of_freedom"
    | "sample_size"
    | "standard_error"
    | "sample_means"
    | "sample_std_devs"
    | "error_message"
  >
  & { test_name: TestName };

/**
 * Pearson correlation test
 */
export function pearsonTest({
  x,
  y,
  alternative = "two.sided",
  alpha = 0.05,
}: {
  x: number[];
  y: number[];
  alternative?: "two.sided" | "less" | "greater";
  alpha?: number;
}): CorrelationTestResult {
  if (x.length !== y.length) {
    throw new Error("x and y must have the same length");
  }

  const cleanX = x.filter((val) => isFinite(val));
  const cleanY = y.filter((val) => isFinite(val));

  if (cleanX.length < 3) {
    throw new Error(
      "Pearson correlation test requires at least 3 observations",
    );
  }

  // Convert alternative hypothesis format for WASM function
  const wasmAlternative = alternative === "two.sided"
    ? "two-sided"
    : alternative;

  return pearson_correlation_test(
    new Float64Array(cleanX),
    new Float64Array(cleanY),
    wasmAlternative,
    alpha,
  ) as CorrelationTestResult;
}

/**
 * Spearman rank correlation test
 */
export function spearmanTest({
  x,
  y,
  alternative = "two.sided",
  alpha = 0.05,
}: {
  x: number[];
  y: number[];
  alternative?: "two.sided" | "less" | "greater";
  alpha?: number;
}): CorrelationTestResult {
  if (x.length !== y.length) {
    throw new Error("x and y must have the same length");
  }

  const cleanX = x.filter((val) => isFinite(val));
  const cleanY = y.filter((val) => isFinite(val));

  if (cleanX.length < 2) {
    throw new Error(
      "Spearman correlation test requires at least 2 observations",
    );
  }

  // Convert alternative hypothesis format for WASM function
  const wasmAlternative = alternative === "two.sided"
    ? "two-sided"
    : alternative;

  return spearman_correlation_test(
    new Float64Array(cleanX),
    new Float64Array(cleanY),
    wasmAlternative,
    alpha,
  ) as CorrelationTestResult;
}

/**
 * Kendall rank correlation test
 */
export function kendallTest({
  x,
  y,
  alternative = "two.sided",
  alpha = 0.05,
}: {
  x: number[];
  y: number[];
  alternative?: "two.sided" | "less" | "greater";
  alpha?: number;
}): CorrelationTestResult {
  if (x.length !== y.length) {
    throw new Error("x and y must have the same length");
  }

  const cleanX = x.filter((val) => isFinite(val));
  const cleanY = y.filter((val) => isFinite(val));

  if (cleanX.length < 2) {
    throw new Error(
      "Kendall correlation test requires at least 2 observations",
    );
  }

  // Convert alternative hypothesis format for WASM function
  const wasmAlternative = alternative === "two.sided"
    ? "two-sided"
    : alternative;

  return kendall_correlation_test(
    new Float64Array(cleanX),
    new Float64Array(cleanY),
    wasmAlternative,
    alpha,
  ) as CorrelationTestResult;
}
