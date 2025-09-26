import {
  anderson_darling_test,
  serializeTestResult,
} from "../../wasm/statistical-tests.ts";
import type { AndersonDarlingTestResult } from "../../../lib/tidy_ts_dataframe.d.ts";

/**
 * Test for normality using Anderson-Darling test
 *
 * The Anderson-Darling test is more sensitive to deviations in the tails
 * of the distribution compared to the Shapiro-Wilk test. It's particularly
 * useful for detecting departures from normality in the extremes of the data.
 *
 * Requires at least 7 observations for reliable results.
 *
 * @param data - Sample data to test for normality
 * @param alpha - Significance level (default: 0.05)
 * @returns Test result with A² statistic and p-value
 *
 * @example
 * ```typescript
 * const data = [1.2, 2.3, 3.1, 4.5, 5.2, 6.1, 7.3, 8.2, 9.1];
 * const result = andersonDarlingTest({ data });
 *
 * if (result.p_value < 0.05) {
 *   console.log("Data is not normally distributed (p < 0.05)");
 * }
 * ```
 */
export function andersonDarlingTest({
  data,
  alpha = 0.05,
}: {
  data: number[];
  alpha?: number;
}): AndersonDarlingTestResult {
  const cleanData = data.filter((x) => isFinite(x));

  if (cleanData.length < 7) {
    throw new Error("Anderson-Darling test requires at least 7 observations");
  }

  const result = anderson_darling_test(
    new Float64Array(cleanData),
    alpha,
  );
  return serializeTestResult(result) as AndersonDarlingTestResult;
}
