import { proportionTestOneSample } from "../../proportion-tests.ts";
import type { OneSampleProportionTestResult } from "../../../../../lib/tidy_ts_dataframe.d.ts";
import { to01 } from "../helpers.ts";

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
  data: boolean[] | readonly boolean[];
  p?: number;
  alternative?: "two-sided" | "less" | "greater";
  alpha?: number;
}): OneSampleProportionTestResult {
  // ============================================================================
  // DECISION TREE: One Group Proportions vs Value
  // ============================================================================
  // Decision logic from pseudocode:
  // 1. Convert data to binary (0/1 or boolean)
  // 2. Validate binary data (throw error if not binary)
  // 3. Use one-sample proportion z-test (no decision needed - single method)
  // 4. Assumes: np ≥ 5 and n(1-p) ≥ 5 (handled by underlying function)
  // ============================================================================

  // Convert boolean data to 0/1 format for the proportion test
  const binaryData = data.map((x) => Boolean(to01(x)));

  return proportionTestOneSample({
    data: binaryData,
    popProportion: p,
    alternative,
    alpha,
  });
}
