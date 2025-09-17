//! Linear model fitting functions

use super::lm_qr::cdqrls;
use super::lm_types::{LmOptions, LmResult, QrResult};

/// Main linear model fitting function
pub fn lm(
    x: &[f64],
    y: &[f64],
    n: usize,
    p: usize,
    ny: usize,
    options: Option<LmOptions>,
) -> Result<LmResult, &'static str> {
    let opts = options.unwrap_or_default();

    // Handle empty model case
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

    // Check for weights
    if let Some(weights) = &opts.weights {
        return lm_wfit(x, y, weights, n, p, ny, Some(opts.clone()), true);
    }

    // Standard QR decomposition
    let qr_result = cdqrls(x, y, n, p, ny, None)?;

    // Convert to LmResult
    let coefficients = qr_result.coefficients.clone();
    let mut fitted_values = Vec::with_capacity(n * ny);

    for j in 0..ny {
        for i in 0..n {
            let mut sum = 0.0;
            for k in 0..p {
                sum += x[i + k * n] * coefficients[k + j * p];
            }
            fitted_values.push(sum);
        }
    }

    let qr = if opts.qr {
        Some(QrResult {
            qr: qr_result.qr.clone(),
            qraux: qr_result.qraux.clone(),
            pivot: qr_result.pivot.clone(),
            tol: qr_result.tol,
            rank: qr_result.rank,
        })
    } else {
        None
    };

    Ok(LmResult {
        coefficients,
        residuals: qr_result.residuals,
        fitted_values,
        effects: qr_result.effects,
        rank: qr_result.rank,
        df_residual: n - qr_result.rank,
        qr,
        assign: None,
        qr_rank: qr_result.rank,
        pivot: qr_result.pivot,
        tol: qr_result.tol,
        pivoted: qr_result.pivoted,
    })
}

/// Weighted linear model fitting function
pub fn lm_wfit(
    x: &[f64],
    y: &[f64],
    weights: &[f64],
    n: usize,
    p: usize,
    ny: usize,
    options: Option<LmOptions>,
    _singular_ok: bool,
) -> Result<LmResult, &'static str> {
    let opts = options.unwrap_or_default();

    // Validate weights
    if weights.len() != n {
        return Err("weights length must match number of observations");
    }
    if !weights.iter().all(|&w| w >= 0.0) {
        return Err("weights must be non-negative");
    }
    if weights.iter().all(|&w| w == 0.0) {
        return Err("all weights are zero");
    }

    // Handle empty model case
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

    // Apply weights: W^(1/2) * X and W^(1/2) * Y
    let sqrt_weights: Vec<f64> = weights.iter().map(|&w| w.sqrt()).collect();

    let mut wx = vec![0.0; n * p];
    let mut wy = vec![0.0; n * ny];

    for i in 0..n {
        let w_sqrt = sqrt_weights[i];
        for j in 0..p {
            wx[i + j * n] = x[i + j * n] * w_sqrt;
        }
        for j in 0..ny {
            wy[i + j * n] = y[i + j * n] * w_sqrt;
        }
    }

    // Fit weighted model
    let qr_result = cdqrls(&wx, &wy, n, p, ny, None)?;

    // Convert back to original scale for residuals and fitted values
    let coefficients = qr_result.coefficients.clone();
    let mut fitted_values = Vec::with_capacity(n * ny);

    for j in 0..ny {
        for i in 0..n {
            let mut sum = 0.0;
            for k in 0..p {
                sum += x[i + k * n] * coefficients[k + j * p];
            }
            fitted_values.push(sum);
        }
    }

    let mut residuals = Vec::with_capacity(n * ny);
    for j in 0..ny {
        for i in 0..n {
            residuals.push(y[i + j * n] - fitted_values[i + j * n]);
        }
    }

    let qr = if opts.qr {
        Some(QrResult {
            qr: qr_result.qr.clone(),
            qraux: qr_result.qraux.clone(),
            pivot: qr_result.pivot.clone(),
            tol: qr_result.tol,
            rank: qr_result.rank,
        })
    } else {
        None
    };

    Ok(LmResult {
        coefficients,
        residuals,
        fitted_values,
        effects: qr_result.effects,
        rank: qr_result.rank,
        df_residual: n - qr_result.rank,
        qr,
        assign: None,
        qr_rank: qr_result.rank,
        pivot: qr_result.pivot,
        tol: qr_result.tol,
        pivoted: qr_result.pivoted,
    })
}
