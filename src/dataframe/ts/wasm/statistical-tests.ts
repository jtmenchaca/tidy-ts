// Statistical tests module

import * as wasmInternal from "../../lib/tidy_ts_dataframe.internal.js";
import { initWasm } from "./wasm-init.ts";
export { serializeTestResult } from "./wasm-serializer.ts";
import type {
  ChiSquareGoodnessOfFitTestResult,
  ChiSquareIndependenceTestResult,
  ChiSquareVarianceTestResult,
  FishersExactTestResult,
  KendallCorrelationTestResult,
  KolmogorovSmirnovTestResult,
  KruskalWallisTestResult,
  MannWhitneyTestResult,
  OneSampleProportionTestResult,
  OneSampleTTestResult,
  OneSampleZTestResult,
  OneWayAnovaTestResult,
  PairedTTestResult,
  PearsonCorrelationTestResult,
  ShapiroWilkTestResult,
  SpearmanCorrelationTestResult,
  TwoSampleProportionTestResult,
  TwoSampleTTestResult,
  TwoSampleZTestResult,
  TwoWayAnovaTestResult,
  WilcoxonSignedRankTestResult,
} from "../../lib/tidy_ts_dataframe.internal.js";

// ANOVA Tests
export function anova_one_way_wasm(
  data: Float64Array,
  group_sizes: Uint32Array,
  alpha: number,
): OneWayAnovaTestResult {
  initWasm();
  return wasmInternal.anova_one_way(data, group_sizes, alpha);
}

export function welch_anova_wasm(
  data: Float64Array,
  group_sizes: Uint32Array,
  alpha: number,
): OneWayAnovaTestResult {
  initWasm();
  return wasmInternal.welch_anova_wasm(data, group_sizes, alpha);
}

export function anova_two_way_wasm(
  data: Float64Array,
  a_levels: number,
  b_levels: number,
  cell_sizes: Uint32Array,
  alpha: number,
): TwoWayAnovaTestResult {
  initWasm();

  return wasmInternal.anova_two_way(
    data,
    a_levels,
    b_levels,
    cell_sizes,
    alpha,
  );
}

export function anova_two_way_factor_a_wasm(
  data: Float64Array,
  a_levels: number,
  b_levels: number,
  cell_sizes: Uint32Array,
  alpha: number,
): OneWayAnovaTestResult {
  initWasm();
  return wasmInternal.anova_two_way_factor_a_wasm(
    data,
    a_levels,
    b_levels,
    cell_sizes,
    alpha,
  );
}

export function anova_two_way_factor_b_wasm(
  data: Float64Array,
  a_levels: number,
  b_levels: number,
  cell_sizes: Uint32Array,
  alpha: number,
): OneWayAnovaTestResult {
  initWasm();
  return wasmInternal.anova_two_way_factor_b_wasm(
    data,
    a_levels,
    b_levels,
    cell_sizes,
    alpha,
  );
}

export function anova_two_way_interaction_wasm(
  data: Float64Array,
  a_levels: number,
  b_levels: number,
  cell_sizes: Uint32Array,
  alpha: number,
): OneWayAnovaTestResult {
  initWasm();
  return wasmInternal.anova_two_way_interaction_wasm(
    data,
    a_levels,
    b_levels,
    cell_sizes,
    alpha,
  );
}

// Chi-Square Tests
export function chi_square_independence(
  observed: Float64Array,
  n_rows: number,
  n_cols: number,
  alpha: number,
): ChiSquareIndependenceTestResult {
  initWasm();
  return wasmInternal.chi_square_independence(
    observed,
    n_rows,
    n_cols,
    alpha,
  );
}

export function chi_square_goodness_of_fit(
  observed: Float64Array,
  expected: Float64Array,
  alpha: number,
): ChiSquareGoodnessOfFitTestResult {
  initWasm();
  return wasmInternal.chi_square_goodness_of_fit(
    observed,
    expected,
    alpha,
  );
}

export function chi_square_variance(
  data: Float64Array,
  pop_variance: number,
  tail: string,
  alpha: number,
): ChiSquareVarianceTestResult {
  initWasm();
  return wasmInternal.chi_square_variance(
    data,
    pop_variance,
    tail,
    alpha,
  );
}
// T-Tests
export function t_test_one_sample(
  x: Float64Array,
  mu: number,
  alpha: number,
  alternative: string,
): OneSampleTTestResult {
  initWasm();
  return wasmInternal.t_test_one_sample(x, mu, alpha, alternative);
}

export function t_test_two_sample_independent(
  x: Float64Array,
  y: Float64Array,
  alpha: number,
  alternative: string,
  pooled: boolean,
): TwoSampleTTestResult {
  initWasm();
  return wasmInternal.t_test_two_sample_independent(
    x,
    y,
    alpha,
    alternative,
    pooled,
  );
}

export function t_test_paired(
  x: Float64Array,
  y: Float64Array,
  alpha: number,
  alternative: string,
): PairedTTestResult {
  initWasm();
  return wasmInternal.t_test_paired(x, y, alpha, alternative);
}

// Z-Tests
export function z_test_one_sample(
  x: Float64Array,
  mu: number,
  sigma: number,
  alpha: number,
  alternative: string,
): OneSampleZTestResult {
  initWasm();
  const result = wasmInternal.z_test_one_sample(
    x,
    mu,
    sigma,
    alpha,
    alternative,
  );
  return result;
}

export function z_test_two_sample(
  x: Float64Array,
  y: Float64Array,
  sigma_x: number,
  sigma_y: number,
  alpha: number,
  alternative: string,
): TwoSampleZTestResult {
  initWasm();
  const result = wasmInternal.z_test_two_sample(
    x,
    y,
    sigma_x,
    sigma_y,
    alpha,
    alternative,
  );
  return result;
}

// Proportion Tests
export function proportion_test_one_sample(
  x: number,
  n: number,
  p0: number,
  alpha: number,
  alternative: string,
): OneSampleProportionTestResult {
  initWasm();
  const result = wasmInternal.proportion_test_one_sample(
    x,
    n,
    p0,
    alpha,
    alternative,
  );
  return result;
}

export function proportion_test_two_sample(
  x1: number,
  n1: number,
  x2: number,
  n2: number,
  alpha: number,
  alternative: string,
  pooled: boolean,
): TwoSampleProportionTestResult {
  initWasm();
  const result = wasmInternal.proportion_test_two_sample(
    x1,
    n1,
    x2,
    n2,
    alpha,
    alternative,
    pooled,
  );
  return result;
}

// Non-parametric Tests
export function mann_whitney_test(
  x: Float64Array,
  y: Float64Array,
  alpha: number,
  alternative: string,
): MannWhitneyTestResult {
  initWasm();
  const result = wasmInternal.mann_whitney_test(x, y, alpha, alternative);
  return result;
}

export function mann_whitney_test_with_config(
  x: Float64Array,
  y: Float64Array,
  exact: boolean,
  continuity_correction: boolean,
  alpha: number,
  alternative: string,
): MannWhitneyTestResult {
  initWasm();
  const result = wasmInternal.mann_whitney_test_with_config(
    x,
    y,
    exact,
    continuity_correction,
    alpha,
    alternative,
  );
  return result;
}

export function wilcoxon_w_test(
  x: Float64Array,
  y: Float64Array,
  alpha: number,
  alternative: string,
): WilcoxonSignedRankTestResult {
  initWasm();
  const result = wasmInternal.wilcoxon_w_test(x, y, alpha, alternative);
  return result;
}

export function shapiro_wilk_test(
  x: Float64Array,
  alpha: number,
): ShapiroWilkTestResult {
  initWasm();
  const result = wasmInternal.shapiro_wilk_test(x, alpha);
  return result;
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
): FishersExactTestResult {
  initWasm();
  const result = wasmInternal.fishers_exact_test_wasm(
    a,
    b,
    c,
    d,
    alternative,
    odds_ratio,
    alpha,
  );
  return result;
}

// Kruskal-Wallis Test
export function kruskal_wallis_test_wasm(
  data: Float64Array,
  group_sizes: Uint32Array,
  alpha: number,
): KruskalWallisTestResult {
  initWasm();
  const result = wasmInternal.kruskal_wallis_test_wasm(
    data,
    group_sizes,
    alpha,
  );
  return result;
}

// Correlation Tests
export function pearson_correlation_test(
  x: Float64Array,
  y: Float64Array,
  alternative: string,
  alpha: number,
): PearsonCorrelationTestResult {
  initWasm();
  const result = wasmInternal.pearson_correlation_test(
    x,
    y,
    alternative,
    alpha,
  );
  return result;
}

export function spearman_correlation_test(
  x: Float64Array,
  y: Float64Array,
  alternative: string,
  alpha: number,
): SpearmanCorrelationTestResult {
  initWasm();
  const result = wasmInternal.spearman_correlation_test(
    x,
    y,
    alternative,
    alpha,
  );
  return result;
}

export function kendall_correlation_test(
  x: Float64Array,
  y: Float64Array,
  alternative: string,
  alpha: number,
): KendallCorrelationTestResult {
  initWasm();
  const result = wasmInternal.kendall_correlation_test(
    x,
    y,
    alternative,
    alpha,
  );
  return result;
}

// Levene's Test
export function levene_test_wasm(
  data: Float64Array,
  group_sizes: Uint32Array,
  alpha: number,
): OneWayAnovaTestResult {
  initWasm();
  const result = wasmInternal.levene_test_wasm(data, group_sizes, alpha);
  return result;
}

// Post-hoc Tests (return JSON strings, not TestResult objects)
export function tukey_hsd_wasm(
  data: Float64Array,
  group_sizes: Uint32Array,
  alpha: number,
): string {
  initWasm();
  const result = wasmInternal.tukey_hsd_wasm(data, group_sizes, alpha);
  return result;
}

export function games_howell_wasm(
  data: Float64Array,
  group_sizes: Uint32Array,
  alpha: number,
): string {
  initWasm();
  const result = wasmInternal.games_howell_wasm(data, group_sizes, alpha);
  return result;
}

export function dunn_test_wasm(
  data: Float64Array,
  group_sizes: Uint32Array,
  alpha: number,
): string {
  initWasm();
  const result = wasmInternal.dunn_test_wasm(data, group_sizes, alpha);
  return result;
}

// Kolmogorov-Smirnov Tests
export function kolmogorov_smirnov_test_wasm(
  x: Float64Array,
  y: Float64Array,
  alternative: string,
  alpha: number,
): KolmogorovSmirnovTestResult {
  initWasm();
  const result = wasmInternal.kolmogorov_smirnov_test_wasm(
    x,
    y,
    alternative,
    alpha,
  );
  return result;
}

export function kolmogorov_smirnov_uniform_wasm(
  x: Float64Array,
  min: number,
  max: number,
  alternative: string,
  alpha: number,
): KolmogorovSmirnovTestResult {
  initWasm();
  const result = wasmInternal.kolmogorov_smirnov_uniform_wasm(
    x,
    min,
    max,
    alternative,
    alpha,
  );
  return result;
}
