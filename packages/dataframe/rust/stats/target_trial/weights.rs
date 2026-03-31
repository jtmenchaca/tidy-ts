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

    // Non-ITT: fit numerator/denominator models per treatment level
    let num_formula = config
        .numerator
        .as_ref()
        .ok_or("numerator formula required for non-ITT analysis")?;
    let den_formula = config
        .denominator
        .as_ref()
        .ok_or("denominator formula required for non-ITT analysis")?;

    let num_cols = parse_simple_formula(num_formula);
    let den_cols = parse_simple_formula(den_formula);

    // Determine which data to use for model fitting
    let model_data = if config.weights.preexpansion {
        pre_data
    } else {
        expanded
    };

    // Rows where followup > 0 (for post-expansion denominator)
    let followup_gt0: Vec<usize> = if !config.weights.preexpansion {
        model_data
            .get_numeric("followup")
            .map(|f| {
                f.iter()
                    .enumerate()
                    .filter(|&(_, &v)| v > 0.0)
                    .map(|(i, _)| i)
                    .collect()
            })
            .unwrap_or_default()
    } else {
        (0..model_data.nrows).collect()
    };

    // Get tx_lag column for conditioning
    let tx_lag = model_data.get_numeric("tx_lag");

    for (level_idx, &level) in config.treat_levels.iter().enumerate() {
        // Filter rows for this treatment level (by tx_lag)
        let level_rows: Vec<usize> = if config.weights.lag_condition {
            if let Some(lag) = tx_lag {
                followup_gt0
                    .iter()
                    .filter(|&&i| (lag[i] - level).abs() < 1e-10)
                    .cloned()
                    .collect()
            } else {
                followup_gt0.clone()
            }
        } else {
            followup_gt0.clone()
        };

        if level_rows.is_empty() {
            numerator_coefs.push(Vec::new());
            denominator_coefs.push(Vec::new());
            continue;
        }

        // Get treatment response for these rows
        let treatment_col = model_data
            .get_numeric(&config.treatment)
            .ok_or_else(|| format!("Treatment column '{}' not found", config.treatment))?;

        let y_num: Vec<f64> = level_rows.iter().map(|&i| treatment_col[i]).collect();

        // Build design matrices
        let x_num = build_design_matrix(model_data, &num_cols, Some(&level_rows))?;
        let x_den = build_design_matrix(model_data, &den_cols, Some(&level_rows))?;

        // Fit models
        let use_multi = config.multinomial
            && !(config.weights.preexpansion
                && (config.excused || config.deviation.excused));

        let y_labels: Option<Vec<String>> = if use_multi {
            Some(y_num.iter().map(|v| format!("{}", *v as i64)).collect())
        } else {
            None
        };

        let num_model = fit_weight_model(
            x_num,
            y_num.clone(),
            use_multi,
            y_labels.as_deref(),
        )?;
        let den_model = fit_weight_model(
            x_den,
            y_num,
            use_multi,
            y_labels.as_deref(),
        )?;

        // Store coefficients
        match &num_model {
            WeightModel::Binary(r) => numerator_coefs.push(r.coefficients.clone()),
            _ => numerator_coefs.push(Vec::new()),
        }
        match &den_model {
            WeightModel::Binary(r) => denominator_coefs.push(r.coefficients.clone()),
            _ => denominator_coefs.push(Vec::new()),
        }

        // Predict for all rows where tx_lag == level (in the expanded data)
        let expanded_tx_lag = expanded.get_numeric("tx_lag");
        let pred_rows: Vec<usize> = if let Some(lag) = expanded_tx_lag {
            (0..n)
                .filter(|&i| (lag[i] - level).abs() < 1e-10)
                .collect()
        } else {
            (0..n).collect()
        };

        if pred_rows.is_empty() {
            continue;
        }

        let target_str = format!("{}", level as i64);
        let x_pred_num = build_design_matrix(expanded, &num_cols, Some(&pred_rows))?;
        let x_pred_den = build_design_matrix(expanded, &den_cols, Some(&pred_rows))?;

        let num_preds = predict_weight_model(
            &num_model,
            &x_pred_num,
            if use_multi { Some(&target_str) } else { None },
        )?;
        let den_preds = predict_weight_model(
            &den_model,
            &x_pred_den,
            if use_multi { Some(&target_str) } else { None },
        )?;

        // Apply probability reversal logic from R:
        // For level_idx == 0 (first/baseline level):
        //   if treatment == level: prob = 1 - prob
        // For level_idx > 0:
        //   if treatment != level: prob = 1 - prob
        let treatment_expanded = expanded
            .get_numeric(&config.treatment)
            .ok_or("Treatment column missing in expanded data")?;

        for (j, &row_idx) in pred_rows.iter().enumerate() {
            let tx_val = treatment_expanded[row_idx];
            let mut n_pred = num_preds[j];
            let mut d_pred = den_preds[j];

            if level_idx == 0 {
                // First treatment level: reverse when treatment matches
                if (tx_val - level).abs() < 1e-10 {
                    n_pred = 1.0 - n_pred;
                    d_pred = 1.0 - d_pred;
                }
            } else {
                // Other levels: reverse when treatment does NOT match
                if (tx_val - level).abs() >= 1e-10 {
                    n_pred = 1.0 - n_pred;
                    d_pred = 1.0 - d_pred;
                }
            }

            numerator[row_idx] = n_pred;
            denominator[row_idx] = d_pred;
        }
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

    let num_cols = parse_simple_formula(num_formula);
    let den_cols = parse_simple_formula(den_formula);

    // Response: abs(cense - 1) → 1 if not censored, 0 if censored
    let y: Vec<f64> = valid_rows
        .iter()
        .map(|&i| (cense_data[i] - 1.0).abs())
        .collect();

    let x_num = build_design_matrix(data, &num_cols, Some(&valid_rows))?;
    let x_den = build_design_matrix(data, &den_cols, Some(&valid_rows))?;

    let num_model = fit_weight_model(x_num, y.clone(), false, None)?;
    let den_model = fit_weight_model(x_den, y, false, None)?;

    // Predict for all rows
    let x_all_num = build_design_matrix(data, &num_cols, None)?;
    let x_all_den = build_design_matrix(data, &den_cols, None)?;

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

    let num_cols = parse_simple_formula(num_formula);
    let den_cols = parse_simple_formula(den_formula);

    let visit_data = data
        .get_numeric(visit_col)
        .ok_or_else(|| format!("Visit column '{}' not found", visit_col))?;

    let y: Vec<f64> = visit_data.to_vec();

    let x_num = build_design_matrix(data, &num_cols, None)?;
    let x_den = build_design_matrix(data, &den_cols, None)?;

    let num_model = fit_weight_model(x_num, y.clone(), false, None)?;
    let den_model = fit_weight_model(x_den, y, false, None)?;

    let x_all_num = build_design_matrix(data, &num_cols, None)?;
    let x_all_den = build_design_matrix(data, &den_cols, None)?;

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

    // Compute per-row weight ratio
    let mut wt = vec![1.0; n];
    for i in 0..n {
        // At followup == 0, weight is 1
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

    // Apply cumulative product by (id, trial)
    // First, sort rows into groups by (id, trial)
    let mut weights = vec![1.0; n];

    // Track current group and running product
    let mut i = 0;
    while i < n {
        let cur_id = id_col[i];
        let cur_trial = trial_col[i];
        let mut cum_prod = 1.0;

        // Process all rows in this (id, trial) group
        while i < n
            && (id_col[i] - cur_id).abs() < 1e-10
            && (trial_col[i] - cur_trial).abs() < 1e-10
        {
            cum_prod *= wt[i];
            weights[i] = cum_prod;
            i += 1;
        }
    }

    // Multiply by LTFU and visit components
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
    let outcome_col = data.get_numeric(&config.outcome);
    let valid_weights: Vec<f64> = if let Some(oc) = outcome_col {
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
