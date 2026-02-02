//! REML adjustment for GLMMs
//!
//! This module computes the REML (Restricted Maximum Likelihood) adjustment
//! for variance component estimation.
//!
//! # Background
//!
//! REML estimation accounts for the degrees of freedom lost from estimating
//! fixed effects. The REML criterion is:
//!
//! ```text
//! log p_REML(y | θ) = log p_ML(y | θ) + 0.5 * log|X'WX|
//! ```
//!
//! where W is the matrix of IRLS weights.
//!
//! # Issue 5 from glmm_to_be_fixed.md
//!
//! The REML adjustment formula needs verification against lme4/glmmTMB.
//! In glmmTMB, REML is handled in the R wrapper, not the TMB template.

use crate::stats::regression::family::GlmFamily;

use super::super::random_effects::SparseMatrix;
use super::linear_algebra::log_determinant;

/// Compute the weighted information matrix X'WX for REML adjustment
///
/// For REML estimation, we need to account for the degrees of freedom lost
/// from estimating fixed effects.
///
/// # Arguments
/// * `y` - Response vector (unused, but needed for consistency)
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
#[allow(clippy::too_many_arguments)]
pub fn compute_weighted_xtx(
    _y: &[f64],
    x: &[Vec<f64>],
    z: &SparseMatrix,
    beta: &[f64],
    b: &[f64],
    family: &dyn GlmFamily,
    weights: &[f64],
    offset: &[f64],
) -> Option<Vec<Vec<f64>>> {
    let n = x.len();
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
/// # Arguments
/// * `y` - Response vector
/// * `x` - Fixed effects design matrix
/// * `z` - Random effects design matrix
/// * `beta` - Fixed effect coefficients
/// * `b` - Random effect coefficients
/// * `family` - GLM family
/// * `weights` - Observation weights
/// * `offset` - Offset vector
///
/// # Returns
/// The REML adjustment 0.5 * log|X'WX|, or None if X'WX is not positive definite
#[allow(clippy::too_many_arguments)]
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

        let y: Vec<f64> = (0..n).map(|i| 1.0 + 0.5 * (i as f64 * 0.1)).collect();

        (y, x, z)
    }

    #[test]
    fn test_compute_weighted_xtx() {
        let (y, x, z) = create_test_data();
        let family = GaussianFamily::default();

        let beta = vec![1.0, 0.5];
        let b = vec![0.0, 0.0, 0.0, 0.0];

        let weights = vec![1.0; y.len()];
        let offset = vec![0.0; y.len()];

        let xtw_x = compute_weighted_xtx(&y, &x, &z, &beta, &b, &family, &weights, &offset);

        assert!(xtw_x.is_some());
        let xtw_x = xtw_x.unwrap();

        // Should be 2x2 symmetric matrix
        assert_eq!(xtw_x.len(), 2);
        assert_eq!(xtw_x[0].len(), 2);
        assert!((xtw_x[0][1] - xtw_x[1][0]).abs() < 1e-10);
    }

    #[test]
    fn test_compute_reml_adjustment() {
        let (y, x, z) = create_test_data();
        let family = GaussianFamily::default();

        let beta = vec![1.0, 0.5];
        let b = vec![0.0, 0.0, 0.0, 0.0];

        let weights = vec![1.0; y.len()];
        let offset = vec![0.0; y.len()];

        let reml_adj = compute_reml_adjustment(&y, &x, &z, &beta, &b, &family, &weights, &offset);

        assert!(reml_adj.is_some());
        let reml_adj = reml_adj.unwrap();

        // REML adjustment should be finite
        assert!(reml_adj.is_finite());
    }
}
