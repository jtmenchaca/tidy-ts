//! GLM helper utilities for target trial emulation.
//!
//! Ported from `SEQTaRget/R/internal_fatglmHelpers.R`.
//! Design matrix construction, formula caching, prediction helpers.
//! Includes R's `model.matrix()` behavior: factor dummy encoding and interactions.

use super::types::ColumnarData;

/// A single term in a parsed formula.
#[derive(Debug, Clone, PartialEq)]
pub enum FormulaTerm {
    /// A simple column reference: "x1"
    Main(String),
    /// An interaction between two or more terms: "a:b"
    Interaction(Vec<String>),
}

/// Parsed formula cache entry.
#[derive(Debug, Clone)]
pub struct FormulaCache {
    /// Column names extracted from the formula (main effects only, for backward compat)
    pub cols: Vec<String>,
    /// Parsed terms including interactions
    pub terms: Vec<FormulaTerm>,
    /// Whether the formula is a simple additive formula (no interactions/transforms)
    pub is_simple: bool,
}

/// Parse a formula string into terms, handling `*` and `:`.
///
/// - `a + b` → [Main("a"), Main("b")]
/// - `a * b` → [Main("a"), Main("b"), Interaction(["a", "b"])]
/// - `a:b`   → [Interaction(["a", "b"])]
/// - `a*b + c` → [Main("a"), Main("b"), Interaction(["a", "b"]), Main("c")]
pub fn parse_formula_terms(formula: &str) -> Vec<FormulaTerm> {
    let mut terms: Vec<FormulaTerm> = Vec::new();

    for segment in formula.split('+') {
        let segment = segment.trim();
        if segment.is_empty() {
            continue;
        }

        if segment.contains('*') {
            // a*b expands to a + b + a:b
            let parts: Vec<String> = segment
                .split('*')
                .map(|s| s.trim().to_string())
                .filter(|s| !s.is_empty())
                .collect();

            // Add main effects (dedup)
            for p in &parts {
                let term = FormulaTerm::Main(p.clone());
                if !terms.contains(&term) {
                    terms.push(term);
                }
            }
            // Add interaction
            let interaction = FormulaTerm::Interaction(parts);
            if !terms.contains(&interaction) {
                terms.push(interaction);
            }
        } else if segment.contains(':') {
            // Pure interaction term
            let parts: Vec<String> = segment
                .split(':')
                .map(|s| s.trim().to_string())
                .filter(|s| !s.is_empty())
                .collect();
            let term = FormulaTerm::Interaction(parts);
            if !terms.contains(&term) {
                terms.push(term);
            }
        } else {
            let term = FormulaTerm::Main(segment.to_string());
            if !terms.contains(&term) {
                terms.push(term);
            }
        }
    }

    terms
}

/// Parse a formula string into a cache entry.
pub fn parse_formula(formula: &str) -> FormulaCache {
    let terms = parse_formula_terms(formula);
    // Extract flat column list for backward compat (main effects only)
    let cols: Vec<String> = terms
        .iter()
        .filter_map(|t| match t {
            FormulaTerm::Main(s) => Some(s.clone()),
            FormulaTerm::Interaction(_) => None,
        })
        .collect();
    let is_simple = !formula.contains(':')
        && !formula.contains('*')
        && !formula.contains("ns(")
        && !formula.contains("bs(")
        && !formula.contains("factor(")
        && !formula.contains("I(")
        && !formula.contains("poly(");
    FormulaCache {
        cols,
        terms,
        is_simple,
    }
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
pub fn init_formula_cache(config: &super::types::TargetTrialConfig) -> PipelineFormulaCache {
    PipelineFormulaCache {
        numerator: config.numerator.as_ref().map(|f| parse_formula(f)),
        denominator: config.denominator.as_ref().map(|f| parse_formula(f)),
        covariates: config.covariates.as_ref().map(|f| parse_formula(f)),
        cense_numerator: config
            .cense_numerator
            .as_ref()
            .map(|f| parse_formula(f)),
        cense_denominator: config
            .cense_denominator
            .as_ref()
            .map(|f| parse_formula(f)),
        visit_numerator: config
            .visit_numerator
            .as_ref()
            .map(|f| parse_formula(f)),
        visit_denominator: config
            .visit_denominator
            .as_ref()
            .map(|f| parse_formula(f)),
        time_sq_col: format!("{}{}", config.time, config.indicator_squared),
        tx_bas: format!("{}{}", config.treatment, config.indicator_baseline),
    }
}

/// Build a design matrix from columnar data using formula terms.
///
/// Handles factor dummy encoding and interaction terms.
/// Returns row-major matrix with intercept column prepended.
pub fn build_design_matrix_from_formula(
    data: &ColumnarData,
    cache: &FormulaCache,
    rows: Option<&[usize]>,
) -> Result<Vec<Vec<f64>>, String> {
    let (matrix, _names) =
        super::weights::build_design_matrix_v2(data, &cache.terms, rows)?;
    Ok(matrix)
}

/// Build design matrix and return expanded column names.
/// Used by outcome_models.rs to produce correct coefficient names.
pub fn build_design_matrix_with_names(
    data: &ColumnarData,
    cache: &FormulaCache,
    rows: Option<&[usize]>,
) -> Result<(Vec<Vec<f64>>, Vec<String>), String> {
    super::weights::build_design_matrix_v2(data, &cache.terms, rows)
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
        assert_eq!(cache.terms.len(), 3);
    }

    #[test]
    fn test_parse_formula_interaction() {
        let cache = parse_formula("tx_bas*followup + x1");
        assert!(!cache.is_simple);
        // a*b → Main(a), Main(b), Interaction([a,b]), Main(x1)
        assert_eq!(cache.terms.len(), 4);
        assert_eq!(cache.terms[0], FormulaTerm::Main("tx_bas".to_string()));
        assert_eq!(cache.terms[1], FormulaTerm::Main("followup".to_string()));
        assert_eq!(
            cache.terms[2],
            FormulaTerm::Interaction(vec!["tx_bas".to_string(), "followup".to_string()])
        );
        assert_eq!(cache.terms[3], FormulaTerm::Main("x1".to_string()));
        // cols should only have main effects
        assert_eq!(cache.cols, vec!["tx_bas", "followup", "x1"]);
    }

    #[test]
    fn test_parse_formula_colon_interaction() {
        let cache = parse_formula("a + a:b + b");
        assert_eq!(cache.terms.len(), 3);
        assert_eq!(cache.terms[0], FormulaTerm::Main("a".to_string()));
        assert_eq!(
            cache.terms[1],
            FormulaTerm::Interaction(vec!["a".to_string(), "b".to_string()])
        );
        assert_eq!(cache.terms[2], FormulaTerm::Main("b".to_string()));
    }

    #[test]
    fn test_parse_formula_dedup() {
        // followup appears both as standalone and inside tx_bas*followup
        let cache = parse_formula("tx_bas + followup + tx_bas*followup");
        // Main(tx_bas), Main(followup), Interaction([tx_bas, followup])
        assert_eq!(cache.terms.len(), 3);
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
