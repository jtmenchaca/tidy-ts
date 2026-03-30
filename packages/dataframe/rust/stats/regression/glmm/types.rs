//! Core GLMM data structures
//!
//! This module defines the fundamental types for Generalized Linear Mixed Models,
//! extending the GLM infrastructure with random effects support.

use serde::{Deserialize, Serialize};
use std::collections::HashMap;

use crate::stats::regression::glm::types::GlmResult;

/// Covariance structure for random effects
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub enum CovarianceType {
    /// Independent random effects (diagonal covariance)
    Independent,
    /// Unstructured covariance (all variances and correlations estimated)
    Unstructured,
    /// Compound symmetry (equal variances, equal correlations)
    CompoundSymmetry,
}

impl Default for CovarianceType {
    fn default() -> Self {
        CovarianceType::Unstructured
    }
}

impl std::fmt::Display for CovarianceType {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            CovarianceType::Independent => write!(f, "independent"),
            CovarianceType::Unstructured => write!(f, "unstructured"),
            CovarianceType::CompoundSymmetry => write!(f, "compound_symmetry"),
        }
    }
}

/// Specification for a single random effect term
///
/// Example: `(1 + x | group)` would have:
/// - `grouping_var`: "group"
/// - `terms`: ["1", "x"] (intercept and slope)
/// - `covariance`: Unstructured (intercept-slope correlation estimated)
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RandomEffect {
    /// Variable name used for grouping (e.g., "patient", "clinic")
    pub grouping_var: String,
    /// Terms in the random effect formula (e.g., ["1", "x"] for random intercept + slope)
    pub terms: Vec<String>,
    /// Number of unique groups/levels for this grouping variable
    pub n_groups: usize,
    /// Number of observations in each group
    pub group_sizes: Vec<usize>,
    /// Unique group identifiers (in order of first appearance)
    pub group_ids: Vec<String>,
    /// Mapping from observation index to group index
    pub group_indices: Vec<usize>,
    /// Covariance structure for this random effect
    pub covariance: CovarianceType,
}

impl RandomEffect {
    /// Create a new random intercept specification
    pub fn intercept(grouping_var: String) -> Self {
        Self {
            grouping_var,
            terms: vec!["1".to_string()],
            n_groups: 0,
            group_sizes: Vec::new(),
            group_ids: Vec::new(),
            group_indices: Vec::new(),
            covariance: CovarianceType::Independent,
        }
    }

    /// Create a random intercept + slope specification
    pub fn intercept_slope(grouping_var: String, slope_var: String) -> Self {
        Self {
            grouping_var,
            terms: vec!["1".to_string(), slope_var],
            n_groups: 0,
            group_sizes: Vec::new(),
            group_ids: Vec::new(),
            group_indices: Vec::new(),
            covariance: CovarianceType::Unstructured,
        }
    }

    /// Number of random effect coefficients per group
    pub fn n_terms(&self) -> usize {
        self.terms.len()
    }

    /// Total number of random effect coefficients (n_groups * n_terms)
    pub fn total_coefficients(&self) -> usize {
        self.n_groups * self.n_terms()
    }

    /// Number of variance parameters for this random effect
    ///
    /// For unstructured: n_terms + n_terms*(n_terms-1)/2 (variances + correlations)
    /// For independent: n_terms (variances only)
    /// For compound symmetry: 2 (one variance, one correlation)
    pub fn n_variance_params(&self) -> usize {
        let k = self.n_terms();
        match self.covariance {
            CovarianceType::Unstructured => k * (k + 1) / 2,
            CovarianceType::Independent => k,
            CovarianceType::CompoundSymmetry => 2,
        }
    }
}

/// Control parameters for GLMM fitting
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct GlmmControl {
    /// Maximum iterations for outer optimization (variance components)
    pub max_iter_outer: usize,
    /// Maximum iterations for inner optimization (fixed effects + BLUPs)
    pub max_iter_inner: usize,
    /// Convergence tolerance for outer optimization (relative gradient norm)
    pub tol_outer: f64,
    /// Convergence tolerance for inner optimization (IRLS)
    pub tol_inner: f64,
    /// Whether to print progress information
    pub verbose: bool,
    /// Use REML estimation (restricted maximum likelihood)
    pub reml: bool,
    /// Optimizer for variance components ("bfgs", "newton", "bobyqa")
    pub optimizer: String,
    /// Starting values for variance parameters (theta)
    pub start_theta: Option<Vec<f64>>,
    /// Starting values for fixed effects (beta)
    pub start_beta: Option<Vec<f64>>,
}

impl Default for GlmmControl {
    fn default() -> Self {
        Self {
            max_iter_outer: 100,
            max_iter_inner: 25,
            tol_outer: 1e-6,
            tol_inner: 1e-8,
            verbose: false,
            reml: true,
            optimizer: "bfgs".to_string(),
            start_theta: None,
            start_beta: None,
        }
    }
}

impl GlmmControl {
    /// Create control with default parameters
    pub fn new() -> Self {
        Self::default()
    }

    /// Use ML estimation instead of REML
    pub fn with_ml(mut self) -> Self {
        self.reml = false;
        self
    }

    /// Set maximum outer iterations
    pub fn with_max_iter(mut self, max_iter: usize) -> Self {
        self.max_iter_outer = max_iter;
        self
    }

    /// Set convergence tolerance
    pub fn with_tolerance(mut self, tol: f64) -> Self {
        self.tol_outer = tol;
        self
    }

    /// Enable verbose output
    pub fn with_verbose(mut self, verbose: bool) -> Self {
        self.verbose = verbose;
        self
    }
}

/// Variance component estimate for a random effect
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct VarianceComponent {
    /// Name of the grouping variable
    pub group_name: String,
    /// Names of the random effect terms
    pub term_names: Vec<String>,
    /// Variance-covariance matrix for this random effect (k x k for k terms)
    pub vcov: Vec<Vec<f64>>,
    /// Standard deviations (square roots of diagonal of vcov)
    pub std_dev: Vec<f64>,
    /// Correlation matrix (derived from vcov)
    pub correlation: Option<Vec<Vec<f64>>>,
    /// Standard errors of variance parameters (if available)
    pub std_errors: Option<Vec<f64>>,
}

impl VarianceComponent {
    /// Create a simple variance component (single random effect term)
    pub fn new_simple(group_name: String, term_name: String, variance: f64) -> Self {
        let std_dev = variance.sqrt();
        Self {
            group_name,
            term_names: vec![term_name],
            vcov: vec![vec![variance]],
            std_dev: vec![std_dev],
            correlation: None,
            std_errors: None,
        }
    }
}

/// Random effect estimates (BLUPs - Best Linear Unbiased Predictors)
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RandomEffectEstimates {
    /// Name of the grouping variable
    pub group_name: String,
    /// Term names for the random effects
    pub term_names: Vec<String>,
    /// Group identifiers
    pub group_ids: Vec<String>,
    /// BLUP estimates: n_groups x n_terms matrix (row-major)
    pub estimates: Vec<Vec<f64>>,
    /// Conditional standard errors: n_groups x n_terms matrix
    pub std_errors: Option<Vec<Vec<f64>>>,
    /// Conditional variance-covariance for each group (if requested)
    pub conditional_vcov: Option<Vec<Vec<Vec<f64>>>>,
}

impl RandomEffectEstimates {
    /// Get BLUP for a specific group and term
    pub fn get(&self, group_idx: usize, term_idx: usize) -> Option<f64> {
        self.estimates.get(group_idx)?.get(term_idx).copied()
    }

    /// Get all BLUPs for a specific group
    pub fn get_group(&self, group_idx: usize) -> Option<&Vec<f64>> {
        self.estimates.get(group_idx)
    }

    /// Number of groups
    pub fn n_groups(&self) -> usize {
        self.group_ids.len()
    }

    /// Number of terms per group
    pub fn n_terms(&self) -> usize {
        self.term_names.len()
    }
}

/// Complete GLMM fit result
///
/// Extends GlmResult with random effect components
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct GlmmResult {
    /// GLM fixed effects result (reuses all GLM infrastructure)
    pub glm_result: GlmResult,

    /// Random effect specifications
    pub random_effects: Vec<RandomEffect>,

    /// Variance component estimates
    pub variance_components: Vec<VarianceComponent>,

    /// Random effect estimates (BLUPs)
    pub blups: Vec<RandomEffectEstimates>,

    /// Residual variance (for Gaussian) or dispersion parameter
    pub residual_variance: f64,

    /// Log-likelihood at convergence
    pub log_likelihood: f64,

    /// REML criterion (if REML was used)
    pub reml_criterion: Option<f64>,

    /// AIC (Akaike Information Criterion)
    pub aic: f64,

    /// BIC (Bayesian Information Criterion)
    pub bic: f64,

    /// Theta parameters (variance component parameterization)
    /// Log-Cholesky: [log(sd1), log(sd2), ..., raw_corr1, raw_corr2, ...]
    pub theta: Vec<f64>,

    /// Standard errors of theta parameters
    pub theta_se: Option<Vec<f64>>,

    /// Number of outer iterations
    pub outer_iterations: usize,

    /// Whether outer optimization converged
    pub converged: bool,

    /// Convergence message
    pub convergence_message: String,

    /// Control parameters used
    pub control: GlmmControl,

    /// Model formula (including random effects)
    pub formula: String,

    /// Summary of model fit
    pub fit_summary: GlmmFitSummary,
}

/// Summary statistics for GLMM fit
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct GlmmFitSummary {
    /// Number of observations
    pub n_observations: usize,
    /// Number of fixed effect parameters
    pub n_fixed: usize,
    /// Number of random effect parameters (total BLUPs)
    pub n_random: usize,
    /// Number of variance parameters (theta)
    pub n_variance_params: usize,
    /// Degrees of freedom for residuals
    pub df_residual: usize,
    /// Number of groups per random effect term
    pub n_groups: HashMap<String, usize>,
    /// Method used (ML or REML)
    pub method: String,
}

impl GlmmResult {
    /// Get fixed effect coefficients
    pub fn coefficients(&self) -> &[f64] {
        &self.glm_result.coefficients
    }

    /// Get fixed effect standard errors
    pub fn std_errors(&self) -> &[f64] {
        &self.glm_result.standard_errors
    }

    /// Get fixed effect names
    pub fn coefficient_names(&self) -> &[String] {
        &self.glm_result.model_matrix_column_names
    }

    /// Get variance for a specific random effect group
    pub fn get_variance(&self, group_name: &str) -> Option<&VarianceComponent> {
        self.variance_components
            .iter()
            .find(|vc| vc.group_name == group_name)
    }

    /// Get BLUPs for a specific random effect group
    pub fn get_blups(&self, group_name: &str) -> Option<&RandomEffectEstimates> {
        self.blups.iter().find(|b| b.group_name == group_name)
    }

    /// Total number of variance parameters
    pub fn n_variance_params(&self) -> usize {
        self.random_effects
            .iter()
            .map(|re| re.n_variance_params())
            .sum::<usize>()
            + 1 // +1 for residual variance (if applicable)
    }

    /// Check if model converged
    pub fn is_converged(&self) -> bool {
        self.converged
    }

    /// Get log-likelihood
    pub fn loglik(&self) -> f64 {
        self.log_likelihood
    }
}

/// Options for GLMM fitting
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct GlmmOptions {
    /// Whether to compute BLUPs
    pub compute_blups: bool,
    /// Whether to compute BLUP standard errors
    pub compute_blup_se: bool,
    /// Whether to compute conditional variance-covariance for BLUPs
    pub compute_blup_vcov: bool,
    /// Prior weights for observations
    pub weights: Option<Vec<f64>>,
    /// Offset vector
    pub offset: Option<Vec<f64>>,
    /// NA action
    pub na_action: String,
}

impl Default for GlmmOptions {
    fn default() -> Self {
        Self {
            compute_blups: true,
            compute_blup_se: true,
            compute_blup_vcov: false,
            weights: None,
            offset: None,
            na_action: "na.omit".to_string(),
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_random_effect_intercept() {
        let re = RandomEffect::intercept("group".to_string());
        assert_eq!(re.grouping_var, "group");
        assert_eq!(re.terms, vec!["1".to_string()]);
        assert_eq!(re.n_terms(), 1);
        assert_eq!(re.n_variance_params(), 1);
    }

    #[test]
    fn test_random_effect_intercept_slope() {
        let re = RandomEffect::intercept_slope("group".to_string(), "x".to_string());
        assert_eq!(re.grouping_var, "group");
        assert_eq!(re.terms, vec!["1".to_string(), "x".to_string()]);
        assert_eq!(re.n_terms(), 2);
        // Unstructured: 2 variances + 1 correlation = 3
        assert_eq!(re.n_variance_params(), 3);
    }

    #[test]
    fn test_variance_params_independent() {
        let mut re = RandomEffect::intercept_slope("group".to_string(), "x".to_string());
        re.covariance = CovarianceType::Independent;
        // Independent: 2 variances only
        assert_eq!(re.n_variance_params(), 2);
    }

    #[test]
    fn test_glmm_control_defaults() {
        let control = GlmmControl::new();
        assert_eq!(control.max_iter_outer, 100);
        assert_eq!(control.tol_outer, 1e-6);
        assert!(control.reml);
        assert!(!control.verbose);
    }

    #[test]
    fn test_glmm_control_builder() {
        let control = GlmmControl::new()
            .with_ml()
            .with_max_iter(50)
            .with_tolerance(1e-8)
            .with_verbose(true);

        assert!(!control.reml);
        assert_eq!(control.max_iter_outer, 50);
        assert_eq!(control.tol_outer, 1e-8);
        assert!(control.verbose);
    }

    #[test]
    fn test_variance_component_simple() {
        let vc = VarianceComponent::new_simple("group".to_string(), "intercept".to_string(), 4.0);
        assert_eq!(vc.group_name, "group");
        assert_eq!(vc.std_dev, vec![2.0]);
        assert_eq!(vc.vcov, vec![vec![4.0]]);
    }

    #[test]
    fn test_covariance_type_display() {
        assert_eq!(CovarianceType::Independent.to_string(), "independent");
        assert_eq!(CovarianceType::Unstructured.to_string(), "unstructured");
        assert_eq!(
            CovarianceType::CompoundSymmetry.to_string(),
            "compound_symmetry"
        );
    }
}
