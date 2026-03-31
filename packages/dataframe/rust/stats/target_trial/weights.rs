//! Inverse probability of censoring weights (IPCW).
//!
//! Ported from `SEQTaRget/R/internal_weights.R`.
//! Fits stabilized IPW via numerator/denominator logistic models,
//! with optional LTFU and visit attendance weight components.

use super::types::{AnalysisMethod, ColumnarData, TargetTrialConfig, WeightDiagnostics};
use crate::stats::regression::family::quasibinomial::QuasiBinomialFamily;
use crate::stats::regression::glm::glm_control::glm_control;
use crate::stats::regression::glm::glm_fit_core::glm_fit;
use crate::stats::regression::glm::multinomial::{multinomial_fit, multinomial_predict};
use crate::stats::regression::glm::types_results::GlmResult;

/// Result of a single binary or multinomial weight model.
#[derive(Debug, Clone)]
pub enum WeightModel {
    Binary(GlmResult),
    Multinomial(crate::stats::regression::glm::multinomial::MultinomialResult),
    /// Skipped because response has no variation
    Skip,
}

/// Computed weight columns and diagnostics.
pub struct WeightOutput {
    /// Numerator probabilities per row
    pub numerator: Vec<f64>,
    /// Denominator probabilities per row
    pub denominator: Vec<f64>,
    /// LTFU weight component (numerator/denominator), if computed
    pub cense: Option<Vec<f64>>,
    /// Visit weight component (numerator/denominator), if computed
    pub visit: Option<Vec<f64>>,
    /// Numerator model coefficients per treatment level
    pub numerator_coefs: Vec<Vec<f64>>,
    /// Denominator model coefficients per treatment level
    pub denominator_coefs: Vec<Vec<f64>>,
}

/// Build a design matrix from column names in the data.
///
/// Returns (X matrix as row-major Vec<Vec<f64>>, column names).
/// Automatically prepends an intercept column.
pub fn build_design_matrix(
    data: &ColumnarData,
    col_names: &[String],
    rows: Option<&[usize]>,
) -> Result<Vec<Vec<f64>>, String> {
    let n = rows.map_or(data.nrows, |r| r.len());
    if n == 0 {
        return Err("No rows to build design matrix from".to_string());
    }

    let n_cols = col_names.len();
    let mut x = vec![vec![0.0; n_cols + 1]; n]; // +1 for intercept

    for (i, row_idx) in rows
        .map(|r| r.iter().cloned().collect::<Vec<_>>())
        .unwrap_or_else(|| (0..data.nrows).collect())
        .iter()
        .enumerate()
    {
        x[i][0] = 1.0; // intercept
        for (j, col_name) in col_names.iter().enumerate() {
            if let Some(col) = data.get_numeric(col_name) {
                x[i][j + 1] = col[*row_idx];
            } else {
                return Err(format!("Column '{}' not found in numeric data", col_name));
            }
        }
    }

    Ok(x)
}

/// Parse a simple additive formula string into column names.
///
/// E.g., "x1 + x2 + x3" → ["x1", "x2", "x3"]
/// Does NOT handle interactions, ns(), bs(), factor(), etc.
pub fn parse_simple_formula(formula: &str) -> Vec<String> {
    formula
        .split('+')
        .map(|s| s.trim().to_string())
        .filter(|s| !s.is_empty())
        .collect()
}

/// Build a design matrix with factor encoding and interaction support.
///
/// Implements R's `model.matrix()` behavior:
/// - Factor columns are expanded to k-1 dummy columns (reference level dropped)
/// - Interaction terms (`:`) create product columns
/// - `a*b` is expanded to `a + b + a:b` by the formula parser before reaching here
///
/// Returns (X matrix row-major with intercept, expanded_column_names).
pub fn build_design_matrix_v2(
    data: &ColumnarData,
    terms: &[super::glm_helpers::FormulaTerm],
    rows: Option<&[usize]>,
) -> Result<(Vec<Vec<f64>>, Vec<String>), String> {
    use super::glm_helpers::FormulaTerm;

    let n = rows.map_or(data.nrows, |r| r.len());
    if n == 0 {
        return Err("No rows to build design matrix from".to_string());
    }

    let row_indices: Vec<usize> = rows
        .map(|r| r.to_vec())
        .unwrap_or_else(|| (0..data.nrows).collect());

    // Expand each term into (column_values, column_names)
    let mut all_cols: Vec<Vec<f64>> = Vec::new();
    let mut all_names: Vec<String> = Vec::new();

    for term in terms {
        match term {
            FormulaTerm::Main(col) => {
                let (cols, names) = expand_single_term(data, col, &row_indices)?;
                // Deduplicate: skip columns already added
                for (c, name) in cols.into_iter().zip(names.into_iter()) {
                    if !all_names.contains(&name) {
                        all_cols.push(c);
                        all_names.push(name);
                    }
                }
            }
            FormulaTerm::Interaction(parts) => {
                let mut part_expansions: Vec<(Vec<Vec<f64>>, Vec<String>)> = Vec::new();
                for part in parts {
                    let expansion = expand_single_term(data, part, &row_indices)?;
                    part_expansions.push(expansion);
                }
                let (interaction_cols, interaction_names) =
                    cross_product_terms(&part_expansions, n);
                for (c, name) in interaction_cols.into_iter().zip(interaction_names.into_iter()) {
                    if !all_names.contains(&name) {
                        all_cols.push(c);
                        all_names.push(name);
                    }
                }
            }
        }
    }

    // Build matrix: intercept + all_cols
    let n_cols = all_cols.len();
    let mut x = vec![vec![0.0; n_cols + 1]; n];
    for i in 0..n {
        x[i][0] = 1.0; // intercept
        for j in 0..n_cols {
            x[i][j + 1] = all_cols[j][i];
        }
    }

    Ok((x, all_names))
}

/// Expand a single column term into one or more columns.
///
/// - Factor column with levels ["0", "1"]: returns 1 dummy column (level "1"),
///   named `{col}1`.
/// - Factor column with levels ["0", "1", "2"]: returns 2 dummy columns,
///   named `{col}1`, `{col}2`.
/// - Numeric column: returns 1 column, named `{col}`.
fn expand_single_term(
    data: &ColumnarData,
    col: &str,
    row_indices: &[usize],
) -> Result<(Vec<Vec<f64>>, Vec<String>), String> {
    let n = row_indices.len();

    if let Some(factor_info) = data.factors.get(col) {
        // Factor encoding: create dummy for each non-reference level
        let raw = data
            .get_numeric(col)
            .ok_or_else(|| format!("Factor column '{}' not found in numeric data", col))?;

        let mut cols = Vec::new();
        let mut names = Vec::new();

        for (level_idx, level) in factor_info.levels.iter().enumerate() {
            if level_idx == factor_info.reference {
                continue; // Skip reference level
            }
            let level_val: f64 = level.parse().unwrap_or(0.0);
            let dummy: Vec<f64> = row_indices
                .iter()
                .map(|&i| {
                    if (raw[i] - level_val).abs() < 1e-10 {
                        1.0
                    } else {
                        0.0
                    }
                })
                .collect();
            cols.push(dummy);
            names.push(format!("{}{}", col, level));
        }

        if cols.is_empty() {
            // Single-level factor: just pass through as numeric
            let vals: Vec<f64> = row_indices.iter().map(|&i| raw[i]).collect();
            return Ok((vec![vals], vec![col.to_string()]));
        }

        Ok((cols, names))
    } else {
        // Numeric passthrough
        let raw = data
            .get_numeric(col)
            .ok_or_else(|| format!("Column '{}' not found in numeric data", col))?;
        let vals: Vec<f64> = row_indices.iter().map(|&i| raw[i]).collect();
        Ok((vec![vals], vec![col.to_string()]))
    }
}

/// Compute cross-product of expanded terms for interaction columns.
///
/// For [([col_a1, col_a2], ["a1","a2"]), ([col_b], ["b"])]:
/// Returns ([a1*b, a2*b], ["a1:b", "a2:b"])
fn cross_product_terms(
    parts: &[(Vec<Vec<f64>>, Vec<String>)],
    n: usize,
) -> (Vec<Vec<f64>>, Vec<String>) {
    if parts.is_empty() {
        return (Vec::new(), Vec::new());
    }

    let mut result_cols = parts[0].0.clone();
    let mut result_names = parts[0].1.clone();

    for part in parts.iter().skip(1) {
        let (ref other_cols, ref other_names) = *part;
        let mut new_cols = Vec::new();
        let mut new_names = Vec::new();

        for (i, left_col) in result_cols.iter().enumerate() {
            for (j, right_col) in other_cols.iter().enumerate() {
                let product: Vec<f64> =
                    (0..n).map(|k| left_col[k] * right_col[k]).collect();
                new_cols.push(product);
                new_names.push(format!("{}:{}", result_names[i], other_names[j]));
            }
        }

        result_cols = new_cols;
        result_names = new_names;
    }

    (result_cols, result_names)
}

/// Predict from a fitted weight model.
///
/// For binary models: returns predicted response probabilities.
/// For multinomial models: returns probability of the target class.
fn predict_weight_model(
    model: &WeightModel,
    x: &[Vec<f64>],
    target: Option<&str>,
) -> Result<Vec<f64>, String> {
    match model {
        WeightModel::Binary(glm_result) => {
            // logistic response: 1 / (1 + exp(-eta))
            let n = x.len();
            let mut preds = vec![0.0; n];
            for (i, row) in x.iter().enumerate() {
                let eta: f64 = row
                    .iter()
                    .zip(glm_result.coefficients.iter())
                    .map(|(xv, cv)| xv * cv)
                    .sum();
                preds[i] = 1.0 / (1.0 + (-eta).exp());
            }
            Ok(preds)
        }
        WeightModel::Multinomial(multi_result) => {
            let target_class =
                target.ok_or_else(|| "target required for multinomial prediction".to_string())?;
            let probs = multinomial_predict(multi_result, x, Some(target_class))?;
            Ok(probs.into_iter().map(|row| row[0]).collect())
        }
        WeightModel::Skip => {
            Ok(vec![1.0; x.len()])
        }
    }
}

/// Fit a single weight model (binary or multinomial).
fn fit_weight_model(
    x: Vec<Vec<f64>>,
    y: Vec<f64>,
    multinomial: bool,
    y_labels: Option<&[String]>,
) -> Result<WeightModel, String> {
    // Check if response has variation
    let y_unique: std::collections::HashSet<u64> =
        y.iter().map(|v| v.to_bits()).collect();
    if y_unique.len() < 2 {
        return Ok(WeightModel::Skip);
    }

    if multinomial {
        let labels = y_labels.ok_or("multinomial requires labels")?;
        let result = multinomial_fit(&x, labels)?;
        Ok(WeightModel::Multinomial(result))
    } else {
        let control = glm_control(None, None, None)?;
        let family: Box<dyn crate::stats::regression::family::GlmFamily> =
            Box::new(QuasiBinomialFamily::logit());
        let result = glm_fit(
            x, y, None, None, None, None, None, family, control, true, None,
        )?;
        Ok(WeightModel::Binary(result))
    }
}

/// Get row indices where a numeric column equals a given value.
fn rows_where_eq(data: &ColumnarData, col: &str, val: f64) -> Vec<usize> {
    if let Some(col_data) = data.get_numeric(col) {
        col_data
            .iter()
            .enumerate()
            .filter(|&(_, &v)| (v - val).abs() < 1e-10)
            .map(|(i, _)| i)
            .collect()
    } else {
        Vec::new()
    }
}

/// Get row indices where a categorical column equals a given value.
fn rows_where_cat_eq(data: &ColumnarData, col: &str, val: &str) -> Vec<usize> {
    if let Some(col_data) = data.get_categorical(col) {
        col_data
            .iter()
            .enumerate()
            .filter(|(_, v)| v.as_str() == val)
            .map(|(i, _)| i)
            .collect()
    } else {
        Vec::new()
    }
}

/// Create tx_lag column on model data.
///
/// Mirrors R's `internal.weights()` lines 21-48.
/// - Pre-expansion: `shift(treatment)` by id, first row filled to `treat_levels[0]`
/// - Post-expansion: `shift(treatment)` by (id, trial), first row filled from
///   baseline lag (pre-data's `shift(treatment)` by id)
fn create_tx_lag(
    model_data: &mut ColumnarData,
    pre_data: &ColumnarData,
    config: &TargetTrialConfig,
    preexpansion: bool,
) -> Result<(), String> {
    let treatment_col = model_data
        .get_numeric(&config.treatment)
        .ok_or_else(|| format!("Treatment column '{}' not found", config.treatment))?
        .clone();

    let n = model_data.nrows;
    let first_level = config.treat_levels[0];

    if preexpansion {
        // R lines 44-48: shift(treatment) by id, first row per id = treat_levels[0]
        let id_col = model_data.get_numeric(&config.id)
            .ok_or("ID column not found")?;
        let time_col = model_data.get_numeric(&config.time)
            .ok_or_else(|| format!("Time column '{}' not found", config.time))?;

        let mut tx_lag = vec![first_level; n];
        // Data should be sorted by (id, time). Within each id group, shift treatment.
        let mut i = 0;
        while i < n {
            let cur_id = id_col[i];
            // First row of each id group: tx_lag = treat_levels[0] (already set)
            // R: [get(params@time) == 0, tx_lag := treat_levels[0]]
            // But actually R does shift then overwrites time==0 rows. Let's be faithful:
            let group_start = i;
            i += 1;
            while i < n && (id_col[i] - cur_id).abs() < 1e-10 {
                tx_lag[i] = treatment_col[i - 1];
                i += 1;
            }
            // Overwrite rows where time == 0 with treat_levels[0]
            for j in group_start..i {
                if time_col[j].abs() < 1e-10 {
                    tx_lag[j] = first_level;
                }
            }
        }

        model_data.numeric.insert("tx_lag".to_string(), tx_lag);
    } else {
        // R lines 21-39: Post-expansion tx_lag creation
        // 1. Create baseline.lag from pre_data: shift(treatment) by id
        let pre_id = pre_data.get_numeric(&config.id).ok_or("ID not found in pre_data")?;
        let pre_time = pre_data.get_numeric(&config.time)
            .ok_or_else(|| format!("Time col '{}' not found in pre_data", config.time))?;
        let pre_treatment = pre_data.get_numeric(&config.treatment)
            .ok_or("Treatment not found in pre_data")?;

        // Build baseline lag lookup: (id, time) → tx_lag from pre_data
        // R: baseline.lag = data[, shift(treatment), by=id][first_row_per_id, tx_lag := treat_levels[0]]
        let mut baseline_lag_lookup: std::collections::HashMap<(u64, u64), f64> =
            std::collections::HashMap::new();
        {
            let mut pi = 0;
            let pre_n = pre_data.nrows;
            while pi < pre_n {
                let cur_id = pre_id[pi];
                let group_start = pi;
                pi += 1;
                while pi < pre_n && (pre_id[pi] - cur_id).abs() < 1e-10 {
                    pi += 1;
                }
                // Within this id group [group_start..pi), compute shift(treatment)
                for j in group_start..pi {
                    let lag_val = if j == group_start {
                        first_level
                    } else {
                        pre_treatment[j - 1]
                    };
                    // R: setnames(baseline.lag, 2, params@time) → renames time col to "period"
                    // So the key is (id, time_value) and it maps to period in expanded
                    baseline_lag_lookup.insert(
                        (pre_id[j].to_bits(), pre_time[j].to_bits()),
                        lag_val,
                    );
                }
            }
        }

        // 2. Create tx_lag on expanded data: shift(treatment) by (id, trial)
        let id_col = model_data.get_numeric(&config.id).ok_or("ID not found")?;
        let trial_col = model_data.get_numeric("trial").ok_or("trial not found")?;
        let followup_col = model_data.get_numeric("followup").ok_or("followup not found")?;
        let period_col = model_data.get_numeric("period").ok_or("period not found")?;

        let mut tx_lag = vec![first_level; n];
        {
            let mut i = 0;
            while i < n {
                let cur_id = id_col[i];
                let cur_trial = trial_col[i];
                let group_start = i;
                i += 1;
                while i < n
                    && (id_col[i] - cur_id).abs() < 1e-10
                    && (trial_col[i] - cur_trial).abs() < 1e-10
                {
                    tx_lag[i] = treatment_col[i - 1];
                    i += 1;
                }
                // tx_lag[group_start] is already first_level (default), but R sets it via shift
                // which gives NA for first row, then overwritten below.
            }
        }

        // 3. At followup==0, override tx_lag with baseline lag
        // R: weight[baseline.lag, on=c(id, period), tx_lag := fifelse(followup==0, i.tx_lag, tx_lag)]
        for i in 0..n {
            if followup_col[i].abs() < 1e-10 {
                let key = (id_col[i].to_bits(), period_col[i].to_bits());
                if let Some(&lag_val) = baseline_lag_lookup.get(&key) {
                    tx_lag[i] = lag_val;
                }
            }
        }

        model_data.numeric.insert("tx_lag".to_string(), tx_lag);
    }

    Ok(())
}

/// Compute IPCW weights for the expanded trial data.
///
/// Mirrors R's `internal.weights()`.
///
/// # Arguments
/// * `expanded` - Expanded trial data (post-SEQexpand)
/// * `pre_data` - Pre-expansion data (for pre-expansion weighting)
/// * `config` - Target trial configuration
///
/// # Returns
/// `WeightOutput` with numerator/denominator probabilities per row.
pub fn compute_weights(
    expanded: &ColumnarData,
    pre_data: &ColumnarData,
    config: &TargetTrialConfig,
) -> Result<WeightOutput, String> {
    let n = expanded.nrows;
    let mut numerator = vec![1.0; n];
    let mut denominator = vec![1.0; n];
    let mut numerator_coefs = Vec::new();
    let mut denominator_coefs = Vec::new();

    // For ITT, weights are all 1 (no treatment weighting needed)
    if config.method == AnalysisMethod::ITT {
        // But may still need LTFU / visit weights
        let cense = if config.ltfu {
            Some(compute_cense_weights(expanded, config)?)
        } else {
            None
        };
        let visit = if config.visit.is_some() {
            Some(compute_visit_weights(expanded, config)?)
        } else {
            None
        };
        return Ok(WeightOutput {
            numerator,
            denominator,
            cense,
            visit,
            numerator_coefs,
            denominator_coefs,
        });
    }

    // ── Setting up weight data (R lines 20-48) ──
    // Create model data with tx_lag column
    let mut weight_data = if config.weights.preexpansion {
        let mut wd = pre_data.clone();
        create_tx_lag(&mut wd, pre_data, config, true)?;
        // R line 47: add time_sq column
        let time_sq_name = format!("{}{}", config.time, config.indicator_squared);
        if !wd.has_column(&time_sq_name) {
            if let Some(time_col) = wd.get_numeric(&config.time).cloned() {
                let sq: Vec<f64> = time_col.iter().map(|v| v * v).collect();
                wd.add_numeric(time_sq_name, sq);
            }
        }
        wd
    } else {
        let mut wd = expanded.clone();
        create_tx_lag(&mut wd, pre_data, config, false)?;
        // R line 40: add period_sq column
        let period_sq_name = format!("period{}", config.indicator_squared);
        if !wd.has_column(&period_sq_name) {
            if let Some(period_col) = wd.get_numeric("period").cloned() {
                let sq: Vec<f64> = period_col.iter().map(|v| v * v).collect();
                wd.add_numeric(period_sq_name, sq);
            }
        }
        wd
    };

    // R line 42: if (excused | deviation.excused) weight[, isExcused := cumsum(ifelse(is.na(isExcused), 0, isExcused)), by = c(id, "trial")]
    if (config.excused || config.deviation.excused) && !config.weights.preexpansion {
        if let Some(exc_col) = weight_data.get_numeric("isExcused").cloned() {
            let id_col = weight_data.get_numeric(&config.id).ok_or("ID missing")?.clone();
            let trial_col = weight_data.get_numeric("trial").ok_or("trial missing")?.clone();
            let mut new_exc = vec![f64::NAN; weight_data.nrows];
            let mut idx = 0;
            while idx < weight_data.nrows {
                let cur_id = id_col[idx];
                let cur_trial = trial_col[idx];
                let group_start = idx;
                idx += 1;
                while idx < weight_data.nrows
                    && (id_col[idx] - cur_id).abs() < 1e-10
                    && (trial_col[idx] - cur_trial).abs() < 1e-10
                {
                    idx += 1;
                }
                let mut cumsum = 0.0;
                for row in group_start..idx {
                    let v = if exc_col[row].is_nan() { 0.0 } else { exc_col[row] };
                    cumsum += v;
                    new_exc[row] = cumsum;
                }
            }
            weight_data.add_numeric("isExcused".to_string(), new_exc);
        }
    }

    // ── Non-ITT model fitting (R lines 85-117) ──
    let num_formula = config
        .numerator
        .as_ref()
        .ok_or("numerator formula required for non-ITT analysis")?;
    let den_formula = config
        .denominator
        .as_ref()
        .ok_or("denominator formula required for non-ITT analysis")?;

    let num_terms = super::glm_helpers::parse_formula_terms(num_formula);
    let den_terms = super::glm_helpers::parse_formula_terms(den_formula);

    // R line 86-87: model.data <- weight
    // if (!weight.preexpansion & !(excused | deviation.excused)) model.data <- model.data[followup > 0, ]
    let all_model_rows: Vec<usize> = (0..weight_data.nrows).collect();
    let base_model_rows: Vec<usize> = if !config.weights.preexpansion
        && !(config.excused || config.deviation.excused)
    {
        weight_data
            .get_numeric("followup")
            .map(|f| {
                f.iter()
                    .enumerate()
                    .filter(|&(_, &v)| v > 0.5) // followup > 0
                    .map(|(i, _)| i)
                    .collect()
            })
            .unwrap_or_else(|| all_model_rows.clone())
    } else {
        all_model_rows.clone()
    };

    let tx_lag_col = weight_data.get_numeric("tx_lag").cloned();
    let treatment_col = weight_data
        .get_numeric(&config.treatment)
        .ok_or_else(|| format!("Treatment column '{}' not found", config.treatment))?
        .clone();

    // Determine multinomial usage
    // R: model.passer checks: multi = if (multinomial && !preexpansion && (excused || deviation.excused)) FALSE else multinomial
    let use_multi = config.multinomial
        && !(config.weights.preexpansion && (config.excused || config.deviation.excused));

    let mut numerator_models: Vec<WeightModel> = Vec::new();
    let mut denominator_models: Vec<WeightModel> = Vec::new();

    for (level_idx, &level) in config.treat_levels.iter().enumerate() {
        // R: eligible_col <- params@weight.eligible_cols[[i]]
        // level_data <- if (!is.na(eligible_col)) model.data[get(eligible_col) == 1, ] else model.data
        let eligible_col = config.weights.eligible_cols.get(level_idx).cloned().unwrap_or_default();
        let level_base_rows: Vec<usize> = if !eligible_col.is_empty() {
            if let Some(ecol) = weight_data.get_numeric(&eligible_col) {
                base_model_rows.iter()
                    .filter(|&&i| (ecol[i] - 1.0).abs() < 1e-10)
                    .cloned()
                    .collect()
            } else {
                base_model_rows.clone()
            }
        } else {
            base_model_rows.clone()
        };

        // ── Numerator model (R lines 96-103) ──
        // Skip if (excused | deviation.excused) & preexpansion
        let skip_numerator = (config.excused || config.deviation.excused) && config.weights.preexpansion;

        if !skip_numerator {
            // R: prepare.data_cached(level_data, params, "numerator", level, "default", cache)
            // For default+numerator: if lag_condition, filter tx_lag == level
            // If excused, filter excused_col == 0
            let num_rows = filter_for_prepare_data(
                &level_base_rows,
                &weight_data,
                config,
                &tx_lag_col,
                level,
                level_idx,
                "numerator",
            );

            let y_num: Vec<f64> = get_response_y(&weight_data, config, &num_rows);

            if num_rows.is_empty() || y_unique_count(&y_num) < 2 {
                numerator_models.push(WeightModel::Skip);
            } else {
                let (x_num, _) = build_design_matrix_v2(&weight_data, &num_terms, Some(&num_rows))?;
                let y_labels: Option<Vec<String>> = if use_multi {
                    Some(y_num.iter().map(|v| format!("{}", *v as i64)).collect())
                } else {
                    None
                };
                numerator_models.push(fit_weight_model(x_num, y_num, use_multi, y_labels.as_deref())?);
            }
        } else {
            numerator_models.push(WeightModel::Skip);
        }

        // ── Denominator model (R lines 107-113) ──
        // R: prepare.data_cached(level_data, params, "denominator", level, "default", cache)
        // For default+denominator: if lag_condition, filter tx_lag == level
        // if !preexpansion: additionally filter followup != 0
        // if excused: filter excused_col == 0
        let den_rows = filter_for_prepare_data(
            &level_base_rows,
            &weight_data,
            config,
            &tx_lag_col,
            level,
            level_idx,
            "denominator",
        );

        let y_den: Vec<f64> = get_response_y(&weight_data, config, &den_rows);

        if den_rows.is_empty() || y_unique_count(&y_den) < 2 {
            denominator_models.push(WeightModel::Skip);
        } else {
            let (x_den, _) = build_design_matrix_v2(&weight_data, &den_terms, Some(&den_rows))?;
            let y_labels: Option<Vec<String>> = if use_multi {
                Some(y_den.iter().map(|v| format!("{}", *v as i64)).collect())
            } else {
                None
            };
            denominator_models.push(fit_weight_model(x_den, y_den, use_multi, y_labels.as_deref())?);
        }
    }

    // Store coefficients
    for model in &numerator_models {
        match model {
            WeightModel::Binary(r) => numerator_coefs.push(r.coefficients.clone()),
            _ => numerator_coefs.push(Vec::new()),
        }
    }
    for model in &denominator_models {
        match model {
            WeightModel::Binary(r) => denominator_coefs.push(r.coefficients.clone()),
            _ => denominator_coefs.push(Vec::new()),
        }
    }

    // ── Estimating (R lines 119-181) ──
    // Predict and assign numerator/denominator per row
    // R: out[tx_lag == level, numerator := inline.pred(...)]
    let out_tx_lag = weight_data.get_numeric("tx_lag")
        .ok_or("tx_lag not found after creation")?;
    let out_treatment = weight_data.get_numeric(&config.treatment)
        .ok_or("Treatment not found")?;

    if !(config.excused || config.deviation.excused) {
        // R lines 123-141: non-excused prediction
        for (level_idx, &level) in config.treat_levels.iter().enumerate() {
            let target_str = format!("{}", level as i64);

            if matches!(numerator_models[level_idx], WeightModel::Skip)
                || matches!(denominator_models[level_idx], WeightModel::Skip)
            {
                // R: out[tx_lag == level, `:=`(numerator = 1, denominator = 1)]
                for i in 0..weight_data.nrows {
                    if (out_tx_lag[i] - level).abs() < 1e-10 {
                        numerator[i] = 1.0;
                        denominator[i] = 1.0;
                    }
                }
            } else {
                // Predict on rows where tx_lag == level
                let pred_rows: Vec<usize> = (0..weight_data.nrows)
                    .filter(|&i| (out_tx_lag[i] - level).abs() < 1e-10)
                    .collect();

                if !pred_rows.is_empty() {
                    let (x_num, _) = build_design_matrix_v2(&weight_data, &num_terms, Some(&pred_rows))?;
                    let (x_den, _) = build_design_matrix_v2(&weight_data, &den_terms, Some(&pred_rows))?;

                    let num_preds = predict_weight_model(
                        &numerator_models[level_idx], &x_num,
                        if use_multi { Some(&target_str) } else { None },
                    )?;
                    let den_preds = predict_weight_model(
                        &denominator_models[level_idx], &x_den,
                        if use_multi { Some(&target_str) } else { None },
                    )?;

                    for (j, &row_idx) in pred_rows.iter().enumerate() {
                        numerator[row_idx] = num_preds[j];
                        denominator[row_idx] = den_preds[j];
                    }

                    // R lines 133-139: flip (1-p) based on treatment matching
                    for &row_idx in &pred_rows {
                        let tx_val = out_treatment[row_idx];
                        if level_idx == 0 {
                            if (tx_val - level).abs() < 1e-10 {
                                numerator[row_idx] = 1.0 - numerator[row_idx];
                                denominator[row_idx] = 1.0 - denominator[row_idx];
                            }
                        } else {
                            if (tx_val - level).abs() >= 1e-10 {
                                numerator[row_idx] = 1.0 - numerator[row_idx];
                                denominator[row_idx] = 1.0 - denominator[row_idx];
                            }
                        }
                    }
                }
            }
        }
    } else {
        // R lines 142-179: excused prediction
        // Denominator prediction
        let exc_multi = if config.multinomial && !config.weights.preexpansion {
            false
        } else {
            config.multinomial
        };

        for (level_idx, &level) in config.treat_levels.iter().enumerate() {
            let target_str = format!("{}", level as i64);
            let excused_col_name = if config.excused {
                config.excused_cols.get(level_idx).cloned().flatten()
            } else {
                config.deviation.excused_cols.get(level_idx).cloned().flatten()
            };

            if let Some(ref col_name) = excused_col_name {
                if let Some(exc_col) = weight_data.get_numeric(col_name) {
                    // R: out[tx_lag == level & get(col) != 1, denominator := inline.pred(...)]
                    let pred_rows: Vec<usize> = (0..weight_data.nrows)
                        .filter(|&i| {
                            (out_tx_lag[i] - level).abs() < 1e-10
                                && (exc_col[i] - 1.0).abs() > 1e-10
                        })
                        .collect();

                    if !pred_rows.is_empty() && !matches!(denominator_models[level_idx], WeightModel::Skip) {
                        let (x_den, _) = build_design_matrix_v2(&weight_data, &den_terms, Some(&pred_rows))?;
                        let den_preds = predict_weight_model(
                            &denominator_models[level_idx], &x_den,
                            if exc_multi { Some(&target_str) } else { None },
                        )?;
                        for (j, &row_idx) in pred_rows.iter().enumerate() {
                            denominator[row_idx] = den_preds[j];
                        }
                    }

                    // R: flip (1-p) for matching/non-matching treatment, only where excused_col == 0
                    for i in 0..weight_data.nrows {
                        if (out_tx_lag[i] - level).abs() < 1e-10 && exc_col[i].abs() < 1e-10 {
                            if level_idx == 0 {
                                if (out_treatment[i] - level).abs() < 1e-10 {
                                    denominator[i] = 1.0 - denominator[i];
                                }
                            } else {
                                if (out_treatment[i] - level).abs() >= 1e-10 {
                                    denominator[i] = 1.0 - denominator[i];
                                }
                            }
                        }
                    }
                }
            }
        }

        // Numerator prediction for excused
        if config.weights.preexpansion {
            // R line 166: out[, numerator := 1]
            // Already initialized to 1.0
        } else {
            let exc_multi2 = if config.multinomial && !config.weights.preexpansion {
                false
            } else {
                config.multinomial
            };

            for (level_idx, &level) in config.treat_levels.iter().enumerate() {
                let target_str = format!("{}", level as i64);
                let excused_col_name = if config.excused {
                    config.excused_cols.get(level_idx).cloned().flatten()
                } else {
                    config.deviation.excused_cols.get(level_idx).cloned().flatten()
                };

                if let Some(ref col_name) = excused_col_name {
                    if let Some(exc_col) = weight_data.get_numeric(col_name) {
                        // R: out[get(treatment) == level & get(col) == 0, numerator := inline.pred(...)]
                        let pred_rows: Vec<usize> = (0..weight_data.nrows)
                            .filter(|&i| {
                                (out_treatment[i] - level).abs() < 1e-10
                                    && exc_col[i].abs() < 1e-10
                            })
                            .collect();

                        if !pred_rows.is_empty() && !matches!(numerator_models[level_idx], WeightModel::Skip) {
                            let (x_num, _) = build_design_matrix_v2(&weight_data, &num_terms, Some(&pred_rows))?;
                            let num_preds = predict_weight_model(
                                &numerator_models[level_idx], &x_num,
                                if exc_multi2 { Some(&target_str) } else { None },
                            )?;
                            for (j, &row_idx) in pred_rows.iter().enumerate() {
                                numerator[row_idx] = num_preds[j];
                            }
                        }
                    }
                }
            }
            // R line 178: out[get(treatment) == treat_levels[0], numerator := 1 - numerator]
            let first_level = config.treat_levels[0];
            for i in 0..weight_data.nrows {
                if (out_treatment[i] - first_level).abs() < 1e-10 {
                    numerator[i] = 1.0 - numerator[i];
                }
            }
        }
    }

    // ── Map predictions back to expanded data if pre-expansion ──
    // For pre-expansion, we predicted on pre_data (weight_data), but need weights
    // aligned to expanded data rows. Map via (id, time→period).
    if config.weights.preexpansion {
        let pre_id = weight_data.get_numeric(&config.id).ok_or("ID missing in weight_data")?;
        let pre_time = weight_data.get_numeric(&config.time)
            .ok_or_else(|| format!("Time col '{}' missing in weight_data", config.time))?;

        // Build lookup: (id, time) → (numerator, denominator)
        let mut pred_lookup: std::collections::HashMap<(u64, u64), (f64, f64)> =
            std::collections::HashMap::new();
        for i in 0..weight_data.nrows {
            let key = (pre_id[i].to_bits(), pre_time[i].to_bits());
            pred_lookup.insert(key, (numerator[i], denominator[i]));
        }

        // Map to expanded rows
        let exp_id = expanded.get_numeric(&config.id).ok_or("ID missing in expanded")?;
        let exp_period = expanded.get_numeric("period").ok_or("period missing in expanded")?;

        let mut exp_numerator = vec![1.0; n];
        let mut exp_denominator = vec![1.0; n];
        for i in 0..n {
            let key = (exp_id[i].to_bits(), exp_period[i].to_bits());
            if let Some(&(np, dp)) = pred_lookup.get(&key) {
                exp_numerator[i] = np;
                exp_denominator[i] = dp;
            }
        }
        numerator = exp_numerator;
        denominator = exp_denominator;
    }

    // Compute LTFU and visit weight components
    let cense = if config.ltfu {
        Some(compute_cense_weights(expanded, config)?)
    } else {
        None
    };
    let visit = if config.visit.is_some() {
        Some(compute_visit_weights(expanded, config)?)
    } else {
        None
    };

    Ok(WeightOutput {
        numerator,
        denominator,
        cense,
        visit,
        numerator_coefs,
        denominator_coefs,
    })
}

/// Filter rows for prepare.data_cached, matching R's row selection logic.
///
/// For case="default":
/// - If lag_condition: filter tx_lag == level (or tx_bas == level for excused numerator)
/// - If type=="denominator" && !preexpansion: filter followup != 0
/// - If excused: filter excused_col == 0
fn filter_for_prepare_data(
    base_rows: &[usize],
    data: &ColumnarData,
    config: &TargetTrialConfig,
    tx_lag_col: &Option<Vec<f64>>,
    level: f64,
    level_idx: usize,
    model_type: &str,
) -> Vec<usize> {
    let tx_bas_name = format!("{}{}", config.treatment, config.indicator_baseline);

    let mut rows: Vec<usize> = base_rows.to_vec();

    // R: if (params@weight.lag_condition)
    if config.weights.lag_condition {
        if model_type == "numerator" && config.excused {
            // R: weight[get(cache$tx_bas) == model] — filter by tx_bas for excused numerator
            if let Some(tx_bas_col) = data.get_numeric(&tx_bas_name) {
                rows.retain(|&i| (tx_bas_col[i] - level).abs() < 1e-10);
            }
        } else {
            // R: weight[tx_lag == model]
            if let Some(lag) = tx_lag_col {
                rows.retain(|&i| (lag[i] - level).abs() < 1e-10);
            }
        }
    }

    // R: if (type == "denominator" && !params@weight.preexpansion) weight <- weight[followup != 0L]
    if model_type == "denominator" && !config.weights.preexpansion {
        if let Some(followup) = data.get_numeric("followup") {
            rows.retain(|&i| followup[i].abs() > 1e-10);
        }
    }

    // R: if (params@excused) { excused_col <- params@excused.cols[[target]]; weight <- weight[get(excused_col) == 0L] }
    if config.excused {
        if let Some(Some(excused_col_name)) = config.excused_cols.get(level_idx) {
            if let Some(exc_col) = data.get_numeric(excused_col_name) {
                rows.retain(|&i| exc_col[i].abs() < 1e-10);
            }
        }
    }

    rows
}

/// Get response variable y for weight model fitting.
///
/// R: if (!preexpansion && (excused || deviation.excused)) → censored column
///    else → treatment column
fn get_response_y(data: &ColumnarData, config: &TargetTrialConfig, rows: &[usize]) -> Vec<f64> {
    if !config.weights.preexpansion && (config.excused || config.deviation.excused) {
        if let Some(censored) = data.get_numeric("censored") {
            return rows.iter().map(|&i| censored[i]).collect();
        }
    }
    if let Some(treatment) = data.get_numeric(&config.treatment) {
        rows.iter().map(|&i| treatment[i]).collect()
    } else {
        vec![0.0; rows.len()]
    }
}

/// Count unique values in y
fn y_unique_count(y: &[f64]) -> usize {
    let set: std::collections::HashSet<u64> = y.iter().map(|v| v.to_bits()).collect();
    set.len()
}

/// Compute LTFU (loss-to-followup) censoring weight component.
///
/// Returns numerator/denominator ratio for each row.
fn compute_cense_weights(
    data: &ColumnarData,
    config: &TargetTrialConfig,
) -> Result<Vec<f64>, String> {
    let cense_col = config
        .cense
        .as_ref()
        .ok_or("cense column required for LTFU weights")?;

    let cense_data = data
        .get_numeric(cense_col)
        .ok_or_else(|| format!("Cense column '{}' not found", cense_col))?;

    // Filter rows where cense is not NaN
    let valid_rows: Vec<usize> = cense_data
        .iter()
        .enumerate()
        .filter(|(_, v)| !v.is_nan())
        .map(|(i, _)| i)
        .collect();

    let num_formula = config
        .cense_numerator
        .as_ref()
        .ok_or("cense_numerator formula required for LTFU")?;
    let den_formula = config
        .cense_denominator
        .as_ref()
        .ok_or("cense_denominator formula required for LTFU")?;

    let num_terms = super::glm_helpers::parse_formula_terms(num_formula);
    let den_terms = super::glm_helpers::parse_formula_terms(den_formula);

    // Response: abs(cense - 1) → 1 if not censored, 0 if censored
    let y: Vec<f64> = valid_rows
        .iter()
        .map(|&i| (cense_data[i] - 1.0).abs())
        .collect();

    let (x_num, _) = build_design_matrix_v2(data, &num_terms, Some(&valid_rows))?;
    let (x_den, _) = build_design_matrix_v2(data, &den_terms, Some(&valid_rows))?;

    let num_model = fit_weight_model(x_num, y.clone(), false, None)?;
    let den_model = fit_weight_model(x_den, y, false, None)?;

    // Predict for all rows
    let (x_all_num, _) = build_design_matrix_v2(data, &num_terms, None)?;
    let (x_all_den, _) = build_design_matrix_v2(data, &den_terms, None)?;

    let num_preds = predict_weight_model(&num_model, &x_all_num, None)?;
    let den_preds = predict_weight_model(&den_model, &x_all_den, None)?;

    // Return ratio
    Ok(num_preds
        .iter()
        .zip(den_preds.iter())
        .map(|(&n, &d)| if d.abs() < 1e-15 { 1.0 } else { n / d })
        .collect())
}

/// Compute visit attendance weight component.
fn compute_visit_weights(
    data: &ColumnarData,
    config: &TargetTrialConfig,
) -> Result<Vec<f64>, String> {
    let visit_col = config
        .visit
        .as_ref()
        .ok_or("visit column required for visit weights")?;

    let _visit_data = data
        .get_numeric(visit_col)
        .ok_or_else(|| format!("Visit column '{}' not found", visit_col))?;

    let num_formula = config
        .visit_numerator
        .as_ref()
        .ok_or("visit_numerator formula required")?;
    let den_formula = config
        .visit_denominator
        .as_ref()
        .ok_or("visit_denominator formula required")?;

    let num_terms = super::glm_helpers::parse_formula_terms(num_formula);
    let den_terms = super::glm_helpers::parse_formula_terms(den_formula);

    let visit_data = data
        .get_numeric(visit_col)
        .ok_or_else(|| format!("Visit column '{}' not found", visit_col))?;

    let y: Vec<f64> = visit_data.to_vec();

    let (x_num, _) = build_design_matrix_v2(data, &num_terms, None)?;
    let (x_den, _) = build_design_matrix_v2(data, &den_terms, None)?;

    let num_model = fit_weight_model(x_num, y.clone(), false, None)?;
    let den_model = fit_weight_model(x_den, y, false, None)?;

    let (x_all_num, _) = build_design_matrix_v2(data, &num_terms, None)?;
    let (x_all_den, _) = build_design_matrix_v2(data, &den_terms, None)?;

    let num_preds = predict_weight_model(&num_model, &x_all_num, None)?;
    let den_preds = predict_weight_model(&den_model, &x_all_den, None)?;

    Ok(num_preds
        .iter()
        .zip(den_preds.iter())
        .map(|(&n, &d)| if d.abs() < 1e-15 { 1.0 } else { n / d })
        .collect())
}

/// Apply cumulative product of weight ratios within (id, trial) groups.
///
/// Mirrors R's:
/// ```r
/// DT[, weight := cumprod(wt), by = c(id, "trial")]
/// ```
///
/// # Arguments
/// * `weight_output` - The computed raw weight ratios
/// * `data` - The expanded data (must have id, trial, followup columns)
/// * `config` - Configuration
///
/// # Returns
/// Final weight vector (one per row), with cumulative product applied.
pub fn apply_cumulative_weights(
    weight_output: &WeightOutput,
    data: &ColumnarData,
    config: &TargetTrialConfig,
) -> Result<(Vec<f64>, WeightDiagnostics), String> {
    let n = data.nrows;
    let id_col = data
        .get_numeric(&config.id)
        .ok_or_else(|| format!("ID column '{}' not found", config.id))?;
    let trial_col = data
        .get_numeric("trial")
        .ok_or("trial column not found")?;
    let followup_col = data
        .get_numeric("followup")
        .ok_or("followup column not found")?;
    let outcome_col_ref = data.get_numeric(&config.outcome);
    let is_excused_path = config.excused || config.deviation.excused;
    let is_excused_col = if is_excused_path {
        data.get_numeric("isExcused")
    } else {
        None
    };

    let weights = if is_excused_path {
        // ── Excused path (R internal_analysis.R lines 72-85 / 98-112) ──
        // Step 1: Compute wt = numerator / denominator with guards
        let mut wt = vec![f64::NAN; n];
        for i in 0..n {
            let num = weight_output.numerator[i];
            let den = weight_output.denominator[i];

            // R: [followup == 0, `:=`(numerator = 1, denominator = 1)]
            if followup_col[i].abs() < 1e-10 {
                wt[i] = 1.0;
                continue;
            }

            // R: [denominator < 1e-15, denominator := 1]
            let den = if den.abs() < 1e-15 || den.is_nan() { 1.0 } else { den };
            // R: [numerator < 1e-15, numerator := 1] (post-expansion only)
            let num = if !config.weights.preexpansion && (num.abs() < 1e-15 || num.is_nan()) { 1.0 } else { num };

            // R: [is.na(outcome), denominator := 1]
            let den = if let Some(oc) = outcome_col_ref {
                if oc[i].is_nan() { 1.0 } else { den }
            } else {
                den
            };

            let ratio = num / den;
            // R: [is.na(wt), wt := 1]
            wt[i] = if ratio.is_nan() { 1.0 } else { ratio };
        }

        // R: [followup == 0, wt := 1] (again, redundant but matching R)
        for i in 0..n {
            if followup_col[i].abs() < 1e-10 {
                wt[i] = 1.0;
            }
        }

        // R: [, tmp := cumsum(ifelse(is.na(isExcused), 0, isExcused)), by = c(id, "trial")]
        // R: [tmp > 0, wt := 1]
        if let Some(exc_col) = is_excused_col {
            let mut idx = 0;
            while idx < n {
                let cur_id = id_col[idx];
                let cur_trial = trial_col[idx];
                let group_start = idx;
                idx += 1;
                while idx < n
                    && (id_col[idx] - cur_id).abs() < 1e-10
                    && (trial_col[idx] - cur_trial).abs() < 1e-10
                {
                    idx += 1;
                }
                let mut exc_cumsum = 0.0;
                for row in group_start..idx {
                    let exc_val = exc_col[row];
                    if !exc_val.is_nan() {
                        exc_cumsum += exc_val;
                    }
                    if exc_cumsum > 0.0 {
                        wt[row] = 1.0;
                    }
                }
            }
        }

        // R: [, weight := cumprod(ifelse(is.na(wt), 1, wt)), by = c(id, "trial")]
        let mut weights = vec![1.0; n];
        let mut idx = 0;
        while idx < n {
            let cur_id = id_col[idx];
            let cur_trial = trial_col[idx];
            let mut cum_prod = 1.0;
            while idx < n
                && (id_col[idx] - cur_id).abs() < 1e-10
                && (trial_col[idx] - cur_trial).abs() < 1e-10
            {
                let w = if wt[idx].is_nan() { 1.0 } else { wt[idx] };
                cum_prod *= w;
                weights[idx] = cum_prod;
                idx += 1;
            }
        }

        // R: [, weight := weight[1], list(cumsum(!is.na(weight)))]
        // This is a forward-fill: groups defined by cumsum of non-NA weight.
        // Since all our weights are non-NAN at this point (we replaced NAN with 1.0),
        // each row is its own group and weight[1] = itself. So this is a no-op.
        // But if we had NAN weights, it would forward-fill from the last non-NAN.

        weights
    } else {
        // ── Non-excused path ──
        let mut wt = vec![1.0; n];
        for i in 0..n {
            if followup_col[i].abs() < 1e-10 {
                wt[i] = 1.0;
            } else {
                let d = weight_output.denominator[i];
                let ratio = if d.abs() < 1e-15 {
                    1.0
                } else {
                    weight_output.numerator[i] / d
                };
                wt[i] = if ratio.is_nan() { 1.0 } else { ratio };
            }
        }

        // R: [followup == 0, wt := 1]
        for i in 0..n {
            if followup_col[i].abs() < 1e-10 {
                wt[i] = 1.0;
            }
        }

        // Cumulative product by (id, trial)
        let mut weights = vec![1.0; n];
        let mut i = 0;
        while i < n {
            let cur_id = id_col[i];
            let cur_trial = trial_col[i];
            let mut cum_prod = 1.0;
            while i < n
                && (id_col[i] - cur_id).abs() < 1e-10
                && (trial_col[i] - cur_trial).abs() < 1e-10
            {
                cum_prod *= wt[i];
                weights[i] = cum_prod;
                i += 1;
            }
        }

        weights
    };

    // Multiply by LTFU and visit components
    let mut weights = weights;
    if let Some(ref cense) = weight_output.cense {
        for i in 0..n {
            weights[i] *= cense[i];
        }
    }
    if let Some(ref visit) = weight_output.visit {
        for i in 0..n {
            weights[i] *= visit[i];
        }
    }

    // Truncate weights
    if config.weights.lower > 0.0 || config.weights.upper < f64::INFINITY {
        for w in weights.iter_mut() {
            if *w < config.weights.lower {
                *w = config.weights.lower;
            }
            if *w > config.weights.upper {
                *w = config.weights.upper;
            }
        }
    }

    // Compute diagnostics (only on rows where outcome is not NaN)
    let valid_weights: Vec<f64> = if let Some(oc) = outcome_col_ref {
        weights
            .iter()
            .zip(oc.iter())
            .filter(|(_, o)| !o.is_nan())
            .map(|(&w, _)| w)
            .collect()
    } else {
        weights.clone()
    };

    let diagnostics = compute_weight_diagnostics(&valid_weights, weight_output);

    Ok((weights, diagnostics))
}

/// Compute weight summary statistics.
fn compute_weight_diagnostics(
    weights: &[f64],
    weight_output: &WeightOutput,
) -> WeightDiagnostics {
    let n = weights.len() as f64;
    if n == 0.0 {
        return WeightDiagnostics {
            min: f64::NAN,
            max: f64::NAN,
            sd: f64::NAN,
            p01: f64::NAN,
            p25: f64::NAN,
            p50: f64::NAN,
            p75: f64::NAN,
            p99: f64::NAN,
            numerator_coefs: Vec::new(),
            denominator_coefs: Vec::new(),
        };
    }

    let mut sorted = weights.to_vec();
    sorted.sort_by(|a, b| a.partial_cmp(b).unwrap_or(std::cmp::Ordering::Equal));

    let min = sorted[0];
    let max = sorted[sorted.len() - 1];
    let mean = sorted.iter().sum::<f64>() / n;
    let variance = sorted.iter().map(|w| (w - mean).powi(2)).sum::<f64>() / (n - 1.0).max(1.0);
    let sd = variance.sqrt();

    let quantile = |p: f64| -> f64 {
        let idx = p * (sorted.len() as f64 - 1.0);
        let lo = idx.floor() as usize;
        let hi = (lo + 1).min(sorted.len() - 1);
        let frac = idx - lo as f64;
        sorted[lo] * (1.0 - frac) + sorted[hi] * frac
    };

    // Flatten all numerator/denominator coefs
    let num_coefs: Vec<f64> = weight_output
        .numerator_coefs
        .iter()
        .flat_map(|v| v.iter())
        .cloned()
        .collect();
    let den_coefs: Vec<f64> = weight_output
        .denominator_coefs
        .iter()
        .flat_map(|v| v.iter())
        .cloned()
        .collect();

    WeightDiagnostics {
        min,
        max,
        sd,
        p01: quantile(0.01),
        p25: quantile(0.25),
        p50: quantile(0.50),
        p75: quantile(0.75),
        p99: quantile(0.99),
        numerator_coefs: num_coefs,
        denominator_coefs: den_coefs,
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn make_test_config() -> TargetTrialConfig {
        let mut config = TargetTrialConfig::default();
        config.id = "id".to_string();
        config.time = "period".to_string();
        config.treatment = "treatment".to_string();
        config.outcome = "outcome".to_string();
        config.eligible = "eligible".to_string();
        config
    }

    #[test]
    fn test_parse_simple_formula() {
        let cols = parse_simple_formula("x1 + x2 + x3");
        assert_eq!(cols, vec!["x1", "x2", "x3"]);

        let cols = parse_simple_formula("followup + followup_sq");
        assert_eq!(cols, vec!["followup", "followup_sq"]);
    }

    #[test]
    fn test_build_design_matrix() {
        let mut data = ColumnarData::new();
        data.add_numeric("x1".to_string(), vec![1.0, 2.0, 3.0]);
        data.add_numeric("x2".to_string(), vec![4.0, 5.0, 6.0]);

        let x = build_design_matrix(&data, &["x1".to_string(), "x2".to_string()], None).unwrap();
        assert_eq!(x.len(), 3);
        assert_eq!(x[0], vec![1.0, 1.0, 4.0]); // intercept, x1, x2
        assert_eq!(x[1], vec![1.0, 2.0, 5.0]);
    }

    #[test]
    fn test_build_design_matrix_with_rows() {
        let mut data = ColumnarData::new();
        data.add_numeric("x1".to_string(), vec![10.0, 20.0, 30.0, 40.0]);

        let x =
            build_design_matrix(&data, &["x1".to_string()], Some(&[1, 3])).unwrap();
        assert_eq!(x.len(), 2);
        assert_eq!(x[0], vec![1.0, 20.0]);
        assert_eq!(x[1], vec![1.0, 40.0]);
    }

    #[test]
    fn test_itt_weights_all_ones() {
        let config = make_test_config();
        let mut data = ColumnarData::new();
        data.add_numeric("id".to_string(), vec![1.0, 1.0, 2.0, 2.0]);
        data.add_numeric("treatment".to_string(), vec![0.0, 1.0, 1.0, 0.0]);
        data.add_numeric("outcome".to_string(), vec![0.0, 0.0, 1.0, 0.0]);
        data.add_numeric("followup".to_string(), vec![0.0, 1.0, 0.0, 1.0]);
        data.add_numeric("trial".to_string(), vec![0.0, 0.0, 0.0, 0.0]);

        let pre_data = data.clone();
        let output = compute_weights(&data, &pre_data, &config).unwrap();

        // ITT → all weights should be 1.0
        assert!(output.numerator.iter().all(|&v| (v - 1.0).abs() < 1e-10));
        assert!(output.denominator.iter().all(|&v| (v - 1.0).abs() < 1e-10));
    }

    #[test]
    fn test_cumulative_weight_product() {
        let config = make_test_config();

        let weight_output = WeightOutput {
            numerator: vec![0.8, 0.7, 0.9, 0.6],
            denominator: vec![0.5, 0.5, 0.5, 0.5],
            cense: None,
            visit: None,
            numerator_coefs: Vec::new(),
            denominator_coefs: Vec::new(),
        };

        let mut data = ColumnarData::new();
        data.add_numeric("id".to_string(), vec![1.0, 1.0, 2.0, 2.0]);
        data.add_numeric("trial".to_string(), vec![0.0, 0.0, 0.0, 0.0]);
        data.add_numeric("followup".to_string(), vec![0.0, 1.0, 0.0, 1.0]);
        data.add_numeric("outcome".to_string(), vec![0.0, 0.0, 0.0, 1.0]);
        data.add_numeric("treatment".to_string(), vec![1.0, 1.0, 0.0, 0.0]);

        let (weights, diag) = apply_cumulative_weights(&weight_output, &data, &config).unwrap();

        // followup==0 → wt=1, so cumprod starts at 1
        // Row 0: followup=0 → weight = 1.0
        // Row 1: followup=1 → wt = 0.7/0.5 = 1.4, weight = 1.0 * 1.4 = 1.4
        // Row 2: followup=0 → weight = 1.0
        // Row 3: followup=1 → wt = 0.6/0.5 = 1.2, weight = 1.0 * 1.2 = 1.2
        assert!((weights[0] - 1.0).abs() < 1e-10);
        assert!((weights[1] - 1.4).abs() < 1e-10);
        assert!((weights[2] - 1.0).abs() < 1e-10);
        assert!((weights[3] - 1.2).abs() < 1e-10);

        assert!(diag.min <= diag.max);
    }

    #[test]
    fn test_weight_diagnostics() {
        let weights = vec![0.5, 1.0, 1.5, 2.0, 2.5];
        let weight_output = WeightOutput {
            numerator: Vec::new(),
            denominator: Vec::new(),
            cense: None,
            visit: None,
            numerator_coefs: vec![vec![0.1, 0.2]],
            denominator_coefs: vec![vec![0.3, 0.4]],
        };

        let diag = compute_weight_diagnostics(&weights, &weight_output);
        assert!((diag.min - 0.5).abs() < 1e-10);
        assert!((diag.max - 2.5).abs() < 1e-10);
        assert!((diag.p50 - 1.5).abs() < 1e-10);
        assert!(diag.sd > 0.0);
        assert_eq!(diag.numerator_coefs, vec![0.1, 0.2]);
        assert_eq!(diag.denominator_coefs, vec![0.3, 0.4]);
    }
}
