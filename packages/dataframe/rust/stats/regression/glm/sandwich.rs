//! Sandwich variance estimators for GLM
//!
//! Ports the core functionality of R's `sandwich` package for GLM objects:
//! - `vcovCL()` — Clustered covariance matrix (the primary entry point)
//! - `meatCL()` — Meat of the clustered sandwich estimator
//! - `estfun.glm()` — Estimating functions (score contributions) for GLM
//! - `bread.glm()` — Bread of the sandwich (scaled inverse Fisher information)
//!
//! Reference: Zeileis, Köll, Graham (2020). "Various Versatile Variances:
//! An Object-Oriented Implementation of Clustered Covariances in R."
//! Journal of Statistical Software, 95(1), 1-36.

use super::types_results::GlmResult;
use serde::{Deserialize, Serialize};

/// Input struct for sandwich estimator via WASM.
/// Contains only the fields needed from GlmResult, avoiding
/// circular reference issues with the full GlmResult's family object.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SandwichInput {
    pub working_residuals: Vec<f64>,
    pub weights: Vec<f64>,
    pub fitted_values: Vec<f64>,
    pub model_matrix: Vec<Vec<f64>>,
    pub r: Vec<Vec<f64>>,
    pub rank: usize,
    pub family_name: String,
    pub dispersion_parameter: f64,
    pub model_matrix_column_names: Vec<String>,
    pub pivot: Vec<i32>,
}

/// Result from `vcovCL` — clustered robust covariance matrix
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct VcovCLResult {
    /// The robust variance-covariance matrix (p × p)
    pub matrix: Vec<Vec<f64>>,
    /// Coefficient names
    pub names: Vec<String>,
    /// Type of HC correction applied
    pub r#type: String,
    /// Number of clusters
    pub n_clusters: usize,
}

/// HC correction type for clustered standard errors
#[derive(Debug, Clone, Copy, PartialEq)]
pub enum HCType {
    /// No small-sample correction
    HC0,
    /// Degrees-of-freedom correction: (n-1)/(n-k) × G/(G-1)
    HC1,
}

impl HCType {
    pub fn from_str(s: &str) -> Self {
        match s {
            "HC0" | "HC" => HCType::HC0,
            "HC1" => HCType::HC1,
            _ => HCType::HC0, // GLM default
        }
    }

    pub fn as_str(&self) -> &'static str {
        match self {
            HCType::HC0 => "HC0",
            HCType::HC1 => "HC1",
        }
    }
}

/// Compute the estimating functions (score matrix) for a GLM.
///
/// For GLM: `estfun_i = (working_residuals_i × working_weights_i × X_i) / dispersion`
///
/// This is the n × k matrix of per-observation score contributions,
/// where n is the number of observations and k is the number of coefficients.
///
/// Matches R's `sandwich::estfun.glm()`.
pub fn estfun_glm(result: &GlmResult) -> Vec<Vec<f64>> {
    let n = result.fitted_values.len();
    let k = result.rank;

    // working residuals × working weights = weighted residuals
    // R: wres <- as.vector(residuals(x, "working")) * weights(x, "working")
    let wres: Vec<f64> = result
        .working_residuals
        .iter()
        .zip(result.weights.iter())
        .map(|(&r, &w)| r * w)
        .collect();

    // Dispersion: 1 for binomial/poisson, estimated for gaussian etc.
    let family = result.family.family.to_lowercase();
    let dispersion = if family.starts_with("poisson")
        || family.starts_with("binomial")
        || family.starts_with("negative binomial")
    {
        1.0
    } else {
        let sum_wres2: f64 = wres.iter().map(|w| w * w).sum();
        let sum_weights: f64 = result.weights.iter().sum();
        if sum_weights > 0.0 {
            sum_wres2 / sum_weights
        } else {
            1.0
        }
    };

    // Get design matrix — use model_matrix (Vec<Vec<f64>>, column-major)
    let x_cols = &result.model_matrix;

    // Build n × k score matrix: ef[i][j] = wres[i] * X[i][j] / dispersion
    let mut ef = vec![vec![0.0; k]; n];
    for i in 0..n {
        let scale = wres[i] / dispersion;
        for j in 0..k {
            ef[i][j] = scale * x_cols[i][j]; // model_matrix is row-major
        }
    }

    ef
}

/// Compute the bread of the sandwich for a GLM.
///
/// `bread = n × cov.unscaled × dispersion`
///
/// This is the p × p scaled inverse Fisher information matrix.
/// Matches R's `sandwich::bread.glm()`.
pub fn bread_glm(result: &GlmResult) -> Vec<Vec<f64>> {
    let n = result.fitted_values.len();
    let k = result.rank;

    // cov.unscaled = (X'WX)^{-1}, available from the QR decomposition
    // R computes: sx$cov.unscaled * sum(sx$df[1:2]) * dispersion
    // where sum(df[1:2]) = rank + df_residual = n
    // So bread = n * cov.unscaled * dispersion = covariance_matrix * n / 1.0 (for binomial)
    // Actually: covariance_matrix = cov.unscaled * dispersion
    // So bread = n * covariance_matrix

    // But we need to compute cov.unscaled from the QR R matrix directly,
    // because covariance_matrix may have been scaled by dispersion already.
    // Let's compute from the R matrix of QR.

    let r_matrix = &result.r;
    let pivot = &result.qr.pivot;

    // Compute R^{-1} via back-substitution
    let mut r_inv = vec![vec![0.0; k]; k];
    for j in 0..k {
        // Solve R x = e_j
        r_inv[j][j] = 1.0;
        for i in (0..=j).rev() {
            if i < j {
                let mut s = 0.0;
                for m in (i + 1)..=j {
                    s += r_matrix[i][m] * r_inv[m][j];
                }
                r_inv[i][j] = -s / r_matrix[i][i];
            } else {
                r_inv[i][j] /= r_matrix[i][i];
            }
        }
    }

    // cov.unscaled = R^{-1} (R^{-1})^T
    let mut cov_unscaled = vec![vec![0.0; k]; k];
    for i in 0..k {
        for j in 0..k {
            let mut s = 0.0;
            for m in 0..k {
                s += r_inv[i][m] * r_inv[j][m];
            }
            cov_unscaled[i][j] = s;
        }
    }

    // Un-pivot: the QR was done on pivoted columns
    let mut bread_mat = vec![vec![0.0; k]; k];
    for i in 0..k {
        for j in 0..k {
            let pi = (pivot[i] - 1) as usize;
            let pj = (pivot[j] - 1) as usize;
            bread_mat[pi][pj] = cov_unscaled[i][j];
        }
    }

    // Dispersion
    let family = result.family.family.to_lowercase();
    let dispersion = if family.starts_with("poisson")
        || family.starts_with("binomial")
        || family.starts_with("negative binomial")
    {
        1.0
    } else {
        result.dispersion_parameter
    };

    // bread = n × cov.unscaled × dispersion
    let n_f64 = n as f64;
    for row in &mut bread_mat {
        for val in row.iter_mut() {
            *val *= n_f64 * dispersion;
        }
    }

    bread_mat
}

/// Compute the meat of the clustered sandwich estimator.
///
/// Aggregates score contributions by cluster, then computes the
/// outer product. Supports HC0 and HC1 corrections.
///
/// Matches R's `sandwich::meatCL()` for single-level clustering.
pub fn meat_cl(
    result: &GlmResult,
    cluster: &[i32],
    hc_type: HCType,
    cadjust: bool,
) -> Vec<Vec<f64>> {
    let ef = estfun_glm(result);
    let n = ef.len();
    let k = ef[0].len();

    // Build cluster grouping: map cluster ID → list of observation indices
    let mut cluster_map: Vec<(i32, Vec<usize>)> = Vec::new();
    {
        let mut seen: std::collections::HashMap<i32, usize> = std::collections::HashMap::new();
        for (i, &cid) in cluster.iter().enumerate() {
            if let Some(&idx) = seen.get(&cid) {
                cluster_map[idx].1.push(i);
            } else {
                seen.insert(cid, cluster_map.len());
                cluster_map.push((cid, vec![i]));
            }
        }
    }
    let g = cluster_map.len(); // number of clusters

    // Aggregate estimating functions by cluster: u_c = Σ_{i ∈ c} ef_i
    let mut cluster_sums: Vec<Vec<f64>> = Vec::with_capacity(g);
    for (_cid, indices) in &cluster_map {
        let mut sum_ef = vec![0.0; k];
        for &i in indices {
            for j in 0..k {
                sum_ef[j] += ef[i][j];
            }
        }
        cluster_sums.push(sum_ef);
    }

    // Cluster adjustment: g/(g-1) if cadjust, else 1
    let adj = if cadjust && g > 1 {
        g as f64 / (g as f64 - 1.0)
    } else {
        1.0
    };

    // Meat = adj × Σ_c (u_c u_c') / n
    let n_f64 = n as f64;
    let mut meat = vec![vec![0.0; k]; k];
    for u_c in &cluster_sums {
        for i in 0..k {
            for j in 0..k {
                meat[i][j] += u_c[i] * u_c[j];
            }
        }
    }

    let scale = adj / n_f64;
    for row in &mut meat {
        for val in row.iter_mut() {
            *val *= scale;
        }
    }

    // HC1 adjustment: (n-1)/(n-k)
    if hc_type == HCType::HC1 {
        let hc1_factor = (n as f64 - 1.0) / (n as f64 - k as f64);
        for row in &mut meat {
            for val in row.iter_mut() {
                *val *= hc1_factor;
            }
        }
    }

    meat
}

/// Compute the clustered robust covariance matrix for a GLM.
///
/// `vcovCL = (1/n) × bread × meat × bread`
///
/// This is the main entry point, matching R's `sandwich::vcovCL()`.
///
/// # Arguments
/// * `result` — A fitted `GlmResult`
/// * `cluster` — Integer cluster IDs, one per observation
/// * `hc_type` — HC correction type (HC0 for GLM default, HC1 for df correction)
/// * `cadjust` — Apply cluster adjustment g/(g-1) (default true in R)
/// * `fix` — If true, fix non-positive-definite result by zeroing negative eigenvalues
pub fn vcov_cl(
    result: &GlmResult,
    cluster: &[i32],
    hc_type: HCType,
    cadjust: bool,
    fix: bool,
) -> VcovCLResult {
    let n = result.fitted_values.len();
    let k = result.rank;

    let bread = bread_glm(result);
    let meat = meat_cl(result, cluster, hc_type, cadjust);

    // sandwich = (1/n) × bread × meat × bread
    let n_f64 = n as f64;

    // Step 1: temp = bread × meat
    let mut temp = vec![vec![0.0; k]; k];
    for i in 0..k {
        for j in 0..k {
            let mut s = 0.0;
            for m in 0..k {
                s += bread[i][m] * meat[m][j];
            }
            temp[i][j] = s;
        }
    }

    // Step 2: result = (1/n) × temp × bread
    let mut vcov = vec![vec![0.0; k]; k];
    for i in 0..k {
        for j in 0..k {
            let mut s = 0.0;
            for m in 0..k {
                s += temp[i][m] * bread[m][j];
            }
            vcov[i][j] = s / n_f64;
        }
    }

    // Symmetrize (numerical precision)
    for i in 0..k {
        for j in (i + 1)..k {
            let avg = (vcov[i][j] + vcov[j][i]) / 2.0;
            vcov[i][j] = avg;
            vcov[j][i] = avg;
        }
    }

    // Fix non-PSD if requested (eigendecomposition, zero out negatives)
    if fix {
        fix_non_psd(&mut vcov);
    }

    // Cluster count
    let n_clusters = {
        let mut ids: Vec<i32> = cluster.to_vec();
        ids.sort_unstable();
        ids.dedup();
        ids.len()
    };

    // Coefficient names
    let names = result.model_matrix_column_names.clone();

    VcovCLResult {
        matrix: vcov,
        names,
        r#type: hc_type.as_str().to_string(),
        n_clusters,
    }
}

/// Fix a non-positive-semidefinite matrix by zeroing negative eigenvalues.
///
/// Matches R's `sandwich::vcovCL()` fix logic:
/// ```r
/// if(fix && any((eig <- eigen(rval, symmetric = TRUE))$values < 0)) {
///     eig$values <- pmax(eig$values, 0)
///     rval[] <- crossprod(sqrt(eig$values) * t(eig$vectors))
/// }
/// ```
fn fix_non_psd(mat: &mut Vec<Vec<f64>>) {
    let k = mat.len();
    if k == 0 {
        return;
    }

    // Simple Jacobi eigendecomposition for symmetric matrices
    // For the small matrices we deal with (k typically < 50), this is fine
    let (eigenvalues, eigenvectors) = symmetric_eigen(mat);

    // Check if any eigenvalues are negative
    if eigenvalues.iter().all(|&v| v >= 0.0) {
        return;
    }

    // Reconstruct: V × diag(max(λ, 0)) × V'
    for i in 0..k {
        for j in 0..k {
            let mut s = 0.0;
            for m in 0..k {
                let lambda = eigenvalues[m].max(0.0);
                s += eigenvectors[i][m] * lambda * eigenvectors[j][m];
            }
            mat[i][j] = s;
        }
    }
}

/// Jacobi eigendecomposition for symmetric matrices.
/// Returns (eigenvalues, eigenvectors) where eigenvectors[i][j] is the
/// i-th component of the j-th eigenvector.
fn symmetric_eigen(mat: &[Vec<f64>]) -> (Vec<f64>, Vec<Vec<f64>>) {
    let k = mat.len();
    let mut a: Vec<Vec<f64>> = mat.to_vec();
    let mut v = vec![vec![0.0; k]; k];
    for i in 0..k {
        v[i][i] = 1.0;
    }

    let max_iter = 100 * k * k;
    let tol = 1e-15;

    for _ in 0..max_iter {
        // Find largest off-diagonal element
        let mut max_val = 0.0f64;
        let mut p = 0;
        let mut q = 1;
        for i in 0..k {
            for j in (i + 1)..k {
                if a[i][j].abs() > max_val {
                    max_val = a[i][j].abs();
                    p = i;
                    q = j;
                }
            }
        }

        if max_val < tol {
            break;
        }

        // Compute rotation
        let theta = 0.5 * (a[q][q] - a[p][p]).atan2(a[p][q]);
        let c = theta.cos();
        let s = theta.sin();

        // Apply rotation to A: A' = G^T A G
        let mut new_a = a.clone();
        for i in 0..k {
            new_a[i][p] = c * a[i][p] + s * a[i][q];
            new_a[i][q] = -s * a[i][p] + c * a[i][q];
        }
        let a_copy = new_a.clone();
        for j in 0..k {
            new_a[p][j] = c * a_copy[p][j] + s * a_copy[q][j];
            new_a[q][j] = -s * a_copy[p][j] + c * a_copy[q][j];
        }
        a = new_a;

        // Update eigenvectors
        for i in 0..k {
            let vip = v[i][p];
            let viq = v[i][q];
            v[i][p] = c * vip + s * viq;
            v[i][q] = -s * vip + c * viq;
        }
    }

    let eigenvalues: Vec<f64> = (0..k).map(|i| a[i][i]).collect();
    (eigenvalues, v)
}

/// Compute vcovCL from a SandwichInput (WASM entry point).
/// Mirrors `vcov_cl` but works from individual fields rather than the full GlmResult.
pub fn vcov_cl_from_input(
    input: &SandwichInput,
    cluster: &[i32],
    hc_type: HCType,
    cadjust: bool,
    fix: bool,
) -> VcovCLResult {
    let n = input.fitted_values.len();
    let k = input.rank;

    // --- estfun ---
    let wres: Vec<f64> = input
        .working_residuals
        .iter()
        .zip(input.weights.iter())
        .map(|(&r, &w)| r * w)
        .collect();

    let family = input.family_name.to_lowercase();
    let dispersion = if family.starts_with("poisson")
        || family.starts_with("binomial")
        || family.starts_with("negative binomial")
    {
        1.0
    } else {
        input.dispersion_parameter
    };

    let mut ef = vec![vec![0.0; k]; n];
    for i in 0..n {
        let scale = wres[i] / dispersion;
        for j in 0..k {
            ef[i][j] = scale * input.model_matrix[i][j];
        }
    }

    // --- bread ---
    let r_matrix = &input.r;
    let pivot = &input.pivot;

    let mut r_inv = vec![vec![0.0; k]; k];
    for j in 0..k {
        r_inv[j][j] = 1.0;
        for i in (0..=j).rev() {
            if i < j {
                let mut s = 0.0;
                for m in (i + 1)..=j {
                    s += r_matrix[i][m] * r_inv[m][j];
                }
                r_inv[i][j] = -s / r_matrix[i][i];
            } else {
                r_inv[i][j] /= r_matrix[i][i];
            }
        }
    }

    let mut cov_unscaled = vec![vec![0.0; k]; k];
    for i in 0..k {
        for j in 0..k {
            let mut s = 0.0;
            for m in 0..k {
                s += r_inv[i][m] * r_inv[j][m];
            }
            cov_unscaled[i][j] = s;
        }
    }

    let mut bread = vec![vec![0.0; k]; k];
    for i in 0..k {
        for j in 0..k {
            let pi = (pivot[i] - 1) as usize;
            let pj = (pivot[j] - 1) as usize;
            bread[pi][pj] = cov_unscaled[i][j];
        }
    }

    let n_f64 = n as f64;
    for row in &mut bread {
        for val in row.iter_mut() {
            *val *= n_f64 * dispersion;
        }
    }

    // --- meat_cl ---
    let mut cluster_map: Vec<(i32, Vec<usize>)> = Vec::new();
    {
        let mut seen: std::collections::HashMap<i32, usize> = std::collections::HashMap::new();
        for (i, &cid) in cluster.iter().enumerate() {
            if let Some(&idx) = seen.get(&cid) {
                cluster_map[idx].1.push(i);
            } else {
                seen.insert(cid, cluster_map.len());
                cluster_map.push((cid, vec![i]));
            }
        }
    }
    let g = cluster_map.len();

    let mut cluster_sums: Vec<Vec<f64>> = Vec::with_capacity(g);
    for (_cid, indices) in &cluster_map {
        let mut sum_ef = vec![0.0; k];
        for &i in indices {
            for j in 0..k {
                sum_ef[j] += ef[i][j];
            }
        }
        cluster_sums.push(sum_ef);
    }

    let adj = if cadjust && g > 1 {
        g as f64 / (g as f64 - 1.0)
    } else {
        1.0
    };

    let mut meat = vec![vec![0.0; k]; k];
    for u_c in &cluster_sums {
        for i in 0..k {
            for j in 0..k {
                meat[i][j] += u_c[i] * u_c[j];
            }
        }
    }

    let scale = adj / n_f64;
    for row in &mut meat {
        for val in row.iter_mut() {
            *val *= scale;
        }
    }

    if hc_type == HCType::HC1 {
        let hc1_factor = (n as f64 - 1.0) / (n as f64 - k as f64);
        for row in &mut meat {
            for val in row.iter_mut() {
                *val *= hc1_factor;
            }
        }
    }

    // --- sandwich = (1/n) × bread × meat × bread ---
    let mut temp = vec![vec![0.0; k]; k];
    for i in 0..k {
        for j in 0..k {
            let mut s = 0.0;
            for m in 0..k {
                s += bread[i][m] * meat[m][j];
            }
            temp[i][j] = s;
        }
    }

    let mut vcov = vec![vec![0.0; k]; k];
    for i in 0..k {
        for j in 0..k {
            let mut s = 0.0;
            for m in 0..k {
                s += temp[i][m] * bread[m][j];
            }
            vcov[i][j] = s / n_f64;
        }
    }

    for i in 0..k {
        for j in (i + 1)..k {
            let avg = (vcov[i][j] + vcov[j][i]) / 2.0;
            vcov[i][j] = avg;
            vcov[j][i] = avg;
        }
    }

    if fix {
        fix_non_psd(&mut vcov);
    }

    let n_clusters = {
        let mut ids: Vec<i32> = cluster.to_vec();
        ids.sort_unstable();
        ids.dedup();
        ids.len()
    };

    let names = input.model_matrix_column_names.clone();

    VcovCLResult {
        matrix: vcov,
        names,
        r#type: hc_type.as_str().to_string(),
        n_clusters,
    }
}
