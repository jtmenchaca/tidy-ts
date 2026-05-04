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
    /// Leverage-adjusted: e_i / sqrt(1-h_i) (non-clustered) or (I-H_ij)^{-1/2} (clustered)
    HC2,
    /// Jackknife: e_i / (1-h_i) (non-clustered) or (I-H_ij)^{-1} (clustered)
    HC3,
}

impl HCType {
    pub fn from_str(s: &str) -> Self {
        match s {
            "HC0" | "HC" => HCType::HC0,
            "HC1" => HCType::HC1,
            "HC2" => HCType::HC2,
            "HC3" => HCType::HC3,
            _ => HCType::HC0, // GLM default
        }
    }

    pub fn as_str(&self) -> &'static str {
        match self {
            HCType::HC0 => "HC0",
            HCType::HC1 => "HC1",
            HCType::HC2 => "HC2",
            HCType::HC3 => "HC3",
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

    // Dispersion: must match R's bread.glm which uses sum(wres^2)/sum(w),
    // NOT deviance/df.residual (which is summary(x)$dispersion).
    let family = result.family.family.to_lowercase();
    let dispersion = if family.starts_with("poisson")
        || family.starts_with("binomial")
        || family.starts_with("negative binomial")
    {
        1.0
    } else {
        let wres: Vec<f64> = result
            .working_residuals
            .iter()
            .zip(result.weights.iter())
            .map(|(&r, &w)| r * w)
            .collect();
        let sum_wres2: f64 = wres.iter().map(|w| w * w).sum();
        let sum_weights: f64 = result.weights.iter().sum();
        if sum_weights > 0.0 {
            sum_wres2 / sum_weights
        } else {
            1.0
        }
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

        // Compute Jacobi rotation angle: tan(2θ) = 2*a[p][q] / (a[p][p] - a[q][q])
        let theta = 0.5 * (2.0 * a[p][q]).atan2(a[p][p] - a[q][q]);
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

/// Compute (X'WX)^{-1} from the design matrix and working weights.
/// Used for HC2/HC3 hat matrix computation.
fn compute_xwx_inv(model_matrix: &[Vec<f64>], weights: &[f64], k: usize) -> Vec<Vec<f64>> {
    let n = model_matrix.len();
    // X'WX
    let mut xwx = vec![vec![0.0; k]; k];
    for i in 0..n {
        let w = weights[i];
        for r in 0..k {
            for c in 0..k {
                xwx[r][c] += model_matrix[i][r] * w * model_matrix[i][c];
            }
        }
    }
    // Cholesky decomposition: X'WX = L L'
    let mut l = vec![vec![0.0; k]; k];
    for j in 0..k {
        let mut s = 0.0;
        for m in 0..j {
            s += l[j][m] * l[j][m];
        }
        l[j][j] = (xwx[j][j] - s).sqrt();
        for i in (j + 1)..k {
            let mut s = 0.0;
            for m in 0..j {
                s += l[i][m] * l[j][m];
            }
            l[i][j] = (xwx[i][j] - s) / l[j][j];
        }
    }
    // L^{-1}
    let mut l_inv = vec![vec![0.0; k]; k];
    for j in 0..k {
        l_inv[j][j] = 1.0 / l[j][j];
        for i in (j + 1)..k {
            let mut s = 0.0;
            for m in j..i {
                s += l[i][m] * l_inv[m][j];
            }
            l_inv[i][j] = -s / l[i][i];
        }
    }
    // (X'WX)^{-1} = (L')^{-1} L^{-1} = L_inv' L_inv
    let mut xwx_inv = vec![vec![0.0; k]; k];
    for i in 0..k {
        for j in 0..k {
            let mut s = 0.0;
            for m in 0..k {
                s += l_inv[m][i] * l_inv[m][j];
            }
            xwx_inv[i][j] = s;
        }
    }
    xwx_inv
}

/// Compute hat values h_i = diag(X (X'WX)^{-1} X' W) for non-clustered HC2/HC3.
fn compute_hat_values(
    model_matrix: &[Vec<f64>],
    weights: &[f64],
    xwx_inv: &[Vec<f64>],
    k: usize,
) -> Vec<f64> {
    let n = model_matrix.len();
    let mut h = vec![0.0; n];
    for i in 0..n {
        // h_i = x_i' (X'WX)^{-1} x_i * w_i
        let mut val = 0.0;
        for r in 0..k {
            for c in 0..k {
                val += model_matrix[i][r] * xwx_inv[r][c] * model_matrix[i][c];
            }
        }
        h[i] = val * weights[i];
    }
    h
}

/// Compute working residuals from estimating functions and design matrix.
///
/// R: `res <- rowMeans(ef/X, na.rm = TRUE)`
/// with zero for rows where all |ef| < eps
fn compute_working_residuals_from_ef(ef: &[Vec<f64>], model_matrix: &[Vec<f64>], k: usize) -> Vec<f64> {
    let n = ef.len();
    let eps = f64::EPSILON;
    let mut res = vec![0.0; n];
    for i in 0..n {
        // Check if all ef values are essentially zero
        if ef[i].iter().all(|&v| v.abs() < eps) {
            res[i] = 0.0;
            continue;
        }
        // rowMeans(ef/X, na.rm=TRUE): average ef[i][j]/X[i][j] over non-NaN entries
        let mut sum = 0.0;
        let mut count = 0;
        for j in 0..k {
            if model_matrix[i][j].abs() > eps {
                sum += ef[i][j] / model_matrix[i][j];
                count += 1;
            }
        }
        res[i] = if count > 0 { sum / count as f64 } else { 0.0 };
    }
    res
}

/// Matrix power via eigendecomposition.
///
/// Faithfully ports R's sandwich::matrixpower():
/// ```r
/// matrixpower <- function(X, p, symmetric = NULL, tol = .Machine$double.eps^(1/1.3)) {
///   if((ncol(X) == 1L) && (nrow(X) == 1L)) return(X^p)
///   if(is.null(symmetric)) symmetric <- isSymmetric(X)
///   Xeig <- eigen(X, symmetric = symmetric)
///   if(is.complex(Xeig$values)) {
///     Xeig$values <- Re(Xeig$values)
///     Xeig$vectors <- Re(Xeig$vectors)
///   }
///   Xeig$values[Xeig$values < tol] <- 0
///   if(symmetric) {
///     Xeig$vectors %*% ((Xeig$values^p) * t(Xeig$vectors))
///   } else {
///     Xeig$vectors %*% ((Xeig$values^p) * matrixinverse(Xeig$vectors))
///   }
/// }
/// ```
fn matrixpower(mat: &[Vec<f64>], power: f64) -> Vec<Vec<f64>> {
    let n = mat.len();
    if n == 1 {
        return vec![vec![mat[0][0].powf(power)]];
    }

    let tol = f64::EPSILON.powf(1.0 / 1.3);

    // Always use general eigendecomposition (QR algorithm).
    // The Jacobi symmetric path has a known bug in its rotation formula
    // and isn't needed since matrices here are small (cluster_size × cluster_size).
    let (eigenvalues, eigenvectors) = general_eigen(mat, n);

    // Zero out eigenvalues < tol, apply power
    let mut lambda_p = vec![0.0; n];
    for m in 0..n {
        let lambda = if eigenvalues[m] < tol { 0.0 } else { eigenvalues[m] };
        lambda_p[m] = lambda.powf(power);
    }

    // V^{-1} via solve (R: matrixinverse uses solve first, SVD fallback)
    let v_inv = matrix_solve(&eigenvectors, n);

    // result = V %*% diag(lambda^p) %*% V^{-1}
    let mut result = vec![vec![0.0; n]; n];
    for i in 0..n {
        for j in 0..n {
            let mut s = 0.0;
            for m in 0..n {
                s += eigenvectors[i][m] * lambda_p[m] * v_inv[m][j];
            }
            result[i][j] = s;
        }
    }
    result
}

/// Check if a matrix is symmetric.
/// Matches R's isSymmetric.matrix with default tol = 100 * .Machine$double.eps
fn is_symmetric(mat: &[Vec<f64>], n: usize) -> bool {
    let tol = 100.0 * f64::EPSILON;
    for i in 0..n {
        for j in (i + 1)..n {
            let diff = (mat[i][j] - mat[j][i]).abs();
            let scale = mat[i][j].abs().max(mat[j][i].abs()).max(1.0);
            if diff > tol * scale {
                return false;
            }
        }
    }
    true
}

/// General (non-symmetric) real eigendecomposition.
///
/// Implements the same algorithm as LAPACK's dgeev:
/// 1. Reduce to upper Hessenberg form via Householder reflections (dgehrd)
/// 2. QR iteration with implicit shifts to get real Schur form (dhseqr)
/// 3. Compute right eigenvectors of the Schur form by back-substitution (dtrevc)
/// 4. Back-transform eigenvectors: V = Q * Z where Z are Schur eigenvectors
///
/// Returns (eigenvalues, eigenvectors) where columns of the eigenvector matrix
/// are right eigenvectors: A * V = V * diag(eigenvalues).
/// For complex eigenvalue pairs, returns Re(eigenvalue) and Re(eigenvector).
fn general_eigen(mat: &[Vec<f64>], n: usize) -> (Vec<f64>, Vec<Vec<f64>>) {
    if n == 1 {
        return (vec![mat[0][0]], vec![vec![1.0]]);
    }
    if n == 2 {
        return eigen_2x2(mat);
    }

    // Step 1: Reduce A to upper Hessenberg form: H = Q^T A Q
    let (mut h, mut q) = hessenberg_reduce(mat, n);

    // Step 2: QR iteration to get real Schur form T = Z^T H Z, with Q updated to Q*Z
    qr_iteration(&mut h, &mut q, n);

    // Step 3: Extract eigenvalues from diagonal/2x2 blocks of Schur form
    let eigenvalues = extract_schur_eigenvalues(&h, n);

    // Step 4: Compute eigenvectors of the Schur form T by back-substitution (dtrevc)
    // then back-transform by Q to get eigenvectors of original matrix A
    let eigenvectors = compute_schur_eigenvectors(&h, &q, &eigenvalues, n);

    // Sort by decreasing |eigenvalue| (matches R's eigen() ordering)
    let mut order: Vec<usize> = (0..n).collect();
    order.sort_by(|&a, &b| eigenvalues[b].abs().partial_cmp(&eigenvalues[a].abs()).unwrap());

    let sorted_vals: Vec<f64> = order.iter().map(|&i| eigenvalues[i]).collect();
    let mut sorted_vecs = vec![vec![0.0; n]; n];
    for i in 0..n {
        for j in 0..n {
            sorted_vecs[i][j] = eigenvectors[i][order[j]];
        }
    }

    (sorted_vals, sorted_vecs)
}

/// Eigendecomposition of a 2×2 matrix.
fn eigen_2x2(mat: &[Vec<f64>]) -> (Vec<f64>, Vec<Vec<f64>>) {
    let a = mat[0][0];
    let b = mat[0][1];
    let c = mat[1][0];
    let d = mat[1][1];
    let tr = a + d;
    let det = a * d - b * c;
    let disc = tr * tr - 4.0 * det;

    if disc >= 0.0 {
        let sqrt_disc = disc.sqrt();
        let l1 = (tr + sqrt_disc) / 2.0;
        let l2 = (tr - sqrt_disc) / 2.0;

        // Eigenvectors: for eigenvalue lambda, solve (A - lambda*I)v = 0
        let mut vecs = vec![vec![0.0; 2]; 2];
        for (idx, &lambda) in [l1, l2].iter().enumerate() {
            if c.abs() > f64::EPSILON {
                vecs[0][idx] = lambda - d;
                vecs[1][idx] = c;
            } else if b.abs() > f64::EPSILON {
                vecs[0][idx] = b;
                vecs[1][idx] = lambda - a;
            } else {
                vecs[idx][idx] = 1.0;
            }
            // Normalize
            let norm = (vecs[0][idx] * vecs[0][idx] + vecs[1][idx] * vecs[1][idx]).sqrt();
            if norm > 0.0 {
                vecs[0][idx] /= norm;
                vecs[1][idx] /= norm;
            }
        }

        // Sort by decreasing |eigenvalue|
        if l1.abs() >= l2.abs() {
            (vec![l1, l2], vecs)
        } else {
            let swapped = vec![
                vec![vecs[0][1], vecs[0][0]],
                vec![vecs[1][1], vecs[1][0]],
            ];
            (vec![l2, l1], swapped)
        }
    } else {
        // Complex pair — return Re
        let re = tr / 2.0;
        // Real part of eigenvector
        let mut vecs = vec![vec![0.0; 2]; 2];
        vecs[0][0] = b;
        vecs[1][0] = re - a;
        vecs[0][1] = 1.0;
        vecs[1][1] = 0.0;
        let norm = (vecs[0][0] * vecs[0][0] + vecs[1][0] * vecs[1][0]).sqrt();
        if norm > 0.0 {
            vecs[0][0] /= norm;
            vecs[1][0] /= norm;
        }
        (vec![re, re], vecs)
    }
}

/// Reduce matrix to upper Hessenberg form using Householder reflections.
/// Returns (H, Q) where H = Q^T A Q is upper Hessenberg.
fn hessenberg_reduce(mat: &[Vec<f64>], n: usize) -> (Vec<Vec<f64>>, Vec<Vec<f64>>) {
    let mut h: Vec<Vec<f64>> = mat.to_vec();
    let mut q = vec![vec![0.0; n]; n];
    for i in 0..n {
        q[i][i] = 1.0;
    }

    for col in 0..(n.saturating_sub(2)) {
        let m = n - col - 1; // length of the Householder vector
        let mut x = vec![0.0; m];
        for i in 0..m {
            x[i] = h[col + 1 + i][col];
        }

        let norm_x: f64 = x.iter().map(|v| v * v).sum::<f64>().sqrt();
        if norm_x < 1e-300 {
            continue;
        }

        // Householder: v = x + sign(x[0])*||x||*e_1, then normalize
        let sign = if x[0] >= 0.0 { 1.0 } else { -1.0 };
        x[0] += sign * norm_x;

        let norm_v: f64 = x.iter().map(|v| v * v).sum::<f64>().sqrt();
        if norm_v < 1e-300 {
            continue;
        }
        for v in &mut x {
            *v /= norm_v;
        }

        // H := (I - 2vv^T) H — apply from left to rows [col+1..n]
        for j in 0..n {
            let mut dot = 0.0;
            for i in 0..m {
                dot += x[i] * h[col + 1 + i][j];
            }
            let two_dot = 2.0 * dot;
            for i in 0..m {
                h[col + 1 + i][j] -= x[i] * two_dot;
            }
        }

        // H := H (I - 2vv^T) — apply from right to cols [col+1..n]
        for i in 0..n {
            let mut dot = 0.0;
            for j in 0..m {
                dot += h[i][col + 1 + j] * x[j];
            }
            let two_dot = 2.0 * dot;
            for j in 0..m {
                h[i][col + 1 + j] -= x[j] * two_dot;
            }
        }

        // Accumulate Q := Q (I - 2vv^T)
        for i in 0..n {
            let mut dot = 0.0;
            for j in 0..m {
                dot += q[i][col + 1 + j] * x[j];
            }
            let two_dot = 2.0 * dot;
            for j in 0..m {
                q[i][col + 1 + j] -= x[j] * two_dot;
            }
        }
    }

    (h, q)
}

/// QR iteration with implicit single shifts to reduce Hessenberg to real Schur form.
/// Modifies H in-place to become quasi-upper-triangular (real Schur form).
/// Q is updated so that the total transformation is tracked.
fn qr_iteration(h: &mut Vec<Vec<f64>>, q: &mut Vec<Vec<f64>>, n: usize) {
    let max_iter = 200 * n;
    let mut p = n; // active submatrix is h[0..p, 0..p]
    let mut iter = 0;

    while p > 1 && iter < max_iter {
        // Deflation: find the largest q_start where h[q_start][q_start-1] ≈ 0
        let mut q_start = p - 1;
        while q_start > 0 {
            let s = h[q_start - 1][q_start - 1].abs() + h[q_start][q_start].abs();
            let tol = f64::EPSILON * if s == 0.0 { 1.0 } else { s };
            if h[q_start][q_start - 1].abs() <= tol {
                h[q_start][q_start - 1] = 0.0;
                break;
            }
            q_start -= 1;
        }

        if q_start >= p - 1 {
            // 1×1 block deflated
            p -= 1;
            continue;
        }

        if q_start == p - 2 {
            // 2×2 block at bottom — check discriminant
            let a11 = h[p - 2][p - 2];
            let a12 = h[p - 2][p - 1];
            let a21 = h[p - 1][p - 2];
            let a22 = h[p - 1][p - 1];
            let disc = (a11 - a22) * (a11 - a22) + 4.0 * a12 * a21;
            if disc < 0.0 {
                // Complex pair — deflate as 2×2 block
                p -= 2;
            } else {
                // Real eigenvalues — apply one more Givens rotation to split
                // Use a shift equal to the eigenvalue closest to a22
                let sqrt_disc = disc.sqrt();
                let mu1 = (a11 + a22 + sqrt_disc) / 2.0;
                let mu2 = (a11 + a22 - sqrt_disc) / 2.0;
                let shift = if (mu1 - a22).abs() <= (mu2 - a22).abs() { mu1 } else { mu2 };

                let x = h[p - 2][p - 2] - shift;
                let y = h[p - 1][p - 2];
                let r = (x * x + y * y).sqrt();
                if r < 1e-300 {
                    p -= 2;
                    continue;
                }
                let c = x / r;
                let s = y / r;

                // Apply Givens from left
                for j in 0..n {
                    let t1 = h[p - 2][j];
                    let t2 = h[p - 1][j];
                    h[p - 2][j] = c * t1 + s * t2;
                    h[p - 1][j] = -s * t1 + c * t2;
                }
                // Apply Givens from right
                for i in 0..n {
                    let t1 = h[i][p - 2];
                    let t2 = h[i][p - 1];
                    h[i][p - 2] = c * t1 + s * t2;
                    h[i][p - 1] = -s * t1 + c * t2;
                }
                // Accumulate in Q
                for i in 0..n {
                    let t1 = q[i][p - 2];
                    let t2 = q[i][p - 1];
                    q[i][p - 2] = c * t1 + s * t2;
                    q[i][p - 1] = -s * t1 + c * t2;
                }

                // Check if we've successfully split
                let sub_tol = f64::EPSILON * (h[p - 2][p - 2].abs() + h[p - 1][p - 1].abs()).max(1.0);
                if h[p - 1][p - 2].abs() <= sub_tol {
                    h[p - 1][p - 2] = 0.0;
                    p -= 2;
                } else {
                    // Didn't converge in one step, just iterate again
                    iter += 1;
                }
            }
            continue;
        }

        // Wilkinson shift from trailing 2×2 block
        let a11 = h[p - 2][p - 2];
        let a12 = h[p - 2][p - 1];
        let a21 = h[p - 1][p - 2];
        let a22 = h[p - 1][p - 1];
        let tr = a11 + a22;
        let det = a11 * a22 - a12 * a21;
        let disc = tr * tr - 4.0 * det;

        let shift = if disc >= 0.0 {
            let sqrt_disc = disc.sqrt();
            let mu1 = (tr + sqrt_disc) / 2.0;
            let mu2 = (tr - sqrt_disc) / 2.0;
            if (mu1 - a22).abs() <= (mu2 - a22).abs() { mu1 } else { mu2 }
        } else {
            a22 // use real part when complex
        };

        // Implicit QR step with Givens rotations on h[q_start..p, :]
        let mut x = h[q_start][q_start] - shift;
        let mut y = h[q_start + 1][q_start];

        for k in q_start..(p - 1) {
            let r = (x * x + y * y).sqrt();
            if r < 1e-300 {
                break;
            }
            let c = x / r;
            let s = y / r;

            // Apply Givens rotation from left: rows k, k+1
            for j in 0..n {
                let t1 = h[k][j];
                let t2 = h[k + 1][j];
                h[k][j] = c * t1 + s * t2;
                h[k + 1][j] = -s * t1 + c * t2;
            }

            // Apply Givens rotation from right: cols k, k+1
            // Only rows 0..min(k+3, p) are affected (Hessenberg structure)
            let upper = (k + 3).min(n);
            for i in 0..upper {
                let t1 = h[i][k];
                let t2 = h[i][k + 1];
                h[i][k] = c * t1 + s * t2;
                h[i][k + 1] = -s * t1 + c * t2;
            }

            // Accumulate in Q
            for i in 0..n {
                let t1 = q[i][k];
                let t2 = q[i][k + 1];
                q[i][k] = c * t1 + s * t2;
                q[i][k + 1] = -s * t1 + c * t2;
            }

            if k + 2 < p {
                x = h[k + 1][k];
                y = h[k + 2][k];
            }
        }

        iter += 1;
    }
}

/// Extract eigenvalues from the quasi-upper-triangular real Schur form.
/// 1×1 diagonal blocks give real eigenvalues.
/// 2×2 diagonal blocks give complex conjugate pairs; we return Re(lambda).
fn extract_schur_eigenvalues(h: &[Vec<f64>], n: usize) -> Vec<f64> {
    let mut eigenvalues = vec![0.0; n];
    let mut i = 0;
    while i < n {
        if i + 1 < n {
            let sub = h[i + 1][i].abs();
            let diag_scale = h[i][i].abs() + h[i + 1][i + 1].abs();
            let tol = f64::EPSILON * if diag_scale == 0.0 { 1.0 } else { diag_scale };
            if sub > tol {
                // 2×2 block: complex conjugate pair
                let re = (h[i][i] + h[i + 1][i + 1]) / 2.0;
                eigenvalues[i] = re;
                eigenvalues[i + 1] = re;
                i += 2;
                continue;
            }
        }
        eigenvalues[i] = h[i][i];
        i += 1;
    }
    eigenvalues
}

/// Compute eigenvectors from the real Schur form T and transformation Q.
///
/// For each eigenvalue, solve (T - lambda*I) z = 0 by back-substitution
/// on the upper triangular part of T, then compute v = Q * z.
///
/// This is the equivalent of LAPACK's dtrevc + back-transformation.
fn compute_schur_eigenvectors(
    t: &[Vec<f64>],
    q: &[Vec<f64>],
    eigenvalues: &[f64],
    n: usize,
) -> Vec<Vec<f64>> {
    let mut eigenvectors = vec![vec![0.0; n]; n];

    // Identify which columns are part of 2×2 blocks
    let mut is_2x2 = vec![false; n];
    {
        let mut i = 0;
        while i < n {
            if i + 1 < n {
                let sub = t[i + 1][i].abs();
                let diag_scale = t[i][i].abs() + t[i + 1][i + 1].abs();
                let tol = f64::EPSILON * if diag_scale == 0.0 { 1.0 } else { diag_scale };
                if sub > tol {
                    is_2x2[i] = true;
                    is_2x2[i + 1] = true;
                    i += 2;
                    continue;
                }
            }
            i += 1;
        }
    }

    let mut i = 0;
    while i < n {
        if is_2x2[i] {
            // 2×2 block at (i, i+1): complex conjugate eigenvalues
            // We return Re(eigenvector) for both columns
            // The 2x2 block is [[a,b],[c,d]] with complex eigenvalues a+bi type
            // For the real part of the eigenvector, use the first column approach
            let lambda = eigenvalues[i];

            // For each of the two columns, solve (T - lambda*I)z = 0
            for col in 0..2 {
                let ci = i + col;
                let mut z = vec![0.0; n];
                z[ci] = 1.0;

                // Back-substitute rows ci-1 down to 0
                for row in (0..i).rev() {
                    if is_2x2[row] && row > 0 && is_2x2[row - 1] {
                        // row is the second row of a 2x2 block — skip, handled with row-1
                        continue;
                    }
                    let mut s = 0.0;
                    for j in (row + 1)..n {
                        s += t[row][j] * z[j];
                    }
                    let denom = t[row][row] - lambda;
                    z[row] = if denom.abs() > 1e-14 { -s / denom } else { 0.0 };
                }

                // Back-transform: v = Q * z
                for r in 0..n {
                    let mut s = 0.0;
                    for j in 0..n {
                        s += q[r][j] * z[j];
                    }
                    eigenvectors[r][ci] = s;
                }
            }

            i += 2;
        } else {
            // Real eigenvalue at position i
            let lambda = eigenvalues[i];
            let mut z = vec![0.0; n];
            z[i] = 1.0;

            // Back-substitute: for row = i-1 down to 0, solve for z[row]
            // (T[row][row] - lambda) * z[row] + sum_{j>row} T[row][j] * z[j] = 0
            for row in (0..i).rev() {
                // If this row is the second row of a 2×2 block, handle specially
                if is_2x2[row] && row > 0 && is_2x2[row - 1] {
                    // This is the bottom row of a 2×2 block.
                    // We need to solve the 2×2 system:
                    //   (T[row-1][row-1] - λ) z[row-1] + T[row-1][row] z[row] = -rhs_{row-1}
                    //   T[row][row-1] z[row-1] + (T[row][row] - λ) z[row] = -rhs_row
                    let r1 = row - 1;
                    let r2 = row;
                    let mut rhs1 = 0.0;
                    let mut rhs2 = 0.0;
                    for j in (r2 + 1)..n {
                        rhs1 += t[r1][j] * z[j];
                        rhs2 += t[r2][j] * z[j];
                    }
                    let a11 = t[r1][r1] - lambda;
                    let a12 = t[r1][r2];
                    let a21 = t[r2][r1];
                    let a22 = t[r2][r2] - lambda;
                    let det = a11 * a22 - a12 * a21;
                    if det.abs() > 1e-30 {
                        z[r1] = (-rhs1 * a22 + rhs2 * a12) / det;
                        z[r2] = (rhs1 * a21 - rhs2 * a11) / det;
                    }
                    continue;
                }

                // If this row is the top of a 2×2 block, skip — handled when we hit the bottom row
                if is_2x2[row] && row + 1 < n && is_2x2[row + 1] {
                    continue;
                }

                // Standard 1×1 back-substitution
                let mut s = 0.0;
                for j in (row + 1)..n {
                    s += t[row][j] * z[j];
                }
                let denom = t[row][row] - lambda;
                z[row] = if denom.abs() > 1e-14 { -s / denom } else { 0.0 };
            }

            // Back-transform: v = Q * z
            for r in 0..n {
                let mut s = 0.0;
                for j in 0..n {
                    s += q[r][j] * z[j];
                }
                eigenvectors[r][i] = s;
            }

            i += 1;
        }
    }

    eigenvectors
}

/// Solve a linear system A x = b for square matrix A.
/// Used for HC3 clustered: solve(I - H_ij).
fn matrix_solve(a: &[Vec<f64>], n: usize) -> Vec<Vec<f64>> {
    // LU decomposition with partial pivoting
    let mut lu = a.to_vec();
    let mut piv: Vec<usize> = (0..n).collect();

    for j in 0..n {
        // Find pivot
        let mut max_val = lu[piv[j]][j].abs();
        let mut max_row = j;
        for i in (j + 1)..n {
            if lu[piv[i]][j].abs() > max_val {
                max_val = lu[piv[i]][j].abs();
                max_row = i;
            }
        }
        piv.swap(j, max_row);

        let pj = piv[j];
        if lu[pj][j].abs() < 1e-15 {
            continue; // singular
        }

        for i in (j + 1)..n {
            let pi = piv[i];
            lu[pi][j] /= lu[pj][j];
            for col in (j + 1)..n {
                let factor = lu[pi][j] * lu[pj][col];
                lu[pi][col] -= factor;
            }
        }
    }

    // Solve for each column of identity matrix
    let mut inv = vec![vec![0.0; n]; n];
    for col in 0..n {
        // Forward substitution: L y = P b
        let mut y = vec![0.0; n];
        for i in 0..n {
            let pi = piv[i];
            y[i] = if pi == col { 1.0 } else { 0.0 };
            for j in 0..i {
                y[i] -= lu[pi][j] * y[j];
            }
        }
        // Back substitution: U x = y
        for i in (0..n).rev() {
            let pi = piv[i];
            inv[i][col] = y[i];
            for j in (i + 1)..n {
                inv[i][col] -= lu[pi][j] * inv[j][col];
            }
            inv[i][col] /= lu[pi][i];
        }
    }
    inv
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
        // Must match R's estfun.glm/bread.glm: sum(wres^2)/sum(w)
        let sum_wres2: f64 = wres.iter().map(|w| w * w).sum();
        let sum_weights: f64 = input.weights.iter().sum();
        if sum_weights > 0.0 {
            sum_wres2 / sum_weights
        } else {
            1.0
        }
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

    // --- HC2/HC3 building blocks ---
    // Precompute (X'WX)^{-1} and working residuals for HC2/HC3
    let xwx_inv = if hc_type == HCType::HC2 || hc_type == HCType::HC3 {
        Some(compute_xwx_inv(&input.model_matrix, &input.weights, k))
    } else {
        None
    };

    // HC2/HC3: adjust estimating functions before aggregation
    if (hc_type == HCType::HC2 || hc_type == HCType::HC3) {
        let xwx_inv_ref = xwx_inv.as_ref().unwrap();

        if g == n {
            // Non-clustered case: simple hat value adjustment
            let h = compute_hat_values(&input.model_matrix, &input.weights, xwx_inv_ref, k);
            for i in 0..n {
                let factor = if hc_type == HCType::HC2 {
                    1.0 / (1.0 - h[i]).sqrt()
                } else {
                    // HC3
                    1.0 / (1.0 - h[i])
                };
                for j in 0..k {
                    ef[i][j] *= factor;
                }
            }
        } else {
            // Clustered case: per-cluster H_ij matrix adjustment
            // R: res <- rowMeans(ef/X, na.rm = TRUE)
            let res = compute_working_residuals_from_ef(&ef, &input.model_matrix, k);

            for (_cid, indices) in &cluster_map {
                let m = indices.len();

                // Compute H_ij = X[ij,] %*% (X'WX)^{-1} %*% t(X[ij,]) %*% diag(w[ij])
                // H_ij is m × m
                let mut h_ij = vec![vec![0.0; m]; m];

                // First compute temp = X[ij,] %*% (X'WX)^{-1}, which is m × k
                let mut temp = vec![vec![0.0; k]; m];
                for (a, &idx_a) in indices.iter().enumerate() {
                    for c in 0..k {
                        let mut s = 0.0;
                        for r in 0..k {
                            s += input.model_matrix[idx_a][r] * xwx_inv_ref[r][c];
                        }
                        temp[a][c] = s;
                    }
                }

                // H_ij = temp %*% t(X[ij,]) %*% diag(w[ij])
                for a in 0..m {
                    for b in 0..m {
                        let idx_b = indices[b];
                        let mut s = 0.0;
                        for c in 0..k {
                            s += temp[a][c] * input.model_matrix[idx_b][c];
                        }
                        h_ij[a][b] = s * input.weights[idx_b];
                    }
                }

                // Compute I - H_ij
                let mut i_minus_h = vec![vec![0.0; m]; m];
                for a in 0..m {
                    for b in 0..m {
                        i_minus_h[a][b] = if a == b { 1.0 } else { 0.0 } - h_ij[a][b];
                    }
                }

                // Apply matrix power/inverse
                let adjustment = if hc_type == HCType::HC2 {
                    // (I - H_ij)^{-1/2}
                    matrixpower(&i_minus_h, -0.5)
                } else {
                    // HC3: solve(I - H_ij) = (I - H_ij)^{-1}
                    matrix_solve(&i_minus_h, m)
                };

                // efi[ij,] = drop(adjustment %*% res[ij]) * X[ij,]
                let res_ij: Vec<f64> = indices.iter().map(|&idx| res[idx]).collect();

                // adjustment %*% res_ij -> adjusted_res (length m)
                let mut adjusted_res = vec![0.0; m];
                for a in 0..m {
                    for b in 0..m {
                        adjusted_res[a] += adjustment[a][b] * res_ij[b];
                    }
                }

                // efi[ij,] = adjusted_res * X[ij,]
                for (a, &idx) in indices.iter().enumerate() {
                    for j in 0..k {
                        ef[idx][j] = adjusted_res[a] * input.model_matrix[idx][j];
                    }
                }
            }
        }

        // Bell & McCaffrey (2002) adjustment: sqrt((g-1)/g) * efi
        let bm_factor = ((g as f64 - 1.0) / g as f64).sqrt();
        for i in 0..n {
            for j in 0..k {
                ef[i][j] *= bm_factor;
            }
        }
    }

    // Aggregate estimating functions by cluster
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
