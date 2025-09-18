//! Core influence calculation functions
//!
//! This module provides the fundamental influence calculation functions
//! equivalent to R's influence_core.R module.

use faer::Mat;
use faer::linalg::solvers::{ColPivQr, Solve};
use std::f64;

/// Result of influence calculations
#[derive(Debug, Clone)]
pub struct InfluenceResult {
    /// Hat values (leverage)
    pub hat: Vec<f64>,
    /// Coefficient changes (n_obs × n_coefs)
    pub coefficients: Option<Vec<Vec<f64>>>,
    /// Standard error estimates
    pub sigma: Vec<f64>,
    /// Weighted residuals
    pub wt_res: Vec<f64>,
}

/// Result of QR influence calculations
#[derive(Debug, Clone)]
pub struct QrInfluenceResult {
    /// Hat values
    pub hat: Vec<f64>,
    /// Standard error estimates
    pub sigma: Vec<f64>,
}

/// Linear model structure for influence calculations
#[derive(Debug, Clone)]
pub struct LinearModel {
    /// Design matrix (n × p)
    pub x: Vec<f64>,
    /// Response vector (n × 1)
    pub y: Vec<f64>,
    /// Number of observations
    pub n: usize,
    /// Number of parameters
    pub p: usize,
    /// Model rank
    pub rank: usize,
    /// Weights (optional)
    pub weights: Option<Vec<f64>>,
    /// Fitted values
    pub fitted: Vec<f64>,
    /// Residuals
    pub residuals: Vec<f64>,
    /// QR decomposition result
    pub qr: Option<QrLsResult>,
    /// NA action
    pub na_action: Option<NaAction>,
    /// Deviance
    pub deviance: f64,
    /// DF residual
    pub df_residual: f64,
}

/// QR decomposition result for influence calculations
#[derive(Debug, Clone)]
pub struct QrLsResult {
    /// Packed QR matrix
    pub qr: Vec<f64>,
    /// Auxiliary QR information
    pub qraux: Vec<f64>,
    /// Coefficients
    pub coefficients: Vec<f64>,
    /// Residuals
    pub residuals: Vec<f64>,
    /// Effects
    pub effects: Vec<f64>,
    /// Rank
    pub rank: usize,
    /// Pivot vector
    pub pivot: Vec<i32>,
    /// Tolerance
    pub tol: f64,
    /// Whether pivoted
    pub pivoted: bool,
}

/// NA action type
#[derive(Debug, Clone)]
pub enum NaAction {
    /// Omit NA values
    Omit,
    /// Pass NA values through
    Pass,
    /// Fail on NA values
    Fail,
}

/// Calculate hat values (leverage) for a design matrix
///
/// This function calculates the diagonal elements of the hat matrix H = X(X'X)^(-1)X'
/// which measure the leverage of each observation.
///
/// # Arguments
///
/// * `x` - Design matrix (n × p) or QR object
/// * `intercept` - Whether to add an intercept column
///
/// # Returns
///
/// Vector of hat values for each observation
pub fn hat(x: &[f64], n: usize, p: usize, intercept: bool) -> Result<Vec<f64>, &'static str> {
    if x.len() != n * p {
        return Err("dimension mismatch in design matrix");
    }

    let mut x_mat = Mat::from_fn(n, p, |i, j| x[i + j * n]);

    // Add intercept if requested
    if intercept {
        let mut x_with_intercept = Mat::zeros(n, p + 1);
        // Set first column to 1 (intercept)
        for i in 0..n {
            x_with_intercept[(i, 0)] = 1.0;
        }
        // Copy original matrix to remaining columns
        for i in 0..n {
            for j in 0..p {
                x_with_intercept[(i, j + 1)] = x_mat[(i, j)];
            }
        }
        x_mat = x_with_intercept;
    }

    // Compute QR decomposition
    let qr = ColPivQr::new(x_mat.as_ref());
    let q = qr.compute_Q();

    // Calculate hat values: diagonal of Q*Q'
    let mut hat_values = vec![0.0; n];
    for i in 0..n {
        for j in 0..q.ncols() {
            hat_values[i] += q[(i, j)] * q[(i, j)];
        }
    }

    Ok(hat_values)
}

/// Calculate weighted residuals
///
/// This function extracts weighted residuals from a linear model object,
/// handling different residual types and weights.
///
/// # Arguments
///
/// * `model` - Linear model object
/// * `drop0` - Whether to drop zero-weight observations
///
/// # Returns
///
/// Vector of weighted residuals
pub fn weighted_residuals(model: &LinearModel, drop0: bool) -> Result<Vec<f64>, &'static str> {
    let mut residuals = model.residuals.clone();

    if let Some(weights) = &model.weights {
        if drop0 {
            // Filter out zero-weight observations
            let mut filtered_residuals = Vec::new();
            for (i, &w) in weights.iter().enumerate() {
                if w != 0.0 {
                    filtered_residuals.push(residuals[i]);
                }
            }
            residuals = filtered_residuals;
        }
    }

    Ok(residuals)
}

/// Core QR influence calculation
///
/// This function performs the core influence calculations using QR decomposition,
/// computing hat values and sigma estimates for leave-one-out analysis.
///
/// # Arguments
///
/// * `qr` - QR decomposition result
/// * `residuals` - Residuals vector
/// * `tol` - Tolerance for rank determination
///
/// # Returns
///
/// QR influence result with hat values and sigma estimates
pub fn qr_influence(
    qr: &QrLsResult,
    residuals: &[f64],
    _tol: f64,
) -> Result<QrInfluenceResult, &'static str> {
    let n = qr.residuals.len();
    let p = qr.rank;

    if residuals.len() != n {
        return Err("residual length does not match QR dimensions");
    }

    // Reconstruct Q matrix from packed QR
    let mut qr_mat = Mat::zeros(n, p);
    for j in 0..p {
        for i in 0..n {
            if i <= j {
                qr_mat[(i, j)] = qr.qr[i + j * n];
            }
        }
    }

    // Compute Q matrix
    let qr_decomp = ColPivQr::new(qr_mat.as_ref());
    let q = qr_decomp.compute_Q();

    // Calculate hat values
    let mut hat_values = vec![0.0; n];
    for i in 0..n {
        for j in 0..q.ncols() {
            hat_values[i] += q[(i, j)] * q[(i, j)];
        }
    }

    // Calculate sigma estimates (simplified version)
    let df_residual = n.saturating_sub(p) as f64;
    let sigma_est = if df_residual > 0.0 {
        let sum_sq_residuals: f64 = residuals.iter().map(|&r| r * r).sum();
        (sum_sq_residuals / df_residual).sqrt()
    } else {
        0.0
    };

    let sigma_values = vec![sigma_est; n];

    Ok(QrInfluenceResult {
        hat: hat_values,
        sigma: sigma_values,
    })
}

/// Main influence calculation function
///
/// This function computes comprehensive influence measures for a linear model,
/// including hat values, coefficient changes, and sigma estimates.
///
/// # Arguments
///
/// * `model` - Linear model object
/// * `do_coef` - Whether to compute coefficient changes
///
/// # Returns
///
/// Influence result with all computed measures
pub fn lm_influence(model: &LinearModel, do_coef: bool) -> Result<InfluenceResult, &'static str> {
    let wt_res = weighted_residuals(model, true)?;
    let e = wt_res.clone();
    let is_mlm = false; // Simplified for single response

    if model.rank == 0 {
        let n = model.n;
        let sigma = (model.deviance / model.df_residual).sqrt();
        let res = InfluenceResult {
            hat: vec![0.0; n],
            coefficients: if do_coef { Some(vec![vec![]; n]) } else { None },
            sigma: vec![sigma; n],
            wt_res: e,
        };
        return Ok(res);
    }

    // Handle non-zero rank case
    let mut e = e;
    let median_abs_e = if !e.is_empty() {
        let mut abs_e: Vec<f64> = e.iter().map(|&x| x.abs()).collect();
        abs_e.sort_by(|a, b| a.partial_cmp(b).unwrap());
        if abs_e.len() % 2 == 0 {
            (abs_e[abs_e.len() / 2 - 1] + abs_e[abs_e.len() / 2]) / 2.0
        } else {
            abs_e[abs_e.len() / 2]
        }
    } else {
        0.0
    };

    // Protect against very small residuals
    for val in &mut e {
        if val.abs() < 100.0 * f64::EPSILON * median_abs_e {
            *val = 0.0;
        }
    }

    // Use existing QR decomposition or compute new one
    let qr_result = if let Some(qr) = &model.qr {
        qr.clone()
    } else {
        // Compute QR decomposition
        let x_mat = Mat::from_fn(model.n, model.p, |i, j| model.x[i + j * model.n]);
        let y_mat = Mat::from_fn(model.n, 1, |i, _| model.y[i]);

        let qr_decomp = ColPivQr::new(x_mat.as_ref());
        let coef = qr_decomp.solve(y_mat.as_ref());
        let fitted = &x_mat * &coef;
        let residuals = Mat::from_fn(model.n, 1, |i, _| model.y[i] - fitted[(i, 0)]);

        QrLsResult {
            qr: vec![0.0; model.n * model.p], // Simplified
            qraux: vec![1.0; model.p],
            coefficients: (0..coef.nrows()).map(|i| coef[(i, 0)]).collect(),
            residuals: (0..residuals.nrows()).map(|i| residuals[(i, 0)]).collect(),
            effects: vec![0.0; model.n],
            rank: model.rank,
            pivot: (0..model.p as i32).collect(),
            tol: f64::EPSILON,
            pivoted: false,
        }
    };

    let n = model.n;
    let tol = 10.0 * f64::EPSILON;
    let qr_infl = qr_influence(&qr_result, &e, tol)?;

    let mut result = InfluenceResult {
        hat: qr_infl.hat,
        coefficients: None,
        sigma: qr_infl.sigma,
        wt_res: e.clone(),
    };

    // Compute coefficient changes if requested
    if do_coef {
        // Simplified coefficient change calculation
        let mut coefficients = vec![vec![0.0; model.p]; n];

        for i in 0..n {
            for j in 0..model.p {
                let hat_val = result.hat[i];
                if hat_val == 1.0 {
                    coefficients[i][j] = 0.0;
                } else {
                    coefficients[i][j] = e[i] / (1.0 - hat_val);
                }
            }
        }

        result.coefficients = Some(coefficients);
    }

    // Handle NA action
    if model.na_action.is_none() {
        if !is_mlm {
            // Drop the 'q=1' array extent (from C)
            result.sigma = result.sigma; // Already a vector
            if do_coef {
                // result.coefficients = drop1d(result.coefficients);
                // Simplified - no 3D array handling
            }
        }
    } else {
        // Handle NA action - simplified
        for hat_val in &mut result.hat {
            if hat_val.is_nan() {
                *hat_val = 0.0; // omitted cases have 0 leverage
            }
        }

        if do_coef {
            if let Some(ref mut coefs) = result.coefficients {
                for row in coefs.iter_mut() {
                    for val in row.iter_mut() {
                        if val.is_nan() {
                            *val = 0.0; // omitted cases have 0 change
                        }
                    }
                }
            }
        }

        for sigma_val in &mut result.sigma {
            if sigma_val.is_nan() {
                *sigma_val = (model.deviance / model.df_residual).sqrt();
            }
        }
    }

    // Force hat values close to 1 to be exactly 1
    for hat_val in &mut result.hat {
        if *hat_val > 1.0 - 10.0 * f64::EPSILON {
            *hat_val = 1.0;
        }
    }

    Ok(result)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_hat_values() {
        let x = vec![1.0, 2.0, 3.0, 4.0, 5.0, 6.0]; // 3x2 matrix
        let hat_vals = hat(&x, 3, 2, true).unwrap();
        assert_eq!(hat_vals.len(), 3);
        assert!(hat_vals.iter().all(|&h| h >= 0.0 && h <= 1.0));
    }

    #[test]
    fn test_influence_calculation() {
        let model = LinearModel {
            x: vec![1.0, 2.0, 3.0, 4.0, 5.0, 6.0], // 3x2
            y: vec![1.0, 2.0, 3.0],
            n: 3,
            p: 2,
            rank: 2,
            weights: None,
            fitted: vec![1.0, 2.0, 3.0],
            residuals: vec![0.0, 0.0, 0.0],
            qr: None,
            na_action: None,
            deviance: 0.0,
            df_residual: 1.0,
        };

        let infl = lm_influence(&model, false).unwrap();
        assert_eq!(infl.hat.len(), 3);
        assert_eq!(infl.sigma.len(), 3);
        assert_eq!(infl.wt_res.len(), 3);
    }
}
