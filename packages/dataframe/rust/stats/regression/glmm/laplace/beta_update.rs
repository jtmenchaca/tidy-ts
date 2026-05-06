//! Fixed effects update for GLMM
//!
//! This module provides IRLS-based update of fixed effects given current
//! random effects estimates.

use crate::stats::regression::family::GlmFamily;

use super::super::random_effects::SparseMatrix;
use crate::stats::linalg::solve_linear_system;

/// Update fixed effects beta given current random effects b
///
/// For Gaussian family with identity link, this is a single WLS step.
/// For other families, runs a few IRLS iterations.
///
/// Uses working response: z* = η + (y - μ) / (dμ/dη)
/// And working weights: w* = weights * (dμ/dη)² / V(μ)
///
/// Then solves: X^T W X * beta = X^T W (z* - Z*b - offset)
///
/// # Arguments
/// * `y` - Response vector
/// * `x` - Fixed effects design matrix
/// * `z` - Random effects design matrix (sparse)
/// * `b` - Current random effect coefficients
/// * `beta_init` - Initial fixed effect estimates
/// * `family` - GLM family
/// * `weights` - Observation weights
/// * `offset` - Offset vector
///
/// # Returns
/// Updated fixed effects, or None if computation fails
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

#[cfg(test)]
mod tests {
    use super::*;
    use crate::stats::regression::family::GaussianFamily;
    use crate::stats::regression::glmm::random_effects::{
        construct_z_matrix, intercept_term_values, populate_random_effect,
    };
    use crate::stats::regression::glmm::types::RandomEffect;

    fn create_test_data() -> (Vec<f64>, Vec<Vec<f64>>, SparseMatrix) {
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

        let beta_true = vec![1.0, 0.5];
        let b_true = vec![0.5, -0.3, 0.2, -0.4];
        let zb = z.mul_vec(&b_true);

        let y: Vec<f64> = (0..n)
            .map(|i| {
                let x_beta: f64 = x[i]
                    .iter()
                    .zip(beta_true.iter())
                    .map(|(xij, bj)| xij * bj)
                    .sum();
                x_beta + zb[i] + 0.1 * (i as f64 - 10.0) * 0.01
            })
            .collect();

        (y, x, z)
    }

    #[test]
    fn test_update_beta_gaussian() {
        let (y, x, z) = create_test_data();
        let family = GaussianFamily::default();

        let b = vec![0.5, -0.3, 0.2, -0.4];
        let beta_init = vec![0.0, 0.0];

        let weights = vec![1.0; y.len()];
        let offset = vec![0.0; y.len()];

        let beta = update_beta(&y, &x, &z, &b, &beta_init, &family, &weights, &offset);

        assert!(beta.is_some());
        let beta = beta.unwrap();

        // Beta should be close to true values
        assert!((beta[0] - 1.0).abs() < 0.1, "Intercept should be ~1.0");
        assert!((beta[1] - 0.5).abs() < 0.1, "Slope should be ~0.5");
    }
}
