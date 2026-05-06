//! Mode finding for random effects
//!
//! This module implements Newton's method for finding the mode of the random
//! effects given the fixed effects and variance components. This is the
//! "inner optimization" in the Laplace approximation.
//!
//! # Algorithm
//!
//! Given (β, θ), find:
//! ```text
//! b_hat = argmax_b log p(y | b, β) + log p(b | θ)
//! ```
//!
//! Using Newton's method:
//! ```text
//! b_{k+1} = b_k + H^{-1} * grad
//! ```
//!
//! where H is the Hessian of the negative joint log-likelihood.

use crate::stats::regression::family::GlmFamily;

use super::super::random_effects::SparseMatrix;
use super::super::types::RandomEffect;
use super::gradient::{joint_gradient_b, joint_hessian_b};
use crate::stats::linalg::solve_linear_system;
use super::types::LaplaceControl;

/// Find the mode of the random effects (inner optimization)
///
/// Uses Newton's method to find:
/// ```text
/// b_hat = argmax_b log p(b | y, β, θ)
/// ```
///
/// # Arguments
/// * `y` - Response vector
/// * `x` - Fixed effects design matrix
/// * `z` - Random effects design matrix (sparse)
/// * `beta` - Fixed effect coefficients
/// * `b_init` - Initial random effect values
/// * `theta` - Variance component parameters
/// * `random_effects` - Random effect specifications
/// * `family` - GLM family
/// * `weights` - Observation weights
/// * `offset` - Offset vector
/// * `sigma` - Residual SD for Gaussian (used to scale IRLS weights)
/// * `control` - Optimization control parameters
///
/// # Returns
/// Tuple of (b_mode, iterations, converged)
pub fn find_b_mode(
    y: &[f64],
    x: &[Vec<f64>],
    z: &SparseMatrix,
    beta: &[f64],
    b_init: &[f64],
    theta: &[f64],
    random_effects: &[RandomEffect],
    family: &dyn GlmFamily,
    weights: &[f64],
    offset: &[f64],
    sigma: f64,
    control: &LaplaceControl,
) -> (Vec<f64>, usize, bool) {
    let q = b_init.len();
    let mut b = b_init.to_vec();
    let mut converged = false;

    for iter in 0..control.max_iter {
        // Compute gradient
        let grad = joint_gradient_b(
            y,
            x,
            z,
            beta,
            &b,
            theta,
            random_effects,
            family,
            weights,
            offset,
            sigma,
        );

        // Check convergence
        let grad_norm: f64 = grad.iter().map(|g| g * g).sum::<f64>().sqrt();
        if grad_norm < control.tol {
            converged = true;
            return (b, iter + 1, converged);
        }

        // Compute Hessian of negative log-likelihood
        let hessian = joint_hessian_b(
            y,
            x,
            z,
            beta,
            &b,
            theta,
            random_effects,
            family,
            weights,
            offset,
            sigma,
        );

        // Add regularization for numerical stability
        let mut hessian_reg = hessian.clone();
        for i in 0..q {
            hessian_reg[i][i] += control.min_variance;
        }

        // Solve H * delta = grad using Cholesky decomposition
        let delta = solve_linear_system(&hessian_reg, &grad);

        match delta {
            Some(d) => {
                // Update with damping: b_new = b + damping * delta
                for i in 0..q {
                    b[i] += control.damping * d[i];
                }
            }
            None => {
                // Hessian not positive definite - use gradient descent step
                let step_size = 0.01;
                for i in 0..q {
                    b[i] += step_size * grad[i];
                }
            }
        }
    }

    (b, control.max_iter, converged)
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::stats::regression::family::GaussianFamily;
    use crate::stats::regression::glmm::random_effects::{
        construct_z_matrix, intercept_term_values, populate_random_effect,
    };

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

    #[test]
    fn test_find_b_mode_converges() {
        let (y, x, re, z) = create_test_data();
        let family = GaussianFamily::default();

        let beta = vec![1.0, 0.5];
        let b_init = vec![0.0, 0.0, 0.0, 0.0];
        let theta = vec![0.0]; // sd = 1

        let weights = vec![1.0; y.len()];
        let offset = vec![0.0; y.len()];

        let control = LaplaceControl::default();

        let (b_mode, iters, converged) = find_b_mode(
            &y,
            &x,
            &z,
            &beta,
            &b_init,
            &theta,
            &[re],
            &family,
            &weights,
            &offset,
            1.0, // sigma
            &control,
        );

        assert!(converged, "Mode finding should converge");
        assert!(
            iters < control.max_iter,
            "Should converge before max iterations"
        );

        // Mode should be finite
        for &bi in &b_mode {
            assert!(bi.is_finite(), "Mode should be finite");
        }
    }

    #[test]
    fn test_find_b_mode_at_gradient_zero() {
        let (y, x, re, z) = create_test_data();
        let family = GaussianFamily::default();

        let beta = vec![1.0, 0.5];
        let b_init = vec![0.0, 0.0, 0.0, 0.0];
        let theta = vec![0.0];

        let weights = vec![1.0; y.len()];
        let offset = vec![0.0; y.len()];

        let control = LaplaceControl::default();

        let (b_mode, _, converged) = find_b_mode(
            &y,
            &x,
            &z,
            &beta,
            &b_init,
            &theta,
            &[re.clone()],
            &family,
            &weights,
            &offset,
            1.0, // sigma
            &control,
        );

        assert!(converged);

        // At the mode, gradient should be near zero
        let grad = joint_gradient_b(
            &y,
            &x,
            &z,
            &beta,
            &b_mode,
            &theta,
            &[re],
            &family,
            &weights,
            &offset,
            1.0, // sigma
        );

        let grad_norm: f64 = grad.iter().map(|g| g * g).sum::<f64>().sqrt();
        assert!(
            grad_norm < 1e-6,
            "Gradient at mode should be near zero: {}",
            grad_norm
        );
    }
}
