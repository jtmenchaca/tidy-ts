import { type TestResult, wilcoxon_w_test } from "../../wasm/wasm-loader.ts";
import type { TestName } from "../../wasm/statistical-tests.ts";

/** Wilcoxon test specific result with only relevant fields */
export type WilcoxonTestResult =
  & Pick<
    TestResult,
    | "test_type"
    | "test_statistic"
    | "p_value"
    | "confidence_interval_lower"
    | "confidence_interval_upper"
    | "confidence_level"
    | "effect_size"
    | "w_statistic"
    | "sample_size"
    | "mean_difference"
    | "standard_error"
    | "margin_of_error"
    | "ranks"
    | "tie_correction"
    | "exact_p_value"
    | "asymptotic_p_value"
    | "error_message"
  >
  & { test_name: TestName };

/**
 * Wilcoxon signed-rank test for paired data
 */
export function wilcoxonSignedRankTest({
  x,
  y,
  alternative = "two-sided",
  alpha = 0.05,
}: {
  x: number[];
  y: number[];
  alternative?: "two-sided" | "less" | "greater";
  alpha?: number;
}): WilcoxonTestResult {
  const cleanX = x.filter((x) => isFinite(x));
  const cleanY = y.filter((x) => isFinite(x));

  if (cleanX.length !== cleanY.length) {
    throw new Error("Paired data must have the same length");
  }

  if (cleanX.length < 1) {
    throw new Error("Must have at least 1 observation");
  }

  return wilcoxon_w_test(
    new Float64Array(cleanX),
    new Float64Array(cleanY),
    alpha,
    alternative,
  ) as WilcoxonTestResult;
}
