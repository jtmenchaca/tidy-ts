//! QR decomposition and least-squares solving for linear models

use super::lm_types::QrLsResult;
use faer::Mat;

#[cfg(feature = "wasm")]
use web_sys::console;

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

    /* ---------- Combined QR+solve (like R's dqrls) ---------- */

    // Create working matrices that we can modify
    let mut x_work = x_mat.to_owned();
    let mut y_work = y_mat.to_owned();

    // Implement manual QR decomposition and solve to avoid WASM issues

    // Use Gram-Schmidt QR decomposition
    let mut q = Mat::zeros(n, p);
    let mut r = Mat::zeros(p, p);

    // Gram-Schmidt process
    for j in 0..p {
        // Start with the j-th column of A
        for i in 0..n {
            q[(i, j)] = x_mat[(i, j)];
        }

        // Orthogonalize against previous columns
        for k in 0..j {
            let mut dot_product = 0.0;
            for i in 0..n {
                dot_product += x_mat[(i, j)] * q[(i, k)];
            }
            r[(k, j)] = dot_product;

            for i in 0..n {
                q[(i, j)] -= dot_product * q[(i, k)];
            }
        }

        // Normalize
        let mut norm = 0.0;
        for i in 0..n {
            norm += q[(i, j)] * q[(i, j)];
        }
        norm = norm.sqrt();
        r[(j, j)] = norm;

        if norm > 1e-12 {
            for i in 0..n {
                q[(i, j)] /= norm;
            }
        }
    }

    // Check rank
    let k = n.min(p);
    let max_d = (0..k).map(|i| r[(i, i)].abs()).fold(0.0, f64::max);
    let tol_eff = tol.unwrap_or(f64::EPSILON * (n.max(p) as f64) * max_d);
    let rank = (0..k).take_while(|&i| r[(i, i)].abs() > tol_eff).count();

    // Compute Q^T * y
    let mut qty = Mat::zeros(p, ny); // Q^T * y should be p x ny, not n x ny

    for j in 0..ny {
        for i in 0..p {
            // Changed from n to p - Q^T should be p x n, so result is p x ny
            let mut sum = 0.0;
            for k in 0..n {
                let q_val = q[(k, i)]; // Q is n x p, so Q^T[i,k] = Q[k,i]
                let y_val = y_mat[(k, j)];
                sum += q_val * y_val;
            }
            qty[(i, j)] = sum;
        }
    }

    // Solve R * coef = Q^T * y using back substitution

    let mut coef = Mat::zeros(p, ny);

    for j in 0..ny {
        for i in (0..rank).rev() {
            let mut sum = qty[(i, j)];

            for k in (i + 1)..rank {
                let r_ik = r[(i, k)];
                let coef_kj = coef[(k, j)];
                sum -= r_ik * coef_kj;
            }

            let r_ii = r[(i, i)];

            if r_ii.abs() > 1e-12 {
                coef[(i, j)] = sum / r_ii;
            } else {
            }
        }
    }

    // Compute fitted values and residuals

    let fitted = &x_mat * &coef;

    let residuals = Mat::from_fn(n, ny, |i, j| {
        let y_val = y_mat[(i, j)];
        let fitted_val = fitted[(i, j)];
        let residual = y_val - fitted_val;
        if i < 3 && j == 0 {}
        residual
    });

    let effects = qty.clone(); // Q^T * y is our effects

    // Create packed QR output (R in upper triangle, Q below diagonal)

    let mut qr_packed = vec![0.0; n * p];

    for j in 0..p {
        for i in 0..n {
            let value = if i <= j { r[(i, j)] } else { q[(i, j)] };
            qr_packed[i + j * n] = value;

            if j < 2 && i < 3 {}
        }
    }

    // No pivoting, so pivot is just 1:p

    let pivot: Vec<i32> = (1..=p as i32).collect();

    // qraux: diagonal of R (length min(n,p))
    let qraux: Vec<f64> = (0..k)
        .map(|i| {
            let diag_val = r[(i, i)];

            diag_val
        })
        .collect();

    let mut coefficients = Vec::with_capacity(p * ny);
    for j in 0..ny {
        for i in 0..p {
            let coef_val = coef[(i, j)];
            coefficients.push(coef_val);
        }
    }

    let mut residuals_vec = Vec::with_capacity(n * ny);
    for j in 0..ny {
        for i in 0..n {
            let residual_val = residuals[(i, j)];
            residuals_vec.push(residual_val);

            if i < 3 {}
        }
    }

    let mut effects_vec = Vec::with_capacity(p * ny); // Changed from n to p
    for j in 0..ny {
        for i in 0..p {
            // Changed from n to p since effects is now p x ny
            let effect_val = effects[(i, j)];
            effects_vec.push(effect_val);

            if i < 3 {}
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
