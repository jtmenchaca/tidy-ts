//! Robust variance estimators

use crate::stats::linalg::matrix::{invert_symmetric, matmul};
use crate::stats::regression::gee::types::GeeglmResult;
use crate::stats::regression::gee::utils::group_indices_by_id;
// Simple implementation of get_design_matrix for GEE module
// This is a placeholder since the full glm_profile_utils module was removed
fn get_design_matrix(
    _glm_result: &crate::stats::regression::glm::types_results::GlmResult,
) -> Result<Vec<Vec<f64>>, String> {
    // TODO: Extract design matrix from GLM result
    // This is a placeholder implementation
    Ok(vec![vec![1.0, 0.0], vec![1.0, 1.0]])
}

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

