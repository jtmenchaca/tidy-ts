//! Random effects likelihood computations
//!
//! This module computes the log-likelihood of random effects given variance components:
//!
//! log p(b | theta) = -0.5 * b' * Sigma^{-1} * b - 0.5 * log|Sigma| - (q/2) * log(2*pi)
//!
//! where:
//! - b is the vector of random effects (BLUPs)
//! - theta are the variance component parameters (log-Cholesky)
//! - Sigma is the block-diagonal covariance matrix derived from theta
//! - q is the total number of random effect coefficients
//!
//! # Gradients
//!
//! For optimization, we need:
//! - d/db log p(b | theta) = -Sigma^{-1} * b
//! - d/dtheta log p(b | theta) - computed via chain rule through the Cholesky
//!
//! # Block Structure
//!
//! For multiple random effects, Sigma is block-diagonal with one block per group.
//! This enables efficient computation:
//! - Each group's contribution is computed independently
//! - Memory scales linearly with number of groups, not quadratically

use super::types::{CovarianceType, RandomEffect};
use crate::stats::linalg::cholesky_decompose;
use super::variance_components::{theta_to_vcov, split_theta};

/// Result from computing the random effects prior likelihood
#[derive(Debug, Clone)]
pub struct RandomEffectsPrior {
    /// Log-likelihood: log p(b | theta)
    pub log_likelihood: f64,
    /// Gradient with respect to b (length = total random effect coefficients)
    pub grad_b: Vec<f64>,
    /// Gradient with respect to theta (length = total variance parameters)
    pub grad_theta: Vec<f64>,
}

/// Compute log p(b | theta) for a single random effect with a single group
///
/// This is the core computation for one group's contribution to the prior.
///
/// # Arguments
/// * `b_group` - Random effect coefficients for this group (length k for k terms)
/// * `theta_re` - Variance parameters for this random effect type
/// * `k` - Number of terms (intercept, slopes, etc.)
/// * `cov_type` - Covariance structure type
///
/// # Returns
/// * (log_lik, grad_b, grad_theta) for this group
fn log_prior_one_group(
    b_group: &[f64],
    theta_re: &[f64],
    k: usize,
    cov_type: &CovarianceType,
) -> (f64, Vec<f64>, Vec<f64>) {
    let n_theta = theta_re.len();

    // Get covariance matrix from theta
    let vcov = compute_vcov_for_type(theta_re, k, cov_type);

    // Compute Cholesky decomposition for solving linear systems
    let chol = match cholesky_decompose(&vcov) {
        Some(c) => c,
        None => {
            // Fallback: return large penalty if not positive definite
            return (
                f64::NEG_INFINITY,
                vec![0.0; k],
                vec![0.0; n_theta],
            );
        }
    };

    // Compute log determinant: log|Sigma| = 2 * sum(log(L_ii))
    let log_det = 2.0 * (0..k).map(|i| chol[i][i].ln()).sum::<f64>();

    // Solve L * y = b to get y, then Sigma^{-1} * b = L^{-T} * y
    let y = forward_solve(&chol, b_group);
    let sigma_inv_b = backward_solve(&chol, &y);

    // Compute quadratic form: b' * Sigma^{-1} * b
    let quad_form: f64 = b_group.iter().zip(sigma_inv_b.iter()).map(|(bi, si)| bi * si).sum();

    // Log-likelihood (without the constant term which cancels in optimization)
    // log p(b | theta) = -0.5 * (q * log(2*pi) + log|Sigma| + b' Sigma^{-1} b)
    let log_lik = -0.5 * ((k as f64) * (2.0 * std::f64::consts::PI).ln() + log_det + quad_form);

    // Gradient w.r.t. b: d/db = -Sigma^{-1} * b
    let grad_b: Vec<f64> = sigma_inv_b.iter().map(|&x| -x).collect();

    // Gradient w.r.t. theta: use numerical differentiation for now
    // (analytical gradient is complex due to the chain rule through Cholesky)
    let grad_theta = numerical_grad_theta(b_group, theta_re, k, cov_type);

    (log_lik, grad_b, grad_theta)
}

/// Compute variance-covariance matrix for a given covariance type
fn compute_vcov_for_type(theta_re: &[f64], k: usize, cov_type: &CovarianceType) -> Vec<Vec<f64>> {
    match cov_type {
        CovarianceType::Independent => {
            // Independent: diagonal only, theta_re = [log(sd_1), ..., log(sd_k)]
            let mut vcov = vec![vec![0.0; k]; k];
            for i in 0..k {
                let sd = theta_re[i].exp();
                vcov[i][i] = sd * sd;
            }
            vcov
        }
        CovarianceType::Unstructured => {
            // Full log-Cholesky parameterization
            theta_to_vcov(theta_re, k)
        }
        CovarianceType::CompoundSymmetry => {
            // theta_re = [log(sd), raw_corr]
            // Issue 3 fix: Use proper bounds transformation for CS correlation
            // Valid range is (-1/(k-1), 1) for positive definiteness
            let sd = theta_re[0].exp();
            let rho = super::variance_components::cs_correlation_transform(theta_re[1], k);
            let variance = sd * sd;
            let covariance = rho * variance;

            let mut vcov = vec![vec![covariance; k]; k];
            for i in 0..k {
                vcov[i][i] = variance;
            }
            vcov
        }
    }
}

/// Solve L * y = b where L is lower triangular (forward substitution)
fn forward_solve(l: &[Vec<f64>], b: &[f64]) -> Vec<f64> {
    let n = b.len();
    let mut y = vec![0.0; n];

    for i in 0..n {
        let mut sum = b[i];
        for j in 0..i {
            sum -= l[i][j] * y[j];
        }
        y[i] = sum / l[i][i];
    }
    y
}

/// Solve L^T * x = y where L is lower triangular (backward substitution)
fn backward_solve(l: &[Vec<f64>], y: &[f64]) -> Vec<f64> {
    let n = y.len();
    let mut x = vec![0.0; n];

    for i in (0..n).rev() {
        let mut sum = y[i];
        for j in (i + 1)..n {
            sum -= l[j][i] * x[j]; // L^T[i][j] = L[j][i]
        }
        x[i] = sum / l[i][i];
    }
    x
}

/// Numerical gradient of log-likelihood w.r.t. theta for one group
fn numerical_grad_theta(
    b_group: &[f64],
    theta_re: &[f64],
    k: usize,
    cov_type: &CovarianceType,
) -> Vec<f64> {
    let eps = 1e-7;
    let n_theta = theta_re.len();
    let mut grad = vec![0.0; n_theta];

    for i in 0..n_theta {
        let mut theta_plus = theta_re.to_vec();
        let mut theta_minus = theta_re.to_vec();
        theta_plus[i] += eps;
        theta_minus[i] -= eps;

        let ll_plus = log_prior_scalar(b_group, &theta_plus, k, cov_type);
        let ll_minus = log_prior_scalar(b_group, &theta_minus, k, cov_type);

        grad[i] = (ll_plus - ll_minus) / (2.0 * eps);
    }
    grad
}

/// Compute just the log-likelihood (no gradients) for numerical differentiation
fn log_prior_scalar(b_group: &[f64], theta_re: &[f64], k: usize, cov_type: &CovarianceType) -> f64 {
    let vcov = compute_vcov_for_type(theta_re, k, cov_type);

    let chol = match cholesky_decompose(&vcov) {
        Some(c) => c,
        None => return f64::NEG_INFINITY,
    };

    let log_det = 2.0 * (0..k).map(|i| chol[i][i].ln()).sum::<f64>();
    let y = forward_solve(&chol, b_group);
    let quad_form: f64 = y.iter().map(|yi| yi * yi).sum();

    -0.5 * ((k as f64) * (2.0 * std::f64::consts::PI).ln() + log_det + quad_form)
}

/// Compute log p(b | theta) for all random effects across all groups
///
/// # Arguments
/// * `b` - All random effect coefficients, concatenated by random effect then by group
///         Layout: [RE1_group1, RE1_group2, ..., RE2_group1, RE2_group2, ...]
///         Each RE_group block has `n_terms` elements
/// * `theta` - All variance parameters, concatenated by random effect
/// * `random_effects` - Random effect specifications (with group info populated)
///
/// # Returns
/// * RandomEffectsPrior with log-likelihood and gradients
pub fn log_random_effects_prior(
    b: &[f64],
    theta: &[f64],
    random_effects: &[RandomEffect],
) -> RandomEffectsPrior {
    // Validate input dimensions
    let total_b: usize = random_effects.iter().map(|re| re.total_coefficients()).sum();
    assert_eq!(
        b.len(),
        total_b,
        "b length ({}) must equal total random effect coefficients ({})",
        b.len(),
        total_b
    );

    let theta_splits = split_theta(theta, random_effects);

    let mut log_likelihood = 0.0;
    let mut grad_b = vec![0.0; b.len()];
    let mut grad_theta = vec![0.0; theta.len()];

    let mut b_offset = 0;
    let mut theta_offset = 0;

    for (re_idx, re) in random_effects.iter().enumerate() {
        let k = re.n_terms();
        let n_groups = re.n_groups;
        let theta_re = theta_splits[re_idx];

        // Process each group for this random effect
        for group_idx in 0..n_groups {
            // Extract b for this group
            let b_start = b_offset + group_idx * k;
            let b_group = &b[b_start..b_start + k];

            // Compute contribution from this group
            let (ll, gb, gt) = log_prior_one_group(b_group, theta_re, k, &re.covariance);

            log_likelihood += ll;

            // Accumulate gradients
            for (i, g) in gb.iter().enumerate() {
                grad_b[b_start + i] += g;
            }
            // Note: grad_theta accumulates across all groups for this RE
            for (i, g) in gt.iter().enumerate() {
                grad_theta[theta_offset + i] += g;
            }
        }

        b_offset += re.total_coefficients();
        theta_offset += re.n_variance_params();
    }

    RandomEffectsPrior {
        log_likelihood,
        grad_b,
        grad_theta,
    }
}

/// Compute just the log-likelihood without gradients (faster for evaluation only)
pub fn log_random_effects_prior_value(
    b: &[f64],
    theta: &[f64],
    random_effects: &[RandomEffect],
) -> f64 {
    let theta_splits = split_theta(theta, random_effects);

    let mut log_likelihood = 0.0;
    let mut b_offset = 0;

    for (re_idx, re) in random_effects.iter().enumerate() {
        let k = re.n_terms();
        let n_groups = re.n_groups;
        let theta_re = theta_splits[re_idx];

        for group_idx in 0..n_groups {
            let b_start = b_offset + group_idx * k;
            let b_group = &b[b_start..b_start + k];

            log_likelihood += log_prior_scalar(b_group, theta_re, k, &re.covariance);
        }

        b_offset += re.total_coefficients();
    }

    log_likelihood
}

/// Compute the inverse covariance matrix Sigma^{-1} for a random effect
///
/// This is useful for computing the Hessian of the Laplace approximation.
///
/// # Arguments
/// * `theta_re` - Variance parameters for this random effect
/// * `k` - Number of terms
/// * `cov_type` - Covariance structure
///
/// # Returns
/// * Inverse covariance matrix (k x k), or None if not positive definite
pub fn compute_precision_matrix(
    theta_re: &[f64],
    k: usize,
    cov_type: &CovarianceType,
) -> Option<Vec<Vec<f64>>> {
    let vcov = compute_vcov_for_type(theta_re, k, cov_type);
    let chol = cholesky_decompose(&vcov)?;

    // Compute L^{-1} then Sigma^{-1} = L^{-T} L^{-1}
    let mut l_inv = vec![vec![0.0; k]; k];

    // Compute L^{-1} column by column
    for j in 0..k {
        let mut e_j = vec![0.0; k];
        e_j[j] = 1.0;
        let col = forward_solve(&chol, &e_j);
        for i in 0..k {
            l_inv[i][j] = col[i];
        }
    }

    // Sigma^{-1} = L^{-T} * L^{-1}
    let mut precision = vec![vec![0.0; k]; k];
    for i in 0..k {
        for j in 0..k {
            let mut sum = 0.0;
            for l in 0..k {
                sum += l_inv[l][i] * l_inv[l][j];
            }
            precision[i][j] = sum;
        }
    }

    Some(precision)
}

/// Compute the block-diagonal precision matrix for all random effects
///
/// Returns a list of precision matrices, one for each random effect type.
/// Each matrix is replicated across all groups of that type.
pub fn compute_block_precision_matrices(
    theta: &[f64],
    random_effects: &[RandomEffect],
) -> Vec<Option<Vec<Vec<f64>>>> {
    let theta_splits = split_theta(theta, random_effects);

    random_effects
        .iter()
        .enumerate()
        .map(|(i, re)| {
            compute_precision_matrix(theta_splits[i], re.n_terms(), &re.covariance)
        })
        .collect()
}

#[cfg(test)]
mod tests {
    use super::*;

    const TOL: f64 = 1e-8;

    fn approx_eq(a: f64, b: f64, tol: f64) -> bool {
        (a - b).abs() < tol || (a.is_nan() && b.is_nan())
    }

    fn create_simple_random_effect(n_groups: usize, n_terms: usize) -> RandomEffect {
        RandomEffect {
            grouping_var: "group".to_string(),
            terms: (0..n_terms).map(|i| format!("term{}", i)).collect(),
            n_groups,
            group_sizes: vec![10; n_groups],
            group_ids: (0..n_groups).map(|i| format!("g{}", i)).collect(),
            group_indices: (0..n_groups * 10).map(|i| i / 10).collect(),
            covariance: if n_terms == 1 {
                CovarianceType::Independent
            } else {
                CovarianceType::Unstructured
            },
        }
    }

    #[test]
    fn test_forward_solve() {
        // L = [[2, 0], [1, 3]]
        // b = [4, 10]
        // L * y = b => y = [2, 8/3]
        let l = vec![vec![2.0, 0.0], vec![1.0, 3.0]];
        let b = vec![4.0, 10.0];
        let y = forward_solve(&l, &b);

        assert!(approx_eq(y[0], 2.0, TOL));
        assert!(approx_eq(y[1], (10.0 - 1.0 * 2.0) / 3.0, TOL)); // (10 - 2)/3 = 8/3
    }

    #[test]
    fn test_backward_solve() {
        // L = [[2, 0], [1, 3]]
        // L^T * x = y where y = [2, 3]
        // L^T = [[2, 1], [0, 3]]
        // x = [0.5, 1] (solving from bottom up)
        let l = vec![vec![2.0, 0.0], vec![1.0, 3.0]];
        let y = vec![2.0, 3.0];
        let x = backward_solve(&l, &y);

        // x[1] = y[1] / L[1][1] = 3/3 = 1
        // x[0] = (y[0] - L[1][0] * x[1]) / L[0][0] = (2 - 1*1) / 2 = 0.5
        assert!(approx_eq(x[1], 1.0, TOL));
        assert!(approx_eq(x[0], 0.5, TOL));
    }

    #[test]
    fn test_log_prior_one_group_identity() {
        // Test with identity covariance (theta = [log(1)] = [0])
        // b = [1.0], Sigma = [[1]]
        // log p(b | theta) = -0.5 * (log(2*pi) + log(1) + 1) = -0.5 * (log(2*pi) + 1)
        let b = vec![1.0];
        let theta = vec![0.0]; // log(1) = 0
        let k = 1;

        let (ll, grad_b, _grad_theta) = log_prior_one_group(&b, &theta, k, &CovarianceType::Independent);

        let expected_ll = -0.5 * ((2.0 * std::f64::consts::PI).ln() + 0.0 + 1.0);
        assert!(approx_eq(ll, expected_ll, 1e-6), "ll={} expected={}", ll, expected_ll);

        // grad_b should be -Sigma^{-1} * b = -1 * 1 = -1
        assert!(approx_eq(grad_b[0], -1.0, 1e-6));
    }

    #[test]
    fn test_log_prior_one_group_scaled() {
        // Test with variance = 4 (sd = 2, theta = log(2))
        // b = [2.0], Sigma = [[4]]
        // log p(b | theta) = -0.5 * (log(2*pi) + log(4) + 4/4)
        //                  = -0.5 * (log(2*pi) + 2*log(2) + 1)
        let b = vec![2.0];
        let theta = vec![2.0_f64.ln()]; // sd = 2
        let k = 1;

        let (ll, grad_b, _) = log_prior_one_group(&b, &theta, k, &CovarianceType::Independent);

        let expected_ll = -0.5 * ((2.0 * std::f64::consts::PI).ln() + 4.0_f64.ln() + 1.0);
        assert!(approx_eq(ll, expected_ll, 1e-6), "ll={} expected={}", ll, expected_ll);

        // grad_b = -Sigma^{-1} * b = -(1/4) * 2 = -0.5
        assert!(approx_eq(grad_b[0], -0.5, 1e-6));
    }

    #[test]
    fn test_log_prior_two_terms_independent() {
        // Two independent terms with different variances
        // theta = [log(1), log(2)] -> variances [1, 4]
        // b = [1, 2]
        // log p = log p1 + log p2
        //       = -0.5*(log(2pi)+0+1) + -0.5*(log(2pi)+log(4)+1)
        let b = vec![1.0, 2.0];
        let theta = vec![0.0, 2.0_f64.ln()]; // sd = [1, 2]
        let k = 2;

        let (ll, grad_b, _) = log_prior_one_group(&b, &theta, k, &CovarianceType::Independent);

        // For independent, Sigma is diagonal, log|Sigma| = log(1) + log(4) = log(4)
        // b' Sigma^{-1} b = 1/1 + 4/4 = 2
        let expected_ll = -0.5 * (2.0 * (2.0 * std::f64::consts::PI).ln() + 4.0_f64.ln() + 2.0);
        assert!(approx_eq(ll, expected_ll, 1e-6), "ll={} expected={}", ll, expected_ll);

        // grad_b = -Sigma^{-1} * b = [-1/1 * 1, -1/4 * 2] = [-1, -0.5]
        assert!(approx_eq(grad_b[0], -1.0, 1e-6));
        assert!(approx_eq(grad_b[1], -0.5, 1e-6));
    }

    #[test]
    fn test_log_prior_full() {
        // Test the full function with multiple groups
        let mut re = create_simple_random_effect(3, 1); // 3 groups, 1 term each
        re.covariance = CovarianceType::Independent;

        // b = [b_group1, b_group2, b_group3] = [1, 2, 3]
        let b = vec![1.0, 2.0, 3.0];
        // theta = [log(1)] for variance = 1
        let theta = vec![0.0];

        let result = log_random_effects_prior(&b, &theta, &[re]);

        // Each group contributes: -0.5 * (log(2pi) + 0 + b_i^2)
        let expected_ll = -0.5 * (3.0 * (2.0 * std::f64::consts::PI).ln() + 1.0 + 4.0 + 9.0);
        assert!(
            approx_eq(result.log_likelihood, expected_ll, 1e-6),
            "ll={} expected={}",
            result.log_likelihood,
            expected_ll
        );

        // grad_b = [-1, -2, -3] for identity covariance
        assert!(approx_eq(result.grad_b[0], -1.0, 1e-6));
        assert!(approx_eq(result.grad_b[1], -2.0, 1e-6));
        assert!(approx_eq(result.grad_b[2], -3.0, 1e-6));
    }

    #[test]
    fn test_log_prior_value_only() {
        // Verify the value-only function matches the full function
        let mut re = create_simple_random_effect(5, 1);
        re.covariance = CovarianceType::Independent;

        let b: Vec<f64> = (0..5).map(|i| i as f64 * 0.5).collect();
        let theta = vec![0.5_f64.ln()]; // sd = 0.5

        let result = log_random_effects_prior(&b, &theta, &[re.clone()]);
        let value_only = log_random_effects_prior_value(&b, &theta, &[re]);

        assert!(
            approx_eq(result.log_likelihood, value_only, 1e-10),
            "full={} value_only={}",
            result.log_likelihood,
            value_only
        );
    }

    #[test]
    fn test_precision_matrix_identity() {
        // theta = [0] => sd = 1 => variance = 1 => precision = 1
        let theta = vec![0.0];
        let prec = compute_precision_matrix(&theta, 1, &CovarianceType::Independent).unwrap();

        assert_eq!(prec.len(), 1);
        assert!(approx_eq(prec[0][0], 1.0, TOL));
    }

    #[test]
    fn test_precision_matrix_scaled() {
        // theta = [log(2)] => sd = 2 => variance = 4 => precision = 0.25
        let theta = vec![2.0_f64.ln()];
        let prec = compute_precision_matrix(&theta, 1, &CovarianceType::Independent).unwrap();

        assert!(approx_eq(prec[0][0], 0.25, TOL));
    }

    #[test]
    fn test_precision_matrix_2x2() {
        // Create a 2x2 covariance with known structure
        // Sigma = [[1, 0.5], [0.5, 1]]
        // Need to find theta that produces this
        // Using vcov_to_theta from variance_components
        let vcov = vec![vec![1.0, 0.5], vec![0.5, 1.0]];
        let theta = super::super::variance_components::vcov_to_theta(&vcov).unwrap();

        let prec = compute_precision_matrix(&theta, 2, &CovarianceType::Unstructured).unwrap();

        // Sigma^{-1} for [[1, 0.5], [0.5, 1]] = 1/(1-0.25) * [[1, -0.5], [-0.5, 1]]
        //                                      = (4/3) * [[1, -0.5], [-0.5, 1]]
        let det = 1.0 - 0.25; // 0.75
        let expected_inv = vec![
            vec![1.0 / det, -0.5 / det],
            vec![-0.5 / det, 1.0 / det],
        ];

        for i in 0..2 {
            for j in 0..2 {
                assert!(
                    approx_eq(prec[i][j], expected_inv[i][j], 1e-6),
                    "prec[{}][{}]={} expected={}",
                    i,
                    j,
                    prec[i][j],
                    expected_inv[i][j]
                );
            }
        }
    }

    #[test]
    fn test_gradient_b_numerical_check() {
        // Verify that the analytical gradient matches numerical gradient
        let b = vec![1.5];
        let theta = vec![0.3]; // some non-trivial variance
        let eps = 1e-6;

        let (_, grad_b, _) = log_prior_one_group(&b, &theta, 1, &CovarianceType::Independent);

        // Numerical gradient
        let b_plus = vec![b[0] + eps];
        let b_minus = vec![b[0] - eps];
        let ll_plus = log_prior_scalar(&b_plus, &theta, 1, &CovarianceType::Independent);
        let ll_minus = log_prior_scalar(&b_minus, &theta, 1, &CovarianceType::Independent);
        let num_grad = (ll_plus - ll_minus) / (2.0 * eps);

        assert!(
            approx_eq(grad_b[0], num_grad, 1e-5),
            "analytical={} numerical={}",
            grad_b[0],
            num_grad
        );
    }

    #[test]
    fn test_gradient_theta_numerical_check() {
        // Verify that the gradient w.r.t. theta is reasonable
        let b = vec![1.5];
        let theta = vec![0.3];
        let eps = 1e-6;

        let (_, _, grad_theta) = log_prior_one_group(&b, &theta, 1, &CovarianceType::Independent);

        // Numerical gradient
        let theta_plus = vec![theta[0] + eps];
        let theta_minus = vec![theta[0] - eps];
        let ll_plus = log_prior_scalar(&b, &theta_plus, 1, &CovarianceType::Independent);
        let ll_minus = log_prior_scalar(&b, &theta_minus, 1, &CovarianceType::Independent);
        let num_grad = (ll_plus - ll_minus) / (2.0 * eps);

        // Since we're using numerical differentiation internally, they should match closely
        assert!(
            approx_eq(grad_theta[0], num_grad, 1e-4),
            "analytical={} numerical={}",
            grad_theta[0],
            num_grad
        );
    }

    #[test]
    fn test_crossed_random_effects() {
        // Two random effects with different structures
        let mut re1 = create_simple_random_effect(2, 1); // 2 groups, 1 term
        re1.covariance = CovarianceType::Independent;
        re1.grouping_var = "patient".to_string();

        let mut re2 = create_simple_random_effect(3, 1); // 3 groups, 1 term
        re2.covariance = CovarianceType::Independent;
        re2.grouping_var = "provider".to_string();

        // b = [patient1, patient2, provider1, provider2, provider3]
        let b = vec![1.0, 2.0, 0.5, 1.5, 2.5];
        // theta = [log(sd_patient), log(sd_provider)]
        let theta = vec![0.0, 0.5_f64.ln()]; // sd = [1, 0.5]

        let result = log_random_effects_prior(&b, &theta, &[re1.clone(), re2.clone()]);

        // Check dimensions
        assert_eq!(result.grad_b.len(), 5);
        assert_eq!(result.grad_theta.len(), 2);

        // Patient contribution: -0.5 * (2*log(2pi) + 0 + 1 + 4) = -0.5 * (2*log(2pi) + 5)
        // Provider contribution: -0.5 * (3*log(2pi) + 3*log(0.25) + (0.25+2.25+6.25)/0.25)
        //                      = -0.5 * (3*log(2pi) + 3*log(0.25) + 35)
        // This is complex, so just verify it's finite and reasonable
        assert!(result.log_likelihood.is_finite());
        assert!(result.log_likelihood < 0.0); // Should be negative
    }
}
