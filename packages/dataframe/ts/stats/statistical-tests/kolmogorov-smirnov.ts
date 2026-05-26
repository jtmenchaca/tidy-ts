import {
  kolmogorov_smirnov_normal_wasm,
  kolmogorov_smirnov_test_wasm,
  kolmogorov_smirnov_uniform_wasm,
} from "../../wasm/statistical-tests.ts";

import type { KolmogorovSmirnovTestResult } from "./types.ts";
import type { PrettifyDeep } from "../../dataframe/types/utility-types.ts";

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
  x: readonly number[];
  y: readonly number[];
  alternative?: "two-sided" | "less" | "greater";
  alpha?: number;
}): PrettifyDeep<KolmogorovSmirnovTestResult> {
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

  return result as KolmogorovSmirnovTestResult;
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
  x: readonly number[];
  min?: number;
  max?: number;
  alternative?: "two-sided" | "less" | "greater";
  alpha?: number;
}): PrettifyDeep<KolmogorovSmirnovTestResult> {
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

  return result as KolmogorovSmirnovTestResult;
}

/**
 * One-sample Kolmogorov-Smirnov test against a normal distribution.
 *
 * Tests whether a sample comes from a Normal(mean, sd) distribution. When
 * `mean` and `sd` are omitted, defaults to the standard normal — same default
 * R uses for `ks.test(x, "pnorm")`. To match R's common pattern of testing
 * against the sample's own mean/sd, pass them explicitly:
 *
 * ```ts
 * const m = s.mean(x)!;
 * const sd = s.stdev(x)!;
 * s.test.normality.kolmogorovSmirnovNormal({ x, mean: m, sd });
 * ```
 *
 * @param x - Sample data
 * @param mean - Mean of the reference normal (default: 0)
 * @param sd - Standard deviation of the reference normal (default: 1)
 * @param alternative - Type of alternative hypothesis
 * @param alpha - Significance level (default: 0.05)
 * @returns Test result with D statistic, p-value, and critical value
 */
export function kolmogorovSmirnovNormalTest({
  x,
  mean = 0,
  sd = 1,
  alternative = "two-sided",
  alpha = 0.05,
}: {
  x: readonly number[];
  mean?: number;
  sd?: number;
  alternative?: "two-sided" | "less" | "greater";
  alpha?: number;
}): PrettifyDeep<KolmogorovSmirnovTestResult> {
  const cleanX = x.filter((v) => isFinite(v));

  if (cleanX.length === 0) {
    throw new Error("Sample must contain at least one finite value");
  }
  if (!(sd > 0)) {
    throw new Error("sd must be positive");
  }

  const result = kolmogorov_smirnov_normal_wasm(
    new Float64Array(cleanX),
    mean,
    sd,
    alternative,
    alpha,
  );
  return result as KolmogorovSmirnovTestResult;
}

// Alias for the main two-sample test
const ksTest = kolmogorovSmirnovTest;
export const ksTestUniform = kolmogorovSmirnovUniformTest;
export const ksTestNormal = kolmogorovSmirnovNormalTest;
