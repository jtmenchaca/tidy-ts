//! Laplace approximation for GLMM marginal likelihood
//!
//! This module implements the main Laplace approximation used for
//! integrating out the random effects in GLMMs.
//!
//! # Algorithm
//!
//! The Laplace approximation for the marginal likelihood is:
//! ```text
//! log p(y | β, θ) ≈ log p(y, b_hat | β, θ) - 0.5 * log|H|
//! ```
//!
//! where:
//! - b_hat is the mode: argmax_b log p(y | b, β) + log p(b | θ)
//! - H is the Hessian of negative joint log-likelihood at the mode
//!
//! # Sigma Handling (Issue 2 - glmmTMB approach)
//!
//! For Gaussian family, sigma (residual SD) is jointly optimized with variance
//! components. Following glmmTMB:
//! - `betadisp` is a parameter vector (we use a single log_sigma)
//! - `phi = exp(etadisp)` where etadisp = log_sigma for simple case
//! - Gaussian likelihood: `dnorm(y, mu, phi, log=TRUE)`
//!
//! glmmTMB reference: glmmTMB.cpp lines 860, 926-939, 965
//!
//! # References
//!
//! - Kristensen et al. (2016). TMB: Automatic Differentiation and Laplace Approximation
//! - Bates et al. (2015). Fitting Linear Mixed-Effects Models Using lme4

use crate::stats::regression::family::GlmFamily;

use super::super::random_effects::SparseMatrix;
use super::super::types::RandomEffect;
use super::super::variance_components::total_theta_params;
use super::gradient::joint_hessian_b;
use super::likelihood::joint_log_likelihood_with_sigma;
use crate::stats::linalg::log_determinant;
use super::mode_finding::find_b_mode;
use super::types::{LaplaceControl, LaplaceResult};

// =============================================================================
// Sigma handling (Issue 2)
// =============================================================================

/// Extract sigma (residual SD) from theta for Gaussian family
///
/// **glmmTMB approach**: For Gaussian family, theta includes log(sigma) as
/// the LAST element. This matches glmmTMB where:
/// - `betadisp` is optimized (line 860)
/// - `phi = exp(etadisp)` (line 939)
/// - `dnorm(yobs(i), mu(i), phi(i), true)` (line 965)
///
/// # Arguments
/// * `theta` - Full theta vector (variance components + optional log_sigma)
/// * `random_effects` - Random effect specifications
/// * `family` - GLM family
///
/// # Returns
/// Tuple of (theta_for_variance_components, sigma)
pub fn extract_sigma_from_theta<'a>(
    theta: &'a [f64],
    random_effects: &[RandomEffect],
    family: &dyn GlmFamily,
) -> (&'a [f64], f64) {
    let n_variance_params = total_theta_params(random_effects);

    if family.name() == "gaussian" && theta.len() > n_variance_params {
        // Last element is log(sigma) - glmmTMB: phi = exp(etadisp)
        let log_sigma = theta[n_variance_params];
        let sigma = log_sigma.exp().max(1e-10); // Ensure positive
        (&theta[..n_variance_params], sigma)
    } else {
        // Non-Gaussian or no sigma parameter: use full theta, sigma = 1.0
        (theta, 1.0)
    }
}

// =============================================================================
// Linear predictor computation
// =============================================================================

/// Compute linear predictor η = X*β + Z*b + offset
///
/// This is a fundamental computation used throughout GLMM fitting.
pub fn compute_linear_predictor(
    x: &[Vec<f64>],
    z: &SparseMatrix,
    beta: &[f64],
    b: &[f64],
    offset: &[f64],
) -> Vec<f64> {
    let n = x.len();
    let zb = z.mul_vec(b);

    (0..n)
        .map(|i| {
            let x_beta: f64 = x[i].iter().zip(beta.iter()).map(|(xij, bj)| xij * bj).sum();
            x_beta + zb[i] + offset[i]
        })
        .collect()
}

/// Compute fitted values μ = g^{-1}(η)
pub fn compute_fitted_values(eta: &[f64], family: &dyn GlmFamily) -> Vec<f64> {
    let linkinv = family.linkinv();
    linkinv(eta)
}

// =============================================================================
// Main Laplace approximation
// =============================================================================

/// Compute Laplace approximation for marginal likelihood with beta profiling
///
/// This is the main entry point for the Laplace approximation. It implements
/// the profile likelihood approach where beta is optimized for each theta.
///
/// # Algorithm (Profile Likelihood)
///
/// For each theta value:
/// 1. Find b_mode that maximizes p(y|b,β,θ) * p(b|θ)
/// 2. **Profile beta**: Update beta to its optimal value given b_mode
/// 3. Re-find b_mode with updated beta (iterate if needed)
/// 4. Compute marginal likelihood at profiled (beta, b_mode)
///
/// This ensures the objective function is purely a function of theta,
/// with beta profiled out. This is crucial for consistent gradient-based
/// optimization of theta.
///
/// # Arguments
/// * `y` - Response vector
/// * `x` - Fixed effects design matrix
/// * `z` - Random effects design matrix (sparse)
/// * `beta` - Fixed effect coefficients (used as starting point)
/// * `b_init` - Initial random effect values
/// * `theta` - Variance component parameters (for Gaussian, includes log_sigma as last element)
/// * `random_effects` - Random effect specifications
/// * `family` - GLM family
/// * `weights` - Observation weights
/// * `offset` - Offset vector
/// * `control` - Optimization control parameters
///
/// # Returns
/// LaplaceResult containing marginal likelihood, mode, gradient, and Hessian.
/// The b_mode and log_marginal_likelihood correspond to the profiled beta.
///
/// # Sigma Handling (glmmTMB approach)
///
/// For Gaussian family, theta should include log(sigma) as the last element.
/// This is extracted via `extract_sigma_from_theta()` and passed to likelihood.
#[allow(clippy::too_many_arguments)]
pub fn laplace_approximation(
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
    control: &LaplaceControl,
) -> LaplaceResult {
    // Step 1: Extract sigma from theta (glmmTMB approach)
    let (theta_vc, sigma) = extract_sigma_from_theta(theta, random_effects, family);

    // Step 2: Find b_mode given current beta
    // Note: We do ONE b-mode + beta update cycle per Laplace evaluation.
    // This keeps the objective consistent with numerical gradients.
    let (b_mode, inner_iter, inner_converged) = find_b_mode(
        y,
        x,
        z,
        beta,
        b_init,
        theta_vc,
        random_effects,
        family,
        weights,
        offset,
        sigma,
        control,
    );

    // Step 2b: Conditionally update beta given b_mode
    // When profile_beta=false (joint optimization), beta is passed through unchanged.
    // When profile_beta=true (profiled optimization), do IRLS update.
    let current_beta = if control.profile_beta {
        super::beta_update::update_beta(y, x, z, &b_mode, beta, family, weights, offset)
            .unwrap_or_else(|| beta.to_vec())
    } else {
        beta.to_vec()
    };

    // Step 3: Compute joint log-likelihood at mode with profiled beta
    // log p(y | b, β, σ) + log p(b | θ)
    let joint_ll = joint_log_likelihood_with_sigma(
        y,
        x,
        z,
        &current_beta,
        &b_mode,
        theta_vc,
        random_effects,
        family,
        weights,
        offset,
        sigma,
    );

    // Step 4: Compute Hessian of negative joint log-likelihood at mode
    // H = -∂²/∂b² [log p(y | b) + log p(b | θ)]
    // sigma is used to scale IRLS weights for Gaussian
    let hessian = joint_hessian_b(
        y,
        x,
        z,
        &current_beta,
        &b_mode,
        theta_vc,
        random_effects,
        family,
        weights,
        offset,
        sigma,
    );

    // Step 5: Laplace correction: -0.5 * log|H|
    let laplace_correction = compute_laplace_correction(&hessian);

    // Step 6: Marginal log-likelihood
    let log_marginal = joint_ll + laplace_correction;

    // Step 7: Compute gradient w.r.t. theta (including log_sigma if Gaussian)
    // Note: gradient is computed with profiled beta for consistency
    let grad_theta = if control.compute_gradient {
        numerical_grad_theta(
            y,
            x,
            z,
            &current_beta, // Use profiled beta
            &b_mode,
            theta, // Full theta including log_sigma
            random_effects,
            family,
            weights,
            offset,
            control,
        )
    } else {
        vec![0.0; theta.len()]
    };

    LaplaceResult {
        log_marginal_likelihood: log_marginal,
        b_mode,
        grad_theta,
        hessian_b: if control.compute_hessian {
            Some(hessian)
        } else {
            None
        },
        inner_iterations: inner_iter,
        inner_converged,
        profiled_beta: Some(current_beta), // Return profiled beta
    }
}

/// Compute Laplace correction: (q/2) * log(2π) - 0.5 * log|H|
///
/// The full Laplace approximation formula for marginal likelihood is:
/// ```text
/// log p(y | θ) ≈ log p(y | b̂, θ) + log p(b̂ | θ) + (q/2) * log(2π) - 0.5 * log|H|
/// ```
///
/// The prior term `log p(b̂ | θ)` includes `-(q/2) * log(2π)` from the MVN density.
/// The Laplace correction adds back `+(q/2) * log(2π)` which partially cancels.
///
/// This is because the Laplace approximation treats the integral:
/// ```text
/// ∫ exp(f(b)) db ≈ exp(f(b̂)) * (2π)^{q/2} * |H|^{-1/2}
/// ```
///
/// Taking logs: `log(...) ≈ f(b̂) + (q/2)*log(2π) - 0.5*log|H|`
fn compute_laplace_correction(hessian: &[Vec<f64>]) -> f64 {
    let q = hessian.len();
    match log_determinant(hessian) {
        Some(log_det) => {
            // Full Laplace correction: (q/2) * log(2π) - 0.5 * log|H|
            let log_2pi = (2.0 * std::f64::consts::PI).ln();
            (q as f64 / 2.0) * log_2pi - 0.5 * log_det
        }
        None => {
            // Hessian not positive definite - return large penalty
            f64::NEG_INFINITY
        }
    }
}

// =============================================================================
// Numerical gradient computation
// =============================================================================

/// Compute gradient of Laplace-approximated marginal likelihood w.r.t. theta
///
/// Uses central differences for numerical differentiation.
/// This computes gradient w.r.t. full theta (including log_sigma if Gaussian).
#[allow(clippy::too_many_arguments)]
fn numerical_grad_theta(
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
    control: &LaplaceControl,
) -> Vec<f64> {
    let eps = 1e-6;
    let n_theta = theta.len();
    let mut grad = vec![0.0; n_theta];

    // Create control for gradient evaluation (no nested gradients!)
    let grad_control = LaplaceControl {
        max_iter: control.max_iter,
        tol: control.tol * 10.0,
        damping: control.damping,
        compute_hessian: false,
        min_variance: control.min_variance,
        compute_gradient: false, // CRITICAL: avoid infinite recursion
        profile_beta: control.profile_beta, // Maintain consistency with outer call
    };

    for i in 0..n_theta {
        let mut theta_plus = theta.to_vec();
        let mut theta_minus = theta.to_vec();
        theta_plus[i] += eps;
        theta_minus[i] -= eps;

        let result_plus = laplace_approximation(
            y,
            x,
            z,
            beta,
            b_init,
            &theta_plus,
            random_effects,
            family,
            weights,
            offset,
            &grad_control,
        );

        let result_minus = laplace_approximation(
            y,
            x,
            z,
            beta,
            b_init,
            &theta_minus,
            random_effects,
            family,
            weights,
            offset,
            &grad_control,
        );

        grad[i] = (result_plus.log_marginal_likelihood - result_minus.log_marginal_likelihood)
            / (2.0 * eps);
    }

    grad
}

// =============================================================================
// Convenience functions
// =============================================================================

/// Convenience function to compute marginal likelihood value only (no gradients)
///
/// This is more efficient when you don't need the gradient.
#[allow(clippy::too_many_arguments)]
pub fn laplace_marginal_likelihood(
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
) -> f64 {
    let control = LaplaceControl {
        compute_hessian: false,
        compute_gradient: false,
        ..Default::default()
    };

    let result = laplace_approximation(
        y,
        x,
        z,
        beta,
        b_init,
        theta,
        random_effects,
        family,
        weights,
        offset,
        &control,
    );

    result.log_marginal_likelihood
}

// =============================================================================
// Tests
// =============================================================================

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
    fn test_extract_sigma_from_theta_gaussian() {
        let mut re = RandomEffect::intercept("group".to_string());
        re.n_groups = 4;
        let family = GaussianFamily::default();

        // theta = [log_sd_re, log_sigma]
        let theta = vec![0.0, -0.5]; // sd_re = 1.0, sigma = exp(-0.5) ≈ 0.606

        let (theta_vc, sigma) = extract_sigma_from_theta(&theta, &[re], &family);

        assert_eq!(theta_vc.len(), 1);
        assert!((theta_vc[0] - 0.0).abs() < 1e-10);
        assert!((sigma - (-0.5_f64).exp()).abs() < 1e-10);
    }

    #[test]
    fn test_extract_sigma_from_theta_no_extra_param() {
        // Test when theta has exactly the right number of variance params (no log_sigma)
        let mut re = RandomEffect::intercept("group".to_string());
        re.n_groups = 4;
        let family = GaussianFamily::default();

        // theta has exactly 1 param = n_variance_params, so no log_sigma
        let theta = vec![0.0];
        let (theta_vc, sigma) = extract_sigma_from_theta(&theta, &[re], &family);

        // Should return full theta and sigma = 1.0 (no extraction)
        assert_eq!(theta_vc.len(), 1);
        assert!((sigma - 1.0).abs() < 1e-10);
    }

    #[test]
    fn test_laplace_approximation_basic() {
        let (y, x, re, z) = create_test_data();
        let family = GaussianFamily::default();

        let beta = vec![1.0, 0.5];
        let b_init = vec![0.0, 0.0, 0.0, 0.0];
        // theta = [log_sd_re, log_sigma]
        let theta = vec![0.0, 0.0]; // sd_re = 1, sigma = 1

        let weights = vec![1.0; y.len()];
        let offset = vec![0.0; y.len()];

        let control = LaplaceControl::default();

        let result = laplace_approximation(
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
            &control,
        );

        assert!(
            result.log_marginal_likelihood.is_finite(),
            "Marginal likelihood should be finite: {}",
            result.log_marginal_likelihood
        );
        assert!(result.inner_converged, "Inner optimization should converge");
        assert_eq!(result.grad_theta.len(), 2); // [grad_theta_vc, grad_log_sigma]
        assert!(result.hessian_b.is_some());
    }

    #[test]
    fn test_laplace_marginal_likelihood_varies_with_theta() {
        let (y, x, re, z) = create_test_data();
        let family = GaussianFamily::default();

        let beta = vec![1.0, 0.5];
        let b_init = vec![0.0, 0.0, 0.0, 0.0];

        let weights = vec![1.0; y.len()];
        let offset = vec![0.0; y.len()];

        // Try different variance component values (log_sigma fixed at 0)
        let theta_small = vec![-1.0, 0.0]; // sd_re ≈ 0.37
        let theta_medium = vec![0.0, 0.0]; // sd_re = 1
        let theta_large = vec![1.0, 0.0]; // sd_re ≈ 2.72

        let ll_small = laplace_marginal_likelihood(
            &y,
            &x,
            &z,
            &beta,
            &b_init,
            &theta_small,
            &[re.clone()],
            &family,
            &weights,
            &offset,
        );

        let ll_medium = laplace_marginal_likelihood(
            &y,
            &x,
            &z,
            &beta,
            &b_init,
            &theta_medium,
            &[re.clone()],
            &family,
            &weights,
            &offset,
        );

        let ll_large = laplace_marginal_likelihood(
            &y,
            &x,
            &z,
            &beta,
            &b_init,
            &theta_large,
            &[re.clone()],
            &family,
            &weights,
            &offset,
        );

        assert!(ll_small.is_finite());
        assert!(ll_medium.is_finite());
        assert!(ll_large.is_finite());

        assert!(
            (ll_small - ll_medium).abs() > 1e-6 || (ll_medium - ll_large).abs() > 1e-6,
            "Likelihood should vary with theta: small={} medium={} large={}",
            ll_small,
            ll_medium,
            ll_large
        );
    }

    #[test]
    fn test_laplace_marginal_likelihood_varies_with_sigma() {
        let (y, x, re, z) = create_test_data();
        let family = GaussianFamily::default();

        let beta = vec![1.0, 0.5];
        let b_init = vec![0.0, 0.0, 0.0, 0.0];

        let weights = vec![1.0; y.len()];
        let offset = vec![0.0; y.len()];

        // Try different sigma values (theta_vc fixed at 0)
        let theta_sigma_small = vec![0.0, -1.0]; // sigma ≈ 0.37
        let theta_sigma_medium = vec![0.0, 0.0]; // sigma = 1
        let theta_sigma_large = vec![0.0, 1.0]; // sigma ≈ 2.72

        let ll_sigma_small = laplace_marginal_likelihood(
            &y,
            &x,
            &z,
            &beta,
            &b_init,
            &theta_sigma_small,
            &[re.clone()],
            &family,
            &weights,
            &offset,
        );

        let ll_sigma_medium = laplace_marginal_likelihood(
            &y,
            &x,
            &z,
            &beta,
            &b_init,
            &theta_sigma_medium,
            &[re.clone()],
            &family,
            &weights,
            &offset,
        );

        let ll_sigma_large = laplace_marginal_likelihood(
            &y,
            &x,
            &z,
            &beta,
            &b_init,
            &theta_sigma_large,
            &[re.clone()],
            &family,
            &weights,
            &offset,
        );

        assert!(ll_sigma_small.is_finite());
        assert!(ll_sigma_medium.is_finite());
        assert!(ll_sigma_large.is_finite());

        // Likelihood should definitely vary with sigma
        assert!(
            (ll_sigma_small - ll_sigma_large).abs() > 1.0,
            "Likelihood should vary significantly with sigma: small={} large={}",
            ll_sigma_small,
            ll_sigma_large
        );
    }

    #[test]
    fn test_gradient_theta_direction() {
        let (y, x, re, z) = create_test_data();
        let family = GaussianFamily::default();

        let beta = vec![1.0, 0.5];
        let b_init = vec![0.0, 0.0, 0.0, 0.0];
        let theta = vec![0.0, 0.0];

        let weights = vec![1.0; y.len()];
        let offset = vec![0.0; y.len()];

        let control = LaplaceControl::default();

        let result = laplace_approximation(
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
            &control,
        );

        // Verify gradient is consistent with finite differences
        let eps = 1e-5;
        for i in 0..theta.len() {
            let mut theta_plus = theta.clone();
            let mut theta_minus = theta.clone();
            theta_plus[i] += eps;
            theta_minus[i] -= eps;

            let ll_plus = laplace_marginal_likelihood(
                &y,
                &x,
                &z,
                &beta,
                &b_init,
                &theta_plus,
                &[re.clone()],
                &family,
                &weights,
                &offset,
            );

            let ll_minus = laplace_marginal_likelihood(
                &y,
                &x,
                &z,
                &beta,
                &b_init,
                &theta_minus,
                &[re.clone()],
                &family,
                &weights,
                &offset,
            );

            let num_grad = (ll_plus - ll_minus) / (2.0 * eps);

            // Check sign matches (or both are near zero)
            if result.grad_theta[i].abs() > 1e-3 && num_grad.abs() > 1e-3 {
                assert!(
                    result.grad_theta[i] * num_grad > 0.0,
                    "Gradient signs should match for theta[{}]: computed={} numerical={}",
                    i,
                    result.grad_theta[i],
                    num_grad
                );
            }
        }
    }
}
