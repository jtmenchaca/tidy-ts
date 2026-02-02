//! Gradient and Hessian computation for GLMM optimization
//!
//! This module computes the gradient and Hessian of the joint log-likelihood
//! with respect to the random effects b. These are used in Newton's method
//! for finding the mode of the random effects.
//!
//! # Mathematical Background
//!
//! For exponential families, the gradient of the data log-likelihood is:
//! ```text
//! d/dη log p(y|η) = (y - μ) * dμ/dη / V(μ)
//! ```
//!
//! The Hessian (of negative log-likelihood) is:
//! ```text
//! H = Z^T W Z + Σ^{-1}
//! ```
//! where W = diag(w_i * (dμ/dη)² / V(μ))

use crate::stats::regression::family::GlmFamily;

use super::super::random_effects::SparseMatrix;
use super::super::random_effects_likelihood::{
    compute_block_precision_matrices, log_random_effects_prior,
};
use super::super::types::RandomEffect;

/// Compute gradient of joint log-likelihood with respect to b
///
/// The gradient combines the data gradient and the prior gradient:
/// ```text
/// grad_b = Z^T * w - Σ^{-1} * b
/// ```
///
/// where w is the vector of working residuals:
/// ```text
/// w_i = weights[i] * (y[i] - μ[i]) * dμ/dη_i / (V(μ[i]) * phi)
/// ```
///
/// For Gaussian, V(μ)=1 but phi=σ², so the total variance is σ².
///
/// # Arguments
/// * `y` - Response vector
/// * `x` - Fixed effects design matrix
/// * `z` - Random effects design matrix (sparse)
/// * `beta` - Fixed effect coefficients
/// * `b` - Random effect coefficients
/// * `theta` - Variance component parameters
/// * `random_effects` - Random effect specifications
/// * `family` - GLM family
/// * `weights` - Observation weights
/// * `offset` - Offset vector
/// * `sigma` - Residual SD for Gaussian (used to scale weights)
///
/// # Returns
/// Gradient vector (length q, where q is total random effect coefficients)
pub fn joint_gradient_b(
    y: &[f64],
    x: &[Vec<f64>],
    z: &SparseMatrix,
    beta: &[f64],
    b: &[f64],
    theta: &[f64],
    random_effects: &[RandomEffect],
    family: &dyn GlmFamily,
    weights: &[f64],
    offset: &[f64],
    sigma: f64,
) -> Vec<f64> {
    let n = y.len();

    // Compute linear predictor and fitted values
    let zb = z.mul_vec(b);
    let eta: Vec<f64> = (0..n)
        .map(|i| {
            let x_beta: f64 = x[i].iter().zip(beta.iter()).map(|(xij, bj)| xij * bj).sum();
            x_beta + zb[i] + offset[i]
        })
        .collect();

    let linkinv = family.linkinv();
    let mu = linkinv(&eta);

    // Compute working residuals: w_i * (y_i - μ_i) * dμ/dη_i / (V(μ_i) * phi)
    // For Gaussian: V(μ) = 1, phi = σ²
    // For Poisson/Binomial: V(μ) varies, phi = 1
    let mu_eta_fn = family.mu_eta();
    let mu_eta_vals = mu_eta_fn(&eta);
    let variance_fn = family.variance();

    // Dispersion parameter: σ² for Gaussian, 1 for other families
    let phi = if family.name() == "gaussian" {
        sigma * sigma
    } else {
        1.0
    };

    let working_resid: Vec<f64> = (0..n)
        .map(|i| {
            let var = variance_fn.variance(mu[i]).unwrap_or(1.0).max(1e-10);
            let mu_eta = mu_eta_vals[i].max(1e-10);
            // Total variance = V(μ) * phi
            weights[i] * (y[i] - mu[i]) * mu_eta / (var * phi)
        })
        .collect();

    // Gradient from data: Z^T * working_resid
    let data_grad = z.transpose_mul_vec(&working_resid);

    // Gradient from prior: -Σ^{-1} * b
    let prior_result = log_random_effects_prior(b, theta, random_effects);
    let prior_grad = prior_result.grad_b;

    // Combined gradient
    data_grad
        .iter()
        .zip(prior_grad.iter())
        .map(|(d, p)| d + p)
        .collect()
}

/// Compute Hessian of negative joint log-likelihood with respect to b
///
/// The Hessian is:
/// ```text
/// H = Z^T W Z + Σ^{-1}
/// ```
///
/// where W = diag(w_i * (dμ/dη)² / (V(μ) * phi)) are the IRLS weights.
/// For Gaussian: V(μ)=1, phi=σ², so W = 1/σ² * I
///
/// Note: This returns the Hessian of the NEGATIVE log-likelihood,
/// which is positive definite for a well-posed problem.
///
/// # Arguments
/// * `y` - Response vector
/// * `x` - Fixed effects design matrix
/// * `z` - Random effects design matrix (sparse)
/// * `beta` - Fixed effect coefficients
/// * `b` - Random effect coefficients
/// * `theta` - Variance component parameters
/// * `random_effects` - Random effect specifications
/// * `family` - GLM family
/// * `weights` - Observation weights
/// * `offset` - Offset vector
/// * `sigma` - Residual SD for Gaussian (used to scale weights)
///
/// # Returns
/// Hessian matrix (q × q)
pub fn joint_hessian_b(
    y: &[f64],
    x: &[Vec<f64>],
    z: &SparseMatrix,
    beta: &[f64],
    b: &[f64],
    theta: &[f64],
    random_effects: &[RandomEffect],
    family: &dyn GlmFamily,
    weights: &[f64],
    offset: &[f64],
    sigma: f64,
) -> Vec<Vec<f64>> {
    let n = y.len();

    // Compute linear predictor and fitted values
    let zb = z.mul_vec(b);
    let eta: Vec<f64> = (0..n)
        .map(|i| {
            let x_beta: f64 = x[i].iter().zip(beta.iter()).map(|(xij, bj)| xij * bj).sum();
            x_beta + zb[i] + offset[i]
        })
        .collect();

    let linkinv = family.linkinv();
    let mu = linkinv(&eta);

    // Compute IRLS weights: w_i * (dμ/dη)² / (V(μ) * phi)
    // For Gaussian: V(μ) = 1, phi = σ²
    // For Poisson/Binomial: V(μ) varies, phi = 1
    let mu_eta_fn = family.mu_eta();
    let mu_eta_vals = mu_eta_fn(&eta);
    let variance_fn = family.variance();

    // Dispersion parameter: σ² for Gaussian, 1 for other families
    let phi = if family.name() == "gaussian" {
        sigma * sigma
    } else {
        1.0
    };

    let irls_weights: Vec<f64> = (0..n)
        .map(|i| {
            let var = variance_fn.variance(mu[i]).unwrap_or(1.0).max(1e-10);
            let mu_eta = mu_eta_vals[i];
            // Total variance = V(μ) * phi
            weights[i] * mu_eta * mu_eta / (var * phi)
        })
        .collect();

    // Compute Z^T * W * Z (data part of Hessian)
    let zt_w_z = z.weighted_cross_product(&irls_weights);

    // Add precision matrices (prior part of Hessian)
    let precision_matrices = compute_block_precision_matrices(theta, random_effects);

    let mut hessian = zt_w_z;

    // Add block-diagonal precision to Hessian
    let mut b_offset = 0;
    for (re_idx, re) in random_effects.iter().enumerate() {
        let k = re.n_terms();
        let n_groups = re.n_groups;

        if let Some(ref prec) = precision_matrices[re_idx] {
            // Add precision matrix for each group
            for group_idx in 0..n_groups {
                let start = b_offset + group_idx * k;
                for i in 0..k {
                    for j in 0..k {
                        hessian[start + i][start + j] += prec[i][j];
                    }
                }
            }
        }

        b_offset += re.total_coefficients();
    }

    hessian
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::stats::regression::family::GaussianFamily;
    use crate::stats::regression::glmm::laplace::likelihood::joint_log_likelihood;
    use crate::stats::regression::glmm::random_effects::{
        construct_z_matrix, intercept_term_values, populate_random_effect,
    };
    use crate::stats::regression::glmm::variance_components::cholesky_decompose;

    fn create_test_data() -> (Vec<f64>, Vec<Vec<f64>>, RandomEffect, SparseMatrix) {
        let n = 20;
        let n_groups = 4;
        let obs_per_group = n / n_groups;

        let group_values: Vec<String> = (0..n)
            .map(|i| format!("g{}", i / obs_per_group))
            .collect();

        let mut re = RandomEffect::intercept("group".to_string());
        populate_random_effect(&mut re, &group_values);

        let term_values = intercept_term_values(n);
        let z =
            construct_z_matrix(&re, &term_values).expect("Z matrix construction should succeed");

        let x: Vec<Vec<f64>> = (0..n).map(|i| vec![1.0, i as f64 * 0.1]).collect();

        let beta = vec![1.0, 0.5];
        let b_true = vec![0.5, -0.3, 0.2, -0.4];
        let zb = z.mul_vec(&b_true);

        let y: Vec<f64> = (0..n)
            .map(|i| {
                let x_beta: f64 = x[i].iter().zip(beta.iter()).map(|(xij, bj)| xij * bj).sum();
                x_beta + zb[i] + 0.1 * (i as f64 - 10.0) * 0.1
            })
            .collect();

        (y, x, re, z)
    }

    fn approx_eq(a: f64, b: f64, tol: f64) -> bool {
        (a - b).abs() < tol || (a.is_nan() && b.is_nan())
    }

    #[test]
    fn test_joint_gradient_b_numerical() {
        let (y, x, re, z) = create_test_data();
        let family = GaussianFamily::default();

        let beta = vec![1.0, 0.5];
        let b = vec![0.0, 0.0, 0.0, 0.0];
        let theta = vec![0.0];

        let weights = vec![1.0; y.len()];
        let offset = vec![0.0; y.len()];

        let grad = joint_gradient_b(
            &y,
            &x,
            &z,
            &beta,
            &b,
            &theta,
            &[re.clone()],
            &family,
            &weights,
            &offset,
            1.0, // sigma
        );

        // Verify gradient numerically
        let eps = 1e-6;
        for i in 0..4 {
            let mut b_plus = b.clone();
            let mut b_minus = b.clone();
            b_plus[i] += eps;
            b_minus[i] -= eps;

            let ll_plus = joint_log_likelihood(
                &y,
                &x,
                &z,
                &beta,
                &b_plus,
                &theta,
                &[re.clone()],
                &family,
                &weights,
                &offset,
            );
            let ll_minus = joint_log_likelihood(
                &y,
                &x,
                &z,
                &beta,
                &b_minus,
                &theta,
                &[re.clone()],
                &family,
                &weights,
                &offset,
            );

            let num_grad = (ll_plus - ll_minus) / (2.0 * eps);
            assert!(
                approx_eq(grad[i], num_grad, 1e-4),
                "Gradient mismatch at {}: analytical={} numerical={}",
                i,
                grad[i],
                num_grad
            );
        }
    }

    #[test]
    fn test_joint_hessian_b_symmetric() {
        let (y, x, re, z) = create_test_data();
        let family = GaussianFamily::default();

        let beta = vec![1.0, 0.5];
        let b = vec![0.1, -0.1, 0.2, -0.2];
        let theta = vec![0.0];

        let weights = vec![1.0; y.len()];
        let offset = vec![0.0; y.len()];

        let hessian = joint_hessian_b(
            &y,
            &x,
            &z,
            &beta,
            &b,
            &theta,
            &[re],
            &family,
            &weights,
            &offset,
            1.0, // sigma
        );

        // Hessian should be symmetric
        let n = hessian.len();
        for i in 0..n {
            for j in 0..n {
                assert!(
                    approx_eq(hessian[i][j], hessian[j][i], 1e-10),
                    "Hessian not symmetric at ({},{}): {} vs {}",
                    i,
                    j,
                    hessian[i][j],
                    hessian[j][i]
                );
            }
        }

        // Hessian should be positive definite
        let chol = cholesky_decompose(&hessian);
        assert!(chol.is_some(), "Hessian should be positive definite");
    }
}
