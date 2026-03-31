//! Outcome model fitting for target trial emulation.
//!
//! Ported from `SEQTaRget/R/internal_models.R`.
//! Fits weighted quasibinomial GLM for the outcome.

use super::glm_helpers::{build_design_matrix_from_formula, FormulaCache};
use super::types::{ColumnarData, TargetTrialConfig};
use crate::stats::regression::family::quasibinomial::QuasiBinomialFamily;
use crate::stats::regression::glm::glm_control::glm_control;
use crate::stats::regression::glm::glm_fit_core::glm_fit;
use crate::stats::regression::glm::types_results::GlmResult;

/// Fitted outcome model.
#[derive(Debug, Clone)]
pub struct OutcomeModel {
    /// The fitted GLM result
    pub result: GlmResult,
    /// Coefficient names
    pub coef_names: Vec<String>,
    /// Whether separation was detected
    pub separation: bool,
}

/// Fit the outcome model.
///
/// Mirrors R's `internal.model()`.
///
/// # Arguments
/// * `data` - Expanded (and optionally weighted) data
/// * `config` - Configuration
/// * `formula_cache` - Cached formula for covariates
/// * `weights` - Optional weight vector (one per row)
pub fn fit_outcome_model(
    data: &ColumnarData,
    config: &TargetTrialConfig,
    formula_cache: &FormulaCache,
    weights: Option<&[f64]>,
) -> Result<OutcomeModel, String> {
    // Filter rows where outcome is not NaN
    let outcome_col = data
        .get_numeric(&config.outcome)
        .ok_or_else(|| format!("Outcome column '{}' not found", config.outcome))?;

    let valid_rows: Vec<usize> = outcome_col
        .iter()
        .enumerate()
        .filter(|(_, v)| !v.is_nan())
        .map(|(i, _)| i)
        .collect();

    if valid_rows.is_empty() {
        return Err("No valid outcome observations".to_string());
    }

    // Build design matrix
    let x = build_design_matrix_from_formula(data, formula_cache, Some(&valid_rows))?;
    let y: Vec<f64> = valid_rows.iter().map(|&i| outcome_col[i]).collect();

    // Extract weights for valid rows, with truncation
    let w: Option<Vec<f64>> = weights.map(|wts| {
        valid_rows
            .iter()
            .map(|&i| {
                let mut w = wts[i];
                if w < config.weights.lower {
                    w = config.weights.lower;
                }
                if w > config.weights.upper {
                    w = config.weights.upper;
                }
                w
            })
            .collect()
    });

    let control = glm_control(None, None, None)?;
    let family: Box<dyn crate::stats::regression::family::GlmFamily> =
        Box::new(QuasiBinomialFamily::logit());

    let result = glm_fit(
        x,
        y,
        w,            // weights
        None,         // start
        None,         // etastart
        None,         // mustart
        None,         // offset
        family,
        control,
        true, // intercept
        None, // column_names
    )?;

    let separation = super::glm_helpers::check_separation(&result.coefficients);

    // Build coefficient names: intercept + formula columns
    let mut coef_names = vec!["(Intercept)".to_string()];
    coef_names.extend(formula_cache.cols.iter().cloned());

    Ok(OutcomeModel {
        result,
        coef_names,
        separation,
    })
}

/// Predict outcome probabilities from a fitted outcome model.
///
/// Returns predicted P(outcome=1) for each row in the data.
pub fn predict_outcome(
    model: &OutcomeModel,
    data: &ColumnarData,
    formula_cache: &FormulaCache,
    rows: Option<&[usize]>,
) -> Result<Vec<f64>, String> {
    let x = build_design_matrix_from_formula(data, formula_cache, rows)?;
    Ok(super::glm_helpers::predict_logistic(
        &x,
        &model.result.coefficients,
    ))
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::stats::target_trial::types::ColumnarData;

    #[test]
    fn test_fit_outcome_model_basic() {
        let mut data = ColumnarData::new();
        // Simple dataset: 20 observations, outcome correlated with x1
        let n = 20;
        let x1: Vec<f64> = (0..n).map(|i| i as f64 / (n - 1) as f64).collect();
        let outcome: Vec<f64> = (0..n).map(|i| if i >= n / 2 { 1.0 } else { 0.0 }).collect();
        let followup: Vec<f64> = (0..n).map(|i| (i % 5) as f64).collect();

        data.add_numeric("x1".to_string(), x1);
        data.add_numeric("outcome".to_string(), outcome);
        data.add_numeric("followup".to_string(), followup);

        let mut config = TargetTrialConfig::default();
        config.outcome = "outcome".to_string();

        let cache = FormulaCache {
            cols: vec!["x1".to_string(), "followup".to_string()],
            is_simple: true,
        };

        let model = fit_outcome_model(&data, &config, &cache, None).unwrap();
        assert_eq!(model.result.coefficients.len(), 3); // intercept + x1 + followup
        assert_eq!(model.coef_names.len(), 3);
    }

    #[test]
    fn test_predict_outcome() {
        let mut data = ColumnarData::new();
        let n = 20;
        let x1: Vec<f64> = (0..n).map(|i| i as f64 / (n - 1) as f64).collect();
        let outcome: Vec<f64> = (0..n).map(|i| if i >= n / 2 { 1.0 } else { 0.0 }).collect();

        data.add_numeric("x1".to_string(), x1);
        data.add_numeric("outcome".to_string(), outcome);

        let mut config = TargetTrialConfig::default();
        config.outcome = "outcome".to_string();

        let cache = FormulaCache {
            cols: vec!["x1".to_string()],
            is_simple: true,
        };

        let model = fit_outcome_model(&data, &config, &cache, None).unwrap();
        let preds = predict_outcome(&model, &data, &cache, None).unwrap();

        assert_eq!(preds.len(), n);
        // All predictions should be in [0, 1]
        for &p in &preds {
            assert!(p >= 0.0 && p <= 1.0);
        }
        // Higher x1 → higher predicted probability
        assert!(preds[n - 1] > preds[0]);
    }
}
