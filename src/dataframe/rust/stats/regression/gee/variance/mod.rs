//! Robust variance estimators

use crate::stats::regression::gee::types::{CorrelationStructure, GeeglmResult};
use crate::stats::regression::gee::utils::group_indices_by_id;
use crate::stats::regression::glm::glm_profile_utils::get_design_matrix;

/// Compute variance-covariance for geeglm
///
/// Currently implements a basic sandwich estimator under independence
/// correlation, using GLM residuals and working weights:
/// V = (X' W X)^{-1} * (X' diag(r^2) X) * (X' W X)^{-1}
pub fn vcov_geeglm(fit: &GeeglmResult, method: &str) -> Option<Vec<Vec<f64>>> {
    match method {
        "san.se" => {
            // Prefer clustered meat; fall back to independence baseline
            compute_sandwich_clustered(fit)
                .ok()
                .or_else(|| compute_sandwich_independence(fit).ok())
        }
        "jack" | "j1s" | "fij" => None, // TODO: add jackknife variants
        _ => None,
    }
}

/// Cluster-robust sandwich estimator using Pearson residuals and GLM weights
/// V = B * (sum_i s_i s_i^T) * B, where B = (X'WX)^{-1}, s_i = Xw_i^T rw_i
fn compute_sandwich_clustered(fit: &GeeglmResult) -> Result<Vec<Vec<f64>>, String> {
    let x = get_design_matrix(&fit.glm_result)?; // n x p rows
    let n = x.len();
    if n == 0 {
        return Err("empty design matrix".to_string());
    }
    let p = x[0].len();

    let w = &fit.glm_result.weights; // n
    let r = &fit.glm_result.pearson_residuals; // n
    if w.len() != n || r.len() != n {
        return Err("incompatible lengths for weights/residuals".to_string());
    }

    // Precompute sqrt-weighted rows and residuals
    let mut xw: Vec<Vec<f64>> = vec![vec![0.0; p]; n];
    let mut rw: Vec<f64> = vec![0.0; n];
    for i in 0..n {
        let sw = w[i].sqrt();
        rw[i] = sw * r[i];
        for j in 0..p {
            xw[i][j] = sw * x[i][j];
        }
    }

    // B = (X' W X)^{-1}
    let mut xtwx = vec![vec![0.0; p]; p];
    for i in 0..n {
        for a in 0..p {
            let xa = xw[i][a];
            for b in 0..p {
                xtwx[a][b] += xa * xw[i][b];
            }
        }
    }
    let xtwx_inv = invert_symmetric(xtwx.clone())?;

    // Meat = sum over clusters of s_i s_i^T, with s_i = sum_{k in cluster i} rw[k] * xw[k]
    let mut meat = vec![vec![0.0; p]; p];
    let clusters = group_indices_by_id(&fit.cluster_ids);
    if clusters.is_empty() {
        return Err("no clusters found".to_string());
    }
    for (start, end) in clusters {
        let mut s = vec![0.0; p];
        for i in start..end {
            let rwi = rw[i];
            for j in 0..p {
                s[j] += rwi * xw[i][j];
            }
        }
        for a in 0..p {
            for b in 0..p {
                meat[a][b] += s[a] * s[b];
            }
        }
    }

    let bm = matmul(&xtwx_inv, &meat);
    let v = matmul(&bm, &xtwx_inv);
    Ok(v)
}

fn compute_sandwich_independence(fit: &GeeglmResult) -> Result<Vec<Vec<f64>>, String> {
    // Extract X (n x p)
    let x = get_design_matrix(&fit.glm_result)?; // rows
    let n = x.len();
    if n == 0 {
        return Err("empty design matrix".to_string());
    }
    let p = x[0].len();

    // Working weights and Pearson residuals
    let w = &fit.glm_result.weights; // length n
    let r = &fit.glm_result.pearson_residuals; // length n
    if w.len() != n || r.len() != n {
        return Err("incompatible lengths for weights/residuals".to_string());
    }

    // Compute X' W X (p x p)
    let mut xtwx = vec![vec![0.0; p]; p];
    for i in 0..n {
        let wi = w[i];
        for a in 0..p {
            let xia = x[i][a];
            for b in 0..p {
                xtwx[a][b] += wi * xia * x[i][b];
            }
        }
    }

    // Invert (X' W X)
    let xtwx_inv = invert_symmetric(xtwx.clone())?;

    // Compute X' diag(r^2) X (p x p)
    let mut xtdxx = vec![vec![0.0; p]; p];
    for i in 0..n {
        let ri2 = r[i] * r[i];
        for a in 0..p {
            let xia = x[i][a];
            for b in 0..p {
                xtdxx[a][b] += ri2 * xia * x[i][b];
            }
        }
    }

    // V = B * M * B, where B = (X'WX)^{-1}, M = X' diag(r^2) X
    let bm = matmul(&xtwx_inv, &xtdxx);
    let v = matmul(&bm, &xtwx_inv);
    Ok(v)
}

fn matmul(a: &[Vec<f64>], b: &[Vec<f64>]) -> Vec<Vec<f64>> {
    let m = a.len();
    let k = if m > 0 { a[0].len() } else { 0 };
    let n = if !b.is_empty() { b[0].len() } else { 0 };
    let mut c = vec![vec![0.0; n]; m];
    for i in 0..m {
        for t in 0..k {
            let ait = a[i][t];
            for j in 0..n {
                c[i][j] += ait * b[t][j];
            }
        }
    }
    c
}

// Simple symmetric matrix inversion via Gauss-Jordan (for small p)
fn invert_symmetric(mut a: Vec<Vec<f64>>) -> Result<Vec<Vec<f64>>, String> {
    let n = a.len();
    if n == 0 {
        return Ok(a);
    }
    for row in &a {
        if row.len() != n {
            return Err("matrix must be square".to_string());
        }
    }
    let mut inv = vec![vec![0.0; n]; n];
    for i in 0..n {
        inv[i][i] = 1.0;
    }

    for i in 0..n {
        // Pivot
        let mut pivot = a[i][i];
        if pivot.abs() < 1e-12 {
            // Find a row to swap
            let mut swap_row = None;
            for r in i + 1..n {
                if a[r][i].abs() > 1e-12 {
                    swap_row = Some(r);
                    break;
                }
            }
            if let Some(r) = swap_row {
                a.swap(i, r);
                inv.swap(i, r);
                pivot = a[i][i];
            } else {
                return Err("singular matrix".to_string());
            }
        }
        let piv_inv = 1.0 / pivot;
        // Normalize row i
        for j in 0..n {
            a[i][j] *= piv_inv;
            inv[i][j] *= piv_inv;
        }
        // Eliminate other rows
        for r in 0..n {
            if r == i {
                continue;
            }
            let factor = a[r][i];
            if factor != 0.0 {
                for j in 0..n {
                    a[r][j] -= factor * a[i][j];
                    inv[r][j] -= factor * inv[i][j];
                }
            }
        }
    }
    Ok(inv)
}
