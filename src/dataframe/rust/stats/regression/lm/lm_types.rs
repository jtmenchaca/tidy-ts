//! Linear model types and structures

use serde::{Deserialize, Serialize};

/// Result of QR decomposition with least-squares solving
#[derive(Debug, Clone)]
pub struct QrLsResult {
    pub qr: Vec<f64>,           // packed (column-major) QR factors
    pub qraux: Vec<f64>,        // auxiliary QR information (length min(n,p))
    pub coefficients: Vec<f64>, // p × ny, row-major
    pub residuals: Vec<f64>,    // n × ny, row-major
    pub effects: Vec<f64>,      // Qᵀ·y, n × ny, row-major
    pub rank: usize,
    pub pivot: Vec<i32>, // 1-based
    pub tol: f64,
    pub pivoted: bool,
}

/// Linear model result structure
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LmResult {
    pub coefficients: Vec<f64>,
    pub residuals: Vec<f64>,
    pub fitted_values: Vec<f64>,
    pub effects: Vec<f64>,
    pub rank: usize,
    pub df_residual: usize,
    pub qr: Option<QrResult>,
    pub assign: Option<Vec<i32>>,
    pub qr_rank: usize,
    pub pivot: Vec<i32>,
    pub tol: f64,
    pub pivoted: bool,
    /// Model weights
    pub weights: Option<Vec<f64>>,
    /// Deviance
    pub deviance: f64,
    /// Call information
    pub call: Option<String>,
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

/// Linear model fit options
#[derive(Debug, Clone)]
pub struct LmOptions {
    pub method: String,
    pub model: bool,
    pub x: bool,
    pub y: bool,
    pub qr: bool,
    pub singular_ok: bool,
    pub contrasts: Option<Vec<String>>,
    pub offset: Option<Vec<f64>>,
    pub weights: Option<Vec<f64>>,
    pub subset: Option<Vec<bool>>,
    pub na_action: String,
}

impl Default for LmOptions {
    fn default() -> Self {
        Self {
            method: "qr".to_string(),
            model: true,
            x: false,
            y: false,
            qr: true,
            singular_ok: true,
            contrasts: None,
            offset: None,
            weights: None,
            subset: None,
            na_action: "na.omit".to_string(),
        }
    }
}

/// Linear model summary structure
#[derive(Debug, Clone)]
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
#[derive(Debug, Clone)]
pub struct CoefficientSummary {
    pub estimate: f64,
    pub std_error: f64,
    pub t_value: f64,
    pub p_value: f64,
}

/// F-statistic for linear model
#[derive(Debug, Clone)]
pub struct FStatistic {
    pub value: f64,
    pub num_df: usize,
    pub den_df: usize,
    pub p_value: f64,
}

/// ANOVA table for linear model
#[derive(Debug, Clone)]
pub struct AnovaTable {
    pub rows: Vec<AnovaRow>,
}

/// ANOVA table row
#[derive(Debug, Clone)]
pub struct AnovaRow {
    pub source: String,
    pub df: usize,
    pub sum_sq: f64,
    pub mean_sq: f64,
    pub f_value: Option<f64>,
    pub p_value: Option<f64>,
}
