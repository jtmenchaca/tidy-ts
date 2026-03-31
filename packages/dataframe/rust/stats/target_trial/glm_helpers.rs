//! GLM helper utilities for target trial emulation.
//!
//! Ported from `SEQTaRget/R/internal_fatglmHelpers.R`.
//! Design matrix construction, formula caching, prediction helpers.

use super::types::ColumnarData;
use super::weights::parse_simple_formula;

/// Parsed formula cache entry.
#[derive(Debug, Clone)]
pub struct FormulaCache {
    /// Column names extracted from the formula
    pub cols: Vec<String>,
    /// Whether the formula is a simple additive formula (no interactions/transforms)
    pub is_simple: bool,
}

/// Parse a formula string into a cache entry.
pub fn parse_formula(formula: &str) -> FormulaCache {
    let cols = parse_simple_formula(formula);
    let is_simple = !formula.contains(':')
        && !formula.contains('*')
        && !formula.contains("ns(")
        && !formula.contains("bs(")
        && !formula.contains("factor(")
        && !formula.contains("I(")
        && !formula.contains("poly(");
    FormulaCache { cols, is_simple }
}

/// Full formula cache for all model types in the pipeline.
#[derive(Debug, Clone)]
pub struct PipelineFormulaCache {
    pub numerator: Option<FormulaCache>,
    pub denominator: Option<FormulaCache>,
    pub covariates: Option<FormulaCache>,
    pub cense_numerator: Option<FormulaCache>,
    pub cense_denominator: Option<FormulaCache>,
    pub visit_numerator: Option<FormulaCache>,
    pub visit_denominator: Option<FormulaCache>,
    pub time_sq_col: String,
    pub tx_bas: String,
}

/// Initialize a formula cache from the pipeline configuration.
///
/// Mirrors R's `init_formula_cache()`.
pub fn init_formula_cache(
    config: &super::types::TargetTrialConfig,
) -> PipelineFormulaCache {
    PipelineFormulaCache {
        numerator: config.numerator.as_ref().map(|f| parse_formula(f)),
        denominator: config.denominator.as_ref().map(|f| parse_formula(f)),
        covariates: config.covariates.as_ref().map(|f| parse_formula(f)),
        cense_numerator: config.cense_numerator.as_ref().map(|f| parse_formula(f)),
        cense_denominator: config.cense_denominator.as_ref().map(|f| parse_formula(f)),
        visit_numerator: config.visit_numerator.as_ref().map(|f| parse_formula(f)),
        visit_denominator: config.visit_denominator.as_ref().map(|f| parse_formula(f)),
        time_sq_col: format!("{}{}", config.time, config.indicator_squared),
        tx_bas: format!("{}{}", config.treatment, config.indicator_baseline),
    }
}

/// Build a design matrix from columnar data using formula column names.
///
/// Returns row-major matrix with intercept column prepended.
pub fn build_design_matrix_from_formula(
    data: &ColumnarData,
    cache: &FormulaCache,
    rows: Option<&[usize]>,
) -> Result<Vec<Vec<f64>>, String> {
    super::weights::build_design_matrix(data, &cache.cols, rows)
}

/// Check for separation in GLM coefficients.
///
/// Returns true if any coefficient is non-finite or |coef| > 25.
pub fn check_separation(coefficients: &[f64]) -> bool {
    coefficients
        .iter()
        .any(|&c| !c.is_finite() || c.abs() > 25.0)
}

/// Predict response probabilities from GLM coefficients.
///
/// Uses logistic link: p = 1 / (1 + exp(-eta))
pub fn predict_logistic(x: &[Vec<f64>], coefficients: &[f64]) -> Vec<f64> {
    x.iter()
        .map(|row| {
            let eta: f64 = row
                .iter()
                .zip(coefficients.iter())
                .map(|(xv, cv)| xv * cv)
                .sum();
            1.0 / (1.0 + (-eta).exp())
        })
        .collect()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_parse_formula_simple() {
        let cache = parse_formula("x1 + x2 + followup");
        assert_eq!(cache.cols, vec!["x1", "x2", "followup"]);
        assert!(cache.is_simple);
    }

    #[test]
    fn test_parse_formula_complex() {
        let cache = parse_formula("x1 + ns(followup) + x2");
        assert!(!cache.is_simple);
    }

    #[test]
    fn test_check_separation() {
        assert!(!check_separation(&[0.5, -1.0, 2.0]));
        assert!(check_separation(&[0.5, 26.0, 2.0]));
        assert!(check_separation(&[f64::NAN, 1.0]));
    }

    #[test]
    fn test_predict_logistic() {
        // With zero coefficients, prediction should be 0.5
        let x = vec![vec![1.0, 0.0], vec![1.0, 0.0]];
        let coefs = vec![0.0, 0.0];
        let preds = predict_logistic(&x, &coefs);
        assert!((preds[0] - 0.5).abs() < 1e-10);

        // Large positive intercept → prediction near 1
        let coefs = vec![10.0, 0.0];
        let preds = predict_logistic(&x, &coefs);
        assert!(preds[0] > 0.999);
    }
}
