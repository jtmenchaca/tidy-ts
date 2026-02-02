//! Data likelihood computation for GLMMs
//!
//! This module computes the data log-likelihood for different GLM families.
//! It addresses Issue 1 from glmm_to_be_fixed.md by using proper distribution
//! functions (dnorm, dpois, dbinom) instead of deviance.
//!
//! # glmmTMB Reference
//!
//! See glmmTMB.cpp lines 961-1178 for the observation likelihood switch statement.
//! Key differences from deviance-based approach:
//! - Gaussian: dnorm(y, mu, phi, log=TRUE) where phi is the residual SD
//! - Poisson: dpois(y, mu, log=TRUE)
//! - Binomial: dbinom_robust(y, n, logit(p), log=TRUE)
//! - Negative Binomial: dnbinom_robust(y, log(mu), log(var-mu), log=TRUE)

use crate::stats::distributions::binomial::dbinom;
use crate::stats::distributions::negative_binomial::dnbinom;
use crate::stats::distributions::normal::dnorm;
use crate::stats::distributions::poisson::dpois;
use crate::stats::regression::family::GlmFamily;

use super::super::random_effects::SparseMatrix;
use super::super::random_effects_likelihood::log_random_effects_prior_value;
use super::super::types::RandomEffect;

/// Compute proper data log-likelihood using distribution functions
///
/// This uses the actual log-likelihood (not deviance) for accurate GLMM optimization.
/// Matches glmmTMB.cpp observation likelihood computation.
///
/// # Families Supported
///
/// - **Gaussian**: `sum(dnorm(y[i], mu[i], sigma, log=TRUE))`
///   - sigma is the residual standard deviation (phi in glmmTMB)
/// - **Poisson**: `sum(dpois(y[i], mu[i], log=TRUE))`
/// - **Binomial**: `sum(dbinom(y[i]*n[i], n[i], mu[i], log=TRUE))`
///   - weights represents the number of trials
/// - **Negative Binomial**: `sum(dnbinom(y[i], size, prob, log=TRUE))`
///   - NB2 parameterization: Var(Y) = mu + mu²/size
///
/// # Arguments
/// * `y` - Response vector
/// * `mu` - Fitted values (mean on response scale)
/// * `weights` - Observation weights (for binomial, this is n)
/// * `family` - GLM family
/// * `sigma` - Residual standard deviation (only used for Gaussian)
///
/// # Returns
/// Data log-likelihood value (sum over all observations)
pub fn compute_data_log_likelihood(
    y: &[f64],
    mu: &[f64],
    weights: &[f64],
    family: &dyn GlmFamily,
    sigma: f64,
) -> f64 {
    let n = y.len();
    let family_name = family.name();

    // Validate sigma for Gaussian
    let sigma = if sigma <= 0.0 || !sigma.is_finite() {
        1.0 // Fallback to default
    } else {
        sigma
    };

    match family_name {
        "gaussian" => {
            // Gaussian: sum(dnorm(y[i], mu[i], sigma, log=TRUE))
            // glmmTMB.cpp:965: tmp_loglik = dnorm(yobs(i), mu(i), phi(i), true);
            let mut ll = 0.0;
            for i in 0..n {
                if mu[i].is_finite() && y[i].is_finite() {
                    ll += weights[i] * dnorm(y[i], mu[i], sigma, true);
                } else {
                    return f64::NEG_INFINITY;
                }
            }
            ll
        }
        "poisson" => {
            // Poisson: sum(dpois(y[i], mu[i], log=TRUE))
            // glmmTMB.cpp:976: tmp_loglik = dpois(yobs(i), mu(i), true);
            let mut ll = 0.0;
            for i in 0..n {
                if mu[i] > 0.0 && mu[i].is_finite() && y[i] >= 0.0 {
                    ll += weights[i] * dpois(y[i], mu[i], true);
                } else {
                    return f64::NEG_INFINITY;
                }
            }
            ll
        }
        "binomial" => {
            // Binomial: sum(dbinom(y[i]*n[i], n[i], mu[i], log=TRUE))
            // glmmTMB.cpp:979-981 uses dbinom_robust with logit(p)
            // weights represents the number of trials
            let mut ll = 0.0;
            for i in 0..n {
                let trials = weights[i];
                let successes = (y[i] * trials).round();
                // mu must be in (0, 1) for binomial probability
                if trials > 0.0 && mu[i] > 0.0 && mu[i] < 1.0 {
                    ll += dbinom(successes, trials, mu[i], true);
                } else if trials > 0.0 {
                    // Edge case: mu at boundary
                    if mu[i] <= 0.0 && successes > 0.0 {
                        return f64::NEG_INFINITY;
                    } else if mu[i] >= 1.0 && successes < trials {
                        return f64::NEG_INFINITY;
                    }
                    // Otherwise valid edge case (all successes or all failures)
                }
            }
            ll
        }
        "nbinom2" | "negative.binomial" => {
            // Negative Binomial (NB2 parameterization):
            // glmmTMB.cpp:1066-1070 uses dnbinom_robust
            // For NB2: Var(Y) = mu + mu²/size
            let size = family.dispersion().unwrap_or(1.0);
            let mut ll = 0.0;
            for i in 0..n {
                if mu[i] > 0.0 && mu[i].is_finite() && y[i] >= 0.0 {
                    // Convert to R's parameterization: size, prob
                    // prob = size / (size + mu)
                    let prob = size / (size + mu[i]);
                    ll += weights[i] * dnbinom(y[i], size, prob, true);
                } else {
                    return f64::NEG_INFINITY;
                }
            }
            ll
        }
        _ => {
            // Fallback: use -0.5 * deviance for unsupported families
            // This is the old behavior and should be avoided if possible
            let deviance_fn = family.deviance();
            let dev = deviance_fn.deviance(y, mu, weights).unwrap_or(f64::INFINITY);
            -0.5 * dev
        }
    }
}

/// Compute the joint log-likelihood: log p(y | b, β, θ) + log p(b | θ)
///
/// This is the core function for Laplace approximation. The joint likelihood
/// combines the data likelihood with the random effects prior.
///
/// # Arguments
/// * `y` - Response vector
/// * `x` - Fixed effects design matrix (row-major, n × p)
/// * `z` - Random effects design matrix (sparse)
/// * `beta` - Fixed effect coefficients
/// * `b` - Random effect coefficients (BLUPs)
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
    // Default sigma = 1.0 for backward compatibility
    joint_log_likelihood_with_sigma(
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
        1.0,
    )
}

/// Compute the joint log-likelihood with explicit sigma parameter
///
/// This version allows specifying the residual standard deviation for Gaussian family.
/// For non-Gaussian families, sigma is ignored.
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
/// * `sigma` - Residual standard deviation (for Gaussian family)
///
/// # Returns
/// Joint log-likelihood value
pub fn joint_log_likelihood_with_sigma(
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

    // Compute data log-likelihood using proper distribution functions
    let data_ll = compute_data_log_likelihood(y, &mu, weights, family, sigma);

    // Random effects log-prior: log p(b | θ)
    let prior_ll = log_random_effects_prior_value(b, theta, random_effects);

    data_ll + prior_ll
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
    fn test_joint_log_likelihood_gaussian() {
        let (y, x, re, z) = create_test_data();
        let family = GaussianFamily::default();

        let beta = vec![1.0, 0.5];
        let b = vec![0.0, 0.0, 0.0, 0.0];
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

        assert!(ll.is_finite(), "Log-likelihood should be finite: {}", ll);
        assert!(ll < 0.0, "Log-likelihood should be negative: {}", ll);
    }

    #[test]
    fn test_data_log_likelihood_gaussian() {
        let y = vec![1.0, 2.0, 3.0];
        let mu = vec![1.1, 1.9, 3.1];
        let weights = vec![1.0, 1.0, 1.0];
        let family = GaussianFamily::default();
        let sigma = 1.0;

        let ll = compute_data_log_likelihood(&y, &mu, &weights, &family, sigma);

        // Should be finite and negative
        assert!(ll.is_finite());
        assert!(ll < 0.0);

        // Should be close to sum of individual dnorm values
        let expected: f64 = y
            .iter()
            .zip(mu.iter())
            .map(|(&yi, &mui)| dnorm(yi, mui, sigma, true))
            .sum();
        assert!((ll - expected).abs() < 1e-10);
    }

    #[test]
    fn test_data_log_likelihood_invalid_mu() {
        let y = vec![1.0, 2.0, 3.0];
        let mu = vec![1.0, f64::NAN, 3.0]; // Invalid mu
        let weights = vec![1.0, 1.0, 1.0];
        let family = GaussianFamily::default();

        let ll = compute_data_log_likelihood(&y, &mu, &weights, &family, 1.0);
        assert_eq!(ll, f64::NEG_INFINITY);
    }
}
