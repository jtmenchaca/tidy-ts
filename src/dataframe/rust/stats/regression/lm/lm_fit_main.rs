//! Main linear model fitting function
//!
//! This module contains the main lm() function for fitting linear models.

use crate::stats::regression::lm::lm_qr::cdqrls;
use crate::stats::regression::lm::lm_types::{LmOptions, LmResult, QrResult};

/// Main linear model function
pub fn lm(
    x: &[f64],
    y: &[f64],
    n: usize,
    p: usize,
    ny: usize,
    options: Option<LmOptions>,
) -> Result<LmResult, &'static str> {
    let opts = options.unwrap_or_default();

    // Basic validation
    if x.len() != n * p || y.len() != n * ny || n == 0 {
        return Err("dimension mismatch");
    }

    if !x.iter().all(|v| v.is_finite()) || !y.iter().all(|v| v.is_finite()) {
        return Err("NA/NaN/Inf in input data");
    }

    // Check for empty model
    if p == 0 {
        return Ok(LmResult {
            coefficients: vec![],
            residuals: y.to_vec(),
            fitted_values: vec![0.0; n * ny],
            effects: vec![],
            rank: 0,
            df_residual: n,
            qr: None,
            assign: None,
            qr_rank: 0,
            pivot: vec![],
            tol: 0.0,
            pivoted: false,
            weights: None,
            deviance: 0.0,
            call: None,
        });
    }

    // Apply weights if provided
    let (x_weighted, y_weighted) = if let Some(weights) = &opts.weights {
        if weights.len() != n {
            return Err("weights length must match number of observations");
        }
        if !weights.iter().all(|w| w.is_finite() && *w >= 0.0) {
            return Err("weights must be finite and non-negative");
        }

        let sqrt_weights: Vec<f64> = weights.iter().map(|w| w.sqrt()).collect();

        // Apply weights to X and y
        let mut x_w = vec![0.0; n * p];
        let mut y_w = vec![0.0; n * ny];

        for i in 0..n {
            let w = sqrt_weights[i];
            for j in 0..p {
                x_w[i + j * n] = x[i + j * n] * w;
            }
            for j in 0..ny {
                y_w[i + j * n] = y[i + j * n] * w;
            }
        }

        (x_w, y_w)
    } else {
        (x.to_vec(), y.to_vec())
    };

    // Apply offset if provided
    let y_offset = if let Some(offset) = &opts.offset {
        if offset.len() != n * ny {
            return Err("offset length must match number of observations");
        }
        y_weighted
            .iter()
            .zip(offset.iter())
            .map(|(y, o)| y - o)
            .collect()
    } else {
        y_weighted
    };

    // Perform QR decomposition and least squares
    let qr_result = cdqrls(&x_weighted, &y_offset, n, p, ny, Some(1e-7))?;

    // Calculate fitted values
    let mut fitted_values = vec![0.0; n * ny];
    for i in 0..n {
        for j in 0..ny {
            let mut sum = 0.0;
            for k in 0..p {
                sum += x[i + k * n] * qr_result.coefficients[k * ny + j];
            }
            fitted_values[i * ny + j] = sum;
        }
    }

    // Add offset back to fitted values
    if let Some(offset) = &opts.offset {
        for i in 0..n * ny {
            fitted_values[i] += offset[i];
        }
    }

    // Calculate residuals
    let residuals: Vec<f64> = y.iter().zip(&fitted_values).map(|(y, f)| y - f).collect();

    // Clone pivot before first use
    let pivot = qr_result.pivot.clone();

    // Create QR result if requested
    let qr = if opts.qr {
        Some(QrResult {
            qr: qr_result.qr,
            qraux: qr_result.qraux,
            pivot: qr_result.pivot,
            tol: qr_result.tol,
            rank: qr_result.rank,
        })
    } else {
        None
    };

    Ok(LmResult {
        coefficients: qr_result.coefficients,
        residuals,
        fitted_values,
        effects: qr_result.effects,
        rank: qr_result.rank,
        df_residual: n - qr_result.rank,
        qr,
        assign: None, // TODO: implement assign
        qr_rank: qr_result.rank,
        pivot,
        tol: qr_result.tol,
        pivoted: qr_result.pivoted,
        weights: None,
        deviance: 0.0, // TODO: Calculate actual deviance
        call: None,
    })
}
