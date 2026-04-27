// @generated file from wasmbuild -- do not edit
// deno-lint-ignore-file
// deno-fmt-ignore-file

export class Grouping {
  private constructor();
  free(): void;
  [Symbol.dispose](): void;
  takeGidPerRow(): Uint32Array;
  takeUniqueKeys(): Uint32Array;
  n_groups: number;
  n_key_cols: number;
}

export class JoinIdxU32 {
  private constructor();
  free(): void;
  [Symbol.dispose](): void;
  /**
   * Move out the right indices (no clone)
   */
  takeRight(): Uint32Array;
  /**
   * Move out the left indices (no clone)
   */
  takeLeft(): Uint32Array;
}

export class PivotDenseF64 {
  private constructor();
  free(): void;
  [Symbol.dispose](): void;
  takeValues(): Float64Array;
  takeSeen(): Uint8Array;
  n_groups: number;
  n_cats: number;
}

export class PivotLongerResult {
  private constructor();
  free(): void;
  [Symbol.dispose](): void;
  takeKeepData(): Uint32Array;
  takeNamesData(): Uint32Array;
  takeValuesData(): Float64Array;
  n_rows: number;
  n_keep_cols: number;
}

export class PivotLongerStringResult {
  private constructor();
  free(): void;
  [Symbol.dispose](): void;
  takeKeepData(): Uint32Array;
  takeNamesData(): Uint32Array;
  takeValuesData(): Uint32Array;
  n_rows: number;
  n_keep_cols: number;
}

/**
 * WASM export for Anderson-Darling normality test
 */
export function anderson_darling_test(x: Float64Array, alpha: number): any;

/**
 * WASM export for one-way ANOVA
 */
export function anova_one_way(
  data: Float64Array,
  group_sizes: Uint32Array,
  alpha: number,
): any;

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
): any;

/**
 * WASM export for two-way ANOVA factor A
 */
export function anova_two_way_factor_a_wasm(
  data: Float64Array,
  a_levels: number,
  b_levels: number,
  cell_sizes: Uint32Array,
  alpha: number,
): any;

/**
 * WASM export for two-way ANOVA factor B
 */
export function anova_two_way_factor_b_wasm(
  data: Float64Array,
  a_levels: number,
  b_levels: number,
  cell_sizes: Uint32Array,
  alpha: number,
): any;

/**
 * WASM export for two-way ANOVA interaction
 */
export function anova_two_way_interaction_wasm(
  data: Float64Array,
  a_levels: number,
  b_levels: number,
  cell_sizes: Uint32Array,
  alpha: number,
): any;

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
 * WASM export for chi-square goodness of fit test
 */
export function chi_square_goodness_of_fit(
  observed: Float64Array,
  expected: Float64Array,
  alpha: number,
): any;

/**
 * WASM export for chi-square test of independence
 */
export function chi_square_independence(
  observed: Float64Array,
  rows: number,
  cols: number,
  alpha: number,
): any;

/**
 * WASM export for chi-square sample size calculation
 */
export function chi_square_sample_size_wasm(
  effect_size: number,
  alpha: number,
  power: number,
  _df: number,
): number;

/**
 * WASM export for chi-square test for variance
 */
export function chi_square_variance(
  data: Float64Array,
  pop_variance: number,
  tail: string,
  alpha: number,
): any;

/**
 * Compute concordance statistic.
 */
export function concordance_wasm(
  time_json: string,
  status_json: string,
  x_json: string,
  options_json?: string | null,
): any;

export function count_f64(values: Float64Array, target: number): number;

export function count_i32(values: Int32Array, target: number): number;

export function count_str(values: string[], target: string): number;

/**
 * Compute residuals for a counting process (start-stop) Cox model.
 *
 * # Arguments
 * * `input_json` - JSON object with:
 *   - start, stop, status, coef, covariates, type, method, weights, strata
 */
export function cox_residuals_counting_wasm(input_json: string): any;

/**
 * Compute Cox model residuals.
 *
 * # Arguments
 * * `time_json` - JSON array of event/censoring times
 * * `status_json` - JSON array of event indicators
 * * `coef_json` - JSON array of fitted coefficients
 * * `covariates_json` - JSON object mapping covariate names to arrays
 * * `options_json` - optional: method, type (mart/score/scho/deviance/dfbeta/dfbetas),
 *                    weights, offset, var (variance matrix for dfbeta/dfbetas)
 */
export function cox_residuals_wasm(
  time_json: string,
  status_json: string,
  coef_json: string,
  covariates_json: string,
  options_json?: string | null,
): any;

/**
 * Proportional hazards test (cox.zph).
 */
export function cox_zph_wasm(
  time_json: string,
  status_json: string,
  coef_json: string,
  covariates_json: string,
  options_json?: string | null,
): any;

/**
 * Fit a Cox proportional hazards model to counting process (start-stop) data.
 *
 * # Arguments
 * * `input_json` - JSON object with:
 *   - start: entry times
 *   - stop: exit times
 *   - status: event indicators (0/1)
 *   - covariates: covariate name→values map
 *   - method: "breslow" or "efron" (default "efron")
 *   - maxiter: max iterations (default 25)
 *   - eps: convergence tolerance (default 1e-9)
 */
export function coxph_counting_wasm(input_json: string): any;

/**
 * Fit a Cox proportional hazards model.
 *
 * # Arguments
 * * `time_json` - JSON array of event/censoring times
 * * `status_json` - JSON array of event indicators (1=event, 0=censored)
 * * `covariates_json` - JSON object mapping covariate names to arrays
 * * `options_json` - JSON object with optional params: method, maxiter, eps, weights, offset
 */
export function coxph_wasm(
  time_json: string,
  status_json: string,
  covariates_json: string,
  options_json?: string | null,
): any;

/**
 * Cross join (Cartesian product) - returns u32 indices
 */
export function cross_join_u32(left_len: number, right_len: number): JoinIdxU32;

/**
 * WASM export for D'Agostino-Pearson K² normality test
 */
export function dagostino_pearson_test(x: Float64Array, alpha: number): any;

/**
 * Ultra-optimized distinct using direct typed arrays - exactly like test_ultra_optimized_distinct.rs
 */
export function distinct_rows_generic_typed(
  column_data: Uint32Array[],
  view_index: Uint32Array,
): Uint32Array;

/**
 * WASM export for Dunn's test
 */
export function dunn_test_wasm(
  data: Float64Array,
  group_sizes: Uint32Array,
  alpha: number,
): any;

/**
 * Fine-Gray competing risks data transformation.
 *
 * Ports the full R `finegray()` function including:
 * - Censoring distribution G(t) via Kaplan-Meier
 * - Truncation distribution H(t) for delayed entry (Geskus 2011)
 * - Per-stratum processing
 * - Interval expansion via the core C algorithm
 *
 * # Input JSON format
 *
 * ```json
 * {
 *   "tstart": [0, 0, ...],       // entry times (all 0 for right-censored)
 *   "tstop": [1, 2, 3, ...],     // exit times
 *   "status": [1, 2, 0, ...],    // 0=censor, 1..k=event types
 *   "etype": 1,                   // event type of interest (1-based, default 1)
 *   "strata": [0, 0, 1, ...],    // optional stratum indicators
 *   "id": [1, 1, 2, 2, ...],     // optional subject IDs (required for counting process)
 *   "weights": [1, 1, ...],      // optional case weights
 *   "counting": false             // true if (start, stop] data
 * }
 * ```
 */
export function finegray_wasm(input_json: string): any;

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
): any;

/**
 * WASM export for Games-Howell test
 */
export function games_howell_wasm(
  data: Float64Array,
  group_sizes: Uint32Array,
  alpha: number,
): any;

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
): any;

/**
 * GLM confint() - Compute confidence intervals for coefficients
 */
export function glm_confint_wasm(result: any, level: number): any;

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
 * JsValue containing the fitted GLM result
 */
export function glm_fit_wasm(
  formula: string,
  family_name: string,
  link_name: string,
  data_json: string,
  options_json?: string | null,
): any;

/**
 * WASM export for influence measures
 *
 * Returns influence() measures (dfbeta, dfbetas, dffits, covratio, cook's distance)
 */
export function glm_influence_wasm(result: any): any;

/**
 * GLM predict() - Make predictions on new data
 */
export function glm_predict_wasm(
  result: any,
  newdata: any,
  pred_type: string,
): any;

/**
 * WASM export for standardized residuals
 *
 * Returns rstandard() values
 */
export function glm_rstandard_wasm(result: any, residual_type: string): any;

/**
 * WASM export for studentized residuals
 *
 * Returns rstudent() values
 */
export function glm_rstudent_wasm(result: any): any;

/**
 * WASM export for GLM summary
 *
 * Returns coefficient table with test statistics and p-values
 */
export function glm_summary_wasm(result: any): any;

/**
 * WASM export for clustered robust covariance matrix (sandwich::vcovCL)
 *
 * Accepts a JSON string with the specific fields needed by the sandwich
 * estimator, avoiding circular reference issues in the full GlmResult.
 */
export function glm_vcov_cl_wasm(
  sandwich_input_json: string,
  cluster: any,
  hc_type: string,
  cadjust: boolean,
  fix: boolean,
): any;

/**
 * WASM export for GLMM fitting
 *
 * Fits a generalized linear mixed model using the provided formula and data.
 *
 * # Arguments
 * * `formula` - Fixed effects formula as string (e.g., "y ~ x1 + x2")
 * * `random_effects_json` - JSON array of random effect specifications
 * * `family_name` - Name of the family ("gaussian", "binomial", "poisson", etc.)
 * * `link_name` - Name of the link function ("identity", "logit", "log", etc.)
 * * `data_json` - JSON string containing the data as an object with column names as keys
 * * `options_json` - JSON string containing optional parameters
 *
 * # Returns
 * JsValue containing the fitted GLMM result
 */
export function glmm_fit_wasm(
  formula: string,
  random_effects_json: string,
  family_name: string,
  link_name: string,
  data_json: string,
  options_json?: string | null,
): any;

/**
 * Perform grouping in a single pass, returning all necessary data
 */
export function group_ids_codes_all(
  keys_codes: Uint32Array,
  n_rows: number,
  n_key_cols: number,
): Grouping;

/**
 * Ultra-optimized inner join using shared utilities and specialized kernels
 */
export function inner_join_typed_multi_u32(
  left_columns: Uint32Array[],
  right_columns: Uint32Array[],
): JoinIdxU32;

/**
 * WASM export for IQR calculation
 */
export function iqr_wasm(data: Float64Array): number;

export function kendall_correlation_test(
  x: Float64Array,
  y: Float64Array,
  alternative: string,
  alpha: number,
  exact?: boolean | null,
): any;

/**
 * WASM export for two-sample Kolmogorov-Smirnov test
 */
export function kolmogorov_smirnov_test_wasm(
  x: Float64Array,
  y: Float64Array,
  alternative: string,
  alpha: number,
): any;

/**
 * WASM export for one-sample Kolmogorov-Smirnov test against uniform distribution
 */
export function kolmogorov_smirnov_uniform_wasm(
  x: Float64Array,
  min: number,
  max: number,
  alternative: string,
  alpha: number,
): any;

/**
 * WASM export for Kruskal-Wallis test
 */
export function kruskal_wallis_test_wasm(
  data: Float64Array,
  group_sizes: Uint32Array,
  alpha: number,
): any;

export function left_join_typed_multi_u32(
  left_columns: Uint32Array[],
  right_columns: Uint32Array[],
): JoinIdxU32;

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
 * * `Result<JsValue, JsValue>` - Serialized result or error
 */
export function levene_test_wasm(
  data: Float64Array,
  group_sizes: Uint32Array,
  alpha: number,
): any;

/**
 * WASM export for Mann-Whitney U test (automatically chooses exact vs asymptotic)
 */
export function mann_whitney_test(
  x: Float64Array,
  y: Float64Array,
  alpha: number,
  alternative: string,
): any;

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
): any;

/**
 * WASM export for mean calculation
 */
export function mean_wasm(values: Float64Array): number;

/**
 * WASM export for median calculation
 */
export function median_wasm(data: Float64Array): number;

export function outer_join_typed_multi_u32(
  left_columns: Uint32Array[],
  right_columns: Uint32Array[],
): JoinIdxU32;

export function pearson_correlation_test(
  x: Float64Array,
  y: Float64Array,
  alternative: string,
  alpha: number,
): any;

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
 * WASM export for proportion sample size calculation
 */
export function proportion_sample_size_wasm(
  p1: number,
  p2: number,
  alpha: number,
  power: number,
): number;

/**
 * WASM export for one-sample proportion test (chi-square approach, matches R)
 */
export function proportion_test_one_sample(
  x: number,
  n: number,
  p0: number,
  alpha: number,
  alternative: string,
): any;

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
): any;

/**
 * WASM export for general quantile calculation
 * Uses R's Type 7 algorithm (default)
 */
export function quantile_wasm(
  data: Float64Array,
  probs: Float64Array,
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
 * Sum aggregation for f64 values
 */
export function reduce_sum_f64(
  gid_per_row: Uint32Array,
  vals: Float64Array,
  n_groups: number,
): Float64Array;

export function right_join_typed_multi_u32(
  left_columns: Uint32Array[],
  right_columns: Uint32Array[],
): JoinIdxU32;

/**
 * WASM export for Shapiro-Wilk normality test
 */
export function shapiro_wilk_test(x: Float64Array, alpha: number): any;

export function spearman_correlation_test(
  x: Float64Array,
  y: Float64Array,
  alternative: string,
  alpha: number,
): any;

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

/**
 * WASM export for sum calculation
 */
export function sum_wasm(values: Float64Array): number;

/**
 * Compute log-rank test (survdiff).
 *
 * # Arguments
 * * `time_json` - JSON array of event/censoring times
 * * `status_json` - JSON array of event indicators
 * * `group_json` - JSON array of group assignments (0-based integers)
 * * `options_json` - optional: rho, strata
 */
export function survdiff_wasm(
  time_json: string,
  status_json: string,
  group_json: string,
  options_json?: string | null,
): any;

/**
 * Compute survival curves from a fitted Cox model.
 *
 * Implements the R logic from `agsurv.R` + `coxsurv.fit` `expand()`:
 * - ctype=1 (Nelson-Aalen/Breslow): haz = nevent/nrisk_weighted
 * - ctype=2 (Efron): uses agsurv5 for tied deaths
 * - stype=1 (KP): product-limit via agsurv4
 * - stype=2 (exp): surv = exp(-cumhaz)
 *
 * # Arguments
 * * `input_json` - JSON object with:
 *   - time: event/censoring times
 *   - status: event indicators (0/1)
 *   - coef: fitted coefficients (empty array for null model)
 *   - covariates: covariate name→values map (empty for null model)
 *   - offset: offset terms (optional)
 *   - stype: 1=KP, 2=exp(-cumhaz) (default 2)
 *   - ctype: 1=Nelson-Aalen, 2=Efron (default 1)
 *   - censor: whether to include censoring times in output (default true)
 *   - newx: covariate values at which to predict (optional, for S(t|newx))
 *   - means: covariate means from fitted model (optional, for centering)
 *   - var: variance-covariance matrix from fitted model (fit$var, optional, for variance)
 */
export function survfit_cox_wasm(input_json: string): any;

/**
 * Compute Kaplan-Meier survival curves.
 *
 * # Arguments
 * * `time_json` - JSON array of event/censoring times
 * * `status_json` - JSON array of event indicators (1=event, 0=censored)
 * * `options_json` - JSON with optional: groups (int[]), weights, stype, ctype
 */
export function survfit_km_wasm(
  time_json: string,
  status_json: string,
  options_json?: string | null,
): any;

/**
 * Split survival data at specified cut points.
 */
export function survsplit_wasm(
  tstart_json: string,
  tstop_json: string,
  cut_json: string,
): any;

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
 * WASM export for one-sample t-test
 */
export function t_test_one_sample(
  x: Float64Array,
  mu: number,
  alpha: number,
  alternative: string,
): any;

/**
 * WASM export for paired t-test
 */
export function t_test_paired(
  x: Float64Array,
  y: Float64Array,
  alpha: number,
  alternative: string,
): any;

/**
 * WASM export for independent two-sample t-test
 */
export function t_test_two_sample_independent(
  x: Float64Array,
  y: Float64Array,
  alpha: number,
  alternative: string,
  pooled: boolean,
): any;

/**
 * WASM export for target trial emulation.
 *
 * Runs the full pipeline in Rust: expand → weights → model → survival → hazard → bootstrap.
 *
 * # Arguments
 * * `config_json` - JSON string containing `TargetTrialConfig`
 * * `data_json` - JSON string containing `ColumnarData` (numeric + categorical columns)
 *
 * # Returns
 * JsValue containing the `TargetTrialResult`
 */
export function target_trial_wasm(config_json: string, data_json: string): any;

/**
 * WASM export for Tukey HSD test
 */
export function tukey_hsd_wasm(
  data: Float64Array,
  group_sizes: Uint32Array,
  alpha: number,
): any;

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
 * WASM export for binomial density function
 */
export function wasm_dbinom(
  x: number,
  size: number,
  prob: number,
  give_log: boolean,
): number;

/**
 * WASM export for chi-squared density function
 */
export function wasm_dchisq(x: number, df: number, give_log: boolean): number;

/**
 * WASM export for exponential density function
 */
export function wasm_dexp(x: number, rate: number, give_log: boolean): number;

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
 * WASM export for gamma density function
 */
export function wasm_dgamma(
  x: number,
  shape: number,
  rate: number,
  give_log: boolean,
): number;

/**
 * WASM export for geometric density function
 */
export function wasm_dgeom(x: number, prob: number, give_log: boolean): number;

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
 * WASM export for log-normal density function
 */
export function wasm_dlnorm(
  x: number,
  meanlog: number,
  sdlog: number,
  give_log: boolean,
): number;

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
 * WASM export for normal density function
 */
export function wasm_dnorm(
  x: number,
  mean: number,
  sd: number,
  give_log: boolean,
): number;

/**
 * WASM export for Poisson density function
 */
export function wasm_dpois(
  x: number,
  lambda: number,
  give_log: boolean,
): number;

/**
 * WASM export for t density function
 */
export function wasm_dt(x: number, df: number, give_log: boolean): number;

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
 * WASM export for Weibull density function
 */
export function wasm_dweibull(
  x: number,
  shape: number,
  scale: number,
  give_log: boolean,
): number;

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
 * WASM export for chi-squared cumulative distribution function
 */
export function wasm_pchisq(
  x: number,
  df: number,
  lower_tail: boolean,
  log_p: boolean,
): number;

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
 * WASM export for geometric cumulative distribution function
 */
export function wasm_pgeom(
  x: number,
  prob: number,
  lower_tail: boolean,
  log_p: boolean,
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
 * WASM export for Poisson cumulative distribution function
 */
export function wasm_ppois(
  x: number,
  lambda: number,
  lower_tail: boolean,
  log_p: boolean,
): number;

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
 * WASM export for chi-squared quantile function
 */
export function wasm_qchisq(
  p: number,
  df: number,
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
 * WASM export for geometric quantile function
 */
export function wasm_qgeom(
  p: number,
  prob: number,
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
 * WASM export for Poisson quantile function
 */
export function wasm_qpois(
  p: number,
  lambda: number,
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
 * WASM export for beta random number generation
 */
export function wasm_rbeta(shape1: number, shape2: number): number;

/**
 * WASM export for binomial random number generation
 */
export function wasm_rbinom(size: number, prob: number): number;

/**
 * WASM export for chi-squared random number generation
 */
export function wasm_rchisq(df: number): number;

/**
 * WASM export for exponential random number generation
 */
export function wasm_rexp(rate: number): number;

/**
 * WASM export for F distribution random number generation
 */
export function wasm_rf(df1: number, df2: number): number;

/**
 * WASM export for gamma random number generation
 */
export function wasm_rgamma(shape: number, rate: number): number;

/**
 * WASM export for geometric random number generation
 */
export function wasm_rgeom(prob: number): number;

/**
 * WASM export for hypergeometric random number generation
 */
export function wasm_rhyper(m: number, n: number, k: number): number;

/**
 * WASM export for log-normal random number generation
 */
export function wasm_rlnorm(meanlog: number, sdlog: number): number;

/**
 * WASM export for negative binomial random number generation
 */
export function wasm_rnbinom(r: number, prob: number): number;

/**
 * WASM export for normal random number generation
 */
export function wasm_rnorm(mean: number, sd: number): number;

/**
 * WASM export for Poisson random number generation
 */
export function wasm_rpois(lambda: number): number;

/**
 * WASM export for t distribution random number generation
 */
export function wasm_rt(df: number): number;

/**
 * WASM export for uniform random number generation
 */
export function wasm_runif(min: number, max: number): number;

/**
 * WASM export for Weibull random number generation
 */
export function wasm_rweibull(shape: number, scale: number): number;

/**
 * WASM export for Wilcoxon random number generation
 */
export function wasm_rwilcox(m: number, n: number): number;

export function wasm_test(): number;

/**
 * WASM export for Welch's ANOVA (unequal variances)
 */
export function welch_anova_wasm(
  data: Float64Array,
  group_sizes: Uint32Array,
  alpha: number,
): any;

/**
 * WASM export for Wilcoxon W test (paired)
 */
export function wilcoxon_w_test(
  x: Float64Array,
  y: Float64Array,
  alpha: number,
  alternative: string,
): any;

/**
 * WASM export for z-test sample size calculation
 */
export function z_sample_size_wasm(
  effect_size: number,
  alpha: number,
  power: number,
  test_type: string,
): number;

/**
 * WASM export for one-sample z-test
 */
export function z_test_one_sample(
  x: Float64Array,
  mu: number,
  sigma: number,
  alpha: number,
  alternative: string,
): any;

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
): any;
