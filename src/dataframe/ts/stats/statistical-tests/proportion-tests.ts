/**
 * Proportion Tests
 *
 * This module provides functions for performing proportion tests using WASM implementations.
 */

// Import WASM functions
import { proportion_test_one_sample, proportion_test_two_sample, serializeTestResult } from "../../wasm/statistical-tests.ts";
import type { OneSampleProportionTestResult, TwoSampleProportionTestResult } from "../../../lib/tidy_ts_dataframe.internal.js";
export type { OneSampleProportionTestResult, TwoSampleProportionTestResult } from "../../../lib/tidy_ts_dataframe.internal.js";



/**
 * One-sample proportion test (WASM implementation)
 */
export function proportionTestOneSample({
  data,
  popProportion,
  alternative = "two-sided",
  alpha = 0.05,
}: {
  data: boolean[];
  popProportion: number;
  alternative?: "two-sided" | "less" | "greater";
  alpha?: number;
}): OneSampleProportionTestResult {
  const n = data.length;

  if (n === 0) {
    throw new Error(
      "One-sample proportion test requires at least 1 observation",
    );
  }

  if (popProportion < 0 || popProportion > 1) {
    throw new Error("Population proportion must be between 0 and 1");
  }

  const successes = data.filter(Boolean).length;

  const result = proportion_test_one_sample(
    successes,
    n,
    popProportion,
    alpha,
    alternative,
  );
  return serializeTestResult(result) as OneSampleProportionTestResult;
}

/**
 * Two-sample proportion test (WASM implementation)
 */
export function proportionTestTwoSample({
  data1,
  data2,
  pooled = true,
  alternative = "two-sided",
  alpha = 0.05,
}: {
  data1: boolean[];
  data2: boolean[];
  pooled?: boolean;
  alternative?: "two-sided" | "less" | "greater";
  alpha?: number;
}): TwoSampleProportionTestResult {
  const n1 = data1.length;
  const n2 = data2.length;

  if (n1 === 0 || n2 === 0) {
    throw new Error(
      "Two-sample proportion test requires at least 1 observation in each group",
    );
  }

  const successes1 = data1.filter(Boolean).length;
  const successes2 = data2.filter(Boolean).length;

  const result = proportion_test_two_sample(
    successes1,
    n1,
    successes2,
    n2,
    alpha,
    alternative,
    pooled,
  );
  return serializeTestResult(result) as TwoSampleProportionTestResult;
}
