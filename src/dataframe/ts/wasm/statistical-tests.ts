// Statistical tests module

import * as wasmInternal from "../../lib/tidy_ts_dataframe.internal.js";
import { initWasm } from "./wasm-init.ts";

// ANOVA Tests
export function anova_one_way(
  data: Float64Array,
  group_sizes: Uint32Array,
  alpha: number,
) {
  initWasm();
  return wasmInternal.anova_one_way(data, group_sizes, alpha);
}

export function anova_two_way(
  data: Float64Array,
  a_levels: number,
  b_levels: number,
  cell_sizes: Uint32Array,
  alpha: number,
) {
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
) {
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
) {
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
) {
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
) {
  initWasm();
  return wasmInternal.chi_square_independence(observed, n_rows, n_cols, alpha);
}

// T-Tests
export function t_test_one_sample(
  x: Float64Array,
  mu: number,
  alpha: number,
  alternative: string,
) {
  initWasm();
  return wasmInternal.t_test_one_sample(x, mu, alpha, alternative);
}

export function t_test_two_sample_independent(
  x: Float64Array,
  y: Float64Array,
  alpha: number,
  alternative: string,
  pooled: boolean,
) {
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
) {
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
) {
  initWasm();
  return wasmInternal.z_test_one_sample(x, mu, sigma, alpha, alternative);
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
  return wasmInternal.z_test_two_sample(
    x,
    y,
    sigma_x,
    sigma_y,
    alpha,
    alternative,
  );
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
  return wasmInternal.proportion_test_one_sample(x, n, p0, alpha, alternative);
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
  return wasmInternal.proportion_test_two_sample(
    x1,
    n1,
    x2,
    n2,
    alpha,
    alternative,
    pooled,
  );
}

// Non-parametric Tests
export function mann_whitney_test(
  x: Float64Array,
  y: Float64Array,
  alpha: number,
  alternative: string,
) {
  initWasm();
  return wasmInternal.mann_whitney_test(x, y, alpha, alternative);
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
  return wasmInternal.mann_whitney_test_with_config(
    x,
    y,
    exact,
    continuity_correction,
    alpha,
    alternative,
  );
}

export function wilcoxon_w_test(
  x: Float64Array,
  y: Float64Array,
  alpha: number,
  alternative: string,
) {
  initWasm();
  return wasmInternal.wilcoxon_w_test(x, y, alpha, alternative);
}

export function shapiro_wilk_test(x: Float64Array, alpha: number) {
  initWasm();
  return wasmInternal.shapiro_wilk_test(x, alpha);
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
  return wasmInternal.fishers_exact_test_wasm(
    a,
    b,
    c,
    d,
    alternative,
    odds_ratio,
    alpha,
  );
}

// Kruskal-Wallis Test
export function kruskal_wallis_test_wasm(
  data: Float64Array,
  group_sizes: Uint32Array,
  alpha: number,
) {
  initWasm();
  return wasmInternal.kruskal_wallis_test_wasm(data, group_sizes, alpha);
}

// Correlation Tests
export function pearson_correlation_test(
  x: Float64Array,
  y: Float64Array,
  alternative: string,
  alpha: number,
) {
  initWasm();
  return wasmInternal.pearson_correlation_test(x, y, alternative, alpha);
}

export function spearman_correlation_test(
  x: Float64Array,
  y: Float64Array,
  alternative: string,
  alpha: number,
) {
  initWasm();
  return wasmInternal.spearman_correlation_test(x, y, alternative, alpha);
}

export function kendall_correlation_test(
  x: Float64Array,
  y: Float64Array,
  alternative: string,
  alpha: number,
) {
  initWasm();
  return wasmInternal.kendall_correlation_test(x, y, alternative, alpha);
}
