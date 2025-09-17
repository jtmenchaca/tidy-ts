//! GLM fit utility QR functions
//!
//! This file contains QR decomposition and weighted least squares functions.

use crate::stats::regression::influence::QrLsResult;
use faer::{Mat, MatRef};

/// Solve weighted least squares problem
///
/// This function solves the weighted least squares problem using QR decomposition
/// with column pivoting.
///
/// # Arguments
///
/// * `x` - Design matrix (n × p)
/// * `y` - Response vector (n × 1)
/// * `tol` - Tolerance for rank determination
///
/// # Returns
///
/// A `QrLsResult` containing the solution and QR decomposition information.
///
/// # Errors
///
/// Returns an error if the QR decomposition or solving fails.
pub fn solve_weighted_ls(x: &[Vec<f64>], y: &[f64], tol: f64) -> Result<QrLsResult, String> {
    // Convert to faer matrices
    let n = x.len();
    let p = if n > 0 { x[0].len() } else { 0 };

    let mut x_mat = Mat::zeros(n, p);
    for (i, row) in x.iter().enumerate() {
        for (j, &val) in row.iter().enumerate() {
            x_mat.as_mut().write(i, j, val);
        }
    }

    let mut y_mat = Mat::zeros(n, 1);
    for (i, &val) in y.iter().enumerate() {
        y_mat.as_mut().write(i, 0, val);
    }

    // Use QR decomposition with column pivoting
    let qr = x_mat.col_piv_qr();
    let rank = qr.rank();

    // Solve the system using least squares
    let solution = qr
        .solve_lstsq(&y_mat)
        .map_err(|e| format!("QR solve failed: {:?}", e))?;

    // Extract coefficients
    let mut coefficients = vec![0.0; p];
    for i in 0..p.min(rank) {
        coefficients[i] = solution.read(i, 0);
    }

    // Create pivot vector
    let pivot: Vec<i32> = (0..p as i32).collect();

    Ok(QrLsResult {
        qr: x_mat.as_ref().to_owned().as_slice().to_vec(),
        qraux: vec![0.0; p.min(n)],
        coefficients,
        residuals: vec![0.0; n], // TODO: Calculate actual residuals
        effects: vec![0.0; n],   // TODO: Calculate actual effects
        rank,
        pivot,
        tol,
        pivoted: false,
    })
}
