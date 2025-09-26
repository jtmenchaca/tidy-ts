import {
  dagostino_pearson_test,
  serializeTestResult,
} from "../../wasm/statistical-tests.ts";
import type { DAgostinoPearsonTestResult } from "../../../lib/tidy_ts_dataframe.d.ts";

/**
 * Test for normality using D'Agostino-Pearson K² test
 *
 * This omnibus test combines skewness and kurtosis to produce a single
 * test statistic (K²) that follows a chi-square distribution with 2 degrees
 * of freedom. It's particularly effective for moderate to large sample sizes.
 *
 * Requires at least 20 observations for reliable results.
 *
 * The test is useful when you want to:
 * - Detect both skewness and kurtosis deviations from normality
 * - Have a single test statistic for overall normality
 * - Work with sample sizes between 20 and 300
 *
 * @param data - Sample data to test for normality
 * @param alpha - Significance level (default: 0.05)
 * @returns Test result with K² statistic, p-value, skewness, and kurtosis
 *
 * @example
 * ```typescript
 * const data = Array.from({length: 50}, () => Math.random() * 10);
 * const result = dagostinoPearsonTest({ data });
 *
 * console.log(`Skewness: ${result.skewness.toFixed(3)}`);
 * console.log(`Kurtosis: ${result.kurtosis.toFixed(3)}`);
 * console.log(`K² statistic: ${result.test_statistic.value.toFixed(3)}`);
 * console.log(`p-value: ${result.p_value.toFixed(3)}`);
 *
 * if (result.p_value < 0.05) {
 *   console.log("Data is not normally distributed");
 *   if (Math.abs(result.skewness) > 1) {
 *     console.log("Significant skewness detected");
 *   }
 *   if (Math.abs(result.kurtosis) > 2) {
 *     console.log("Significant kurtosis detected");
 *   }
 * }
 * ```
 */
export function dagostinoPearsonTest({
  data,
  alpha = 0.05,
}: {
  data: number[];
  alpha?: number;
}): DAgostinoPearsonTestResult {
  const cleanData = data.filter((x) => isFinite(x));

  if (cleanData.length < 20) {
    throw new Error(
      "D'Agostino-Pearson test requires at least 20 observations",
    );
  }

  const result = dagostino_pearson_test(
    new Float64Array(cleanData),
    alpha,
  );
  return serializeTestResult(result) as DAgostinoPearsonTestResult;
}
