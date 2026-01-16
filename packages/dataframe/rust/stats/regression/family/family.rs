//! GLM Family functions and link functions
//!
//! This module provides Rust implementations of R's GLM family functions,
//! including binomial, gaussian, poisson, gamma, and inverse gaussian families
//! with their associated link functions and variance functions.
//!
//! ## Architecture
//!
//! The module is organized into focused components:
//!
//! - **`binomial`**: Binomial family with logit, probit, cauchit, log, and cloglog links
//! - **`gaussian`**: Gaussian family with identity, log, and inverse links
//! - **`poisson`**: Poisson family with log, identity, and sqrt links
//! - **`gamma`**: Gamma family with inverse and identity links
//! - **`inverse_gaussian`**: Inverse Gaussian family with 1/mu², log, identity, and inverse links
//! - **`quasi`**: Quasi family for custom variance and link functions
//! - **`links`**: Common link functions and their derivatives
//! - **`variance`**: Variance functions for each family
//! - **`deviance`**: Deviance residual functions
//!
//! ## Usage Example
//!
//! ```rust
//! use tidy_ts::stats::regression::family::{BinomialFamily, LinkFunction};
//!
//! let family = BinomialFamily::new(LinkFunction::Logit);
//! let mu = vec![0.1, 0.5, 0.9];
//! let eta = family.link(&mu)?;
//! let mu_back = family.link_inverse(&eta)?;
//! ```

use serde::{Deserialize, Serialize};
use std::f64;

// Re-export main types for convenience
pub use binomial::BinomialFamily;
pub use deviance::DevianceFunction;
pub use gamma::GammaFamily;
pub use gaussian::GaussianFamily;
pub use inverse_gaussian::InverseGaussianFamily;
pub use links::{LinkFunction, LinkFunctionType};
pub use poisson::PoissonFamily;
pub use quasi::QuasiFamily;
pub use variance::VarianceFunction;

// Re-export the trait from mod.rs
pub use super::GlmFamily;

// Module declarations
pub mod binomial;
pub mod deviance;
pub mod gamma;
pub mod gaussian;
pub mod inverse_gaussian;
pub mod links;
pub mod poisson;
pub mod quasi;
pub mod variance;

/// Constants for numerical stability
pub const THRESH: f64 = 30.0;
pub const MTHRESH: f64 = -30.0;
pub const INVEPS: f64 = 1.0 / f64::EPSILON;

/// Helper function to evaluate x/(1 - x) with bounds checking
///
/// # Arguments
/// * `x` - Input in the range (0, 1)
///
/// # Returns
/// * `x/(1 - x)`
///
/// # Errors
/// * Returns error if x is not in (0, 1)
pub fn x_d_omx(x: f64) -> Result<f64, &'static str> {
    if x < 0.0 || x > 1.0 {
        return Err("Value out of range (0, 1)");
    }
    Ok(x / (1.0 - x))
}

/// Helper function to evaluate x/(1 + x)
///
/// # Arguments
/// * `x` - Input value
///
/// # Returns
/// * `x/(1 + x)`
pub fn x_d_opx(x: f64) -> f64 {
    x / (1.0 + x)
}

/// Helper function for y * log(y/mu) with special case for y = 0
///
/// # Arguments
/// * `y` - Response value
/// * `mu` - Fitted value
///
/// # Returns
/// * `y * log(y/mu)` or 0 if y = 0
pub fn y_log_y(y: f64, mu: f64) -> f64 {
    if y != 0.0 { y * (y / mu).ln() } else { 0.0 }
}

/// Helper function to compute deviance residuals
///
/// # Arguments
/// * `y` - Response values
/// * `mu` - Fitted values
/// * `weights` - Observation weights
///
/// # Returns
/// * Vector of deviance residuals
pub fn deviance_residuals(
    y: &[f64],
    mu: &[f64],
    weights: &[f64],
    deviance_fn: &dyn DevianceFunction,
) -> Result<Vec<f64>, &'static str> {
    if y.len() != mu.len() {
        return Err("y and mu must have the same length");
    }
    if weights.len() != y.len() && weights.len() != 1 {
        return Err("weights must have length 1 or same as y");
    }

    let mut residuals = Vec::with_capacity(y.len());

    for i in 0..y.len() {
        let weight = if weights.len() == 1 {
            weights[0]
        } else {
            weights[i]
        };
        let dev_resid = deviance_fn.deviance_residual(y[i], mu[i], weight)?;
        residuals.push(dev_resid);
    }

    Ok(residuals)
}

/// Helper function to compute working weights
///
/// # Arguments
/// * `eta` - Linear predictors
/// * `mu` - Fitted values
/// * `weights` - Observation weights
/// * `variance_fn` - Variance function
/// * `link_fn` - Link function
///
/// # Returns
/// * Vector of working weights
pub fn working_weights(
    eta: &[f64],
    mu: &[f64],
    weights: &[f64],
    variance_fn: &dyn VarianceFunction,
    link_fn: &dyn LinkFunction,
) -> Result<Vec<f64>, &'static str> {
    if eta.len() != mu.len() {
        return Err("eta and mu must have the same length");
    }
    if weights.len() != eta.len() && weights.len() != 1 {
        return Err("weights must have length 1 or same as eta");
    }

    let mut working_wts = Vec::with_capacity(eta.len());

    for i in 0..eta.len() {
        let weight = if weights.len() == 1 {
            weights[0]
        } else {
            weights[i]
        };
        let variance = variance_fn.variance(mu[i])?;
        let mu_eta = link_fn.mu_eta(eta[i])?;
        let working_wt = weight / (variance * mu_eta * mu_eta);
        working_wts.push(working_wt);
    }

    Ok(working_wts)
}

/// Helper function to compute working residuals
///
/// # Arguments
/// * `y` - Response values
/// * `mu` - Fitted values
/// * `eta` - Linear predictors
/// * `link_fn` - Link function
///
/// # Returns
/// * Vector of working residuals
pub fn working_residuals(
    y: &[f64],
    mu: &[f64],
    eta: &[f64],
    link_fn: &dyn LinkFunction,
) -> Result<Vec<f64>, &'static str> {
    if y.len() != mu.len() || mu.len() != eta.len() {
        return Err("y, mu, and eta must have the same length");
    }

    let mut residuals = Vec::with_capacity(y.len());

    for i in 0..y.len() {
        let mu_eta = link_fn.mu_eta(eta[i])?;
        let working_resid = (y[i] - mu[i]) * mu_eta;
        residuals.push(working_resid);
    }

    Ok(residuals)
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::stats::regression::family::binomial::BinomialFamily;
    use crate::stats::regression::family::links::LinkFunction;

    #[test]
    fn test_x_d_omx() {
        assert_eq!(x_d_omx(0.5).unwrap(), 1.0);
        assert_eq!(x_d_omx(0.25).unwrap(), 1.0 / 3.0);
        assert!(x_d_omx(1.0).is_err());
        assert!(x_d_omx(-0.1).is_err());
    }

    #[test]
    fn test_x_d_opx() {
        assert_eq!(x_d_opx(1.0), 0.5);
        assert_eq!(x_d_opx(0.0), 0.0);
        assert_eq!(x_d_opx(2.0), 2.0 / 3.0);
    }

    #[test]
    fn test_y_log_y() {
        assert_eq!(y_log_y(0.0, 0.5), 0.0);
        assert!((y_log_y(1.0, 0.5) - 1.0 * (1.0 / 0.5).ln()).abs() < 1e-10);
    }

    #[test]
    fn test_binomial_family() {
        let family = BinomialFamily::new(LinkFunction::Logit);
        assert_eq!(family.name(), "binomial");

        let mu = vec![0.1, 0.5, 0.9];
        assert!(family.valid_mu(&mu).is_ok());

        let y = vec![0.0, 1.0, 1.0];
        assert!(family.valid_y(&y).is_ok());
    }
}
