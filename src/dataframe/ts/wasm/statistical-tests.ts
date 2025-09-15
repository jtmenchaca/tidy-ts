// Statistical tests module

import * as wasmInternal from "../../lib/tidy_ts_dataframe.internal.js";
import { initWasm } from "./wasm-init.ts";

// Test type name mapping
const TEST_TYPE_NAMES = {
  1: "One-sample z-test",
  2: "Two-sample z-test",
  3: "Paired z-test",
  4: "One-sample proportion test",
  5: "Two-sample proportion test",
  6: "One-sample t-test",
  7: "Two-sample t-test",
  8: "Paired t-test",
  9: "Wilcoxon signed-rank test",
  10: "Mann-Whitney U test",
  11: "One-way ANOVA",
  12: "Two-way ANOVA",
  13: "Chi-square test of independence",
  14: "Chi-square goodness of fit test",
  15: "Fisher's exact test",
  16: "Kruskal-Wallis test",
  17: "Friedman test",
  18: "Pearson correlation test",
  19: "Spearman correlation test",
  20: "Kendall correlation test",
  21: "Shapiro-Wilk normality test",
  22: "Kolmogorov-Smirnov test",
  23: "Anderson-Darling test",
  24: "Levene's test",
  25: "Bartlett's test",
} as const;

export type TestName = typeof TEST_TYPE_NAMES[keyof typeof TEST_TYPE_NAMES];

/**
 * Add test name to result
 */
function addName(
  result: wasmInternal.TestResult,
): wasmInternal.TestResult & { test_name: TestName } {
  const testName =
    TEST_TYPE_NAMES[result.test_type as keyof typeof TEST_TYPE_NAMES] ||
    `Unknown test (type ${result.test_type})` as TestName;
  // Add test_name property to the existing result object
  // deno-lint-ignore no-explicit-any
  (result as any).test_name = testName;
  return result as wasmInternal.TestResult & { test_name: TestName };
}

// ANOVA Tests
export function anova_one_way(
  data: Float64Array,
  group_sizes: Uint32Array,
  alpha: number,
) {
  initWasm();
  return addName(wasmInternal.anova_one_way(data, group_sizes, alpha));
}

export function anova_two_way(
  data: Float64Array,
  a_levels: number,
  b_levels: number,
  cell_sizes: Uint32Array,
  alpha: number,
) {
  initWasm();
  return addName(wasmInternal.anova_two_way(
    data,
    a_levels,
    b_levels,
    cell_sizes,
    alpha,
  ));
}

export function anova_two_way_factor_a_wasm(
  data: Float64Array,
  a_levels: number,
  b_levels: number,
  cell_sizes: Uint32Array,
  alpha: number,
) {
  initWasm();
  return addName(wasmInternal.anova_two_way_factor_a_wasm(
    data,
    a_levels,
    b_levels,
    cell_sizes,
    alpha,
  ));
}

export function anova_two_way_factor_b_wasm(
  data: Float64Array,
  a_levels: number,
  b_levels: number,
  cell_sizes: Uint32Array,
  alpha: number,
) {
  initWasm();
  return addName(wasmInternal.anova_two_way_factor_b_wasm(
    data,
    a_levels,
    b_levels,
    cell_sizes,
    alpha,
  ));
}

export function anova_two_way_interaction_wasm(
  data: Float64Array,
  a_levels: number,
  b_levels: number,
  cell_sizes: Uint32Array,
  alpha: number,
) {
  initWasm();
  return addName(wasmInternal.anova_two_way_interaction_wasm(
    data,
    a_levels,
    b_levels,
    cell_sizes,
    alpha,
  ));
}

// Chi-Square Tests
export function chi_square_independence(
  observed: Float64Array,
  n_rows: number,
  n_cols: number,
  alpha: number,
) {
  initWasm();
  return addName(
    wasmInternal.chi_square_independence(observed, n_rows, n_cols, alpha),
  );
}

// T-Tests
export function t_test_one_sample(
  x: Float64Array,
  mu: number,
  alpha: number,
  alternative: string,
) {
  initWasm();
  return addName(wasmInternal.t_test_one_sample(x, mu, alpha, alternative));
}

export function t_test_two_sample_independent(
  x: Float64Array,
  y: Float64Array,
  alpha: number,
  alternative: string,
  pooled: boolean,
) {
  initWasm();
  return addName(wasmInternal.t_test_two_sample_independent(
    x,
    y,
    alpha,
    alternative,
    pooled,
  ));
}

export function t_test_paired(
  x: Float64Array,
  y: Float64Array,
  alpha: number,
  alternative: string,
) {
  initWasm();
  return addName(wasmInternal.t_test_paired(x, y, alpha, alternative));
}

// Z-Tests
export function z_test_one_sample(
  x: Float64Array,
  mu: number,
  sigma: number,
  alpha: number,
  alternative: string,
) {
  initWasm();
  return addName(
    wasmInternal.z_test_one_sample(x, mu, sigma, alpha, alternative),
  );
}

export function z_test_two_sample(
  x: Float64Array,
  y: Float64Array,
  sigma_x: number,
  sigma_y: number,
  alpha: number,
  alternative: string,
) {
  initWasm();
  return addName(wasmInternal.z_test_two_sample(
    x,
    y,
    sigma_x,
    sigma_y,
    alpha,
    alternative,
  ));
}

// Proportion Tests
export function proportion_test_one_sample(
  x: number,
  n: number,
  p0: number,
  alpha: number,
  alternative: string,
) {
  initWasm();
  return addName(
    wasmInternal.proportion_test_one_sample(x, n, p0, alpha, alternative),
  );
}

export function proportion_test_two_sample(
  x1: number,
  n1: number,
  x2: number,
  n2: number,
  alpha: number,
  alternative: string,
  pooled: boolean,
) {
  initWasm();
  return addName(wasmInternal.proportion_test_two_sample(
    x1,
    n1,
    x2,
    n2,
    alpha,
    alternative,
    pooled,
  ));
}

// Non-parametric Tests
export function mann_whitney_test(
  x: Float64Array,
  y: Float64Array,
  alpha: number,
  alternative: string,
) {
  initWasm();
  return addName(wasmInternal.mann_whitney_test(x, y, alpha, alternative));
}

export function mann_whitney_test_with_config(
  x: Float64Array,
  y: Float64Array,
  exact: boolean,
  continuity_correction: boolean,
  alpha: number,
  alternative: string,
) {
  initWasm();
  return addName(wasmInternal.mann_whitney_test_with_config(
    x,
    y,
    exact,
    continuity_correction,
    alpha,
    alternative,
  ));
}

export function wilcoxon_w_test(
  x: Float64Array,
  y: Float64Array,
  alpha: number,
  alternative: string,
) {
  initWasm();
  return addName(wasmInternal.wilcoxon_w_test(x, y, alpha, alternative));
}

export function shapiro_wilk_test(x: Float64Array, alpha: number) {
  initWasm();
  return addName(wasmInternal.shapiro_wilk_test(x, alpha));
}

// Fisher's Exact Test
export function fishers_exact_test_wasm(
  a: number,
  b: number,
  c: number,
  d: number,
  alternative: string,
  odds_ratio: number,
  alpha: number,
) {
  initWasm();
  return addName(wasmInternal.fishers_exact_test_wasm(
    a,
    b,
    c,
    d,
    alternative,
    odds_ratio,
    alpha,
  ));
}

// Kruskal-Wallis Test
export function kruskal_wallis_test_wasm(
  data: Float64Array,
  group_sizes: Uint32Array,
  alpha: number,
) {
  initWasm();
  return addName(
    wasmInternal.kruskal_wallis_test_wasm(data, group_sizes, alpha),
  );
}

// Correlation Tests
export function pearson_correlation_test(
  x: Float64Array,
  y: Float64Array,
  alternative: string,
  alpha: number,
) {
  initWasm();
  return addName(
    wasmInternal.pearson_correlation_test(x, y, alternative, alpha),
  );
}

export function spearman_correlation_test(
  x: Float64Array,
  y: Float64Array,
  alternative: string,
  alpha: number,
) {
  initWasm();
  return addName(
    wasmInternal.spearman_correlation_test(x, y, alternative, alpha),
  );
}

export function kendall_correlation_test(
  x: Float64Array,
  y: Float64Array,
  alternative: string,
  alpha: number,
) {
  initWasm();
  return addName(
    wasmInternal.kendall_correlation_test(x, y, alternative, alpha),
  );
}
