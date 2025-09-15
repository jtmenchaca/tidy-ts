import { shapiro_wilk_test, type TestResult } from "../../wasm/wasm-loader.ts";
import type { TestName } from "../../wasm/statistical-tests.ts";

/** Shapiro-Wilk test specific result with only relevant fields */
export type ShapiroWilkTestResult =
  & Pick<
    TestResult,
    | "test_type"
    | "test_statistic"
    | "p_value"
    | "effect_size"
    | "sample_size"
    | "normality_test_p_value"
    | "assumptions_violated"
    | "error_message"
  >
  & { test_name: TestName };

/**
 * Test for normality using Shapiro-Wilk test
 */
export function shapiroWilkTest({
  data,
  alpha = 0.05,
}: {
  data: number[];
  alpha?: number;
}): ShapiroWilkTestResult {
  const cleanData = data.filter((x) => isFinite(x));

  if (cleanData.length < 3) {
    throw new Error("Shapiro-Wilk test requires at least 3 observations");
  }

  if (cleanData.length > 5000) {
    throw new Error("Shapiro-Wilk test is not reliable for n > 5000");
  }

  return shapiro_wilk_test(
    new Float64Array(cleanData),
    alpha,
  ) as ShapiroWilkTestResult;
}
