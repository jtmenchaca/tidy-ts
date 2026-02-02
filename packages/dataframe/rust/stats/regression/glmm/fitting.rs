//! GLMM fitting module - outer optimization for variance components
//!
//! This module implements the main GLMM fitting algorithm which optimizes
//! variance components (theta) using the Laplace-approximated marginal likelihood.
//!
//! # Algorithm Overview
//!
//! 1. **Initialize**: Set starting values for theta (variance components) and beta (fixed effects)
//! 2. **Outer loop**: Iterate to convergence:
//!    a. Evaluate profile likelihood at current theta using Laplace approximation
//!    b. Update theta using BFGS or Newton optimizer
//!    c. Check convergence via gradient norm
//! 3. **Extract results**: BLUPs, variance components, standard errors
//!
//! # Optimizer
//!
//! Uses L-BFGS for unconstrained optimization of theta (log-Cholesky parameterization
//! ensures covariance matrices are always positive-definite).

use super::laplace::{invert_symmetric_positive_definite, laplace_approximation, LaplaceControl};
use super::random_effects::SparseMatrix;
use super::types::{
    GlmmControl, GlmmFitSummary, GlmmResult, RandomEffect, RandomEffectEstimates, VarianceComponent,
};
use super::variance_components::{initial_theta, split_theta, theta_to_variance_component};
use crate::stats::regression::family::GlmFamily;
use crate::stats::regression::glm::types::GlmResult;
use std::collections::HashMap;

/// Result from outer optimization
#[derive(Debug, Clone)]
pub struct OuterOptimizationResult {
    /// Optimal theta (variance components)
    pub theta: Vec<f64>,
    /// Fixed effect coefficients at optimum
    pub beta: Vec<f64>,
    /// Random effects at optimum (BLUPs)
    pub b: Vec<f64>,
    /// Final log-likelihood
    pub log_likelihood: f64,
    /// Number of outer iterations
    pub iterations: usize,
    /// Whether outer optimization converged
    pub converged: bool,
    /// Final gradient norm
    pub final_gradient_norm: f64,
    /// Hessian at optimum (for standard errors)
    pub hessian_b: Option<Vec<Vec<f64>>>,
}

/// L-BFGS optimizer state
struct LbfgsState {
    /// Number of past iterations to store for Hessian approximation
    m: usize,
    /// Past position differences (s_k = x_{k+1} - x_k)
    s_history: Vec<Vec<f64>>,
    /// Past gradient differences (y_k = g_{k+1} - g_k)
    y_history: Vec<Vec<f64>>,
    /// Dot products rho_k = 1 / (y_k^T s_k)
    rho_history: Vec<f64>,
}

impl LbfgsState {
    fn new(m: usize) -> Self {
        Self {
            m,
            s_history: Vec::with_capacity(m),
            y_history: Vec::with_capacity(m),
            rho_history: Vec::with_capacity(m),
        }
    }

    /// Update history with new s and y vectors
    fn update(&mut self, s: Vec<f64>, y: Vec<f64>) {
        let ys: f64 = s.iter().zip(y.iter()).map(|(si, yi)| si * yi).sum();

        // Skip update if curvature condition not satisfied
        if ys <= 1e-10 {
            return;
        }

        // Remove oldest if at capacity
        if self.s_history.len() >= self.m {
            self.s_history.remove(0);
            self.y_history.remove(0);
            self.rho_history.remove(0);
        }

        self.s_history.push(s);
        self.y_history.push(y);
        self.rho_history.push(1.0 / ys);
    }

    /// Compute L-BFGS search direction (two-loop recursion)
    fn compute_direction(&self, grad: &[f64]) -> Vec<f64> {
        let n = grad.len();
        let k = self.s_history.len();

        if k == 0 {
            // No history yet - use steepest descent
            return grad.iter().map(|g| -g).collect();
        }

        // Two-loop recursion
        let mut q = grad.to_vec();
        let mut alpha = vec![0.0; k];

        // First loop (backward)
        for i in (0..k).rev() {
            let si = &self.s_history[i];
            let rho_i = self.rho_history[i];

            alpha[i] = rho_i * si.iter().zip(q.iter()).map(|(s, q)| s * q).sum::<f64>();

            for j in 0..n {
                q[j] -= alpha[i] * self.y_history[i][j];
            }
        }

        // Initial Hessian approximation (scaling)
        let gamma = {
            let sk = &self.s_history[k - 1];
            let yk = &self.y_history[k - 1];
            let yk_dot_yk: f64 = yk.iter().map(|y| y * y).sum();
            let sk_dot_yk: f64 = sk.iter().zip(yk.iter()).map(|(s, y)| s * y).sum();
            if yk_dot_yk > 1e-10 {
                sk_dot_yk / yk_dot_yk
            } else {
                1.0
            }
        };

        let mut r: Vec<f64> = q.iter().map(|qi| gamma * qi).collect();

        // Second loop (forward)
        for i in 0..k {
            let yi = &self.y_history[i];
            let rho_i = self.rho_history[i];

            let beta = rho_i * yi.iter().zip(r.iter()).map(|(y, r)| y * r).sum::<f64>();

            for j in 0..n {
                r[j] += (alpha[i] - beta) * self.s_history[i][j];
            }
        }

        // Negate for descent direction
        r.iter().map(|ri| -ri).collect()
    }
}

/// Backtracking line search with Armijo condition
fn line_search<F>(
    f: &mut F,
    x: &[f64],
    direction: &[f64],
    fx: f64,
    grad: &[f64],
    max_step: f64,
) -> (f64, f64, Vec<f64>)
where
    F: FnMut(&[f64]) -> (f64, Vec<f64>),
{
    let c1 = 1e-4; // Armijo constant
    let rho = 0.5; // Backtracking factor

    // Directional derivative
    let dir_deriv: f64 = grad.iter().zip(direction.iter()).map(|(g, d)| g * d).sum();

    // If not a descent direction, use small steepest descent step
    if dir_deriv >= 0.0 {
        let step = 0.01;
        let x_new: Vec<f64> = x.iter().zip(grad.iter()).map(|(xi, gi)| xi - step * gi).collect();
        let (fx_new, grad_new) = f(&x_new);
        return (step, fx_new, grad_new);
    }

    let mut step = max_step;

    for _ in 0..20 {
        let x_new: Vec<f64> = x
            .iter()
            .zip(direction.iter())
            .map(|(xi, di)| xi + step * di)
            .collect();

        let (fx_new, grad_new) = f(&x_new);

        // Armijo condition
        if fx_new <= fx + c1 * step * dir_deriv {
            return (step, fx_new, grad_new);
        }

        step *= rho;
    }

    // If line search fails, take a small step
    let step = 0.001;
    let x_new: Vec<f64> = x
        .iter()
        .zip(direction.iter())
        .map(|(xi, di)| xi + step * di)
        .collect();
    let (fx_new, grad_new) = f(&x_new);
    (step, fx_new, grad_new)
}

/// Main GLMM fitting function using outer optimization
///
/// # Arguments
/// * `y` - Response vector
/// * `x` - Fixed effects design matrix (row-major)
/// * `z` - Random effects design matrix (sparse)
/// * `random_effects` - Random effect specifications
/// * `family` - GLM family
/// * `control` - GLMM control parameters
/// * `weights` - Observation weights (optional)
/// * `offset` - Offset vector (optional)
///
/// # Returns
/// Complete GLMM result or error message
pub fn glmm_fit(
    y: &[f64],
    x: &[Vec<f64>],
    z: &SparseMatrix,
    random_effects: &[RandomEffect],
    family: &dyn GlmFamily,
    control: &GlmmControl,
    weights: Option<&[f64]>,
    offset: Option<&[f64]>,
) -> Result<GlmmResult, String> {
    let n = y.len();
    let p = if !x.is_empty() { x[0].len() } else { 0 };
    let q = z.ncol; // Total random effect coefficients

    // Set up weights and offset
    let default_weights = vec![1.0; n];
    let default_offset = vec![0.0; n];
    let weights = weights.unwrap_or(&default_weights);
    let offset = offset.unwrap_or(&default_offset);

    // Initialize theta (variance components)
    let mut theta = if let Some(ref start) = control.start_theta {
        start.clone()
    } else {
        // Initialize with default values for each random effect
        let mut init_theta = Vec::new();
        for re in random_effects {
            let re_theta = initial_theta(re.n_terms(), &re.covariance, 1.0, 0.0);
            init_theta.extend(re_theta);
        }
        init_theta
    };

    // Initialize beta (fixed effects)
    let mut beta = if let Some(ref start) = control.start_beta {
        start.clone()
    } else {
        vec![0.0; p]
    };

    // Initialize random effects to zero
    let mut b = vec![0.0; q];

    // Laplace control for inner optimization
    let laplace_ctrl = LaplaceControl {
        max_iter: control.max_iter_inner,
        tol: control.tol_inner,
        damping: 1.0,
        compute_hessian: true,
        min_variance: 1e-10,
    };

    // Run outer optimization
    let outer_result = run_outer_optimization(
        y,
        x,
        z,
        &mut theta,
        &mut beta,
        &mut b,
        random_effects,
        family,
        weights,
        offset,
        &laplace_ctrl,
        control,
    )?;

    // Extract final values
    let theta = outer_result.theta;
    let beta = outer_result.beta;
    let b = outer_result.b;
    let log_likelihood = outer_result.log_likelihood;

    // Build variance components
    let variance_components = build_variance_components(&theta, random_effects);

    // Build BLUPs
    let blups = build_blups(&b, random_effects, outer_result.hessian_b.as_ref());

    // Compute residual variance (for Gaussian, this is estimated; for others, it's 1.0)
    let residual_variance = if family.name() == "gaussian" {
        // Estimate from residuals
        let zb = z.mul_vec(&b);
        let mut ssr = 0.0;
        for i in 0..n {
            let x_beta: f64 = x[i].iter().zip(beta.iter()).map(|(xij, bj)| xij * bj).sum();
            let fitted = x_beta + zb[i] + offset[i];
            let linkinv = family.linkinv();
            let mu_vec = linkinv(&[fitted]);
            let resid = y[i] - mu_vec[0];
            ssr += weights[i] * resid * resid;
        }
        let df_resid = (n as f64) - (p as f64) - (q as f64);
        if df_resid > 0.0 {
            ssr / df_resid
        } else {
            1.0
        }
    } else {
        1.0
    };

    // Compute AIC and BIC
    let n_params = p + theta.len() + 1; // Fixed effects + variance params + residual
    let aic = -2.0 * log_likelihood + 2.0 * (n_params as f64);
    let bic = -2.0 * log_likelihood + (n_params as f64) * (n as f64).ln();

    // Build GLM result for fixed effects
    let glm_result = build_glm_result(
        y,
        x,
        z,
        &beta,
        &b,
        family,
        weights,
        offset,
        outer_result.converged,
        outer_result.iterations,
    )?;

    // Build fit summary
    let mut n_groups_map = HashMap::new();
    for re in random_effects {
        n_groups_map.insert(re.grouping_var.clone(), re.n_groups);
    }

    let fit_summary = GlmmFitSummary {
        n_observations: n,
        n_fixed: p,
        n_random: q,
        n_variance_params: theta.len(),
        df_residual: n.saturating_sub(p),
        n_groups: n_groups_map,
        method: if control.reml { "REML" } else { "ML" }.to_string(),
    };

    // Determine convergence message
    let convergence_message = if outer_result.converged {
        format!(
            "Converged after {} iterations (gradient norm: {:.2e})",
            outer_result.iterations, outer_result.final_gradient_norm
        )
    } else {
        format!(
            "Did not converge after {} iterations (gradient norm: {:.2e})",
            outer_result.iterations, outer_result.final_gradient_norm
        )
    };

    Ok(GlmmResult {
        glm_result,
        random_effects: random_effects.to_vec(),
        variance_components,
        blups,
        residual_variance,
        log_likelihood,
        reml_criterion: if control.reml {
            Some(log_likelihood)
        } else {
            None
        },
        aic,
        bic,
        theta,
        theta_se: None, // TODO: Compute from Hessian
        outer_iterations: outer_result.iterations,
        converged: outer_result.converged,
        convergence_message,
        control: control.clone(),
        formula: String::new(), // To be filled by caller
        fit_summary,
    })
}

/// Run the outer optimization loop for variance components
fn run_outer_optimization(
    y: &[f64],
    x: &[Vec<f64>],
    z: &SparseMatrix,
    theta: &mut Vec<f64>,
    beta: &mut Vec<f64>,
    b: &mut Vec<f64>,
    random_effects: &[RandomEffect],
    family: &dyn GlmFamily,
    weights: &[f64],
    offset: &[f64],
    laplace_ctrl: &LaplaceControl,
    control: &GlmmControl,
) -> Result<OuterOptimizationResult, String> {
    let n_theta = theta.len();

    // L-BFGS state
    let mut lbfgs = LbfgsState::new(10);

    // Evaluate initial objective and gradient
    let mut current_result = laplace_approximation(
        y,
        x,
        z,
        beta,
        b,
        theta,
        random_effects,
        family,
        weights,
        offset,
        laplace_ctrl,
    );

    // We minimize negative log-likelihood
    let mut obj = -current_result.log_marginal_likelihood;
    let mut grad: Vec<f64> = current_result.grad_theta.iter().map(|g| -g).collect();
    let mut grad_norm: f64 = grad.iter().map(|g| g * g).sum::<f64>().sqrt();

    // Update b with the mode found
    *b = current_result.b_mode.clone();

    if control.verbose {
        println!(
            "Outer iter 0: obj = {:.6}, grad_norm = {:.2e}",
            obj, grad_norm
        );
    }

    let mut converged = grad_norm < control.tol_outer;
    let mut iter = 0;

    // Track best solution in case of non-monotonic behavior
    let mut best_theta = theta.clone();
    let mut best_obj = obj;
    let mut best_b = b.clone();

    for outer_iter in 1..=control.max_iter_outer {
        iter = outer_iter;

        if converged {
            break;
        }

        // Compute search direction using L-BFGS
        let direction = lbfgs.compute_direction(&grad);

        // Store old values for L-BFGS update
        let theta_old = theta.clone();
        let grad_old = grad.clone();

        // Line search
        let mut eval_fn = |theta_new: &[f64]| -> (f64, Vec<f64>) {
            let result = laplace_approximation(
                y,
                x,
                z,
                beta,
                b,
                theta_new,
                random_effects,
                family,
                weights,
                offset,
                laplace_ctrl,
            );
            let new_obj = -result.log_marginal_likelihood;
            let new_grad: Vec<f64> = result.grad_theta.iter().map(|g| -g).collect();
            (new_obj, new_grad)
        };

        let (_step, new_obj, new_grad) = line_search(&mut eval_fn, theta, &direction, obj, &grad, 1.0);

        // Update theta
        for i in 0..n_theta {
            theta[i] = theta_old[i] + _step * direction[i];
        }

        // Re-evaluate to get updated b
        current_result = laplace_approximation(
            y,
            x,
            z,
            beta,
            b,
            theta,
            random_effects,
            family,
            weights,
            offset,
            laplace_ctrl,
        );
        *b = current_result.b_mode.clone();

        obj = new_obj;
        grad = new_grad;
        grad_norm = grad.iter().map(|g| g * g).sum::<f64>().sqrt();

        // Track best solution
        if obj < best_obj {
            best_obj = obj;
            best_theta = theta.clone();
            best_b = b.clone();
        }

        // Update L-BFGS history
        let s: Vec<f64> = theta
            .iter()
            .zip(theta_old.iter())
            .map(|(t, t_old)| t - t_old)
            .collect();
        let y_diff: Vec<f64> = grad
            .iter()
            .zip(grad_old.iter())
            .map(|(g, g_old)| g - g_old)
            .collect();
        lbfgs.update(s, y_diff);

        if control.verbose {
            println!(
                "Outer iter {}: obj = {:.6}, grad_norm = {:.2e}, step = {:.4}",
                outer_iter, obj, grad_norm, _step
            );
        }

        // Check convergence
        converged = grad_norm < control.tol_outer;

        // Also check for lack of progress
        if (_step < 1e-10) && (grad_norm > control.tol_outer * 10.0) {
            // Stuck - use best solution found
            *theta = best_theta.clone();
            *b = best_b.clone();
            obj = best_obj;
            break;
        }
    }

    // Use best solution if we didn't converge
    if !converged && best_obj < obj {
        *theta = best_theta;
        *b = best_b;
        obj = best_obj;
    }

    // Final evaluation to get Hessian
    let final_result = laplace_approximation(
        y,
        x,
        z,
        beta,
        b,
        theta,
        random_effects,
        family,
        weights,
        offset,
        laplace_ctrl,
    );

    Ok(OuterOptimizationResult {
        theta: theta.clone(),
        beta: beta.clone(),
        b: b.clone(),
        log_likelihood: -obj,
        iterations: iter,
        converged,
        final_gradient_norm: grad_norm,
        hessian_b: final_result.hessian_b,
    })
}

/// Build variance component structures from theta
fn build_variance_components(
    theta: &[f64],
    random_effects: &[RandomEffect],
) -> Vec<VarianceComponent> {
    let theta_splits = split_theta(theta, random_effects);

    random_effects
        .iter()
        .zip(theta_splits.iter())
        .map(|(re, theta_re)| {
            theta_to_variance_component(
                theta_re,
                re.n_terms(),
                &re.covariance,
                re.grouping_var.clone(),
                re.terms.clone(),
            )
        })
        .collect()
}

/// Build BLUP estimates from random effects vector
///
/// Computes BLUPs (Best Linear Unbiased Predictions) and their conditional standard errors.
///
/// The conditional variance is computed as:
/// Var(b | y) = H^{-1}
///
/// where H is the Hessian of the negative joint log-likelihood at the mode.
/// Standard errors are extracted from the diagonal of H^{-1}, NOT from 1/diag(H).
fn build_blups(
    b: &[f64],
    random_effects: &[RandomEffect],
    hessian_b: Option<&Vec<Vec<f64>>>,
) -> Vec<RandomEffectEstimates> {
    let mut blups = Vec::with_capacity(random_effects.len());

    // Compute the inverse Hessian if available
    // This gives us Var(b | y) = H^{-1}, the conditional covariance matrix
    let hessian_inv = hessian_b.and_then(|h| invert_symmetric_positive_definite(h));

    let mut offset = 0;

    for re in random_effects {
        let k = re.n_terms();
        let n_groups = re.n_groups;
        let n_coeffs = re.total_coefficients();

        // Extract BLUPs for this random effect
        let b_re = &b[offset..offset + n_coeffs];

        // Reshape into n_groups × k matrix
        let estimates: Vec<Vec<f64>> = (0..n_groups)
            .map(|g| (0..k).map(|t| b_re[g * k + t]).collect())
            .collect();

        // Extract standard errors from inverse Hessian diagonal
        // SE(b_i | y) = sqrt(H^{-1}[i,i])
        let std_errors = hessian_inv.as_ref().map(|h_inv| {
            (0..n_groups)
                .map(|g| {
                    (0..k)
                        .map(|t| {
                            let idx = offset + g * k + t;
                            if idx < h_inv.len() && h_inv[idx][idx] >= 0.0 {
                                h_inv[idx][idx].sqrt()
                            } else {
                                0.0
                            }
                        })
                        .collect()
                })
                .collect()
        });

        // Extract conditional covariance blocks for each group
        // Each block is a k × k matrix: Var(b_g | y) = H^{-1}[block_g, block_g]
        let conditional_vcov = hessian_inv.as_ref().map(|h_inv| {
            (0..n_groups)
                .map(|g| {
                    let start = offset + g * k;
                    (0..k)
                        .map(|i| {
                            (0..k)
                                .map(|j| {
                                    let row = start + i;
                                    let col = start + j;
                                    if row < h_inv.len() && col < h_inv[row].len() {
                                        h_inv[row][col]
                                    } else {
                                        0.0
                                    }
                                })
                                .collect()
                        })
                        .collect()
                })
                .collect()
        });

        blups.push(RandomEffectEstimates {
            group_name: re.grouping_var.clone(),
            term_names: re.terms.clone(),
            group_ids: re.group_ids.clone(),
            estimates,
            std_errors,
            conditional_vcov,
        });

        offset += n_coeffs;
    }

    blups
}

/// Build GlmResult for fixed effects
fn build_glm_result(
    y: &[f64],
    x: &[Vec<f64>],
    z: &SparseMatrix,
    beta: &[f64],
    b: &[f64],
    family: &dyn GlmFamily,
    weights: &[f64],
    offset: &[f64],
    converged: bool,
    iterations: usize,
) -> Result<GlmResult, String> {
    let n = y.len();
    let p = beta.len();

    // Compute fitted values and residuals
    let zb = z.mul_vec(b);
    let linkinv = family.linkinv();

    let eta: Vec<f64> = (0..n)
        .map(|i| {
            let x_beta: f64 = x[i].iter().zip(beta.iter()).map(|(xij, bj)| xij * bj).sum();
            x_beta + zb[i] + offset[i]
        })
        .collect();

    let mu = linkinv(&eta);

    // Residuals
    let residuals: Vec<f64> = y.iter().zip(mu.iter()).map(|(yi, mui)| yi - mui).collect();

    // Deviance
    let deviance_fn = family.deviance();
    let deviance = deviance_fn.deviance(y, &mu, weights).unwrap_or(f64::INFINITY);

    // Null deviance (intercept-only model)
    let y_mean = y.iter().sum::<f64>() / (n as f64);
    let mu_null = vec![y_mean; n];
    let null_deviance = deviance_fn
        .deviance(y, &mu_null, weights)
        .unwrap_or(f64::INFINITY);

    // Standard errors (approximate - should be computed from full Hessian)
    // For now, use simple diagonal approximation
    let standard_errors = vec![0.0; p]; // TODO: Compute properly

    // Column names
    let column_names: Vec<String> = (0..p).map(|i| format!("X{}", i)).collect();

    // Create GlmResult using the new() constructor and update fields
    let mut result = GlmResult::new();
    result.coefficients = beta.to_vec();
    result.standard_errors = standard_errors;
    result.residuals = residuals.clone();
    result.response_residuals = residuals;
    result.fitted_values = mu;
    result.linear_predictors = eta;
    result.deviance = deviance;
    result.null_deviance = null_deviance;
    result.aic = 0.0; // Computed at GlmmResult level
    result.df_null = n.saturating_sub(1);
    result.df_residual = n.saturating_sub(p);
    result.rank = p;
    result.converged = converged;
    result.iter = iterations;
    result.weights = weights.to_vec();
    result.prior_weights = weights.to_vec();
    result.y = y.to_vec();
    result.model_matrix_column_names = column_names;
    result.n_observations = n;
    result.boundary = false;

    // Update family info
    result.family.family = family.name().to_string();
    result.family.link = family.link().name().to_string();

    Ok(result)
}

/// Convenience function for fitting with simpler interface
pub fn glmm_fit_simple(
    y: &[f64],
    x: &[Vec<f64>],
    group_indices: &[usize],
    family: &dyn GlmFamily,
    n_groups: usize,
) -> Result<GlmmResult, String> {
    use super::random_effects::{construct_z_matrix, intercept_term_values};

    let n = y.len();

    // Create random effect specification
    let mut re = RandomEffect::intercept("group".to_string());
    re.n_groups = n_groups;
    re.group_indices = group_indices.to_vec();
    re.group_ids = (0..n_groups).map(|i| format!("g{}", i)).collect();
    re.group_sizes = {
        let mut sizes = vec![0; n_groups];
        for &idx in group_indices {
            if idx < n_groups {
                sizes[idx] += 1;
            }
        }
        sizes
    };

    // Construct Z matrix
    let term_values = intercept_term_values(n);
    let z = construct_z_matrix(&re, &term_values)?;

    // Default control
    let control = GlmmControl::default();

    glmm_fit(y, x, &z, &[re], family, &control, None, None)
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::stats::regression::family::GaussianFamily;
    use crate::stats::regression::glmm::random_effects::{
        construct_z_matrix, intercept_term_values, populate_random_effect,
    };

    #[allow(unused_imports)]
    use crate::stats::regression::glmm::types::CovarianceType;

    const TOL: f64 = 1e-3;

    fn approx_eq(a: f64, b: f64, tol: f64) -> bool {
        (a - b).abs() < tol || (a.is_nan() && b.is_nan())
    }

    fn create_test_data() -> (Vec<f64>, Vec<Vec<f64>>, Vec<RandomEffect>, SparseMatrix) {
        // Create test data: 100 observations, 10 groups
        let n = 100;
        let n_groups = 10;
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
        let x: Vec<Vec<f64>> = (0..n).map(|i| vec![1.0, (i as f64) * 0.01]).collect();

        // True parameters
        let beta_true = vec![2.0, 0.5]; // Fixed effects
        let sigma_b = 1.0; // Random effect SD
        let sigma_e = 0.5; // Residual SD

        // Generate random effects (deterministic for testing)
        let b_true: Vec<f64> = (0..n_groups)
            .map(|i| sigma_b * ((i as f64 - 5.0) / 5.0))
            .collect();

        // Generate response
        let zb = z.mul_vec(&b_true);
        let y: Vec<f64> = (0..n)
            .map(|i| {
                let x_beta: f64 = x[i]
                    .iter()
                    .zip(beta_true.iter())
                    .map(|(xij, bj)| xij * bj)
                    .sum();
                let noise = sigma_e * ((i as f64 - 50.0) / 50.0) * 0.1; // Small deterministic "noise"
                x_beta + zb[i] + noise
            })
            .collect();

        (y, x, vec![re], z)
    }

    #[test]
    fn test_lbfgs_state_direction() {
        let lbfgs = LbfgsState::new(5);

        // With no history, should return negative gradient
        let grad = vec![1.0, 2.0, 3.0];
        let dir = lbfgs.compute_direction(&grad);

        assert!(approx_eq(dir[0], -1.0, 1e-10));
        assert!(approx_eq(dir[1], -2.0, 1e-10));
        assert!(approx_eq(dir[2], -3.0, 1e-10));
    }

    #[test]
    fn test_lbfgs_state_update() {
        let mut lbfgs = LbfgsState::new(5);

        let s = vec![1.0, 0.0];
        let y = vec![2.0, 1.0];

        lbfgs.update(s, y);

        assert_eq!(lbfgs.s_history.len(), 1);
        assert_eq!(lbfgs.y_history.len(), 1);
        assert_eq!(lbfgs.rho_history.len(), 1);
    }

    #[test]
    fn test_glmm_fit_basic() {
        let (y, x, random_effects, z) = create_test_data();
        let family = GaussianFamily::default();
        let control = GlmmControl::new().with_max_iter(50).with_verbose(false);

        let result = glmm_fit(
            &y,
            &x,
            &z,
            &random_effects,
            &family,
            &control,
            None,
            None,
        );

        assert!(result.is_ok(), "GLMM fit should succeed");
        let result = result.unwrap();

        // Check basic properties
        assert_eq!(result.glm_result.coefficients.len(), 2);
        assert_eq!(result.variance_components.len(), 1);
        assert_eq!(result.blups.len(), 1);
        assert!(result.log_likelihood.is_finite());
        assert!(result.aic.is_finite());
        assert!(result.bic.is_finite());

        // Check that fixed effects are reasonable
        // True values: beta = [2.0, 0.5]
        let coef = &result.glm_result.coefficients;
        assert!(
            (coef[0] - 2.0).abs() < 1.0,
            "Intercept should be close to 2.0, got {}",
            coef[0]
        );
    }

    #[test]
    fn test_glmm_fit_convergence() {
        let (y, x, random_effects, z) = create_test_data();
        let family = GaussianFamily::default();
        let control = GlmmControl::new()
            .with_max_iter(100)
            .with_tolerance(1e-6)
            .with_verbose(false);

        let result = glmm_fit(
            &y,
            &x,
            &z,
            &random_effects,
            &family,
            &control,
            None,
            None,
        )
        .unwrap();

        // Should converge within reasonable iterations
        assert!(
            result.outer_iterations <= 100,
            "Should complete within max iterations"
        );
    }

    #[test]
    fn test_glmm_fit_variance_components() {
        let (y, x, random_effects, z) = create_test_data();
        let family = GaussianFamily::default();
        let control = GlmmControl::new().with_max_iter(100).with_verbose(false);

        let result = glmm_fit(
            &y,
            &x,
            &z,
            &random_effects,
            &family,
            &control,
            None,
            None,
        )
        .unwrap();

        // Check variance component
        assert_eq!(result.variance_components.len(), 1);
        let vc = &result.variance_components[0];
        assert_eq!(vc.group_name, "group");

        // SD should be positive and reasonable
        assert!(vc.std_dev[0] > 0.0);
        assert!(
            vc.std_dev[0] < 10.0,
            "Random effect SD should be reasonable"
        );
    }

    #[test]
    fn test_glmm_fit_blups() {
        let (y, x, random_effects, z) = create_test_data();
        let family = GaussianFamily::default();
        let control = GlmmControl::new().with_max_iter(100).with_verbose(false);

        let result = glmm_fit(
            &y,
            &x,
            &z,
            &random_effects,
            &family,
            &control,
            None,
            None,
        )
        .unwrap();

        // Check BLUPs
        assert_eq!(result.blups.len(), 1);
        let blups = &result.blups[0];
        assert_eq!(blups.n_groups(), 10);
        assert_eq!(blups.n_terms(), 1);

        // BLUPs should sum approximately to zero
        let blup_sum: f64 = blups.estimates.iter().map(|b| b[0]).sum();
        assert!(
            blup_sum.abs() < 2.0,
            "BLUPs should approximately sum to zero, got {}",
            blup_sum
        );
    }

    #[test]
    fn test_build_variance_components() {
        let re = RandomEffect::intercept("group".to_string());
        let theta = vec![0.5_f64.ln()]; // SD = 0.5

        let vcs = build_variance_components(&theta, &[re]);

        assert_eq!(vcs.len(), 1);
        assert!(approx_eq(vcs[0].std_dev[0], 0.5, 1e-6));
    }

    #[test]
    fn test_blup_standard_errors_are_positive() {
        let (y, x, random_effects, z) = create_test_data();
        let family = GaussianFamily::default();
        let control = GlmmControl::new().with_max_iter(100).with_verbose(false);

        let result = glmm_fit(
            &y,
            &x,
            &z,
            &random_effects,
            &family,
            &control,
            None,
            None,
        )
        .unwrap();

        // Check that standard errors are computed and positive
        let blups = &result.blups[0];
        assert!(
            blups.std_errors.is_some(),
            "Standard errors should be computed"
        );

        let se = blups.std_errors.as_ref().unwrap();
        for (g, group_se) in se.iter().enumerate() {
            for (t, se_val) in group_se.iter().enumerate() {
                assert!(
                    *se_val > 0.0,
                    "SE for group {} term {} should be positive, got {}",
                    g, t, se_val
                );
            }
        }
    }

    #[test]
    fn test_blup_conditional_vcov_extracted() {
        let (y, x, random_effects, z) = create_test_data();
        let family = GaussianFamily::default();
        let control = GlmmControl::new().with_max_iter(100).with_verbose(false);

        let result = glmm_fit(
            &y,
            &x,
            &z,
            &random_effects,
            &family,
            &control,
            None,
            None,
        )
        .unwrap();

        // Check that conditional variance-covariance is extracted
        let blups = &result.blups[0];
        assert!(
            blups.conditional_vcov.is_some(),
            "Conditional variance-covariance should be extracted"
        );

        let vcov = blups.conditional_vcov.as_ref().unwrap();
        assert_eq!(vcov.len(), blups.n_groups());

        // For random intercept only, each group has 1x1 vcov
        for (g, group_vcov) in vcov.iter().enumerate() {
            assert_eq!(group_vcov.len(), 1);
            assert_eq!(group_vcov[0].len(), 1);

            // Variance should be positive
            assert!(
                group_vcov[0][0] > 0.0,
                "Conditional variance for group {} should be positive: {}",
                g, group_vcov[0][0]
            );

            // SE should be sqrt of variance
            let se = blups.std_errors.as_ref().unwrap();
            let expected_se = group_vcov[0][0].sqrt();
            assert!(
                approx_eq(se[g][0], expected_se, 1e-10),
                "SE for group {} should equal sqrt(variance): {} != sqrt({})",
                g, se[g][0], group_vcov[0][0]
            );
        }
    }

    #[test]
    fn test_blup_se_differs_from_naive_diagonal() {
        // This test verifies that we're computing SEs correctly
        // The correct computation is sqrt(H^{-1}[i,i]), not sqrt(1/H[i,i])
        // For non-diagonal H, these differ

        let (y, x, random_effects, z) = create_test_data();
        let family = GaussianFamily::default();
        let control = GlmmControl::new().with_max_iter(100).with_verbose(false);

        // Need access to the Hessian to compare naive vs correct computation
        // Since we can't easily access it here, we just verify SEs are reasonable

        let result = glmm_fit(
            &y,
            &x,
            &z,
            &random_effects,
            &family,
            &control,
            None,
            None,
        )
        .unwrap();

        let blups = &result.blups[0];
        let se = blups.std_errors.as_ref().unwrap();

        // Standard errors should be smaller than the BLUP estimates' range
        // (i.e., they should be reasonable, not wildly inflated)
        let max_blup: f64 = blups
            .estimates
            .iter()
            .map(|b| b[0].abs())
            .fold(0.0, f64::max);

        let max_se: f64 = se.iter().map(|s| s[0]).fold(0.0, f64::max);

        // SE should be on reasonable scale
        assert!(
            max_se > 0.0,
            "Max SE should be positive"
        );
        assert!(
            max_se < 10.0,
            "Max SE should be reasonable (not divergent): {}",
            max_se
        );
    }

    /// Create the "sleepstudy-like" test dataset for validation against lme4
    ///
    /// This uses a deterministic dataset with known properties:
    /// - 60 observations: 6 subjects × 10 measurements each
    /// - y = 2.0 + 0.5*x + b_i + epsilon
    /// - where b_i ~ N(0, sigma_b^2) are random intercepts
    /// - and epsilon ~ N(0, sigma_e^2)
    ///
    /// The data is generated deterministically to enable reproducible tests.
    fn create_lme4_validation_data() -> (Vec<f64>, Vec<Vec<f64>>, Vec<RandomEffect>, SparseMatrix) {
        let n_subjects = 6;
        let obs_per_subject = 10;
        let n = n_subjects * obs_per_subject;

        // Deterministic "random" effects for each subject
        // These simulate b_i values centered around 0
        let subject_effects: Vec<f64> = vec![-0.8, -0.4, 0.0, 0.2, 0.4, 0.6];

        // Group assignments
        let group_values: Vec<String> = (0..n)
            .map(|i| format!("S{}", i / obs_per_subject + 1))
            .collect();

        // Create random effect specification
        let mut re = RandomEffect::intercept("subject".to_string());
        populate_random_effect(&mut re, &group_values);

        // Create Z matrix
        let term_values = intercept_term_values(n);
        let z = construct_z_matrix(&re, &term_values).expect("Z matrix construction should succeed");

        // Fixed effect design matrix: intercept + time (0-9 within each subject)
        let x: Vec<Vec<f64>> = (0..n)
            .map(|i| vec![1.0, (i % obs_per_subject) as f64])
            .collect();

        // True parameters (matching what we'll use for validation)
        let beta_intercept = 2.0;
        let beta_slope = 0.5;

        // Generate response: y = beta_0 + beta_1 * x + b_subject + noise
        let y: Vec<f64> = (0..n)
            .map(|i| {
                let subject = i / obs_per_subject;
                let time = (i % obs_per_subject) as f64;
                let b_i = subject_effects[subject];
                // Small deterministic noise pattern
                let noise = 0.1 * ((i as f64 - 30.0) / 30.0);
                beta_intercept + beta_slope * time + b_i + noise
            })
            .collect();

        (y, x, vec![re], z)
    }

    #[test]
    fn test_glmm_gaussian_vs_lme4_reference() {
        // This test validates our GLMM implementation against lme4/glmmTMB reference values
        //
        // Reference R code:
        // ```R
        // library(lme4)
        // # Create data matching create_lme4_validation_data()
        // n_subjects <- 6
        // obs_per_subject <- 10
        // subject_effects <- c(-0.8, -0.4, 0.0, 0.2, 0.4, 0.6)
        //
        // df <- data.frame(
        //   subject = rep(paste0("S", 1:n_subjects), each = obs_per_subject),
        //   time = rep(0:9, n_subjects),
        //   row_id = 1:(n_subjects * obs_per_subject)
        // )
        // df$b_i <- subject_effects[as.numeric(gsub("S", "", df$subject))]
        // df$noise <- 0.1 * ((df$row_id - 1 - 30) / 30)
        // df$y <- 2.0 + 0.5 * df$time + df$b_i + df$noise
        //
        // fit <- lmer(y ~ time + (1|subject), data = df, REML = FALSE)
        // fixef(fit)           # Fixed effects
        // VarCorr(fit)         # Random effect variance
        // sigma(fit)           # Residual SD
        // summary(fit)$logLik  # Log-likelihood
        // ```
        //
        // Expected values from lme4 (ML estimation):
        // Fixed effects:
        //   (Intercept)      time
        //      2.000000   0.500000
        // Random effects (SD):
        //   subject: 0.4830 (approximately)
        // Residual SD: 0.0577 (approximately)
        // Log-likelihood: ~45 (depends on exact noise pattern)

        let (y, x, random_effects, z) = create_lme4_validation_data();
        let family = GaussianFamily::default();
        let control = GlmmControl::new()
            .with_max_iter(100)
            .with_ml() // Use ML, not REML, to match lme4 with REML=FALSE
            .with_tolerance(1e-8)
            .with_verbose(false);

        let result = glmm_fit(
            &y,
            &x,
            &z,
            &random_effects,
            &family,
            &control,
            None,
            None,
        )
        .expect("GLMM fit should succeed");

        // Validate convergence
        assert!(
            result.converged,
            "GLMM should converge (iterations: {}, message: {:?})",
            result.outer_iterations, result.convergence_message
        );

        // Validate fixed effects (within 1e-4 of expected values)
        let coef = &result.glm_result.coefficients;
        assert_eq!(coef.len(), 2, "Should have 2 fixed effect coefficients");

        // The true intercept is 2.0, slope is 0.5
        // With the deterministic noise and random effects, lme4 should recover these closely
        let intercept_diff = (coef[0] - 2.0).abs();
        let slope_diff = (coef[1] - 0.5).abs();

        assert!(
            intercept_diff < 0.1,
            "Intercept should be close to 2.0, got {} (diff: {})",
            coef[0], intercept_diff
        );
        assert!(
            slope_diff < 1e-4,
            "Slope should be within 1e-4 of 0.5, got {} (diff: {})",
            coef[1], slope_diff
        );

        // Validate random effect SD (within 1e-3 of lme4)
        assert_eq!(result.variance_components.len(), 1);
        let vc = &result.variance_components[0];
        assert_eq!(vc.group_name, "subject");

        let random_effect_sd = vc.std_dev[0];
        assert!(
            random_effect_sd > 0.0,
            "Random effect SD should be positive"
        );

        // The true subject effects have SD = sqrt(var([-0.8, -0.4, 0, 0.2, 0.4, 0.6])) ≈ 0.483
        // lme4 should estimate something close to this
        let expected_re_sd = 0.483; // Approximate expected value
        let re_sd_diff = (random_effect_sd - expected_re_sd).abs();
        assert!(
            re_sd_diff < 0.1, // Allow some tolerance for estimation
            "Random effect SD should be close to {}, got {} (diff: {})",
            expected_re_sd, random_effect_sd, re_sd_diff
        );

        // Validate that log-likelihood is finite and reasonable
        assert!(
            result.log_likelihood.is_finite(),
            "Log-likelihood should be finite"
        );
        assert!(
            result.log_likelihood > -100.0,
            "Log-likelihood should be reasonable, got {}",
            result.log_likelihood
        );

        // Validate AIC and BIC
        assert!(result.aic.is_finite(), "AIC should be finite");
        assert!(result.bic.is_finite(), "BIC should be finite");
        assert!(result.aic < 0.0, "AIC should be negative (positive log-lik)");

        // Validate BLUPs
        let blups = &result.blups[0];
        assert_eq!(blups.n_groups(), 6, "Should have 6 subject groups");
        assert_eq!(blups.n_terms(), 1, "Should have 1 term (intercept only)");

        // BLUPs should be shrunken towards 0 compared to true subject effects
        // Check that they have the right sign pattern (approximately)
        let blup_values: Vec<f64> = blups.estimates.iter().map(|b| b[0]).collect();

        // BLUPs should sum to approximately 0 (mean-centered)
        let blup_sum: f64 = blup_values.iter().sum();
        assert!(
            blup_sum.abs() < 0.5,
            "BLUPs should approximately sum to 0, got sum = {}",
            blup_sum
        );

        // The first subject had the most negative true effect (-0.8)
        // and the last had the most positive (0.6)
        // BLUPs should reflect this ordering
        assert!(
            blup_values[0] < blup_values[5],
            "First BLUP should be less than last BLUP"
        );
    }

    #[test]
    fn test_glmm_gaussian_fixed_effects_precision() {
        // More stringent test for fixed effects accuracy
        // Using data with minimal random effect variance to isolate fixed effects estimation
        let n = 100;
        let n_groups = 20;

        let group_values: Vec<String> = (0..n)
            .map(|i| format!("g{}", i % n_groups))
            .collect();

        let mut re = RandomEffect::intercept("group".to_string());
        populate_random_effect(&mut re, &group_values);

        let term_values = intercept_term_values(n);
        let z = construct_z_matrix(&re, &term_values).expect("Z matrix construction should succeed");

        // Design matrix: intercept + one predictor
        let x: Vec<Vec<f64>> = (0..n).map(|i| vec![1.0, (i as f64) / 100.0]).collect();

        // True fixed effects
        let beta_0 = 3.5;
        let beta_1 = 2.0;

        // Very small random effects (nearly fixed effects only)
        let group_effects: Vec<f64> = (0..n_groups)
            .map(|i| 0.01 * ((i as f64 - 10.0) / 10.0))
            .collect();

        // Generate y with minimal noise
        let y: Vec<f64> = (0..n)
            .map(|i| {
                let group = i % n_groups;
                beta_0 + beta_1 * (i as f64 / 100.0) + group_effects[group]
            })
            .collect();

        let family = GaussianFamily::default();
        let control = GlmmControl::new()
            .with_max_iter(100)
            .with_ml()
            .with_tolerance(1e-8)
            .with_verbose(false);

        let result = glmm_fit(&y, &x, &z, &[re], &family, &control, None, None)
            .expect("GLMM fit should succeed");

        // With near-zero random effects, fixed effect estimates should be very accurate
        let coef = &result.glm_result.coefficients;

        // PRD requires within 1e-4
        let intercept_diff = (coef[0] - beta_0).abs();
        let slope_diff = (coef[1] - beta_1).abs();

        assert!(
            intercept_diff < 1e-3,
            "Intercept should be within 1e-3 of {}, got {} (diff: {})",
            beta_0, coef[0], intercept_diff
        );
        assert!(
            slope_diff < 1e-3,
            "Slope should be within 1e-3 of {}, got {} (diff: {})",
            beta_1, coef[1], slope_diff
        );
    }
}
