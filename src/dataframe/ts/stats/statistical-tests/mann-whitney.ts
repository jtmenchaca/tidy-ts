import {
  mann_whitney_test_with_config,
  type TestResult,
} from "../../wasm/wasm-loader.ts";
import type { TestName } from "../../wasm/statistical-tests.ts";

/** Mann-Whitney test specific result with only relevant fields */
export type MannWhitneyTestResult =
  & Pick<
    TestResult,
    | "test_type"
    | "u_statistic"
    | "sample_size"
    | "mean_difference"
    | "standard_error"
    | "margin_of_error"
    | "sample_means"
    | "sample_std_devs"
    | "ranks"
    | "tie_correction"
    | "exact_p_value"
    | "asymptotic_p_value"
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
 * Mann-Whitney U test (Wilcoxon rank-sum) for non-parametric comparison
 */
export function mannWhitneyTest({
  x,
  y,
  exact = true,
  continuityCorrection = true,
  alternative = "two-sided",
  alpha = 0.05,
}: {
  x: number[];
  y: number[];
  exact?: boolean;
  continuityCorrection?: boolean;
  alternative?: "two-sided" | "less" | "greater";
  alpha?: number;
}): MannWhitneyTestResult {
  const cleanX = x.filter((x) => isFinite(x));
  const cleanY = y.filter((x) => isFinite(x));

  if (cleanX.length < 1 || cleanY.length < 1) {
    throw new Error("Each group must have at least 1 observation");
  }

  return mann_whitney_test_with_config(
    new Float64Array(cleanX),
    new Float64Array(cleanY),
    exact,
    continuityCorrection,
    alpha,
    alternative,
  ) as MannWhitneyTestResult;
}
