import {
  kolmogorov_smirnov_test_wasm,
  kolmogorov_smirnov_uniform_wasm,
  serializeTestResult,
} from "../../wasm/statistical-tests.ts";

import type { KolmogorovSmirnovTestResult } from "../../../lib/tidy_ts_dataframe.d.ts";

/**
 * Two-sample Kolmogorov-Smirnov test
 *
 * Tests whether two samples come from the same distribution by comparing
 * their empirical cumulative distribution functions (ECDFs).
 *
 * @param x - First sample
 * @param y - Second sample
 * @param alternative - Type of alternative hypothesis:
 *   - "two-sided": distributions differ (default)
 *   - "less": CDF of x is less than CDF of y (x is stochastically smaller)
 *   - "greater": CDF of x is greater than CDF of y (x is stochastically larger)
 * @param alpha - Significance level (default: 0.05)
 * @returns Test result with D statistic, p-value, and critical value
 */
export function kolmogorovSmirnovTest({
  x,
  y,
  alternative = "two-sided",
  alpha = 0.05,
}: {
  x: number[];
  y: number[];
  alternative?: "two-sided" | "less" | "greater";
  alpha?: number;
}): KolmogorovSmirnovTestResult {
  // Clean data
  const cleanX = x.filter((v) => isFinite(v));
  const cleanY = y.filter((v) => isFinite(v));

  if (cleanX.length === 0 || cleanY.length === 0) {
    throw new Error("Both samples must contain at least one finite value");
  }

  const result = kolmogorov_smirnov_test_wasm(
    new Float64Array(cleanX),
    new Float64Array(cleanY),
    alternative,
    alpha,
  );

  return serializeTestResult(result) as KolmogorovSmirnovTestResult;
}

/**
 * One-sample Kolmogorov-Smirnov test against uniform distribution
 *
 * Tests whether a sample comes from a uniform distribution on [min, max].
 *
 * @param x - Sample data
 * @param min - Minimum value of uniform distribution (default: 0)
 * @param max - Maximum value of uniform distribution (default: 1)
 * @param alternative - Type of alternative hypothesis
 * @param alpha - Significance level (default: 0.05)
 * @returns Test result with D statistic, p-value, and critical value
 */
export function kolmogorovSmirnovUniformTest({
  x,
  min = 0,
  max = 1,
  alternative = "two-sided",
  alpha = 0.05,
}: {
  x: number[];
  min?: number;
  max?: number;
  alternative?: "two-sided" | "less" | "greater";
  alpha?: number;
}): KolmogorovSmirnovTestResult {
  // Clean data
  const cleanX = x.filter((v) => isFinite(v));

  if (cleanX.length === 0) {
    throw new Error("Sample must contain at least one finite value");
  }

  if (min >= max) {
    throw new Error("min must be less than max");
  }

  const result = kolmogorov_smirnov_uniform_wasm(
    new Float64Array(cleanX),
    min,
    max,
    alternative,
    alpha,
  );

  return serializeTestResult(result) as KolmogorovSmirnovTestResult;
}

// Alias for the main two-sample test
export const ksTest = kolmogorovSmirnovTest;
export const ksTestUniform = kolmogorovSmirnovUniformTest;
