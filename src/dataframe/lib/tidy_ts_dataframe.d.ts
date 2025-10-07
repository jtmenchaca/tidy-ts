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
export function geeglm_fit_wasm(
  formula: string,
  family_name: string,
  link_name: string,
  data_json: string,
  id_json: string,
  waves_json: string | null | undefined,
  corstr: string,
  std_err: string,
  options_json?: string | null,
): string;
/**
 * WASM export for GLM fitting
 *
 * Fits a generalized linear model using the provided formula and data.
 *
 * # Arguments
 * * `formula` - Model formula as string (e.g., "y ~ x1 + x2")
 * * `family_name` - Name of the family ("gaussian", "binomial", "poisson", etc.)
 * * `link_name` - Name of the link function ("identity", "logit", "log", etc.)
 * * `data_json` - JSON string containing the data as an object with column names as keys
 * * `options_json` - JSON string containing optional parameters
 *
 * # Returns
 * JSON string containing the fitted GLM result
 */
export function glm_fit_wasm(
  formula: string,
  family_name: string,
  link_name: string,
  data_json: string,
  options_json?: string | null,
): string;
/**
 * WASM export for Anderson-Darling normality test
 */
export function anderson_darling_test(
  x: Float64Array,
  alpha: number,
): AndersonDarlingTestResult;
/**
 * WASM export for one-way ANOVA
 */
export function anova_one_way(
  data: Float64Array,
  group_sizes: Uint32Array,
  alpha: number,
): OneWayAnovaTestResult;
/**
 * WASM export for two-way ANOVA factor A
 */
export function anova_two_way_factor_a_wasm(
  data: Float64Array,
  a_levels: number,
  b_levels: number,
  cell_sizes: Uint32Array,
  alpha: number,
): OneWayAnovaTestResult;
/**
 * WASM export for two-way ANOVA factor B
 */
export function anova_two_way_factor_b_wasm(
  data: Float64Array,
  a_levels: number,
  b_levels: number,
  cell_sizes: Uint32Array,
  alpha: number,
): OneWayAnovaTestResult;
/**
 * WASM export for two-way ANOVA interaction
 */
export function anova_two_way_interaction_wasm(
  data: Float64Array,
  a_levels: number,
  b_levels: number,
  cell_sizes: Uint32Array,
  alpha: number,
): OneWayAnovaTestResult;
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
): TwoWayAnovaTestResult;
/**
 * WASM export for Welch's ANOVA (unequal variances)
 */
export function welch_anova_wasm(
  data: Float64Array,
  group_sizes: Uint32Array,
  alpha: number,
): WelchAnovaTestResult;
/**
 * WASM export for chi-square test of independence
 */
export function chi_square_independence(
  observed: Float64Array,
  rows: number,
  cols: number,
  alpha: number,
): ChiSquareIndependenceTestResult;
/**
 * WASM export for chi-square goodness of fit test
 */
export function chi_square_goodness_of_fit(
  observed: Float64Array,
  expected: Float64Array,
  alpha: number,
): ChiSquareGoodnessOfFitTestResult;
/**
 * WASM export for chi-square test for variance
 */
export function chi_square_variance(
  data: Float64Array,
  pop_variance: number,
  tail: string,
  alpha: number,
): ChiSquareVarianceTestResult;
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
): PearsonCorrelationTestResult;
export function spearman_correlation_test(
  x: Float64Array,
  y: Float64Array,
  alternative: string,
  alpha: number,
): SpearmanCorrelationTestResult;
export function kendall_correlation_test(
  x: Float64Array,
  y: Float64Array,
  alternative: string,
  alpha: number,
): KendallCorrelationTestResult;
/**
 * WASM export for D'Agostino-Pearson K² normality test
 */
export function dagostino_pearson_test(
  x: Float64Array,
  alpha: number,
): DAgostinoPearsonTestResult;
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
): FishersExactTestResult;
/**
 * WASM export for two-sample Kolmogorov-Smirnov test
 */
export function kolmogorov_smirnov_test_wasm(
  x: Float64Array,
  y: Float64Array,
  alternative: string,
  alpha: number,
): KolmogorovSmirnovTestResult;
/**
 * WASM export for one-sample Kolmogorov-Smirnov test against uniform distribution
 */
export function kolmogorov_smirnov_uniform_wasm(
  x: Float64Array,
  min: number,
  max: number,
  alternative: string,
  alpha: number,
): KolmogorovSmirnovTestResult;
/**
 * WASM export for Kruskal-Wallis test
 */
export function kruskal_wallis_test_wasm(
  data: Float64Array,
  group_sizes: Uint32Array,
  alpha: number,
): KruskalWallisTestResult;
/**
 * WASM wrapper for Levene's test for equality of variances
 *
 * Tests whether groups have equal variances using the Brown-Forsythe
 * modification (deviations from medians rather than means).
 *
 * # Arguments
 * * `data` - Flattened array of all group data
 * * `group_sizes` - Array of group sizes
 * * `alpha` - Significance level
 *
 * # Returns
 * * `OneWayAnovaTestResult` - F-statistic, p-value, degrees of freedom
 *   - p < alpha indicates unequal variances (reject null hypothesis)
 *   - p >= alpha suggests equal variances (fail to reject null hypothesis)
 */
export function levene_test_wasm(
  data: Float64Array,
  group_sizes: Uint32Array,
  alpha: number,
): OneWayAnovaTestResult;
/**
 * WASM export for Mann-Whitney U test (automatically chooses exact vs asymptotic)
 */
export function mann_whitney_test(
  x: Float64Array,
  y: Float64Array,
  alpha: number,
  alternative: string,
): MannWhitneyTestResult;
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
): MannWhitneyTestResult;
/**
 * WASM export for Tukey HSD test
 */
export function tukey_hsd_wasm(
  data: Float64Array,
  group_sizes: Uint32Array,
  alpha: number,
): TukeyHsdTestResult;
/**
 * WASM export for Games-Howell test
 */
export function games_howell_wasm(
  data: Float64Array,
  group_sizes: Uint32Array,
  alpha: number,
): GamesHowellTestResult;
/**
 * WASM export for Dunn's test
 */
export function dunn_test_wasm(
  data: Float64Array,
  group_sizes: Uint32Array,
  alpha: number,
): DunnTestResult;
/**
 * WASM export for one-sample proportion test (chi-square approach, matches R)
 */
export function proportion_test_one_sample(
  x: number,
  n: number,
  p0: number,
  alpha: number,
  alternative: string,
): OneSampleProportionTestResult;
/**
 * WASM export for two-sample proportion test (chi-square approach, matches R)
 */
export function proportion_test_two_sample(
  x1: number,
  n1: number,
  x2: number,
  n2: number,
  alpha: number,
  alternative: string,
  _pooled: boolean,
): TwoSampleProportionTestResult;
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
export function shapiro_wilk_test(
  x: Float64Array,
  alpha: number,
): ShapiroWilkTestResult;
/**
 * WASM export for one-sample t-test
 */
export function t_test_one_sample(
  x: Float64Array,
  mu: number,
  alpha: number,
  alternative: string,
): OneSampleTTestResult;
/**
 * WASM export for independent two-sample t-test
 */
export function t_test_two_sample_independent(
  x: Float64Array,
  y: Float64Array,
  alpha: number,
  alternative: string,
  pooled: boolean,
): TwoSampleTTestResult;
/**
 * WASM export for paired t-test
 */
export function t_test_paired(
  x: Float64Array,
  y: Float64Array,
  alpha: number,
  alternative: string,
): PairedTTestResult;
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
): WilcoxonSignedRankTestResult;
/**
 * WASM export for one-sample z-test
 */
export function z_test_one_sample(
  x: Float64Array,
  mu: number,
  sigma: number,
  alpha: number,
  alternative: string,
): OneSampleZTestResult;
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
): TwoSampleZTestResult;
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
 * Effect size types that can be returned by statistical tests
 */
export enum EffectSizeType {
  CohensD = 0,
  HedgesG = 1,
  EtaSquared = 2,
  PartialEtaSquared = 3,
  OmegaSquared = 4,
  CramersV = 5,
  PhiCoefficient = 6,
  PointBiserialCorrelation = 7,
  RankBiserialCorrelation = 8,
  KendallsTau = 9,
  SpearmansRho = 10,
  PearsonsR = 11,
  GlassDelta = 12,
  CohensF = 13,
  CohensH = 14,
  OddsRatio = 15,
  RelativeRisk = 16,
  RiskDifference = 17,
  NumberNeededToTreat = 18,
}
/**
 * Mann-Whitney test method type
 */
export enum MannWhitneyMethod {
  Exact = 0,
  Asymptotic = 1,
}
/**
 * Test statistic names that can be returned by statistical tests
 */
export enum TestStatisticName {
  TStatistic = 0,
  FStatistic = 1,
  ChiSquare = 2,
  ZStatistic = 3,
  UStatistic = 4,
  WStatistic = 5,
  HStatistic = 6,
  RStatistic = 7,
  TauStatistic = 8,
  RhoStatistic = 9,
  DStatistic = 10,
  GStatistic = 11,
  QStatistic = 12,
  VStatistic = 13,
  AStatistic = 14,
  BStatistic = 15,
  LStatistic = 16,
  SStatistic = 17,
  ExactTest = 18,
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
  KruskalWallis = 10,
  OneSampleZTest = 11,
  TwoSampleZTest = 12,
  OneSampleProportionTest = 13,
  TwoSampleProportionTest = 14,
  ShapiroWilk = 15,
  FishersExact = 16,
  PearsonCorrelation = 17,
  SpearmanCorrelation = 18,
  KendallCorrelation = 19,
  Error = 20,
}
/**
 * Wilcoxon signed-rank test method type
 */
export enum WilcoxonMethod {
  Exact = 0,
  Asymptotic = 1,
}
/**
 * Anderson-Darling test result
 */
export class AndersonDarlingTestResult {
  private constructor();
  free(): void;
  test_name: string;
  p_value: number;
  test_statistic: TestStatistic;
  sample_size: number;
  alpha: number;
  get error_message(): string | undefined;
  set error_message(value: string | null | undefined);
}
/**
 * Complete ANOVA table component (includes Total row)
 */
export class AnovaTableComponent {
  private constructor();
  free(): void;
  component: string;
  ss: number;
  df: number;
  get ms(): number | undefined;
  set ms(value: number | null | undefined);
  get f_statistic(): number | undefined;
  set f_statistic(value: number | null | undefined);
  get p_value(): number | undefined;
  set p_value(value: number | null | undefined);
  get eta_squared(): number | undefined;
  set eta_squared(value: number | null | undefined);
  get partial_eta_squared(): number | undefined;
  set partial_eta_squared(value: number | null | undefined);
  get omega_squared(): number | undefined;
  set omega_squared(value: number | null | undefined);
}
/**
 * Component of a two-way ANOVA test (Factor A, Factor B, or Interaction)
 */
export class AnovaTestComponent {
  private constructor();
  free(): void;
  test_statistic: TestStatistic;
  p_value: number;
  degrees_of_freedom: number;
  effect_size: EffectSize;
  mean_square: number;
  sum_of_squares: number;
}
/**
 * Chi-square goodness of fit test result
 */
export class ChiSquareGoodnessOfFitTestResult {
  private constructor();
  free(): void;
  test_name: string;
  p_value: number;
  effect_size: EffectSize;
  test_statistic: TestStatistic;
  degrees_of_freedom: number;
  sample_size: number;
  chi_square_expected: Float64Array;
  alpha: number;
  get error_message(): string | undefined;
  set error_message(value: string | null | undefined);
}
/**
 * Chi-square test of independence result
 */
export class ChiSquareIndependenceTestResult {
  private constructor();
  free(): void;
  test_name: string;
  p_value: number;
  effect_size: EffectSize;
  test_statistic: TestStatistic;
  degrees_of_freedom: number;
  sample_size: number;
  phi_coefficient: number;
  chi_square_expected: Float64Array;
  residuals: Float64Array;
  alpha: number;
  get error_message(): string | undefined;
  set error_message(value: string | null | undefined);
}
/**
 * Chi-square test for variance result
 */
export class ChiSquareVarianceTestResult {
  private constructor();
  free(): void;
  test_name: string;
  p_value: number;
  effect_size: EffectSize;
  test_statistic: TestStatistic;
  degrees_of_freedom: number;
  sample_size: number;
  confidence_interval: ConfidenceInterval;
  alpha: number;
  get error_message(): string | undefined;
  set error_message(value: string | null | undefined);
}
/**
 * Confidence interval structure
 */
export class ConfidenceInterval {
  private constructor();
  free(): void;
  lower: number;
  upper: number;
  confidence_level: number;
}
/**
 * D'Agostino-Pearson K² test result
 */
export class DAgostinoPearsonTestResult {
  private constructor();
  free(): void;
  test_name: string;
  p_value: number;
  test_statistic: TestStatistic;
  sample_size: number;
  skewness: number;
  kurtosis: number;
  alpha: number;
  get error_message(): string | undefined;
  set error_message(value: string | null | undefined);
}
/**
 * Result structure for Dunn's test
 */
export class DunnTestResult {
  private constructor();
  free(): void;
  /**
   * Test statistic for the overall test (if applicable)
   */
  test_statistic: TestStatistic;
  /**
   * P-value for the overall test (if applicable)
   */
  p_value: number;
  /**
   * Name of the test performed
   */
  test_name: string;
  /**
   * Significance level used
   */
  alpha: number;
  /**
   * Error message if test failed
   */
  get error_message(): string | undefined;
  /**
   * Error message if test failed
   */
  set error_message(value: string | null | undefined);
  /**
   * Explanatory note about the header values
   */
  get note(): string | undefined;
  /**
   * Explanatory note about the header values
   */
  set note(value: string | null | undefined);
  /**
   * Multiple comparison correction method used
   */
  correction_method: string;
  /**
   * Number of groups compared
   */
  n_groups: number;
  /**
   * Total sample size
   */
  n_total: number;
  /**
   * Individual pairwise comparisons
   */
  comparisons: PairwiseComparison[];
}
/**
 * Effect size with type information
 */
export class EffectSize {
  private constructor();
  free(): void;
  value: number;
  name: string;
}
/**
 * Fisher's exact test result
 */
export class FishersExactTestResult {
  private constructor();
  free(): void;
  test_name: string;
  p_value: number;
  effect_size: EffectSize;
  test_statistic: TestStatistic;
  confidence_interval: ConfidenceInterval;
  method: string;
  method_type: string;
  get mid_p_value(): number | undefined;
  set mid_p_value(value: number | null | undefined);
  alternative: string;
  alpha: number;
  get error_message(): string | undefined;
  set error_message(value: string | null | undefined);
}
/**
 * Result structure for Games-Howell test
 */
export class GamesHowellTestResult {
  private constructor();
  free(): void;
  /**
   * Test statistic for the overall test (if applicable)
   */
  test_statistic: TestStatistic;
  /**
   * P-value for the overall test (if applicable)
   */
  p_value: number;
  /**
   * Name of the test performed
   */
  test_name: string;
  /**
   * Significance level used
   */
  alpha: number;
  /**
   * Error message if test failed
   */
  get error_message(): string | undefined;
  /**
   * Error message if test failed
   */
  set error_message(value: string | null | undefined);
  /**
   * Explanatory note about the header values
   */
  get note(): string | undefined;
  /**
   * Explanatory note about the header values
   */
  set note(value: string | null | undefined);
  /**
   * Multiple comparison correction method used
   */
  correction_method: string;
  /**
   * Number of groups compared
   */
  n_groups: number;
  /**
   * Total sample size
   */
  n_total: number;
  /**
   * Individual pairwise comparisons
   */
  comparisons: PairwiseComparison[];
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
 * Kendall correlation test result
 */
export class KendallCorrelationTestResult {
  private constructor();
  free(): void;
  test_name: string;
  p_value: number;
  effect_size: EffectSize;
  test_statistic: TestStatistic;
  confidence_interval: ConfidenceInterval;
  alternative: string;
  alpha: number;
  get error_message(): string | undefined;
  set error_message(value: string | null | undefined);
}
export class KolmogorovSmirnovTestResult {
  private constructor();
  free(): void;
  p_value: number;
  sample1_size: number;
  sample2_size: number;
  critical_value: number;
  d_statistic: number;
  d_plus: number;
  d_minus: number;
  alpha: number;
  readonly test_statistic: TestStatistic;
  readonly test_name: string;
  readonly alternative: string;
}
/**
 * Kruskal-Wallis test result
 */
export class KruskalWallisTestResult {
  private constructor();
  free(): void;
  test_name: string;
  p_value: number;
  effect_size: EffectSize;
  test_statistic: TestStatistic;
  degrees_of_freedom: number;
  sample_size: number;
  alpha: number;
  get error_message(): string | undefined;
  set error_message(value: string | null | undefined);
}
/**
 * Mann-Whitney test result with method information
 */
export class MannWhitneyTestResult {
  private constructor();
  free(): void;
  test_name: string;
  p_value: number;
  effect_size: EffectSize;
  test_statistic: TestStatistic;
  method: string;
  alternative: string;
  alpha: number;
  get error_message(): string | undefined;
  set error_message(value: string | null | undefined);
}
/**
 * One-sample proportion test result
 */
export class OneSampleProportionTestResult {
  private constructor();
  free(): void;
  test_name: string;
  p_value: number;
  test_statistic: TestStatistic;
  confidence_interval: ConfidenceInterval;
  sample_proportion: number;
  alternative: string;
  alpha: number;
  get error_message(): string | undefined;
  set error_message(value: string | null | undefined);
}
/**
 * One-sample t-test result
 */
export class OneSampleTTestResult {
  private constructor();
  free(): void;
  test_name: string;
  p_value: number;
  effect_size: EffectSize;
  test_statistic: TestStatistic;
  confidence_interval: ConfidenceInterval;
  degrees_of_freedom: number;
  alternative: string;
  alpha: number;
  get error_message(): string | undefined;
  set error_message(value: string | null | undefined);
}
/**
 * One-sample Z-test result
 */
export class OneSampleZTestResult {
  private constructor();
  free(): void;
  test_name: string;
  p_value: number;
  effect_size: EffectSize;
  test_statistic: TestStatistic;
  confidence_interval: ConfidenceInterval;
  alternative: string;
  alpha: number;
  get error_message(): string | undefined;
  set error_message(value: string | null | undefined);
}
/**
 * One-way ANOVA test result with guaranteed properties
 */
export class OneWayAnovaTestResult {
  private constructor();
  free(): void;
  test_name: string;
  p_value: number;
  effect_size: EffectSize;
  test_statistic: TestStatistic;
  degrees_of_freedom: number;
  r_squared: number;
  adjusted_r_squared: number;
  sample_size: number;
  sample_means: Float64Array;
  sample_std_devs: Float64Array;
  sum_of_squares: Float64Array;
  alpha: number;
  get error_message(): string | undefined;
  set error_message(value: string | null | undefined);
}
/**
 * Paired t-test result
 */
export class PairedTTestResult {
  private constructor();
  free(): void;
  test_name: string;
  p_value: number;
  effect_size: EffectSize;
  test_statistic: TestStatistic;
  confidence_interval: ConfidenceInterval;
  degrees_of_freedom: number;
  mean_difference: number;
  standard_error: number;
  alternative: string;
  alpha: number;
  get error_message(): string | undefined;
  set error_message(value: string | null | undefined);
}
/**
 * Result for a single pairwise comparison
 */
export class PairwiseComparison {
  private constructor();
  free(): void;
  /**
   * First group label/index
   */
  group1: string;
  /**
   * Second group label/index
   */
  group2: string;
  /**
   * Mean difference between groups
   */
  mean_difference: number;
  /**
   * Standard error of the difference
   */
  standard_error: number;
  /**
   * Test statistic with name (q for Tukey, t for Games-Howell, z for Dunn)
   */
  test_statistic: TestStatistic;
  /**
   * P-value for the comparison
   */
  p_value: number;
  /**
   * Confidence interval for the difference
   */
  confidence_interval: ConfidenceInterval;
  /**
   * Whether the difference is significant at the given alpha level
   */
  significant: boolean;
  /**
   * Adjusted p-value (if applicable)
   */
  adjusted_p_value: number;
}
/**
 * Pearson correlation test result
 */
export class PearsonCorrelationTestResult {
  private constructor();
  free(): void;
  test_name: string;
  p_value: number;
  effect_size: EffectSize;
  test_statistic: TestStatistic;
  confidence_interval: ConfidenceInterval;
  degrees_of_freedom: number;
  alternative: string;
  alpha: number;
  get error_message(): string | undefined;
  set error_message(value: string | null | undefined);
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
 * Shapiro-Wilk test result
 */
export class ShapiroWilkTestResult {
  private constructor();
  free(): void;
  test_name: string;
  p_value: number;
  test_statistic: TestStatistic;
  sample_size: number;
  alpha: number;
  get error_message(): string | undefined;
  set error_message(value: string | null | undefined);
}
/**
 * Spearman correlation test result
 */
export class SpearmanCorrelationTestResult {
  private constructor();
  free(): void;
  test_name: string;
  p_value: number;
  effect_size: EffectSize;
  test_statistic: TestStatistic;
  confidence_interval: ConfidenceInterval;
  degrees_of_freedom: number;
  alternative: string;
  alpha: number;
  get error_message(): string | undefined;
  set error_message(value: string | null | undefined);
}
/**
 * Test statistic with name
 */
export class TestStatistic {
  private constructor();
  free(): void;
  value: number;
  name: string;
}
/**
 * Result structure for Tukey HSD test
 */
export class TukeyHsdTestResult {
  private constructor();
  free(): void;
  /**
   * Name of the test performed
   */
  test_name: string;
  /**
   * P-value for the overall test (if applicable)
   */
  p_value: number;
  /**
   * Test statistic for the overall test (if applicable)
   */
  test_statistic: TestStatistic;
  /**
   * Number of groups compared
   */
  n_groups: number;
  /**
   * Total sample size
   */
  n_total: number;
  /**
   * Individual pairwise comparisons
   */
  comparisons: PairwiseComparison[];
  /**
   * Multiple comparison correction method used
   */
  correction_method: string;
  /**
   * Explanatory note about the header values
   */
  get note(): string | undefined;
  /**
   * Explanatory note about the header values
   */
  set note(value: string | null | undefined);
  /**
   * Significance level used
   */
  alpha: number;
  /**
   * Error message if test failed
   */
  get error_message(): string | undefined;
  /**
   * Error message if test failed
   */
  set error_message(value: string | null | undefined);
}
/**
 * Two-sample proportion test result
 */
export class TwoSampleProportionTestResult {
  private constructor();
  free(): void;
  test_name: string;
  p_value: number;
  test_statistic: TestStatistic;
  confidence_interval: ConfidenceInterval;
  proportion_difference: number;
  alternative: string;
  alpha: number;
  get error_message(): string | undefined;
  set error_message(value: string | null | undefined);
}
/**
 * Two-sample independent t-test result
 */
export class TwoSampleTTestResult {
  private constructor();
  free(): void;
  test_name: string;
  p_value: number;
  effect_size: EffectSize;
  test_statistic: TestStatistic;
  confidence_interval: ConfidenceInterval;
  degrees_of_freedom: number;
  mean_difference: number;
  standard_error: number;
  alternative: string;
  alpha: number;
  get error_message(): string | undefined;
  set error_message(value: string | null | undefined);
}
/**
 * Two-sample Z-test result
 */
export class TwoSampleZTestResult {
  private constructor();
  free(): void;
  test_name: string;
  p_value: number;
  effect_size: EffectSize;
  test_statistic: TestStatistic;
  confidence_interval: ConfidenceInterval;
  mean_difference: number;
  standard_error: number;
  alternative: string;
  alpha: number;
  get error_message(): string | undefined;
  set error_message(value: string | null | undefined);
}
/**
 * Two-way ANOVA test result with guaranteed properties for all three tests
 */
export class TwoWayAnovaTestResult {
  private constructor();
  free(): void;
  test_name: string;
  factor_a: AnovaTestComponent;
  factor_b: AnovaTestComponent;
  interaction: AnovaTestComponent;
  r_squared: number;
  sample_size: number;
  sample_means: Float64Array;
  sample_std_devs: Float64Array;
  sum_of_squares: Float64Array;
  grand_mean: number;
  anova_table: AnovaTableComponent[];
  df_error: number;
  ms_error: number;
  df_total: number;
  alpha: number;
  get error_message(): string | undefined;
  set error_message(value: string | null | undefined);
}
/**
 * Welch's ANOVA test result with proper two degrees of freedom
 */
export class WelchAnovaTestResult {
  private constructor();
  free(): void;
  test_name: string;
  p_value: number;
  effect_size: EffectSize;
  test_statistic: TestStatistic;
  df1: number;
  df2: number;
  r_squared: number;
  adjusted_r_squared: number;
  sample_size: number;
  sample_means: Float64Array;
  sample_std_devs: Float64Array;
  alpha: number;
  get error_message(): string | undefined;
  set error_message(value: string | null | undefined);
}
/**
 * Wilcoxon signed-rank test result with method information
 */
export class WilcoxonSignedRankTestResult {
  private constructor();
  free(): void;
  test_name: string;
  p_value: number;
  effect_size: EffectSize;
  test_statistic: TestStatistic;
  method: string;
  alternative: string;
  alpha: number;
  get error_message(): string | undefined;
  set error_message(value: string | null | undefined);
}
