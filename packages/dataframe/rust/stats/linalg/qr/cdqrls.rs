//! Column-pivoted QR + least-squares (R's `dqrls`)

use faer::Mat;

use super::types::QrLsResult;

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
    #[cfg(feature = "wasm")]
    // cdqrls called
    if x.len() != n * p || y.len() != n * ny || n == 0 || p == 0 {
        // Dimension mismatch detected
        return Err("dimension mismatch");
    }
    if !x.iter().all(|v| v.is_finite()) || !y.iter().all(|v| v.is_finite()) {
        // Non-finite values in input
        return Err("NA/NaN/Inf in input data");
    }

    /* ---------- build faer matrices ---------- */
    // faer is row-major internally so we transpose the col-major input on the fly
    let x_mat = Mat::from_fn(n, p, |i, j| x[i + j * n]);
    let y_mat = Mat::from_fn(n, ny, |i, j| y[i + j * n]);

    /* ---------- Combined QR+solve (like R's dqrls) ---------- */

    // Create working matrices that we can modify
    let x_work = x_mat.to_owned();
    let y_work = y_mat.to_owned();

    // Use Householder QR decomposition to match R's dqrdc2 approach
    let mut x_qr = x_work.clone();
    let mut qraux = vec![0.0; p];
    let mut pivot: Vec<i32> = (1..=p as i32).collect();

    // Tolerance for rank determination (matches R's approach)
    // R uses 1e-7 for QR rank determination, regardless of GLM convergence tolerance
    let tol_eff = match tol {
        Some(t) if t >= 1e-10 => t,
        _ => 1e-7,
    };

    // Compute column norms
    let mut col_norms: Vec<f64> = (0..p)
        .map(|j| {
            let mut norm = 0.0;
            for i in 0..n {
                norm += x_qr[(i, j)] * x_qr[(i, j)];
            }
            norm.sqrt()
        })
        .collect();
    let mut work1 = col_norms.clone();
    let mut work2: Vec<f64> = col_norms
        .iter()
        .map(|&v| if v == 0.0 { 1.0 } else { v })
        .collect();

    for j in 0..p {
        qraux[j] = col_norms[j];
    }

    // Householder QR with column pivoting
    let lup = n.min(p);
    let mut k_cur = p + 1;
    #[allow(unused_assignments)]
    let mut rank = p;

    for col in 0..lup {
        // Limited pivoting via cycling: move negligible columns to the right
        loop {
            if col + 1 >= k_cur {
                break;
            }
            if qraux[col] >= work2[col] * tol_eff {
                break;
            }

            for i in 0..n {
                let t = x_qr[(i, col)];
                for j in (col + 1)..p {
                    x_qr[(i, j - 1)] = x_qr[(i, j)];
                }
                x_qr[(i, p - 1)] = t;
            }
            let pv = pivot[col];
            let qa = col_norms[col];
            let qa_aux = qraux[col];
            let w1 = work1[col];
            let w2 = work2[col];
            for j in (col + 1)..p {
                pivot[j - 1] = pivot[j];
                col_norms[j - 1] = col_norms[j];
                qraux[j - 1] = qraux[j];
                work1[j - 1] = work1[j];
                work2[j - 1] = work2[j];
            }
            pivot[p - 1] = pv;
            col_norms[p - 1] = qa;
            qraux[p - 1] = qa_aux;
            work1[p - 1] = w1;
            work2[p - 1] = w2;
            k_cur -= 1;
        }

        // Householder transformation for column col (matching R's dqrdc2)
        if col + 1 != n {
            let mut nrmxl = 0.0;
            for i in col..n {
                nrmxl += x_qr[(i, col)] * x_qr[(i, col)];
            }
            nrmxl = nrmxl.sqrt();

            if nrmxl != 0.0 {
                if x_qr[(col, col)] != 0.0 {
                    nrmxl = if x_qr[(col, col)] < 0.0 {
                        -nrmxl
                    } else {
                        nrmxl
                    };
                }
                for i in col..n {
                    x_qr[(i, col)] /= nrmxl;
                }

                x_qr[(col, col)] = 1.0 + x_qr[(col, col)];
                if col + 1 < p {
                    for j in (col + 1)..p {
                        let mut t = 0.0;
                        for i in col..n {
                            t += x_qr[(i, col)] * x_qr[(i, j)];
                        }
                        t = -t / x_qr[(col, col)];

                        for i in col..n {
                            x_qr[(i, j)] += t * x_qr[(i, col)];
                        }

                        // Update column norm like dqrdc2
                        if col_norms[j] != 0.0 {
                            let mut tt = 1.0 - (x_qr[(col, j)].abs() / col_norms[j]).powi(2);
                            if tt < 0.0 {
                                tt = 0.0;
                            }
                            if tt.abs() >= 1e-6 {
                                col_norms[j] *= tt.sqrt();
                                work1[j] = col_norms[j];
                                qraux[j] = col_norms[j];
                            } else {
                                let mut new_norm = 0.0;
                                for i in (col + 1)..n {
                                    new_norm += x_qr[(i, j)] * x_qr[(i, j)];
                                }
                                col_norms[j] = new_norm.sqrt();
                                work1[j] = col_norms[j];
                                qraux[j] = col_norms[j];
                            }
                        }
                    }
                }

                qraux[col] = x_qr[(col, col)];
                x_qr[(col, col)] = -nrmxl;
            }
        }
    }

    rank = (k_cur - 1).min(n);

    // Apply Q^T to y using stored Householder transformations (matching R's dqrsl)
    let mut qty_work = y_work.clone();

    let ju = rank.min(n.saturating_sub(1));
    for j in 0..ju {
        if qraux[j] != 0.0 {
            for k in 0..ny {
                let temp = x_qr[(j, j)];
                x_qr[(j, j)] = qraux[j];

                let mut t = 0.0;
                for i in j..n {
                    t += x_qr[(i, j)] * qty_work[(i, k)];
                }
                t = -t / x_qr[(j, j)];

                for i in j..n {
                    qty_work[(i, k)] += t * x_qr[(i, j)];
                }

                x_qr[(j, j)] = temp;
            }
        }
    }

    // Back-substitute to solve R * coef = Q^T * y (matching R's dqrsl)
    let mut coef = Mat::zeros(p, ny);

    for j in 0..ny {
        for i in 0..rank {
            coef[(i, j)] = qty_work[(i, j)];
        }

        for jj in 1..=rank {
            let i = rank - jj;

            if x_qr[(i, i)] != 0.0 {
                coef[(i, j)] = coef[(i, j)] / x_qr[(i, i)];

                if i > 0 {
                    let t = -coef[(i, j)];
                    for k in 0..i {
                        coef[(k, j)] += t * x_qr[(k, i)];
                    }
                }
            }
        }
    }

    // R's dqrls returns b in pivoted order
    let mut coef_orig = Mat::zeros(p, ny);
    for j in 0..ny {
        for i in 0..rank {
            let orig_col = (pivot[i] - 1) as usize;
            coef_orig[(orig_col, j)] = coef[(i, j)];
        }
    }
    let fitted = &x_mat * &coef_orig;
    let residuals = Mat::from_fn(n, ny, |i, j| y_mat[(i, j)] - fitted[(i, j)]);

    let effects = qty_work.clone();

    let mut qr_packed = vec![0.0; n * p];
    for j in 0..p {
        for i in 0..n {
            qr_packed[i + j * n] = x_qr[(i, j)];
        }
    }

    let mut coefficients = Vec::with_capacity(p * ny);
    for j in 0..ny {
        for i in 0..p {
            coefficients.push(coef[(i, j)]);
        }
    }

    let mut residuals_vec = Vec::with_capacity(n * ny);
    for j in 0..ny {
        for i in 0..n {
            residuals_vec.push(residuals[(i, j)]);
        }
    }

    let mut effects_vec = Vec::with_capacity(n * ny);
    for j in 0..ny {
        for i in 0..n {
            effects_vec.push(effects[(i, j)]);
        }
    }

    let pivoted = (0..p).any(|i| pivot[i] != (i + 1) as i32);

    Ok(QrLsResult {
        qr: qr_packed,
        qraux,
        coefficients,
        residuals: residuals_vec,
        effects: effects_vec,
        rank,
        pivot,
        tol: tol_eff,
        pivoted,
    })
}
