//! Variance component parameterization for GLMM
//!
//! This module implements the log-Cholesky parameterization for variance components,
//! matching the approach used in lme4/glmmTMB. This parameterization provides:
//!
//! - Unconstrained optimization (no bounds needed)
//! - Numerically stable transformations
//! - Positive-definite covariance matrices guaranteed
//!
//! # Parameterization
//!
//! For a k×k covariance matrix Σ, we use the Cholesky decomposition:
//!   Σ = L L^T
//!
//! where L is lower-triangular with positive diagonal.
//!
//! The theta parameterization stores:
//!   theta[0..k] = log(diag(L))  (log of diagonal elements)
//!   theta[k..] = L[i,j] for i > j (off-diagonal elements, row-major)
//!
//! This gives k(k+1)/2 parameters for a k×k covariance matrix.
//!
//! # Transformations
//!
//! - `theta_to_cholesky`: theta → L (Cholesky factor)
//! - `cholesky_to_vcov`: L → Σ (covariance matrix)
//! - `theta_to_vcov`: theta → Σ (combined)
//! - `vcov_to_theta`: Σ → theta (inverse)
//! - `theta_to_sd`: theta → standard deviations
//! - `theta_to_corr`: theta → correlation matrix

use super::types::CovarianceType;

/// Convert theta parameters to Cholesky factor L
///
/// # Arguments
/// * `theta` - Unconstrained parameters [log(L[0,0]), log(L[1,1]), ..., L[1,0], L[2,0], ...]
/// * `k` - Dimension of the covariance matrix
///
/// # Returns
/// * Lower-triangular Cholesky factor as a row-major k×k matrix
///
/// # Panics
/// Panics if theta.len() != k*(k+1)/2
pub fn theta_to_cholesky(theta: &[f64], k: usize) -> Vec<Vec<f64>> {
    let expected_len = k * (k + 1) / 2;
    assert_eq!(
        theta.len(),
        expected_len,
        "theta has {} elements but k={} requires {}",
        theta.len(),
        k,
        expected_len
    );

    let mut chol = vec![vec![0.0; k]; k];

    // First k elements are log of diagonal
    for i in 0..k {
        chol[i][i] = theta[i].exp();
    }

    // Remaining elements are off-diagonal (lower triangular)
    let mut idx = k;
    for i in 1..k {
        for j in 0..i {
            chol[i][j] = theta[idx];
            idx += 1;
        }
    }

    chol
}

/// Convert Cholesky factor L to covariance matrix Σ = L L^T
///
/// # Arguments
/// * `chol` - Lower-triangular Cholesky factor (k×k)
///
/// # Returns
/// * Symmetric positive-definite covariance matrix (k×k)
pub fn cholesky_to_vcov(chol: &[Vec<f64>]) -> Vec<Vec<f64>> {
    let k = chol.len();
    let mut vcov = vec![vec![0.0; k]; k];

    for i in 0..k {
        for j in 0..=i {
            // Σ[i,j] = sum over l of L[i,l] * L[j,l]
            let mut sum = 0.0;
            for l in 0..=j.min(i) {
                sum += chol[i][l] * chol[j][l];
            }
            vcov[i][j] = sum;
            vcov[j][i] = sum; // Symmetric
        }
    }

    vcov
}

/// Convert theta parameters directly to covariance matrix
///
/// # Arguments
/// * `theta` - Unconstrained parameters
/// * `k` - Dimension of the covariance matrix
///
/// # Returns
/// * Symmetric positive-definite covariance matrix (k×k)
pub fn theta_to_vcov(theta: &[f64], k: usize) -> Vec<Vec<f64>> {
    let chol = theta_to_cholesky(theta, k);
    cholesky_to_vcov(&chol)
}

/// Convert covariance matrix to theta parameters
///
/// Uses Cholesky decomposition then extracts log-Cholesky parameters.
///
/// # Arguments
/// * `vcov` - Symmetric positive-definite covariance matrix
///
/// # Returns
/// * Unconstrained theta parameters, or None if vcov is not positive definite
pub fn vcov_to_theta(vcov: &[Vec<f64>]) -> Option<Vec<f64>> {
    let k = vcov.len();
    if k == 0 {
        return Some(Vec::new());
    }

    // Perform Cholesky decomposition
    let chol = cholesky_decompose(vcov)?;

    // Extract theta: log(diagonal) then off-diagonals
    let mut theta = Vec::with_capacity(k * (k + 1) / 2);

    // Log of diagonal elements
    for i in 0..k {
        if chol[i][i] <= 0.0 {
            return None; // Not positive definite
        }
        theta.push(chol[i][i].ln());
    }

    // Off-diagonal elements (row-major lower triangular)
    for i in 1..k {
        for j in 0..i {
            theta.push(chol[i][j]);
        }
    }

    Some(theta)
}

/// Cholesky decomposition of a symmetric positive-definite matrix
///
/// # Arguments
/// * `a` - Symmetric positive-definite matrix
///
/// # Returns
/// * Lower-triangular Cholesky factor L such that A = L L^T, or None if not positive definite
pub fn cholesky_decompose(a: &[Vec<f64>]) -> Option<Vec<Vec<f64>>> {
    let n = a.len();
    let mut l = vec![vec![0.0; n]; n];

    for i in 0..n {
        for j in 0..=i {
            let mut sum = a[i][j];

            for k in 0..j {
                sum -= l[i][k] * l[j][k];
            }

            if i == j {
                if sum <= 0.0 {
                    return None; // Not positive definite
                }
                l[i][j] = sum.sqrt();
            } else {
                l[i][j] = sum / l[j][j];
            }
        }
    }

    Some(l)
}

/// Convert theta parameters to standard deviations
///
/// # Arguments
/// * `theta` - Unconstrained parameters
/// * `k` - Dimension of the covariance matrix
///
/// # Returns
/// * Vector of standard deviations (length k)
pub fn theta_to_sd(theta: &[f64], k: usize) -> Vec<f64> {
    let vcov = theta_to_vcov(theta, k);
    vcov.iter().enumerate().map(|(i, row)| row[i].sqrt()).collect()
}

/// Convert theta parameters to correlation matrix
///
/// # Arguments
/// * `theta` - Unconstrained parameters
/// * `k` - Dimension of the covariance matrix
///
/// # Returns
/// * Correlation matrix (k×k) with 1s on diagonal
pub fn theta_to_corr(theta: &[f64], k: usize) -> Vec<Vec<f64>> {
    if k <= 1 {
        return vec![vec![1.0]];
    }

    let vcov = theta_to_vcov(theta, k);
    vcov_to_corr(&vcov)
}

/// Convert covariance matrix to correlation matrix
///
/// # Arguments
/// * `vcov` - Covariance matrix
///
/// # Returns
/// * Correlation matrix with 1s on diagonal
pub fn vcov_to_corr(vcov: &[Vec<f64>]) -> Vec<Vec<f64>> {
    let k = vcov.len();
    if k == 0 {
        return Vec::new();
    }

    let sds: Vec<f64> = vcov.iter().enumerate().map(|(i, row)| row[i].sqrt()).collect();
    let mut corr = vec![vec![0.0; k]; k];

    for i in 0..k {
        for j in 0..k {
            if sds[i] > 0.0 && sds[j] > 0.0 {
                corr[i][j] = vcov[i][j] / (sds[i] * sds[j]);
            } else if i == j {
                corr[i][j] = 1.0;
            }
        }
    }

    corr
}

/// Compute the Jacobian of the theta -> vcov transformation
///
/// This is needed for REML estimation where we need to adjust the likelihood
/// for the transformation of parameters.
///
/// # Arguments
/// * `theta` - Unconstrained parameters
/// * `k` - Dimension of the covariance matrix
///
/// # Returns
/// * Jacobian matrix (n_vcov_params × n_theta) where n_vcov_params = k(k+1)/2
///
/// The Jacobian relates changes in theta to changes in the unique elements of vcov.
/// For REML, we typically need |J| or log|J| for the likelihood adjustment.
pub fn theta_to_vcov_jacobian(theta: &[f64], k: usize) -> Vec<Vec<f64>> {
    let n_params = k * (k + 1) / 2;

    // Numerical differentiation with central differences
    let eps = 1e-7;
    let mut jacobian = vec![vec![0.0; n_params]; n_params];

    for j in 0..n_params {
        let mut theta_plus = theta.to_vec();
        let mut theta_minus = theta.to_vec();
        theta_plus[j] += eps;
        theta_minus[j] -= eps;

        let vcov_plus = theta_to_vcov(&theta_plus, k);
        let vcov_minus = theta_to_vcov(&theta_minus, k);

        // Extract unique elements (lower triangular including diagonal)
        let mut row = 0;
        for i in 0..k {
            for l in 0..=i {
                jacobian[row][j] = (vcov_plus[i][l] - vcov_minus[i][l]) / (2.0 * eps);
                row += 1;
            }
        }
    }

    jacobian
}

/// Compute the log-determinant of the Jacobian for REML
///
/// # Arguments
/// * `theta` - Unconstrained parameters
/// * `k` - Dimension of the covariance matrix
///
/// # Returns
/// * log|J| where J is the Jacobian of the transformation
pub fn log_jacobian_determinant(theta: &[f64], k: usize) -> f64 {
    if k == 0 {
        return 0.0;
    }

    // For the log-Cholesky parameterization, the Jacobian has a nice form
    // |J| = 2^k * prod(L[i,i]^(k-i+1)) for i = 0..k-1
    //
    // Since L[i,i] = exp(theta[i]), we have:
    // log|J| = k*log(2) + sum((k-i)*theta[i]) for i = 0..k-1
    //
    // Actually, the exact form depends on whether we're looking at the Jacobian
    // from theta to the unique elements of Σ or to vec(Σ). For the former:
    //
    // The log-Jacobian for theta -> vech(Σ) is:
    // log|J| = sum_{i=0}^{k-1} (k - i) * theta[i] + k * log(2)

    let mut log_det = (k as f64) * 2.0_f64.ln();
    for i in 0..k {
        log_det += ((k - i) as f64) * theta[i];
    }

    log_det
}

/// Compute gradient of log-Jacobian determinant with respect to theta
///
/// # Arguments
/// * `theta` - Unconstrained parameters
/// * `k` - Dimension of the covariance matrix
///
/// # Returns
/// * Gradient vector of length k*(k+1)/2
pub fn log_jacobian_determinant_gradient(_theta: &[f64], k: usize) -> Vec<f64> {
    let n_params = k * (k + 1) / 2;
    let mut grad = vec![0.0; n_params];

    // d/d(theta[i]) log|J| = (k - i) for i = 0..k-1 (the log-diagonal terms)
    // d/d(theta[j]) log|J| = 0 for j >= k (the off-diagonal terms)
    for i in 0..k {
        grad[i] = (k - i) as f64;
    }

    grad
}

/// Create theta parameters for a given covariance structure
///
/// # Arguments
/// * `k` - Number of terms in the random effect
/// * `cov_type` - Type of covariance structure
/// * `initial_sd` - Initial standard deviation(s)
/// * `initial_corr` - Initial correlation (for compound symmetry)
///
/// # Returns
/// * Initial theta parameters
pub fn initial_theta(
    k: usize,
    cov_type: &CovarianceType,
    initial_sd: f64,
    initial_corr: f64,
) -> Vec<f64> {
    match cov_type {
        CovarianceType::Independent => {
            // k parameters: log(sd) for each term
            vec![initial_sd.ln(); k]
        }
        CovarianceType::Unstructured => {
            // k*(k+1)/2 parameters: k log(sd) + k*(k-1)/2 off-diagonals
            let mut theta = vec![initial_sd.ln(); k];
            // Off-diagonals initialized to 0 (no correlation)
            theta.extend(vec![0.0; k * (k - 1) / 2]);
            theta
        }
        CovarianceType::CompoundSymmetry => {
            // 2 parameters: log(sd) and correlation
            // For CS, all variances equal, all correlations equal
            // We use a simplified parameterization for CS
            vec![initial_sd.ln(), initial_corr]
        }
    }
}

/// Convert theta to variance component structure
///
/// # Arguments
/// * `theta` - Unconstrained parameters
/// * `k` - Number of terms
/// * `cov_type` - Covariance structure type
/// * `group_name` - Name of the grouping variable
/// * `term_names` - Names of the random effect terms
///
/// # Returns
/// * VarianceComponent with computed vcov, std_dev, and correlation
pub fn theta_to_variance_component(
    theta: &[f64],
    k: usize,
    cov_type: &CovarianceType,
    group_name: String,
    term_names: Vec<String>,
) -> super::VarianceComponent {
    let (vcov, std_dev, correlation) = match cov_type {
        CovarianceType::Independent => {
            // Independent: diagonal only
            assert_eq!(theta.len(), k, "Independent requires k theta params");
            let sds: Vec<f64> = theta.iter().map(|t| t.exp()).collect();
            let vcov: Vec<Vec<f64>> = (0..k)
                .map(|i| {
                    let mut row = vec![0.0; k];
                    row[i] = sds[i] * sds[i];
                    row
                })
                .collect();
            let corr = vec![vec![1.0; k]; k].into_iter()
                .enumerate()
                .map(|(i, mut row)| {
                    for j in 0..k {
                        if i != j {
                            row[j] = 0.0;
                        }
                    }
                    row
                })
                .collect();
            (vcov, sds, Some(corr))
        }
        CovarianceType::Unstructured => {
            let vcov = theta_to_vcov(theta, k);
            let std_dev = theta_to_sd(theta, k);
            let correlation = Some(theta_to_corr(theta, k));
            (vcov, std_dev, correlation)
        }
        CovarianceType::CompoundSymmetry => {
            // theta[0] = log(sd), theta[1] = correlation
            assert!(theta.len() >= 2, "CompoundSymmetry requires at least 2 params");
            let sd = theta[0].exp();
            let rho = theta[1].tanh(); // Transform to (-1, 1)

            let variance = sd * sd;
            let covariance = rho * variance;

            let mut vcov = vec![vec![covariance; k]; k];
            for i in 0..k {
                vcov[i][i] = variance;
            }

            let mut corr = vec![vec![rho; k]; k];
            for i in 0..k {
                corr[i][i] = 1.0;
            }

            (vcov, vec![sd; k], Some(corr))
        }
    };

    super::VarianceComponent {
        group_name,
        term_names,
        vcov,
        std_dev,
        correlation,
        std_errors: None,
    }
}

/// Compute the total number of theta parameters for a set of random effects
///
/// # Arguments
/// * `random_effects` - Slice of RandomEffect specifications
///
/// # Returns
/// * Total number of theta parameters
pub fn total_theta_params(random_effects: &[super::RandomEffect]) -> usize {
    random_effects.iter().map(|re| re.n_variance_params()).sum()
}

/// Split theta vector into per-random-effect components
///
/// # Arguments
/// * `theta` - Combined theta vector for all random effects
/// * `random_effects` - Slice of RandomEffect specifications
///
/// # Returns
/// * Vector of theta slices, one per random effect
pub fn split_theta<'a>(
    theta: &'a [f64],
    random_effects: &[super::RandomEffect],
) -> Vec<&'a [f64]> {
    let mut result = Vec::with_capacity(random_effects.len());
    let mut offset = 0;

    for re in random_effects {
        let n_params = re.n_variance_params();
        result.push(&theta[offset..offset + n_params]);
        offset += n_params;
    }

    result
}

#[cfg(test)]
mod tests {
    use super::*;
    use super::super::types::CovarianceType;

    const TOL: f64 = 1e-10;

    fn approx_eq(a: f64, b: f64, tol: f64) -> bool {
        (a - b).abs() < tol
    }

    fn matrix_approx_eq(a: &[Vec<f64>], b: &[Vec<f64>], tol: f64) -> bool {
        if a.len() != b.len() {
            return false;
        }
        for (row_a, row_b) in a.iter().zip(b.iter()) {
            if row_a.len() != row_b.len() {
                return false;
            }
            for (val_a, val_b) in row_a.iter().zip(row_b.iter()) {
                if !approx_eq(*val_a, *val_b, tol) {
                    return false;
                }
            }
        }
        true
    }

    #[test]
    fn test_theta_to_cholesky_1x1() {
        // 1x1 case: theta = [log(sd)]
        let theta = vec![1.0_f64.ln()]; // sd = 1
        let chol = theta_to_cholesky(&theta, 1);
        assert_eq!(chol.len(), 1);
        assert!(approx_eq(chol[0][0], 1.0, TOL));
    }

    #[test]
    fn test_theta_to_cholesky_2x2() {
        // 2x2 case: theta = [log(L[0,0]), log(L[1,1]), L[1,0]]
        let theta = vec![0.0, 0.0, 0.5]; // L[0,0]=1, L[1,1]=1, L[1,0]=0.5
        let chol = theta_to_cholesky(&theta, 2);

        assert_eq!(chol.len(), 2);
        assert!(approx_eq(chol[0][0], 1.0, TOL));
        assert!(approx_eq(chol[0][1], 0.0, TOL));
        assert!(approx_eq(chol[1][0], 0.5, TOL));
        assert!(approx_eq(chol[1][1], 1.0, TOL));
    }

    #[test]
    fn test_cholesky_to_vcov_1x1() {
        let chol = vec![vec![2.0]];
        let vcov = cholesky_to_vcov(&chol);
        assert!(approx_eq(vcov[0][0], 4.0, TOL)); // 2^2 = 4
    }

    #[test]
    fn test_cholesky_to_vcov_2x2() {
        // L = [[1, 0], [0.5, 1]]
        // Σ = L L^T = [[1, 0.5], [0.5, 1.25]]
        let chol = vec![vec![1.0, 0.0], vec![0.5, 1.0]];
        let vcov = cholesky_to_vcov(&chol);

        assert!(approx_eq(vcov[0][0], 1.0, TOL));
        assert!(approx_eq(vcov[0][1], 0.5, TOL));
        assert!(approx_eq(vcov[1][0], 0.5, TOL));
        assert!(approx_eq(vcov[1][1], 1.25, TOL));
    }

    #[test]
    fn test_theta_to_vcov_2x2() {
        // theta = [log(1), log(1), 0.5] -> L = [[1, 0], [0.5, 1]]
        let theta = vec![0.0, 0.0, 0.5];
        let vcov = theta_to_vcov(&theta, 2);

        assert!(approx_eq(vcov[0][0], 1.0, TOL));
        assert!(approx_eq(vcov[0][1], 0.5, TOL));
        assert!(approx_eq(vcov[1][0], 0.5, TOL));
        assert!(approx_eq(vcov[1][1], 1.25, TOL));
    }

    #[test]
    fn test_round_trip_1x1() {
        // Start with variance = 4.0, sd = 2.0
        let original_vcov = vec![vec![4.0]];
        let theta = vcov_to_theta(&original_vcov).unwrap();
        let recovered_vcov = theta_to_vcov(&theta, 1);

        assert!(matrix_approx_eq(&original_vcov, &recovered_vcov, TOL));
    }

    #[test]
    fn test_round_trip_2x2() {
        // Start with a valid 2x2 covariance matrix
        // Σ = [[4, 1], [1, 9]] (var1=4, var2=9, cov=1)
        let original_vcov = vec![vec![4.0, 1.0], vec![1.0, 9.0]];
        let theta = vcov_to_theta(&original_vcov).unwrap();
        let recovered_vcov = theta_to_vcov(&theta, 2);

        assert!(matrix_approx_eq(&original_vcov, &recovered_vcov, TOL));
    }

    #[test]
    fn test_round_trip_3x3() {
        // 3x3 covariance matrix
        let original_vcov = vec![
            vec![4.0, 0.5, 0.25],
            vec![0.5, 2.0, 0.3],
            vec![0.25, 0.3, 1.0],
        ];
        let theta = vcov_to_theta(&original_vcov).unwrap();
        let recovered_vcov = theta_to_vcov(&theta, 3);

        assert!(matrix_approx_eq(&original_vcov, &recovered_vcov, TOL));
    }

    #[test]
    fn test_theta_to_sd() {
        // theta = [log(2), log(3), 0] -> sd = [2, 3]
        let theta = vec![2.0_f64.ln(), 3.0_f64.ln(), 0.0];
        let sd = theta_to_sd(&theta, 2);

        assert!(approx_eq(sd[0], 2.0, TOL));
        assert!(approx_eq(sd[1], 3.0, TOL));
    }

    #[test]
    fn test_theta_to_corr_uncorrelated() {
        // L = [[1, 0], [0, 1]] -> Σ = I -> corr = I
        let theta = vec![0.0, 0.0, 0.0];
        let corr = theta_to_corr(&theta, 2);

        assert!(approx_eq(corr[0][0], 1.0, TOL));
        assert!(approx_eq(corr[0][1], 0.0, TOL));
        assert!(approx_eq(corr[1][0], 0.0, TOL));
        assert!(approx_eq(corr[1][1], 1.0, TOL));
    }

    #[test]
    fn test_theta_to_corr_correlated() {
        // Create a covariance matrix with known correlation
        // var1=1, var2=1, cov=0.5 -> corr=0.5
        let original_vcov = vec![vec![1.0, 0.5], vec![0.5, 1.0]];
        let theta = vcov_to_theta(&original_vcov).unwrap();
        let corr = theta_to_corr(&theta, 2);

        assert!(approx_eq(corr[0][0], 1.0, TOL));
        assert!(approx_eq(corr[0][1], 0.5, TOL));
        assert!(approx_eq(corr[1][0], 0.5, TOL));
        assert!(approx_eq(corr[1][1], 1.0, TOL));
    }

    #[test]
    fn test_cholesky_decompose_2x2() {
        let a = vec![vec![4.0, 2.0], vec![2.0, 5.0]];
        let l = cholesky_decompose(&a).unwrap();

        // Verify L L^T = A
        let recovered = cholesky_to_vcov(&l);
        assert!(matrix_approx_eq(&a, &recovered, TOL));
    }

    #[test]
    fn test_cholesky_decompose_not_positive_definite() {
        // Not positive definite: eigenvalues are not all positive
        let a = vec![vec![1.0, 2.0], vec![2.0, 1.0]];
        assert!(cholesky_decompose(&a).is_none());
    }

    #[test]
    fn test_initial_theta_independent() {
        let theta = initial_theta(3, &CovarianceType::Independent, 2.0, 0.0);
        assert_eq!(theta.len(), 3);
        for t in &theta {
            assert!(approx_eq(*t, 2.0_f64.ln(), TOL));
        }
    }

    #[test]
    fn test_initial_theta_unstructured() {
        let theta = initial_theta(2, &CovarianceType::Unstructured, 1.5, 0.0);
        // 2 log(sd) + 1 off-diagonal = 3 params
        assert_eq!(theta.len(), 3);
        assert!(approx_eq(theta[0], 1.5_f64.ln(), TOL));
        assert!(approx_eq(theta[1], 1.5_f64.ln(), TOL));
        assert!(approx_eq(theta[2], 0.0, TOL)); // Off-diagonal initialized to 0
    }

    #[test]
    fn test_initial_theta_compound_symmetry() {
        let theta = initial_theta(3, &CovarianceType::CompoundSymmetry, 2.0, 0.3);
        assert_eq!(theta.len(), 2);
        assert!(approx_eq(theta[0], 2.0_f64.ln(), TOL));
        assert!(approx_eq(theta[1], 0.3, TOL));
    }

    #[test]
    fn test_theta_to_variance_component_independent() {
        let theta = vec![1.0_f64.ln(), 2.0_f64.ln()]; // sd = [1, 2]
        let vc = theta_to_variance_component(
            &theta,
            2,
            &CovarianceType::Independent,
            "group".to_string(),
            vec!["intercept".to_string(), "slope".to_string()],
        );

        assert_eq!(vc.group_name, "group");
        assert!(approx_eq(vc.std_dev[0], 1.0, TOL));
        assert!(approx_eq(vc.std_dev[1], 2.0, TOL));
        assert!(approx_eq(vc.vcov[0][0], 1.0, TOL));
        assert!(approx_eq(vc.vcov[1][1], 4.0, TOL));
        assert!(approx_eq(vc.vcov[0][1], 0.0, TOL)); // Independent = no correlation
    }

    #[test]
    fn test_theta_to_variance_component_compound_symmetry() {
        let theta = vec![1.0_f64.ln(), 0.5]; // sd = 1, rho = tanh(0.5) ≈ 0.462
        let vc = theta_to_variance_component(
            &theta,
            2,
            &CovarianceType::CompoundSymmetry,
            "group".to_string(),
            vec!["a".to_string(), "b".to_string()],
        );

        let expected_rho = 0.5_f64.tanh();
        assert!(approx_eq(vc.std_dev[0], 1.0, TOL));
        assert!(approx_eq(vc.std_dev[1], 1.0, TOL));
        assert!(approx_eq(vc.vcov[0][0], 1.0, TOL));
        assert!(approx_eq(vc.vcov[1][1], 1.0, TOL));
        assert!(approx_eq(vc.vcov[0][1], expected_rho, TOL));

        let corr = vc.correlation.unwrap();
        assert!(approx_eq(corr[0][1], expected_rho, TOL));
    }

    #[test]
    fn test_log_jacobian_determinant() {
        // For k=1, log|J| = log(2) + theta[0]
        let theta = vec![0.0];
        let log_jac = log_jacobian_determinant(&theta, 1);
        assert!(approx_eq(log_jac, 2.0_f64.ln(), 1e-8));

        // For k=2, log|J| = 2*log(2) + 2*theta[0] + 1*theta[1]
        let theta2 = vec![1.0, 0.5, 0.0];
        let log_jac2 = log_jacobian_determinant(&theta2, 2);
        let expected = 2.0 * 2.0_f64.ln() + 2.0 * 1.0 + 1.0 * 0.5;
        assert!(approx_eq(log_jac2, expected, 1e-8));
    }

    #[test]
    fn test_log_jacobian_determinant_gradient() {
        let theta = vec![1.0, 0.5, 0.0];
        let grad = log_jacobian_determinant_gradient(&theta, 2);

        // d/d(theta[0]) = k - 0 = 2
        // d/d(theta[1]) = k - 1 = 1
        // d/d(theta[2]) = 0 (off-diagonal)
        assert!(approx_eq(grad[0], 2.0, TOL));
        assert!(approx_eq(grad[1], 1.0, TOL));
        assert!(approx_eq(grad[2], 0.0, TOL));
    }

    #[test]
    fn test_total_theta_params() {
        use super::super::types::RandomEffect;

        let re1 = RandomEffect::intercept("a".to_string());
        let re2 = RandomEffect::intercept_slope("b".to_string(), "x".to_string());

        // re1: 1 param (intercept only, independent)
        // re2: 3 params (intercept + slope, unstructured: 2 variances + 1 corr)
        let total = total_theta_params(&[re1, re2]);
        assert_eq!(total, 4);
    }

    #[test]
    fn test_split_theta() {
        use super::super::types::RandomEffect;

        let re1 = RandomEffect::intercept("a".to_string());
        let re2 = RandomEffect::intercept_slope("b".to_string(), "x".to_string());

        let theta = vec![0.0, 1.0, 2.0, 3.0]; // 1 + 3 = 4 params
        let splits = split_theta(&theta, &[re1, re2]);

        assert_eq!(splits.len(), 2);
        assert_eq!(splits[0], &[0.0]);
        assert_eq!(splits[1], &[1.0, 2.0, 3.0]);
    }
}
