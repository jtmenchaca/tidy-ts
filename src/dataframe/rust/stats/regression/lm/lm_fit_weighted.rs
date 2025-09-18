//! Weighted linear model fitting function
//!
//! This module contains the lm_wfit() function for fitting weighted linear models.

use crate::stats::regression::lm::lm_qr::cdqrls;
use crate::stats::regression::lm::lm_types::{LmResult, QrResult};

/// Weighted linear model fit
pub fn lm_wfit(
    x: &[f64],
    y: &[f64],
    w: &[f64],
    n: usize,
    p: usize,
    ny: usize,
    offset: Option<&[f64]>,
    singular_ok: bool,
) -> Result<LmResult, &'static str> {
    // Basic validation
    if x.len() != n * p || y.len() != n * ny || w.len() != n || n == 0 {
        return Err("dimension mismatch");
    }

    if !x.iter().all(|v| v.is_finite())
        || !y.iter().all(|v| v.is_finite())
        || !w.iter().all(|v| v.is_finite())
    {
        return Err("NA/NaN/Inf in input data");
    }

    if w.iter().any(|&w| w < 0.0) {
        return Err("negative weights not allowed");
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

    // Handle zero weights
    let zero_weights = w.iter().any(|&w| w == 0.0);
    let (x_work, y_work, w_work) = if zero_weights {
        let mut x_work = Vec::new();
        let mut y_work = Vec::new();
        let mut w_work = Vec::new();

        for i in 0..n {
            if w[i] != 0.0 {
                for j in 0..p {
                    x_work.push(x[i + j * n]);
                }
                for j in 0..ny {
                    y_work.push(y[i + j * n]);
                }
                w_work.push(w[i]);
            }
        }

        (x_work, y_work, w_work)
    } else {
        (x.to_vec(), y.to_vec(), w.to_vec())
    };

    let n_work = w_work.len();
    if n_work == 0 {
        return Err("all weights are zero");
    }

    // Apply weights
    let sqrt_weights: Vec<f64> = w_work.iter().map(|w| w.sqrt()).collect();
    let mut x_weighted = vec![0.0; n_work * p];
    let mut y_weighted = vec![0.0; n_work * ny];

    for i in 0..n_work {
        let w = sqrt_weights[i];
        for j in 0..p {
            x_weighted[i + j * n_work] = x_work[i + j * n_work] * w;
        }
        for j in 0..ny {
            y_weighted[i + j * n_work] = y_work[i + j * n_work] * w;
        }
    }

    // Apply offset if provided
    let y_offset = if let Some(offset) = offset {
        if offset.len() != n * ny {
            return Err("offset length must match number of observations");
        }
        let mut y_off = Vec::new();
        for i in 0..n {
            if w[i] != 0.0 {
                for j in 0..ny {
                    y_off.push(y_weighted[i * ny + j] - offset[i * ny + j]);
                }
            }
        }
        y_off
    } else {
        y_weighted
    };

    // Perform QR decomposition
    let qr_result = cdqrls(&x_weighted, &y_offset, n_work, p, ny, Some(1e-7))?;

    if !singular_ok && qr_result.rank < p {
        return Err("singular fit encountered");
    }

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
    if let Some(offset) = offset {
        for i in 0..n * ny {
            fitted_values[i] += offset[i];
        }
    }

    // Calculate residuals
    let residuals: Vec<f64> = y.iter().zip(&fitted_values).map(|(y, f)| y - f).collect();

    Ok(LmResult {
        coefficients: qr_result.coefficients,
        residuals,
        fitted_values,
        effects: qr_result.effects,
        rank: qr_result.rank,
        df_residual: n_work - qr_result.rank,
        qr: Some(QrResult {
            qr: qr_result.qr,
            qraux: qr_result.qraux,
            pivot: qr_result.pivot.clone(),
            tol: qr_result.tol,
            rank: qr_result.rank,
        }),
        assign: None, // TODO: implement assign
        qr_rank: qr_result.rank,
        pivot: qr_result.pivot,
        tol: qr_result.tol,
        pivoted: qr_result.pivoted,
        weights: Some(w.to_vec()),
        deviance: 0.0, // TODO: Calculate actual deviance
        call: None,
    })
}
