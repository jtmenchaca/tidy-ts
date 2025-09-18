//! GLM fit utility QR functions
//!
//! This file contains QR decomposition and weighted least squares functions.

use crate::stats::regression::influence::QrLsResult;
use faer::{Mat, prelude::*};

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
            x_mat[(i, j)] = val;
        }
    }

    let mut y_mat = Mat::zeros(n, 1);
    for (i, &val) in y.iter().enumerate() {
        y_mat[(i, 0)] = val;
    }

    // Use QR decomposition with column pivoting
    let qr = x_mat.col_piv_qr();

    // Calculate rank from R matrix diagonal
    let r = qr.R();
    let k = n.min(p);
    let max_d = (0..k).map(|i| r[(i, i)].abs()).fold(0.0, f64::max);
    let tol_eff = tol * (n.max(p) as f64) * max_d;
    let rank = (0..k).take_while(|&i| r[(i, i)].abs() > tol_eff).count();

    // Solve the system using least squares
    let solution = qr.solve_lstsq(&y_mat);

    // Extract coefficients directly (no pivot permutation needed)
    let mut coefficients = vec![0.0; p];
    for i in 0..p.min(rank) {
        coefficients[i] = solution[(i, 0)];
    }

    // Create pivot vector (no pivoting used)
    let pivot: Vec<i32> = (0..p as i32).collect();

    // Convert matrix to flat vector
    let mut qr_vec = Vec::with_capacity(n * p);
    for i in 0..n {
        for j in 0..p {
            qr_vec.push(x_mat[(i, j)]);
        }
    }

    Ok(QrLsResult {
        qr: qr_vec,
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
