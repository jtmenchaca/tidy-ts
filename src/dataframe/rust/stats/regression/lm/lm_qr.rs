//! QR decomposition and least-squares solving for linear models

use super::lm_types::QrLsResult;
use faer::Mat;
use faer::linalg::solvers::{ColPivQr, Solve};

/// Column-pivoted QR + least-squares (replacement for R's `dqrls`).
///
/// `x` is column-major (n×p) and `y` is row-major (n×ny).
pub fn cdqrls(
    x: &[f64],
    y: &[f64],
    n: usize,
    p: usize,
    ny: usize,
    tol: Option<f64>,
) -> Result<QrLsResult, &'static str> {
    /* ---------- basic checks ---------- */
    if x.len() != n * p || y.len() != n * ny || n == 0 || p == 0 {
        return Err("dimension mismatch");
    }
    if !x.iter().all(|v| v.is_finite()) || !y.iter().all(|v| v.is_finite()) {
        return Err("NA/NaN/Inf in input data");
    }

    /* ---------- build faer matrices ---------- */
    // faer is row-major internally so we transpose the col-major input on the fly
    let x_mat = Mat::from_fn(n, p, |i, j| x[i + j * n]);
    let y_mat = Mat::from_fn(n, ny, |i, j| y[i + j * n]);

    /* ---------- QR with column pivoting ---------- */
    // 1. build the factorisation (pure Rust, WASM-safe)
    let qr = ColPivQr::new(x_mat.as_ref()); // APᵀ = Q R

    // 2. numerical rank from the R‐factor diagonal
    let r = qr.R(); // upper-triangular R
    let k = n.min(p);
    let max_d = (0..k).map(|i| r[(i, i)].abs()).fold(0.0, f64::max);
    let tol_eff = tol.unwrap_or(f64::EPSILON * (n.max(p) as f64) * max_d);
    let rank = (0..k).take_while(|&i| r[(i, i)].abs() > tol_eff).count();

    // 3. least-squares solution: solve  min‖A β - Y‖₂
    let coef = qr.solve(y_mat.as_ref());

    // 4. full Q (needed for effects = QᵀY)
    let q = qr.compute_Q();

    // 5. column permutation → 1-based pivot vector
    let perm = qr.P();
    let forward = perm.canonicalized().arrays().0; // forward[i] = col index
    let pivot: Vec<i32> = forward.iter().map(|&idx| idx as i32 + 1).collect();

    /* ---------- diagnostics ---------- */
    // Residuals  (row-major, n × ny)
    let fitted = &x_mat * &coef; // n × ny
    let residuals = Mat::from_fn(n, ny, |i, j| y_mat[(i, j)] - fitted[(i, j)]);

    // Effects = QᵀY
    let effects = q.transpose() * &y_mat;

    /* ---------- pack outputs to match the old layout ---------- */
    let mut qr_packed = vec![0.0; n * p];
    // Store R in upper-triangular part, Q's reflectors below
    for j in 0..p {
        for i in 0..n {
            if i <= j {
                qr_packed[i + j * n] = r[(i, j)];
            } else {
                qr_packed[i + j * n] = q[(i, j)];
            }
        }
    }

    // qraux: diagonal of R (length min(n,p))
    let qraux: Vec<f64> = (0..k).map(|i| r[(i, i)]).collect();

    // Convert matrices back to the expected layout
    let coef_data: Vec<f64> = (0..p)
        .flat_map(|i| (0..ny).map(move |j| coef[(i, j)]))
        .collect();
    let residuals_data: Vec<f64> = (0..n)
        .flat_map(|i| (0..ny).map(move |j| residuals[(i, j)]))
        .collect();
    let effects_data: Vec<f64> = (0..n)
        .flat_map(|i| (0..ny).map(move |j| effects[(i, j)]))
        .collect();

    let mut coefficients = Vec::with_capacity(p * ny);
    for j in 0..ny {
        for i in 0..p {
            coefficients.push(coef_data[i * ny + j]);
        }
    }

    let mut residuals_vec = Vec::with_capacity(n * ny);
    for j in 0..ny {
        for i in 0..n {
            residuals_vec.push(residuals_data[i * ny + j]);
        }
    }

    let mut effects_vec = Vec::with_capacity(n * ny);
    for j in 0..ny {
        for i in 0..n {
            effects_vec.push(effects_data[i * ny + j]);
        }
    }

    Ok(QrLsResult {
        qr: qr_packed,
        qraux,
        coefficients,
        residuals: residuals_vec,
        effects: effects_vec,
        rank,
        pivot,
        tol: tol_eff,
        pivoted: true,
    })
}
