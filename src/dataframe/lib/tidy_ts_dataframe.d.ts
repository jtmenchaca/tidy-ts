// @generated file from wasmbuild -- do not edit
// deno-lint-ignore-file
// deno-fmt-ignore-file

/**
 * Sum aggregation for f64 values
 */
export function reduce_sum_f64(
  gid_per_row: Uint32Array,
  vals: Float64Array,
  n_groups: number,
): Float64Array;
/**
 * Count aggregation (number of non-null values)
 */
export function reduce_count_u32(
  gid_per_row: Uint32Array,
  valid: Uint8Array,
  n_groups: number,
): Uint32Array;
/**
 * Mean aggregation for f64 values
 */
export function reduce_mean_f64(
  gid_per_row: Uint32Array,
  vals: Float64Array,
  valid: Uint8Array,
  n_groups: number,
): Float64Array;
/**
 * WASM export: fill `indices` with sorted order (u32).
 * - `flat_cols`: column-major f64 matrix [n_cols * n_rows]
 * - `dirs`: i8 (+1 = asc, -1 = desc), length = n_cols
 */
export function arrange_multi_f64_wasm(
  flat_cols: Float64Array,
  n_rows: number,
  n_cols: number,
  dirs: Int8Array,
  indices: Uint32Array,
): void;
/**
 * Stable sort `indices` by one f64 key vector (NaN last), asc/desc.
 */
export function stable_sort_indices_f64_wasm(
  values: Float64Array,
  indices: Uint32Array,
  ascending: boolean,
): void;
/**
 * Stable sort `indices` by one u32 rank key vector, asc/desc, with explicit NA code (last).
 */
export function stable_sort_indices_u32_wasm(
  ranks: Uint32Array,
  indices: Uint32Array,
  ascending: boolean,
  na_code: number,
): void;
export function count_f64(values: Float64Array, target: number): number;
export function count_i32(values: Int32Array, target: number): number;
export function count_str(values: string[], target: string): number;
/**
 * Cross join (Cartesian product) - returns u32 indices
 */
export function cross_join_u32(left_len: number, right_len: number): JoinIdxU32;
/**
 * Ultra-optimized distinct using direct typed arrays - exactly like test_ultra_optimized_distinct.rs
 */
export function distinct_rows_generic_typed(
  column_data: Uint32Array[],
  view_index: Uint32Array,
): Uint32Array;
/**
 * WASM export for batch numeric filtering
 *
 * Compares a numeric array against a threshold value with the given operation.
 * Operations: 0=GT, 1=GTE, 2=LT, 3=LTE, 4=EQ, 5=NE
 */
export function batch_filter_numbers(
  values: Float64Array,
  threshold: number,
  operation: number,
  output: Uint8Array,
): void;
/**
 * Perform grouping in a single pass, returning all necessary data
 */
export function group_ids_codes_all(
  keys_codes: Uint32Array,
  n_rows: number,
  n_key_cols: number,
): Grouping;
export function group_ids_codes(
  keys_codes: Uint32Array,
  n_rows: number,
  n_key_cols: number,
): Uint32Array;
/**
 * Get unique group keys from grouping operation
 *
 * This function needs to be called after group_ids_codes to get the unique keys.
 * The keys are stored in row-major order (group then columns).
 */
export function get_unique_group_keys(
  keys_codes: Uint32Array,
  n_rows: number,
  n_key_cols: number,
): Uint32Array;
/**
 * Get number of groups from grouping operation
 */
export function get_group_count(
  keys_codes: Uint32Array,
  n_rows: number,
  n_key_cols: number,
): number;
/**
 * Get group information for a specific group
 *
 * Args:
 * - unique_keys: Unique group keys from group_ids_codes
 * - n_key_cols: Number of key columns
 * - group_id: Group ID to get information for
 *
 * Returns:
 * - key_values: The group's key values
 */
export function get_group_info(
  unique_keys: Uint32Array,
  n_key_cols: number,
  group_id: number,
): Uint32Array;
/**
 * Ultra-optimized inner join using shared utilities and specialized kernels
 */
export function inner_join_typed_multi_u32(
  left_columns: Uint32Array[],
  right_columns: Uint32Array[],
): JoinIdxU32;
/**
 * WASM export for interquartile range
 */
export function iqr_wasm(data: Float64Array): number;
export function left_join_typed_multi_u32(
  left_columns: Uint32Array[],
  right_columns: Uint32Array[],
): JoinIdxU32;
/**
 * WASM export for median calculation
 */
export function median_wasm(data: Float64Array): number;
/**
 * Ultra-optimized outer join using shared utilities and specialized kernels
 */
export function outer_join_typed_multi_u32(
  left_columns: Uint32Array[],
  right_columns: Uint32Array[],
): JoinIdxU32;
/**
 * Ultra-optimized pivot_longer using typed arrays and bulk copying
 */
export function pivot_longer_typed_arrays(
  keep_cols_data: Uint32Array,
  fold_cols_data: Float64Array,
  fold_cols_names: Uint32Array,
  n_input_rows: number,
  n_keep_cols: number,
  n_fold_cols: number,
): PivotLongerResult;
/**
 * Ultra-optimized pivot_longer for numeric data with validation
 */
export function pivot_longer_typed_numeric(
  keep_cols_data: Uint32Array,
  fold_cols_data: Float64Array,
  fold_cols_valid: Uint8Array,
  fold_cols_names: Uint32Array,
  n_input_rows: number,
  n_keep_cols: number,
  n_fold_cols: number,
): PivotLongerResult;
/**
 * Ultra-optimized pivot_longer for string data
 */
export function pivot_longer_typed_strings(
  keep_cols_data: Uint32Array,
  fold_cols_data: Uint32Array,
  fold_cols_names: Uint32Array,
  n_input_rows: number,
  n_keep_cols: number,
  n_fold_cols: number,
): PivotLongerStringResult;
/**
 * Perform pivot_longer operation on dictionary-encoded columns
 *
 * Args:
 * - keep_cols_data: Column-major dictionary-encoded data for columns to keep (n_keep_cols × n_input_rows)
 * - fold_cols_data: Column-major data for columns to fold/melt (n_fold_cols × n_input_rows)
 * - fold_cols_names: Dictionary codes for the names of columns being folded
 * - n_input_rows: Number of input rows
 * - n_keep_cols: Number of columns to keep
 * - n_fold_cols: Number of columns to fold/melt
 */
export function pivot_longer_dense(
  keep_cols_data: Uint32Array,
  fold_cols_data: Float64Array,
  fold_cols_names: Uint32Array,
  n_input_rows: number,
  n_keep_cols: number,
  n_fold_cols: number,
): PivotLongerResult;
/**
 * Optimized pivot_longer for the common case of numeric values
 * This version handles NaN/undefined values appropriately
 */
export function pivot_longer_numeric(
  keep_cols_data: Uint32Array,
  fold_cols_data: Float64Array,
  fold_cols_valid: Uint8Array,
  fold_cols_names: Uint32Array,
  n_input_rows: number,
  n_keep_cols: number,
  n_fold_cols: number,
): PivotLongerResult;
/**
 * Fast pivot_longer specifically for string columns
 * Returns dictionary codes that can be decoded in TypeScript
 */
export function pivot_longer_strings(
  keep_cols_data: Uint32Array,
  fold_cols_data: Uint32Array,
  fold_cols_names: Uint32Array,
  n_input_rows: number,
  n_keep_cols: number,
  n_fold_cols: number,
): PivotLongerStringResult;
/**
 * policy: 0=first, 1=last, 2=sum, 3=mean
 */
export function pivot_wider_dense_f64(
  gid_per_row: Uint32Array,
  cat_codes: Uint32Array,
  values: Float64Array,
  n_groups: number,
  n_cats: number,
  policy: number,
): Float64Array;
/**
 * Get seen flags from dense pivot operation
 *
 * This function needs to be called after pivot_wider_dense_f64 to get
 * the seen flags indicating which cells have values.
 */
export function pivot_wider_seen_flags(
  gid_per_row: Uint32Array,
  cat_codes: Uint32Array,
  _values: Float64Array,
  n_groups: number,
  n_cats: number,
  _policy: number,
): Uint8Array;
/**
 * Combined pivot operation that returns values and seen flags in one pass
 * policy: 0=first, 1=last, 2=sum, 3=mean
 */
export function pivot_wider_dense_f64_all(
  gid_per_row: Uint32Array,
  cat_codes: Uint32Array,
  values: Float64Array,
  n_groups: number,
  n_cats: number,
  policy: number,
): PivotDenseF64;
/**
 * WASM export for general quantile calculation
 * Uses R's Type 7 algorithm (default)
 */
export function quantile_wasm(
  data: Float64Array,
  probs: Float64Array,
): Float64Array;
/**
 * Ultra-optimized right join using shared utilities and specialized kernels
 */
export function right_join_typed_multi_u32(
  left_columns: Uint32Array[],
  right_columns: Uint32Array[],
): JoinIdxU32;
/**
 * WASM export for sum calculation
 */
export function sum_wasm(values: Float64Array): number;
/**
 * WASM export for unique f64 values
 */
export function unique_f64(values: Float64Array): Float64Array;
/**
 * WASM export for unique i32 values
 */
export function unique_i32(values: Int32Array): Int32Array;
/**
 * WASM export for unique string values
 */
export function unique_str(values: string[]): string[];
/**
 * WASM export for beta density function
 */
export function wasm_dbeta(
  x: number,
  shape1: number,
  shape2: number,
  give_log: boolean,
): number;
/**
 * WASM export for beta cumulative distribution function
 */
export function wasm_pbeta(
  x: number,
  shape1: number,
  shape2: number,
  lower_tail: boolean,
  log_p: boolean,
): number;
/**
 * WASM export for beta quantile function
 */
export function wasm_qbeta(
  p: number,
  shape1: number,
  shape2: number,
  lower_tail: boolean,
  log_p: boolean,
): number;
/**
 * WASM export for beta random number generation
 */
export function wasm_rbeta(shape1: number, shape2: number): number;
/**
 * WASM export for normal density function
 */
export function wasm_dnorm(
  x: number,
  mean: number,
  sd: number,
  give_log: boolean,
): number;
/**
 * WASM export for normal cumulative distribution function
 */
export function wasm_pnorm(
  x: number,
  mean: number,
  sd: number,
  lower_tail: boolean,
  log_p: boolean,
): number;
/**
 * WASM export for normal quantile function
 */
export function wasm_qnorm(
  p: number,
  mean: number,
  sd: number,
  lower_tail: boolean,
  log_p: boolean,
): number;
/**
 * WASM export for normal random number generation
 */
export function wasm_rnorm(mean: number, sd: number): number;
/**
 * WASM export for gamma density function
 */
export function wasm_dgamma(
  x: number,
  shape: number,
  rate: number,
  give_log: boolean,
): number;
/**
 * WASM export for gamma cumulative distribution function
 */
export function wasm_pgamma(
  x: number,
  shape: number,
  rate: number,
  lower_tail: boolean,
  log_p: boolean,
): number;
/**
 * WASM export for gamma quantile function
 */
export function wasm_qgamma(
  p: number,
  shape: number,
  rate: number,
  lower_tail: boolean,
  log_p: boolean,
): number;
/**
 * WASM export for gamma random number generation
 */
export function wasm_rgamma(shape: number, rate: number): number;
/**
 * WASM export for exponential density function
 */
export function wasm_dexp(x: number, rate: number, give_log: boolean): number;
/**
 * WASM export for exponential cumulative distribution function
 */
export function wasm_pexp(
  x: number,
  rate: number,
  lower_tail: boolean,
  log_p: boolean,
): number;
/**
 * WASM export for exponential quantile function
 */
export function wasm_qexp(
  p: number,
  rate: number,
  lower_tail: boolean,
  log_p: boolean,
): number;
/**
 * WASM export for exponential random number generation
 */
export function wasm_rexp(rate: number): number;
/**
 * WASM export for chi-squared density function
 */
export function wasm_dchisq(x: number, df: number, give_log: boolean): number;
/**
 * WASM export for chi-squared cumulative distribution function
 */
export function wasm_pchisq(
  x: number,
  df: number,
  lower_tail: boolean,
  log_p: boolean,
): number;
/**
 * WASM export for chi-squared quantile function
 */
export function wasm_qchisq(
  p: number,
  df: number,
  lower_tail: boolean,
  log_p: boolean,
): number;
/**
 * WASM export for chi-squared random number generation
 */
export function wasm_rchisq(df: number): number;
/**
 * WASM export for F density function
 */
export function wasm_df(
  x: number,
  df1: number,
  df2: number,
  give_log: boolean,
): number;
/**
 * WASM export for F cumulative distribution function
 */
export function wasm_pf(
  x: number,
  df1: number,
  df2: number,
  lower_tail: boolean,
  log_p: boolean,
): number;
/**
 * WASM export for F quantile function
 */
export function wasm_qf(
  p: number,
  df1: number,
  df2: number,
  lower_tail: boolean,
  log_p: boolean,
): number;
/**
 * WASM export for F distribution random number generation
 */
export function wasm_rf(df1: number, df2: number): number;
/**
 * WASM export for t density function
 */
export function wasm_dt(x: number, df: number, give_log: boolean): number;
/**
 * WASM export for t cumulative distribution function
 */
export function wasm_pt(
  x: number,
  df: number,
  lower_tail: boolean,
  log_p: boolean,
): number;
/**
 * WASM export for t quantile function
 */
export function wasm_qt(
  p: number,
  df: number,
  lower_tail: boolean,
  log_p: boolean,
): number;
/**
 * WASM export for t distribution random number generation
 */
export function wasm_rt(df: number): number;
/**
 * WASM export for Poisson density function
 */
export function wasm_dpois(
  x: number,
  lambda: number,
  give_log: boolean,
): number;
/**
 * WASM export for Poisson cumulative distribution function
 */
export function wasm_ppois(
  x: number,
  lambda: number,
  lower_tail: boolean,
  log_p: boolean,
): number;
/**
 * WASM export for Poisson quantile function
 */
export function wasm_qpois(
  p: number,
  lambda: number,
  lower_tail: boolean,
  log_p: boolean,
): number;
/**
 * WASM export for Poisson random number generation
 */
export function wasm_rpois(lambda: number): number;
/**
 * WASM export for binomial density function
 */
export function wasm_dbinom(
  x: number,
  size: number,
  prob: number,
  give_log: boolean,
): number;
/**
 * WASM export for binomial cumulative distribution function
 */
export function wasm_pbinom(
  x: number,
  size: number,
  prob: number,
  lower_tail: boolean,
  log_p: boolean,
): number;
/**
 * WASM export for binomial quantile function
 */
export function wasm_qbinom(
  p: number,
  size: number,
  prob: number,
  lower_tail: boolean,
  log_p: boolean,
): number;
/**
 * WASM export for binomial random number generation
 */
export function wasm_rbinom(size: number, prob: number): number;
/**
 * WASM export for uniform density function
 */
export function wasm_dunif(
  x: number,
  min: number,
  max: number,
  give_log: boolean,
): number;
/**
 * WASM export for uniform cumulative distribution function
 */
export function wasm_punif(
  x: number,
  min: number,
  max: number,
  lower_tail: boolean,
  log_p: boolean,
): number;
/**
 * WASM export for uniform quantile function
 */
export function wasm_qunif(
  p: number,
  min: number,
  max: number,
  lower_tail: boolean,
  log_p: boolean,
): number;
/**
 * WASM export for uniform random number generation
 */
export function wasm_runif(min: number, max: number): number;
/**
 * WASM export for Weibull density function
 */
export function wasm_dweibull(
  x: number,
  shape: number,
  scale: number,
  give_log: boolean,
): number;
/**
 * WASM export for Weibull cumulative distribution function
 */
export function wasm_pweibull(
  x: number,
  shape: number,
  scale: number,
  lower_tail: boolean,
  log_p: boolean,
): number;
/**
 * WASM export for Weibull quantile function
 */
export function wasm_qweibull(
  p: number,
  shape: number,
  scale: number,
  lower_tail: boolean,
  log_p: boolean,
): number;
/**
 * WASM export for Weibull random number generation
 */
export function wasm_rweibull(shape: number, scale: number): number;
/**
 * WASM export for geometric density function
 */
export function wasm_dgeom(x: number, prob: number, give_log: boolean): number;
/**
 * WASM export for geometric cumulative distribution function
 */
export function wasm_pgeom(
  x: number,
  prob: number,
  lower_tail: boolean,
  log_p: boolean,
): number;
/**
 * WASM export for geometric quantile function
 */
export function wasm_qgeom(
  p: number,
  prob: number,
  lower_tail: boolean,
  log_p: boolean,
): number;
/**
 * WASM export for geometric random number generation
 */
export function wasm_rgeom(prob: number): number;
/**
 * WASM export for hypergeometric density function
 */
export function wasm_dhyper(
  x: number,
  m: number,
  n: number,
  k: number,
  give_log: boolean,
): number;
/**
 * WASM export for hypergeometric cumulative distribution function
 */
export function wasm_phyper(
  x: number,
  m: number,
  n: number,
  k: number,
  lower_tail: boolean,
  log_p: boolean,
): number;
/**
 * WASM export for hypergeometric quantile function
 */
export function wasm_qhyper(
  p: number,
  m: number,
  n: number,
  k: number,
  lower_tail: boolean,
  log_p: boolean,
): number;
/**
 * WASM export for hypergeometric random number generation
 */
export function wasm_rhyper(m: number, n: number, k: number): number;
/**
 * WASM export for log-normal density function
 */
export function wasm_dlnorm(
  x: number,
  meanlog: number,
  sdlog: number,
  give_log: boolean,
): number;
/**
 * WASM export for log-normal cumulative distribution function
 */
export function wasm_plnorm(
  x: number,
  meanlog: number,
  sdlog: number,
  lower_tail: boolean,
  log_p: boolean,
): number;
/**
 * WASM export for log-normal quantile function
 */
export function wasm_qlnorm(
  p: number,
  meanlog: number,
  sdlog: number,
  lower_tail: boolean,
  log_p: boolean,
): number;
/**
 * WASM export for log-normal random number generation
 */
export function wasm_rlnorm(meanlog: number, sdlog: number): number;
/**
 * WASM export for negative binomial density function
 */
export function wasm_dnbinom(
  x: number,
  r: number,
  p: number,
  give_log: boolean,
): number;
/**
 * WASM export for negative binomial cumulative distribution function
 */
export function wasm_pnbinom(
  x: number,
  r: number,
  p: number,
  lower_tail: boolean,
  log_p: boolean,
): number;
/**
 * WASM export for negative binomial quantile function
 */
export function wasm_qnbinom(
  p: number,
  r: number,
  prob: number,
  lower_tail: boolean,
  log_p: boolean,
): number;
/**
 * WASM export for negative binomial random number generation
 */
export function wasm_rnbinom(r: number, prob: number): number;
/**
 * WASM export for Wilcoxon density function
 */
export function wasm_dwilcox(
  x: number,
  m: number,
  n: number,
  give_log: boolean,
): number;
/**
 * WASM export for Wilcoxon cumulative distribution function
 */
export function wasm_pwilcox(
  q: number,
  m: number,
  n: number,
  lower_tail: boolean,
  log_p: boolean,
): number;
/**
 * WASM export for Wilcoxon quantile function
 */
export function wasm_qwilcox(
  p: number,
  m: number,
  n: number,
  lower_tail: boolean,
  log_p: boolean,
): number;
/**
 * WASM export for Wilcoxon random number generation
 */
export function wasm_rwilcox(m: number, n: number): number;
/**
 * WASM export for one-way ANOVA
 */
export function anova_one_way(
  data: Float64Array,
  group_sizes: Uint32Array,
  alpha: number,
): TestResult;
/**
 * WASM export for two-way ANOVA factor A
 */
export function anova_two_way_factor_a_wasm(
  data: Float64Array,
  a_levels: number,
  b_levels: number,
  cell_sizes: Uint32Array,
  alpha: number,
): TestResult;
/**
 * WASM export for two-way ANOVA factor B
 */
export function anova_two_way_factor_b_wasm(
  data: Float64Array,
  a_levels: number,
  b_levels: number,
  cell_sizes: Uint32Array,
  alpha: number,
): TestResult;
/**
 * WASM export for two-way ANOVA interaction
 */
export function anova_two_way_interaction_wasm(
  data: Float64Array,
  a_levels: number,
  b_levels: number,
  cell_sizes: Uint32Array,
  alpha: number,
): TestResult;
/**
 * WASM export for two-way ANOVA
 * Takes flattened data with group information to reconstruct 2D factorial design
 */
export function anova_two_way(
  data: Float64Array,
  a_levels: number,
  b_levels: number,
  cell_sizes: Uint32Array,
  alpha: number,
): TestResult;
/**
 * WASM export for chi-square test of independence
 */
export function chi_square_independence(
  observed: Float64Array,
  rows: number,
  cols: number,
  alpha: number,
): TestResult;
/**
 * WASM export for chi-square sample size calculation
 */
export function chi_square_sample_size_wasm(
  effect_size: number,
  alpha: number,
  power: number,
  _df: number,
): number;
export function pearson_correlation_test(
  x: Float64Array,
  y: Float64Array,
  alternative: string,
  alpha: number,
): TestResult;
export function spearman_correlation_test(
  x: Float64Array,
  y: Float64Array,
  alternative: string,
  alpha: number,
): TestResult;
export function kendall_correlation_test(
  x: Float64Array,
  y: Float64Array,
  alternative: string,
  alpha: number,
): TestResult;
/**
 * WASM export for Fisher's exact test
 */
export function fishers_exact_test_wasm(
  a: number,
  b: number,
  c: number,
  d: number,
  alternative: string,
  odds_ratio: number,
  alpha: number,
): TestResult;
/**
 * WASM export for Kruskal-Wallis test
 */
export function kruskal_wallis_test_wasm(
  data: Float64Array,
  group_sizes: Uint32Array,
  alpha: number,
): TestResult;
/**
 * WASM export for Mann-Whitney U test
 */
export function mann_whitney_test(
  x: Float64Array,
  y: Float64Array,
  alpha: number,
  alternative: string,
): TestResult;
/**
 * WASM export for Mann-Whitney U test with configuration
 */
export function mann_whitney_test_with_config(
  x: Float64Array,
  y: Float64Array,
  exact: boolean,
  continuity_correction: boolean,
  alpha: number,
  alternative: string,
): TestResult;
/**
 * WASM export for one-sample proportion test
 */
export function proportion_test_one_sample(
  x: number,
  n: number,
  p0: number,
  alpha: number,
  alternative: string,
): TestResult;
/**
 * WASM export for two-sample proportion test
 */
export function proportion_test_two_sample(
  x1: number,
  n1: number,
  x2: number,
  n2: number,
  alpha: number,
  alternative: string,
  pooled: boolean,
): TestResult;
/**
 * WASM export for proportion sample size calculation
 */
export function proportion_sample_size_wasm(
  p1: number,
  p2: number,
  alpha: number,
  power: number,
): number;
/**
 * WASM export for Shapiro-Wilk normality test
 */
export function shapiro_wilk_test(x: Float64Array, alpha: number): TestResult;
/**
 * WASM export for one-sample t-test
 */
export function t_test_one_sample(
  x: Float64Array,
  mu: number,
  alpha: number,
  alternative: string,
): TestResult;
/**
 * WASM export for independent two-sample t-test
 */
export function t_test_two_sample_independent(
  x: Float64Array,
  y: Float64Array,
  alpha: number,
  alternative: string,
  pooled: boolean,
): TestResult;
/**
 * WASM export for paired t-test
 */
export function t_test_paired(
  x: Float64Array,
  y: Float64Array,
  alpha: number,
  alternative: string,
): TestResult;
/**
 * WASM export for t-test sample size calculation
 */
export function t_sample_size_wasm(
  effect_size: number,
  alpha: number,
  power: number,
  std_dev: number,
): number;
/**
 * WASM export for Wilcoxon W test (paired)
 */
export function wilcoxon_w_test(
  x: Float64Array,
  y: Float64Array,
  alpha: number,
  alternative: string,
): TestResult;
/**
 * WASM export for one-sample z-test
 */
export function z_test_one_sample(
  x: Float64Array,
  mu: number,
  sigma: number,
  alpha: number,
  alternative: string,
): TestResult;
/**
 * WASM export for two-sample z-test
 */
export function z_test_two_sample(
  x: Float64Array,
  y: Float64Array,
  sigma_x: number,
  sigma_y: number,
  alpha: number,
  alternative: string,
): TestResult;
/**
 * WASM export for z-test sample size calculation
 */
export function z_sample_size_wasm(
  effect_size: number,
  alpha: number,
  power: number,
  test_type: string,
): number;
export function wasm_test(): number;
/**
 * Represents the type of alternative hypothesis for statistical tests.
 */
export enum AlternativeType {
  /**
   * Two-sided test (default)
   */
  TwoSided = 0,
  /**
   * One-sided test: less than
   */
  Less = 1,
  /**
   * One-sided test: greater than
   */
  Greater = 2,
}
/**
 * Represents the type of statistical test performed.
 */
export enum TestType {
  OneWayAnova = 0,
  TwoWayAnovaFactorA = 1,
  TwoWayAnovaFactorB = 2,
  TwoWayAnovaInteraction = 3,
  IndependentTTest = 4,
  PairedTTest = 5,
  OneSampleTTest = 6,
  ChiSquareIndependence = 7,
  MannWhitneyU = 8,
  WilcoxonSignedRank = 9,
  OneSampleZTest = 10,
  TwoSampleZTest = 11,
  OneSampleProportionTest = 12,
  TwoSampleProportionTest = 13,
  ShapiroWilk = 14,
  PearsonCorrelation = 15,
  SpearmanCorrelation = 16,
  KendallCorrelation = 17,
  Error = 18,
}
/**
 * Grouping result that contains all information in one pass
 */
export class Grouping {
  private constructor();
  free(): void;
  takeGidPerRow(): Uint32Array;
  takeUniqueKeys(): Uint32Array;
  n_groups: number;
  n_key_cols: number;
}
/**
 * Optimized WASM join result using packed u32 arrays with sentinel values
 */
export class JoinIdxU32 {
  private constructor();
  free(): void;
  /**
   * Move out the left indices (no clone)
   */
  takeLeft(): Uint32Array;
  /**
   * Move out the right indices (no clone)
   */
  takeRight(): Uint32Array;
}
/**
 * Combined pivot result with values and seen flags
 */
export class PivotDenseF64 {
  private constructor();
  free(): void;
  takeValues(): Float64Array;
  takeSeen(): Uint8Array;
  n_groups: number;
  n_cats: number;
}
/**
 * Result of pivot_longer operation containing reshaped data
 */
export class PivotLongerResult {
  private constructor();
  free(): void;
  takeKeepData(): Uint32Array;
  takeNamesData(): Uint32Array;
  takeValuesData(): Float64Array;
  n_rows: number;
  n_keep_cols: number;
}
/**
 * Result for string pivot_longer operations
 */
export class PivotLongerStringResult {
  private constructor();
  free(): void;
  takeKeepData(): Uint32Array;
  takeNamesData(): Uint32Array;
  takeValuesData(): Uint32Array;
  n_rows: number;
  n_keep_cols: number;
}
/**
 * Result of a statistical test containing all relevant information
 */
export class TestResult {
  private constructor();
  free(): void;
  /**
   * Type of statistical test performed
   */
  test_type: TestType;
  /**
   * The calculated test statistic value
   */
  get test_statistic(): number | undefined;
  /**
   * The calculated test statistic value
   */
  set test_statistic(value: number | null | undefined);
  /**
   * The p-value of the test
   */
  get p_value(): number | undefined;
  /**
   * The p-value of the test
   */
  set p_value(value: number | null | undefined);
  /**
   * Confidence interval lower bound
   */
  get confidence_interval_lower(): number | undefined;
  /**
   * Confidence interval lower bound
   */
  set confidence_interval_lower(value: number | null | undefined);
  /**
   * Confidence interval upper bound
   */
  get confidence_interval_upper(): number | undefined;
  /**
   * Confidence interval upper bound
   */
  set confidence_interval_upper(value: number | null | undefined);
  /**
   * Confidence level used (e.g., 0.95 for 95%)
   */
  get confidence_level(): number | undefined;
  /**
   * Confidence level used (e.g., 0.95 for 95%)
   */
  set confidence_level(value: number | null | undefined);
  /**
   * General effect size measure
   */
  get effect_size(): number | undefined;
  /**
   * General effect size measure
   */
  set effect_size(value: number | null | undefined);
  /**
   * Cohen's d (for t-tests)
   */
  get cohens_d(): number | undefined;
  /**
   * Cohen's d (for t-tests)
   */
  set cohens_d(value: number | null | undefined);
  /**
   * Eta squared (for ANOVA)
   */
  get eta_squared(): number | undefined;
  /**
   * Eta squared (for ANOVA)
   */
  set eta_squared(value: number | null | undefined);
  /**
   * Cramer's V (for chi-square)
   */
  get cramers_v(): number | undefined;
  /**
   * Cramer's V (for chi-square)
   */
  set cramers_v(value: number | null | undefined);
  /**
   * Phi coefficient (for 2x2 chi-square)
   */
  get phi_coefficient(): number | undefined;
  /**
   * Phi coefficient (for 2x2 chi-square)
   */
  set phi_coefficient(value: number | null | undefined);
  /**
   * Odds ratio (for categorical tests)
   */
  get odds_ratio(): number | undefined;
  /**
   * Odds ratio (for categorical tests)
   */
  set odds_ratio(value: number | null | undefined);
  /**
   * Relative risk (for categorical tests)
   */
  get relative_risk(): number | undefined;
  /**
   * Relative risk (for categorical tests)
   */
  set relative_risk(value: number | null | undefined);
  /**
   * Degrees of freedom
   */
  get degrees_of_freedom(): number | undefined;
  /**
   * Degrees of freedom
   */
  set degrees_of_freedom(value: number | null | undefined);
  /**
   * Sample size
   */
  get sample_size(): number | undefined;
  /**
   * Sample size
   */
  set sample_size(value: number | null | undefined);
  /**
   * Correlation coefficient (for correlation tests)
   */
  get correlation(): number | undefined;
  /**
   * Correlation coefficient (for correlation tests)
   */
  set correlation(value: number | null | undefined);
  /**
   * U statistic (for Mann-Whitney)
   */
  get u_statistic(): number | undefined;
  /**
   * U statistic (for Mann-Whitney)
   */
  set u_statistic(value: number | null | undefined);
  /**
   * W statistic (for Wilcoxon)
   */
  get w_statistic(): number | undefined;
  /**
   * W statistic (for Wilcoxon)
   */
  set w_statistic(value: number | null | undefined);
  /**
   * F statistic (for ANOVA)
   */
  get f_statistic(): number | undefined;
  /**
   * F statistic (for ANOVA)
   */
  set f_statistic(value: number | null | undefined);
  /**
   * Mean difference between groups
   */
  get mean_difference(): number | undefined;
  /**
   * Mean difference between groups
   */
  set mean_difference(value: number | null | undefined);
  /**
   * Standard error
   */
  get standard_error(): number | undefined;
  /**
   * Standard error
   */
  set standard_error(value: number | null | undefined);
  /**
   * Margin of error
   */
  get margin_of_error(): number | undefined;
  /**
   * Margin of error
   */
  set margin_of_error(value: number | null | undefined);
  /**
   * Sample means for each group
   */
  get sample_means(): Float64Array | undefined;
  /**
   * Sample means for each group
   */
  set sample_means(value: Float64Array | null | undefined);
  /**
   * Sample standard deviations for each group
   */
  get sample_std_devs(): Float64Array | undefined;
  /**
   * Sample standard deviations for each group
   */
  set sample_std_devs(value: Float64Array | null | undefined);
  /**
   * Expected frequencies (for chi-square)
   */
  get chi_square_expected(): Float64Array | undefined;
  /**
   * Expected frequencies (for chi-square)
   */
  set chi_square_expected(value: Float64Array | null | undefined);
  /**
   * Residuals (for chi-square)
   */
  get residuals(): Float64Array | undefined;
  /**
   * Residuals (for chi-square)
   */
  set residuals(value: Float64Array | null | undefined);
  /**
   * Ranks (for non-parametric tests)
   */
  get ranks(): Float64Array | undefined;
  /**
   * Ranks (for non-parametric tests)
   */
  set ranks(value: Float64Array | null | undefined);
  /**
   * Tie correction factor
   */
  get tie_correction(): number | undefined;
  /**
   * Tie correction factor
   */
  set tie_correction(value: number | null | undefined);
  /**
   * Exact p-value (when available)
   */
  get exact_p_value(): number | undefined;
  /**
   * Exact p-value (when available)
   */
  set exact_p_value(value: number | null | undefined);
  /**
   * Asymptotic p-value (for large samples)
   */
  get asymptotic_p_value(): number | undefined;
  /**
   * Asymptotic p-value (for large samples)
   */
  set asymptotic_p_value(value: number | null | undefined);
  /**
   * R-squared value
   */
  get r_squared(): number | undefined;
  /**
   * R-squared value
   */
  set r_squared(value: number | null | undefined);
  /**
   * Adjusted R-squared value
   */
  get adjusted_r_squared(): number | undefined;
  /**
   * Adjusted R-squared value
   */
  set adjusted_r_squared(value: number | null | undefined);
  /**
   * Akaike Information Criterion
   */
  get aic(): number | undefined;
  /**
   * Akaike Information Criterion
   */
  set aic(value: number | null | undefined);
  /**
   * Bayesian Information Criterion
   */
  get bic(): number | undefined;
  /**
   * Bayesian Information Criterion
   */
  set bic(value: number | null | undefined);
  /**
   * Sum of squares breakdown
   */
  get sum_of_squares(): Float64Array | undefined;
  /**
   * Sum of squares breakdown
   */
  set sum_of_squares(value: Float64Array | null | undefined);
  /**
   * Number of missing values
   */
  get missing_values(): number | undefined;
  /**
   * Number of missing values
   */
  set missing_values(value: number | null | undefined);
  /**
   * Number of outliers detected
   */
  get outliers_detected(): number | undefined;
  /**
   * Number of outliers detected
   */
  set outliers_detected(value: number | null | undefined);
  /**
   * List of violated assumptions
   */
  get assumptions_violated(): string[] | undefined;
  /**
   * List of violated assumptions
   */
  set assumptions_violated(value: string[] | null | undefined);
  /**
   * P-value from normality test
   */
  get normality_test_p_value(): number | undefined;
  /**
   * P-value from normality test
   */
  set normality_test_p_value(value: number | null | undefined);
  /**
   * Error message if the test failed
   */
  get error_message(): string | undefined;
  /**
   * Error message if the test failed
   */
  set error_message(value: string | null | undefined);
}
