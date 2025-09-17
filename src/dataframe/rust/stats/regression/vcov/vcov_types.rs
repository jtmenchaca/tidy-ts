//! Variance-covariance matrix types and structures

use serde::{Deserialize, Serialize};

/// Trait for objects that can provide variance-covariance matrices
pub trait VcovObject {
    fn vcov(&self, complete: bool) -> Result<Vec<Vec<f64>>, &'static str>;
}

/// Trait for objects that can provide sigma values
pub trait SigmaObject {
    fn sigma(&self) -> Result<f64, &'static str>;
}

/// Trait for objects that can provide deviance
pub trait DevianceObject {
    fn deviance(&self) -> f64;
}

/// Trait for objects that can provide number of observations
pub trait NobsObject {
    fn nobs(&self) -> usize;
}

/// Trait for objects that can provide coefficients
pub trait CoefObject {
    fn coef(&self) -> &[f64];
}

/// Linear model object for vcov calculations
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LmObject {
    pub coefficients: Vec<f64>,
    pub residuals: Vec<f64>,
    pub fitted_values: Vec<f64>,
    pub rank: usize,
    pub df_residual: usize,
    pub qr: Option<QrResult>,
    pub assign: Option<Vec<i32>>,
    pub qr_rank: usize,
    pub pivot: Vec<i32>,
    pub tol: f64,
    pub pivoted: bool,
}

/// QR decomposition result
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct QrResult {
    pub qr: Vec<f64>,
    pub qraux: Vec<f64>,
    pub pivot: Vec<i32>,
    pub tol: f64,
    pub rank: usize,
}

/// Linear model summary object
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LmSummary {
    pub coefficients: Vec<CoefficientSummary>,
    pub sigma: f64,
    pub df: Vec<usize>,
    pub r_squared: f64,
    pub adj_r_squared: f64,
    pub fstatistic: Option<FStatistic>,
    pub cov_unscaled: Vec<Vec<f64>>,
    pub correlation: Option<Vec<Vec<f64>>>,
}

/// Coefficient summary for linear model
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CoefficientSummary {
    pub estimate: f64,
    pub std_error: f64,
    pub t_value: f64,
    pub p_value: f64,
}

/// F-statistic for linear model
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FStatistic {
    pub value: f64,
    pub num_df: usize,
    pub den_df: usize,
    pub p_value: f64,
}

/// GLM object for vcov calculations
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GlmObject {
    pub coefficients: Vec<f64>,
    pub residuals: Vec<f64>,
    pub fitted_values: Vec<f64>,
    pub rank: usize,
    pub df_residual: usize,
    pub family: String,
    pub linear_predictors: Vec<f64>,
    pub deviance: f64,
    pub aic: f64,
    pub null_deviance: f64,
    pub iter: usize,
    pub weights: Vec<f64>,
    pub prior_weights: Vec<f64>,
    pub y: Vec<f64>,
    pub converged: bool,
    pub boundary: bool,
}

/// GLM summary object
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GlmSummary {
    pub coefficients: Vec<CoefficientSummary>,
    pub dispersion: f64,
    pub df: Vec<usize>,
    pub null_deviance: f64,
    pub deviance: f64,
    pub aic: f64,
    pub iter: usize,
    pub deviance_resid: Vec<f64>,
    pub df_residual: usize,
    pub null_df: usize,
    pub converged: bool,
    pub boundary: bool,
}

/// Multivariate linear model object
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MlmObject {
    pub coefficients: Vec<Vec<f64>>,
    pub residuals: Vec<Vec<f64>>,
    pub fitted_values: Vec<Vec<f64>>,
    pub rank: usize,
    pub df_residual: usize,
    pub qr: Option<QrResult>,
    pub assign: Option<Vec<i32>>,
    pub qr_rank: usize,
    pub pivot: Vec<i32>,
    pub tol: f64,
    pub pivoted: bool,
}

/// Multivariate linear model summary object
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MlmSummary {
    pub coefficients: Vec<Vec<CoefficientSummary>>,
    pub sigma: Vec<Vec<f64>>,
    pub df: Vec<usize>,
    pub r_squared: Vec<f64>,
    pub adj_r_squared: Vec<f64>,
    pub fstatistic: Vec<Option<FStatistic>>,
    pub cov_unscaled: Vec<Vec<Vec<f64>>>,
    pub correlation: Vec<Option<Vec<Vec<f64>>>>,
}
