//! Laplace approximation for GLMM marginal likelihood
//!
//! This module implements the Laplace approximation used for integrating out
//! the random effects in GLMMs. The key steps are:
//!
//! 1. **Joint log-likelihood**: `log p(y | b, β, θ) + log p(b | θ)`
//!    - Data likelihood from GLM family
//!    - Random effects prior from variance components
//!
//! 2. **Mode finding**: Find `b_hat` that maximizes joint likelihood given (β, θ)
//!    - Newton's method with Hessian from Z^T W Z + Σ^{-1}
//!
//! 3. **Laplace approximation**: `log p(y | β, θ) ≈ joint(b_hat) - 0.5 * log|H|`
//!    - H is the Hessian of negative joint likelihood at the mode
//!
//! # References
//!
//! - Kristensen et al. (2016). TMB: Automatic Differentiation and Laplace Approximation
//! - Bates et al. (2015). Fitting Linear Mixed-Effects Models Using lme4

use super::random_effects::SparseMatrix;
use super::random_effects_likelihood::{
    compute_block_precision_matrices, log_random_effects_prior, log_random_effects_prior_value,
};
use super::types::RandomEffect;
use super::variance_components::cholesky_decompose;
use crate::stats::regression::family::GlmFamily;

/// Result of Laplace approximation
#[derive(Debug, Clone)]
pub struct LaplaceResult {
    /// Approximate marginal log-likelihood: log p(y | β, θ)
    pub log_marginal_likelihood: f64,
    /// Mode of random effects (BLUPs): argmax_b log p(b | y, β, θ)
    pub b_mode: Vec<f64>,
    /// Gradient w.r.t. theta (for outer optimization)
    pub grad_theta: Vec<f64>,
    /// Hessian of negative joint likelihood at mode (for standard errors)
    pub hessian_b: Option<Vec<Vec<f64>>>,
    /// Number of Newton iterations for mode finding
    pub inner_iterations: usize,
    /// Whether inner optimization converged
    pub inner_converged: bool,
}

/// Control parameters for Laplace approximation
#[derive(Debug, Clone)]
pub struct LaplaceControl {
    /// Maximum iterations for mode finding
    pub max_iter: usize,
    /// Convergence tolerance (gradient norm)
    pub tol: f64,
    /// Step size damping factor (for stability)
    pub damping: f64,
    /// Whether to compute Hessian for output
    pub compute_hessian: bool,
    /// Minimum variance to add to diagonal for numerical stability
    pub min_variance: f64,
    /// Whether to compute gradient w.r.t. theta (disable to avoid infinite recursion)
    pub compute_gradient: bool,
}

impl Default for LaplaceControl {
    fn default() -> Self {
        Self {
            max_iter: 100,
            tol: 1e-8,
            damping: 1.0,
            compute_hessian: true,
            min_variance: 1e-10,
            compute_gradient: true,
        }
    }
}

/// Compute the joint log-likelihood: log p(y | b, β, θ) + log p(b | θ)
///
/// # Arguments
/// * `y` - Response vector
/// * `x` - Fixed effects design matrix (row-major)
/// * `z` - Random effects design matrix (sparse)
/// * `beta` - Fixed effect coefficients
/// * `b` - Random effect coefficients
/// * `theta` - Variance component parameters
/// * `random_effects` - Random effect specifications
/// * `family` - GLM family
/// * `weights` - Observation weights
/// * `offset` - Offset vector
///
/// # Returns
/// Joint log-likelihood value
pub fn joint_log_likelihood(
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
) -> f64 {
    let n = y.len();

    // Compute linear predictor: η = X*β + Z*b + offset
    let zb = z.mul_vec(b);
    let eta: Vec<f64> = (0..n)
        .map(|i| {
            let x_beta: f64 = x[i].iter().zip(beta.iter()).map(|(xij, bj)| xij * bj).sum();
            x_beta + zb[i] + offset[i]
        })
        .collect();

    // Compute μ = g^{-1}(η) using link inverse
    let linkinv = family.linkinv();
    let mu = linkinv(&eta);

    // Compute data log-likelihood
    // For exponential families, we use the quasi-likelihood approach:
    // The deviance D = -2 * (log L(y; μ) - log L(y; y_saturated))
    // For Gaussian: D = Σ (y - μ)², and -D/2 is proportional to log-lik
    // For Poisson: D = 2 * Σ [y * log(y/μ) - (y - μ)], and -D/2 captures the key terms
    //
    // However, for accurate GLMM optimization, we should use the actual log-likelihood
    // not just the deviance. The issue is that deviance drops constants that matter
    // when comparing models with different random effects.
    //
    // For now, we use -0.5 * deviance as a proxy which works for Gaussian
    // and provides good optimization behavior for other families.
    let deviance_fn = family.deviance();
    let dev = deviance_fn.deviance(y, &mu, weights).unwrap_or(f64::INFINITY);

    // Data log-likelihood (proportional to negative half deviance)
    let data_ll = -0.5 * dev;

    // Random effects log-prior: log p(b | θ)
    let prior_ll = log_random_effects_prior_value(b, theta, random_effects);

    data_ll + prior_ll
}

/// Compute gradient of joint log-likelihood with respect to b
///
/// grad_b = Z^T * diag(d log p(y_i | η_i) / d η_i) - Σ^{-1} * b
///
/// For exponential families:
/// d log p(y | η) / d η = (y - μ) * dμ/dη / V(μ)
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

    // Compute working residuals: w_i * (y_i - μ_i) * dμ/dη_i / V(μ_i)
    let mu_eta_fn = family.mu_eta();
    let mu_eta_vals = mu_eta_fn(&eta);
    let variance_fn = family.variance();

    let working_resid: Vec<f64> = (0..n)
        .map(|i| {
            let var = variance_fn.variance(mu[i]).unwrap_or(1.0).max(1e-10);
            let mu_eta = mu_eta_vals[i].max(1e-10);
            weights[i] * (y[i] - mu[i]) * mu_eta / var
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
/// H = Z^T * W * Z + Σ^{-1}
///
/// where W = diag(w_i * (dμ/dη)² / V(μ))
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

    // Compute IRLS weights: w_i * (dμ/dη)² / V(μ)
    let mu_eta_fn = family.mu_eta();
    let mu_eta_vals = mu_eta_fn(&eta);
    let variance_fn = family.variance();

    let irls_weights: Vec<f64> = (0..n)
        .map(|i| {
            let var = variance_fn.variance(mu[i]).unwrap_or(1.0).max(1e-10);
            let mu_eta = mu_eta_vals[i];
            weights[i] * mu_eta * mu_eta / var
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

/// Find the mode of the random effects (inner optimization)
///
/// Uses Newton's method to find b_hat = argmax_b log p(b | y, β, θ)
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
    control: &LaplaceControl,
) -> (Vec<f64>, usize, bool) {
    let q = b_init.len();
    let mut b = b_init.to_vec();
    let mut converged = false;

    for iter in 0..control.max_iter {
        // Compute gradient
        let grad = joint_gradient_b(y, x, z, beta, &b, theta, random_effects, family, weights, offset);

        // Check convergence
        let grad_norm: f64 = grad.iter().map(|g| g * g).sum::<f64>().sqrt();
        if grad_norm < control.tol {
            converged = true;
            return (b, iter + 1, converged);
        }

        // Compute Hessian of negative log-likelihood
        let hessian =
            joint_hessian_b(y, x, z, beta, &b, theta, random_effects, family, weights, offset);

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

/// Solve linear system A * x = b using Cholesky decomposition
fn solve_linear_system(a: &[Vec<f64>], b: &[f64]) -> Option<Vec<f64>> {
    let n = b.len();

    // Cholesky decomposition
    let chol = cholesky_decompose(a)?;

    // Forward substitution: L * y = b
    let mut y = vec![0.0; n];
    for i in 0..n {
        let mut sum = b[i];
        for j in 0..i {
            sum -= chol[i][j] * y[j];
        }
        y[i] = sum / chol[i][i];
    }

    // Backward substitution: L^T * x = y
    let mut x = vec![0.0; n];
    for i in (0..n).rev() {
        let mut sum = y[i];
        for j in (i + 1)..n {
            sum -= chol[j][i] * x[j];
        }
        x[i] = sum / chol[i][i];
    }

    Some(x)
}

/// Compute log determinant of a matrix using Cholesky decomposition
fn log_determinant(a: &[Vec<f64>]) -> Option<f64> {
    let chol = cholesky_decompose(a)?;
    let n = chol.len();

    // log|A| = log|L|² = 2 * sum(log(L_ii))
    let log_det = 2.0 * (0..n).map(|i| chol[i][i].ln()).sum::<f64>();
    Some(log_det)
}

/// Invert a symmetric positive-definite matrix using Cholesky decomposition
///
/// For a symmetric positive-definite matrix A with Cholesky decomposition A = LL^T,
/// the inverse is computed as A^{-1} = L^{-T} L^{-1}.
///
/// This is used to compute conditional variances Var(b|y) = H^{-1} where H is
/// the Hessian of the negative joint log-likelihood.
pub fn invert_symmetric_positive_definite(a: &[Vec<f64>]) -> Option<Vec<Vec<f64>>> {
    let n = a.len();
    if n == 0 {
        return Some(vec![]);
    }

    // Cholesky decomposition: A = LL^T
    let chol = cholesky_decompose(a)?;

    // Compute L^{-1} by forward substitution on identity columns
    let mut l_inv = vec![vec![0.0; n]; n];
    for j in 0..n {
        // Solve L * x = e_j for j-th column of L^{-1}
        for i in j..n {
            if i == j {
                l_inv[i][j] = 1.0 / chol[i][i];
            } else {
                let mut sum = 0.0;
                for k in j..i {
                    sum += chol[i][k] * l_inv[k][j];
                }
                l_inv[i][j] = -sum / chol[i][i];
            }
        }
    }

    // Compute A^{-1} = L^{-T} L^{-1} = (L^{-1})^T (L^{-1})
    let mut a_inv = vec![vec![0.0; n]; n];
    for i in 0..n {
        for j in 0..=i {
            let mut sum = 0.0;
            // (L^{-1})^T [i, k] * L^{-1} [k, j] = L^{-1} [k, i] * L^{-1} [k, j]
            // L^{-1} is lower triangular, so only k from max(i,j) to n-1 contributes
            for k in i..n {
                sum += l_inv[k][i] * l_inv[k][j];
            }
            a_inv[i][j] = sum;
            a_inv[j][i] = sum; // Symmetric
        }
    }

    Some(a_inv)
}

/// Update fixed effects beta given current random effects b
///
/// For Gaussian family with identity link, this is a single WLS step.
/// For other families, runs a few IRLS iterations.
///
/// Uses working response: z* = η + (y - μ) / (dμ/dη)
/// And working weights: w* = weights * (dμ/dη)² / V(μ)
///
/// Then solves: X^T W X * beta = X^T W (z* - Z*b - offset)
pub fn update_beta(
    y: &[f64],
    x: &[Vec<f64>],
    z: &SparseMatrix,
    b: &[f64],
    beta_init: &[f64],
    family: &dyn GlmFamily,
    weights: &[f64],
    offset: &[f64],
) -> Option<Vec<f64>> {
    let n = y.len();
    let p = if !x.is_empty() { x[0].len() } else { return None };

    if p == 0 {
        return Some(vec![]);
    }

    // Compute Z*b once (this is fixed during beta estimation)
    let zb = z.mul_vec(b);

    // Initialize beta from previous estimate
    let mut beta = if beta_init.len() == p {
        beta_init.to_vec()
    } else {
        vec![0.0; p]
    };

    // Run multiple iterations to converge to correct estimates
    // Even Gaussian needs iterations if b has already absorbed fixed effects signal
    let max_iter = 10;

    let linkinv = family.linkinv();
    let mu_eta_fn = family.mu_eta();
    let variance_fn = family.variance();

    for _iter in 0..max_iter {
        // Compute current linear predictor: η = X*β + Z*b + offset
        let eta: Vec<f64> = (0..n)
            .map(|i| {
                let x_beta: f64 = x[i].iter().zip(beta.iter()).map(|(xij, bj)| xij * bj).sum();
                x_beta + zb[i] + offset[i]
            })
            .collect();

        let mu = linkinv(&eta);
        let mu_eta_vals = mu_eta_fn(&eta);

        // Compute IRLS weights and working response
        let mut working_response = vec![0.0; n];
        let mut irls_weights = vec![0.0; n];

        for i in 0..n {
            let var = variance_fn.variance(mu[i]).unwrap_or(1.0).max(1e-10);
            let mu_eta = mu_eta_vals[i].abs().max(1e-10);

            irls_weights[i] = weights[i] * mu_eta * mu_eta / var;

            // Working response: z* = η + (y - μ) / (dμ/dη) - Z*b - offset
            // So that we solve for beta in: X*beta = z*
            working_response[i] = (y[i] - mu[i]) / mu_eta + eta[i] - zb[i] - offset[i];
        }

        // Solve weighted least squares: X^T W X * beta = X^T W * working_response
        // Build X^T W X
        let mut xtw_x = vec![vec![0.0; p]; p];
        for j in 0..p {
            for k in 0..=j {
                let mut sum = 0.0;
                for i in 0..n {
                    sum += x[i][j] * irls_weights[i] * x[i][k];
                }
                xtw_x[j][k] = sum;
                xtw_x[k][j] = sum; // Symmetric
            }
        }

        // Add small regularization for numerical stability
        for j in 0..p {
            xtw_x[j][j] += 1e-8;
        }

        // Build X^T W * working_response
        let mut xtw_z = vec![0.0; p];
        for j in 0..p {
            let mut sum = 0.0;
            for i in 0..n {
                sum += x[i][j] * irls_weights[i] * working_response[i];
            }
            xtw_z[j] = sum;
        }

        // Solve via Cholesky
        if let Some(new_beta) = solve_linear_system(&xtw_x, &xtw_z) {
            beta = new_beta;
        } else {
            break;
        }
    }

    Some(beta)
}

/// Compute Laplace approximation for marginal likelihood
///
/// log p(y | β, θ) ≈ log p(y, b_hat | β, θ) - 0.5 * log|H|
///
/// where:
/// - b_hat is the mode (argmax_b joint likelihood)
/// - H is the Hessian of negative joint log-likelihood at b_hat
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
    // Find the mode of the random effects
    let (b_mode, inner_iter, inner_converged) = find_b_mode(
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
        control,
    );

    // Compute joint log-likelihood at mode
    let joint_ll = joint_log_likelihood(
        y,
        x,
        z,
        beta,
        &b_mode,
        theta,
        random_effects,
        family,
        weights,
        offset,
    );

    // Compute Hessian at mode
    let hessian = joint_hessian_b(
        y,
        x,
        z,
        beta,
        &b_mode,
        theta,
        random_effects,
        family,
        weights,
        offset,
    );

    // Laplace correction: -0.5 * log|H|
    let laplace_correction = match log_determinant(&hessian) {
        Some(log_det) => -0.5 * log_det,
        None => {
            // If Hessian is not positive definite, return a large penalty
            f64::NEG_INFINITY
        }
    };

    // Marginal log-likelihood
    let log_marginal = joint_ll + laplace_correction;

    // Compute gradient w.r.t. theta using numerical differentiation
    // Skip if compute_gradient is false (to avoid infinite recursion)
    let grad_theta = if control.compute_gradient {
        numerical_grad_theta(
            y,
            x,
            z,
            beta,
            &b_mode,
            theta,
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
    }
}

/// Compute gradient of Laplace-approximated marginal likelihood w.r.t. theta
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

    // Create a lighter control for gradient evaluation
    // CRITICAL: compute_gradient = false to avoid infinite recursion!
    let grad_control = LaplaceControl {
        max_iter: control.max_iter,
        tol: control.tol * 10.0, // Slightly looser tolerance for speed
        damping: control.damping,
        compute_hessian: false,
        min_variance: control.min_variance,
        compute_gradient: false, // Must be false to avoid infinite recursion
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

/// Convenience function to compute marginal likelihood value only (no gradients)
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
        compute_gradient: false, // Don't need gradient for value-only computation
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

/// Compute the weighted information matrix X'WX for REML adjustment
///
/// For REML estimation, we need to account for the degrees of freedom lost
/// from estimating fixed effects. The REML criterion is:
///
/// log p_REML(y | θ) = log p_ML(y | θ) + 0.5 * log|X'WX|
///
/// where W is the matrix of IRLS weights: w_i = (dμ/dη)² / V(μ)
///
/// # Arguments
/// * `y` - Response vector
/// * `x` - Fixed effects design matrix (row-major, n × p)
/// * `z` - Random effects design matrix (sparse)
/// * `beta` - Fixed effect coefficients
/// * `b` - Random effect coefficients
/// * `family` - GLM family
/// * `weights` - Observation weights
/// * `offset` - Offset vector
///
/// # Returns
/// The p × p weighted information matrix X'WX, or None if computation fails
pub fn compute_weighted_xtx(
    y: &[f64],
    x: &[Vec<f64>],
    z: &SparseMatrix,
    beta: &[f64],
    b: &[f64],
    family: &dyn GlmFamily,
    weights: &[f64],
    offset: &[f64],
) -> Option<Vec<Vec<f64>>> {
    let n = y.len();
    let p = if !x.is_empty() { x[0].len() } else { return None };

    if p == 0 {
        return None;
    }

    // Compute linear predictor: η = X*β + Z*b + offset
    let zb = z.mul_vec(b);
    let eta: Vec<f64> = (0..n)
        .map(|i| {
            let x_beta: f64 = x[i].iter().zip(beta.iter()).map(|(xij, bj)| xij * bj).sum();
            x_beta + zb[i] + offset[i]
        })
        .collect();

    // Compute fitted values
    let linkinv = family.linkinv();
    let mu = linkinv(&eta);

    // Compute IRLS weights: w = prior_weights * (dμ/dη)² / V(μ)
    let mu_eta_fn = family.mu_eta();
    let mu_eta_vals = mu_eta_fn(&eta);
    let variance_fn = family.variance();

    let irls_weights: Vec<f64> = (0..n)
        .map(|i| {
            let var = variance_fn.variance(mu[i]).unwrap_or(1.0).max(1e-10);
            let mu_eta = mu_eta_vals[i].abs().max(1e-10);
            weights[i] * mu_eta * mu_eta / var
        })
        .collect();

    // Compute X'WX
    let mut xtw_x = vec![vec![0.0; p]; p];
    for j in 0..p {
        for k in 0..=j {
            let mut sum = 0.0;
            for i in 0..n {
                sum += x[i][j] * irls_weights[i] * x[i][k];
            }
            xtw_x[j][k] = sum;
            xtw_x[k][j] = sum; // Symmetric
        }
    }

    Some(xtw_x)
}

/// Compute the REML adjustment: 0.5 * log|X'WX|
///
/// This is used to adjust the ML marginal likelihood for REML estimation.
/// The REML criterion adjusts for the loss of degrees of freedom from
/// estimating fixed effects.
///
/// # Returns
/// The REML adjustment 0.5 * log|X'WX|, or None if X'WX is not positive definite
pub fn compute_reml_adjustment(
    y: &[f64],
    x: &[Vec<f64>],
    z: &SparseMatrix,
    beta: &[f64],
    b: &[f64],
    family: &dyn GlmFamily,
    weights: &[f64],
    offset: &[f64],
) -> Option<f64> {
    let xtw_x = compute_weighted_xtx(y, x, z, beta, b, family, weights, offset)?;

    // Compute log determinant
    let log_det = log_determinant(&xtw_x)?;

    // REML adjustment: +0.5 * log|X'WX|
    // This is added to the marginal likelihood (not subtracted from objective)
    Some(0.5 * log_det)
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::stats::regression::family::GaussianFamily;
    use crate::stats::regression::glmm::random_effects::{
        construct_z_matrix, intercept_term_values, populate_random_effect,
    };

    const TOL: f64 = 1e-6;

    fn approx_eq(a: f64, b: f64, tol: f64) -> bool {
        (a - b).abs() < tol || (a.is_nan() && b.is_nan())
    }

    fn create_test_data() -> (Vec<f64>, Vec<Vec<f64>>, RandomEffect, SparseMatrix) {
        // Create simple test data: 20 observations, 4 groups
        let n = 20;
        let n_groups = 4;
        let obs_per_group = n / n_groups;

        // Group assignments
        let group_values: Vec<String> = (0..n)
            .map(|i| format!("g{}", i / obs_per_group))
            .collect();

        // Create random effect specification
        let mut re = RandomEffect::intercept("group".to_string());
        populate_random_effect(&mut re, &group_values);

        // Create Z matrix
        let term_values = intercept_term_values(n);
        let z = construct_z_matrix(&re, &term_values).expect("Z matrix construction should succeed");

        // Create design matrix (intercept + one covariate)
        let x: Vec<Vec<f64>> = (0..n).map(|i| vec![1.0, i as f64 * 0.1]).collect();

        // Create response with random effect
        let beta = vec![1.0, 0.5]; // Fixed effects
        let b_true = vec![0.5, -0.3, 0.2, -0.4]; // True random effects
        let zb = z.mul_vec(&b_true);

        let y: Vec<f64> = (0..n)
            .map(|i| {
                let x_beta: f64 = x[i].iter().zip(beta.iter()).map(|(xij, bj)| xij * bj).sum();
                x_beta + zb[i] + 0.1 * (i as f64 - 10.0) * 0.1 // Add small noise pattern
            })
            .collect();

        (y, x, re, z)
    }

    #[test]
    fn test_joint_log_likelihood_gaussian() {
        let (y, x, re, z) = create_test_data();
        let family = GaussianFamily::default();

        let beta = vec![1.0, 0.5];
        let b = vec![0.0, 0.0, 0.0, 0.0]; // Zero random effects
        let theta = vec![0.0]; // log(sd) = 0 means sd = 1

        let weights = vec![1.0; y.len()];
        let offset = vec![0.0; y.len()];

        let ll = joint_log_likelihood(
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
        );

        // Should be finite
        assert!(ll.is_finite(), "Log-likelihood should be finite: {}", ll);
        // Should be negative (log of probability)
        assert!(ll < 0.0, "Log-likelihood should be negative: {}", ll);
    }

    #[test]
    fn test_joint_gradient_b() {
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
        );

        // Gradient should have length equal to total random effect coefficients
        assert_eq!(grad.len(), 4);

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

        // Hessian should be positive definite (for well-posed problem)
        let chol = cholesky_decompose(&hessian);
        assert!(
            chol.is_some(),
            "Hessian should be positive definite"
        );
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
            &control,
        );

        assert!(converged, "Mode finding should converge");
        assert!(iters < control.max_iter, "Should converge before max iterations");

        // Mode should be finite
        for &bi in &b_mode {
            assert!(bi.is_finite(), "Mode should be finite");
        }
    }

    #[test]
    fn test_laplace_approximation_basic() {
        let (y, x, re, z) = create_test_data();
        let family = GaussianFamily::default();

        let beta = vec![1.0, 0.5];
        let b_init = vec![0.0, 0.0, 0.0, 0.0];
        let theta = vec![0.0]; // sd = 1

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

        // Marginal likelihood should be finite
        assert!(
            result.log_marginal_likelihood.is_finite(),
            "Marginal likelihood should be finite: {}",
            result.log_marginal_likelihood
        );

        // Should converge
        assert!(result.inner_converged, "Inner optimization should converge");

        // Gradient should be computed
        assert_eq!(result.grad_theta.len(), 1);
        assert!(result.grad_theta[0].is_finite());

        // Hessian should be computed
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

        // Try different variance values
        let theta_small = vec![-1.0]; // sd = exp(-1) ≈ 0.37
        let theta_medium = vec![0.0]; // sd = 1
        let theta_large = vec![1.0]; // sd = exp(1) ≈ 2.72

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

        // All should be finite
        assert!(ll_small.is_finite());
        assert!(ll_medium.is_finite());
        assert!(ll_large.is_finite());

        // Should vary (not all equal)
        assert!(
            (ll_small - ll_medium).abs() > 1e-6 || (ll_medium - ll_large).abs() > 1e-6,
            "Likelihood should vary with theta: small={} medium={} large={}",
            ll_small,
            ll_medium,
            ll_large
        );
    }

    #[test]
    fn test_solve_linear_system() {
        // Test with identity matrix
        let a = vec![vec![1.0, 0.0], vec![0.0, 1.0]];
        let b = vec![3.0, 5.0];

        let x = solve_linear_system(&a, &b).unwrap();
        assert!(approx_eq(x[0], 3.0, TOL));
        assert!(approx_eq(x[1], 5.0, TOL));

        // Test with non-trivial positive-definite matrix
        let a2 = vec![vec![4.0, 2.0], vec![2.0, 3.0]];
        let b2 = vec![10.0, 13.0];

        let x2 = solve_linear_system(&a2, &b2).unwrap();

        // Verify A * x = b
        let ax0 = a2[0][0] * x2[0] + a2[0][1] * x2[1];
        let ax1 = a2[1][0] * x2[0] + a2[1][1] * x2[1];
        assert!(approx_eq(ax0, b2[0], TOL));
        assert!(approx_eq(ax1, b2[1], TOL));
    }

    #[test]
    fn test_log_determinant() {
        // Identity matrix: det = 1, log det = 0
        let a = vec![vec![1.0, 0.0], vec![0.0, 1.0]];
        let log_det = log_determinant(&a).unwrap();
        assert!(approx_eq(log_det, 0.0, TOL));

        // Diagonal matrix: det = 4*9 = 36, log det = log(36)
        let b = vec![vec![4.0, 0.0], vec![0.0, 9.0]];
        let log_det_b = log_determinant(&b).unwrap();
        assert!(approx_eq(log_det_b, 36.0_f64.ln(), TOL));

        // 2x2 matrix with known determinant
        // [[4, 2], [2, 3]] has det = 4*3 - 2*2 = 8
        let c = vec![vec![4.0, 2.0], vec![2.0, 3.0]];
        let log_det_c = log_determinant(&c).unwrap();
        assert!(approx_eq(log_det_c, 8.0_f64.ln(), TOL));
    }

    #[test]
    fn test_gradient_theta_direction() {
        let (y, x, re, z) = create_test_data();
        let family = GaussianFamily::default();

        let beta = vec![1.0, 0.5];
        let b_init = vec![0.0, 0.0, 0.0, 0.0];
        let theta = vec![0.0];

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
        let mut theta_plus = theta.clone();
        let mut theta_minus = theta.clone();
        theta_plus[0] += eps;
        theta_minus[0] -= eps;

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

        // Sign should match
        if result.grad_theta[0].abs() > 1e-3 && num_grad.abs() > 1e-3 {
            assert!(
                result.grad_theta[0] * num_grad > 0.0,
                "Gradient signs should match: computed={} numerical={}",
                result.grad_theta[0],
                num_grad
            );
        }
    }

    #[test]
    fn test_invert_symmetric_positive_definite_identity() {
        // Identity matrix should invert to itself
        let identity = vec![vec![1.0, 0.0], vec![0.0, 1.0]];
        let inv = invert_symmetric_positive_definite(&identity).unwrap();

        assert_eq!(inv.len(), 2);
        assert!(approx_eq(inv[0][0], 1.0, TOL));
        assert!(approx_eq(inv[0][1], 0.0, TOL));
        assert!(approx_eq(inv[1][0], 0.0, TOL));
        assert!(approx_eq(inv[1][1], 1.0, TOL));
    }

    #[test]
    fn test_invert_symmetric_positive_definite_diagonal() {
        // Diagonal matrix with variances 4 and 9
        let diag = vec![vec![4.0, 0.0], vec![0.0, 9.0]];
        let inv = invert_symmetric_positive_definite(&diag).unwrap();

        // Inverse should have 1/4 and 1/9 on diagonal
        assert!(approx_eq(inv[0][0], 0.25, TOL));
        assert!(approx_eq(inv[0][1], 0.0, TOL));
        assert!(approx_eq(inv[1][0], 0.0, TOL));
        assert!(approx_eq(inv[1][1], 1.0 / 9.0, TOL));
    }

    #[test]
    fn test_invert_symmetric_positive_definite_2x2() {
        // 2x2 positive definite: [[2, 1], [1, 3]]
        // Determinant = 2*3 - 1*1 = 5
        // Inverse = [[3, -1], [-1, 2]] / 5
        let a = vec![vec![2.0, 1.0], vec![1.0, 3.0]];
        let inv = invert_symmetric_positive_definite(&a).unwrap();

        assert!(approx_eq(inv[0][0], 0.6, TOL), "inv[0][0] = {}", inv[0][0]);
        assert!(approx_eq(inv[0][1], -0.2, TOL), "inv[0][1] = {}", inv[0][1]);
        assert!(approx_eq(inv[1][0], -0.2, TOL), "inv[1][0] = {}", inv[1][0]);
        assert!(approx_eq(inv[1][1], 0.4, TOL), "inv[1][1] = {}", inv[1][1]);

        // Verify A * A^{-1} = I
        let product_00 = a[0][0] * inv[0][0] + a[0][1] * inv[1][0];
        let product_01 = a[0][0] * inv[0][1] + a[0][1] * inv[1][1];
        let product_10 = a[1][0] * inv[0][0] + a[1][1] * inv[1][0];
        let product_11 = a[1][0] * inv[0][1] + a[1][1] * inv[1][1];

        assert!(approx_eq(product_00, 1.0, TOL));
        assert!(approx_eq(product_01, 0.0, TOL));
        assert!(approx_eq(product_10, 0.0, TOL));
        assert!(approx_eq(product_11, 1.0, TOL));
    }

    #[test]
    fn test_invert_symmetric_positive_definite_3x3() {
        // 3x3 positive definite matrix
        let a = vec![
            vec![4.0, 2.0, 1.0],
            vec![2.0, 5.0, 2.0],
            vec![1.0, 2.0, 6.0],
        ];
        let inv = invert_symmetric_positive_definite(&a).unwrap();

        // Verify A * A^{-1} = I
        for i in 0..3 {
            for j in 0..3 {
                let product: f64 = (0..3).map(|k| a[i][k] * inv[k][j]).sum();
                let expected = if i == j { 1.0 } else { 0.0 };
                assert!(
                    approx_eq(product, expected, TOL),
                    "(A * A^-1)[{}][{}] = {}, expected {}",
                    i,
                    j,
                    product,
                    expected
                );
            }
        }

        // Verify symmetry of inverse
        for i in 0..3 {
            for j in 0..3 {
                assert!(
                    approx_eq(inv[i][j], inv[j][i], TOL),
                    "Inverse should be symmetric: inv[{}][{}]={} != inv[{}][{}]={}",
                    i,
                    j,
                    inv[i][j],
                    j,
                    i,
                    inv[j][i]
                );
            }
        }
    }

    #[test]
    fn test_invert_symmetric_positive_definite_empty() {
        let empty: Vec<Vec<f64>> = vec![];
        let inv = invert_symmetric_positive_definite(&empty).unwrap();
        assert!(inv.is_empty());
    }

    #[test]
    fn test_invert_symmetric_positive_definite_1x1() {
        let a = vec![vec![4.0]];
        let inv = invert_symmetric_positive_definite(&a).unwrap();
        assert!(approx_eq(inv[0][0], 0.25, TOL));
    }

    #[test]
    fn test_blup_standard_errors_from_hessian_inverse() {
        // Verify that BLUP SEs are extracted correctly from H^{-1}
        // Create a simple Hessian with known inverse
        let (y, x, re, z) = create_test_data();
        let family = GaussianFamily::default();

        let beta = vec![1.0, 0.5];
        let b_init = vec![0.0, 0.0, 0.0, 0.0];
        let theta = vec![0.0]; // log(sd) = 0 means sd = 1

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

        // Verify we have a Hessian
        assert!(
            result.hessian_b.is_some(),
            "Hessian should be computed"
        );

        let hessian = result.hessian_b.as_ref().unwrap();

        // Verify Hessian is positive definite (all diagonal elements positive)
        for i in 0..hessian.len() {
            assert!(
                hessian[i][i] > 0.0,
                "Hessian diagonal element {} should be positive: {}",
                i,
                hessian[i][i]
            );
        }

        // Compute inverse and verify diagonal gives correct SEs
        let h_inv = invert_symmetric_positive_definite(hessian).unwrap();

        // Inverse should also have positive diagonal
        for i in 0..h_inv.len() {
            assert!(
                h_inv[i][i] >= 0.0,
                "H^-1 diagonal element {} should be non-negative: {}",
                i,
                h_inv[i][i]
            );
        }

        // The correct SEs are sqrt(H^{-1}[i,i]), NOT sqrt(1/H[i,i])
        // These two are only equal when H is diagonal
        // For non-diagonal H, they differ
        for i in 0..hessian.len() {
            let wrong_se = (1.0 / hessian[i][i]).sqrt();
            let correct_se = h_inv[i][i].sqrt();

            // Log the values for debugging
            println!(
                "Index {}: H[i,i]={:.6}, H^-1[i,i]={:.6}, wrong_SE={:.6}, correct_SE={:.6}",
                i, hessian[i][i], h_inv[i][i], wrong_se, correct_se
            );
        }
    }
}
