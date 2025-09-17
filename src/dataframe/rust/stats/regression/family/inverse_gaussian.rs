//! Inverse Gaussian family for GLM
//!
//! This module provides the inverse gaussian family implementation with various link functions
//! including 1/mu², log, identity, and inverse links.

use super::{
    DevianceFunction, GlmFamily, InverseGaussianDeviance, InverseGaussianVariance, LinkFunction,
    VarianceFunction,
};
use serde::{Deserialize, Serialize};

/// Inverse Gaussian family with specified link function
pub struct InverseGaussianFamily {
    link: Box<dyn LinkFunction>,
}

impl InverseGaussianFamily {
    /// Create a new inverse gaussian family with the specified link function
    pub fn new(link: impl LinkFunction + 'static) -> Self {
        Self {
            link: Box::new(link),
        }
    }

    /// Create an inverse gaussian family with 1/mu² link (default)
    pub fn mu_squared() -> Self {
        Self::new(InverseMuSquaredLink)
    }

    /// Create an inverse gaussian family with log link
    pub fn log() -> Self {
        Self::new(super::links::LogLink)
    }

    /// Create an inverse gaussian family with identity link
    pub fn identity() -> Self {
        Self::new(super::links::IdentityLink)
    }

    /// Create an inverse gaussian family with inverse link
    pub fn inverse() -> Self {
        Self::new(super::links::InverseLink)
    }
}

impl std::fmt::Debug for InverseGaussianFamily {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.debug_struct("InverseGaussianFamily")
            .field("link", &"<dyn LinkFunction>")
            .finish()
    }
}

impl GlmFamily for InverseGaussianFamily {
    fn name(&self) -> &'static str {
        "inverse_gaussian"
    }

    fn link(&self) -> &dyn LinkFunction {
        self.link.as_ref()
    }

    fn variance(&self) -> &dyn VarianceFunction {
        &InverseGaussianVariance
    }

    fn deviance(&self) -> &dyn DevianceFunction {
        &InverseGaussianDeviance
    }

    fn valid_mu(&self, mu: &[f64]) -> Result<(), &'static str> {
        for &m in mu {
            if m.is_nan() || m <= 0.0 {
                return Err("mu must be positive for inverse gaussian family");
            }
        }
        Ok(())
    }

    fn valid_y(&self, y: &[f64]) -> Result<(), &'static str> {
        for &yi in y {
            if yi.is_nan() || yi <= 0.0 {
                return Err("y must be positive for inverse gaussian family");
            }
        }
        Ok(())
    }

    fn initialize(&self, y: &[f64], mu: &mut [f64], weights: &mut [f64]) -> Result<(), String> {
        if y.len() != mu.len() {
            return Err("y and mu must have the same length".to_string());
        }
        if weights.len() != y.len() && weights.len() != 1 {
            return Err("weights must have length 1 or same as y".to_string());
        }

        for i in 0..y.len() {
            let yi = y[i];
            let weight = if weights.len() == 1 {
                weights[0]
            } else {
                weights[i]
            };

            // Initialize mu based on y and weights
            let mu_init = if weight > 0.0 && yi > 0.0 { yi } else { 1.0 };

            mu[i] = mu_init;
        }

        Ok(())
    }

    fn aic(&self) -> Box<dyn Fn(&[f64], &[f64], &[f64], f64) -> f64 + '_> {
        Box::new(|y, mu, weights, dev| self.aic_calc(y, mu, weights, dev))
    }

    fn dispersion(&self) -> Option<f64> {
        None // Inverse Gaussian family has no dispersion parameter
    }

    fn aic_calc(&self, y: &[f64], mu: &[f64], weights: &[f64], _dev: f64) -> f64 {
        // AIC = -2 * log-likelihood + 2 * df
        // For inverse gaussian: -2 * sum(w * (-0.5 * (y-mu)^2 / (y*mu^2))) + 2 * df
        let mut log_lik = 0.0;

        for i in 0..y.len() {
            let yi = y[i];
            let mui = mu[i];
            let weight = if weights.len() == 1 {
                weights[0]
            } else {
                weights[i]
            };

            if weight > 0.0 && yi > 0.0 && mui > 0.0 {
                let term = -0.5 * (yi - mui).powi(2) / (yi * mui * mui);
                log_lik += weight * term;
            }
        }

        -2.0 * log_lik + 2.0 * (y.len() as f64)
    }
}

/// 1/mu² link function for inverse gaussian family
#[derive(Debug, Clone)]
pub struct InverseMuSquaredLink;

impl LinkFunction for InverseMuSquaredLink {
    fn link(&self, mu: f64) -> Result<f64, &'static str> {
        if mu <= 0.0 {
            return Err("mu must be positive for 1/mu² link");
        }
        Ok(1.0 / (mu * mu))
    }

    fn link_inverse(&self, eta: f64) -> Result<f64, &'static str> {
        if eta <= 0.0 {
            return Err("eta must be positive for 1/mu² link");
        }
        Ok(1.0 / eta.sqrt())
    }

    fn mu_eta(&self, eta: f64) -> Result<f64, &'static str> {
        if eta <= 0.0 {
            return Err("eta must be positive for 1/mu² link");
        }
        Ok(-0.5 * eta.powf(-1.5))
    }

    fn name(&self) -> &'static str {
        "1/mu²"
    }

    fn valid_mu(&self, mu: f64) -> bool {
        mu > 0.0
    }

    fn valid_eta(&self, eta: f64) -> bool {
        eta > 0.0
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::stats::regression::family::links::LogLink;

    #[test]
    fn test_inverse_gaussian_family_creation() {
        let family = InverseGaussianFamily::mu_squared();
        assert_eq!(family.name(), "inverse_gaussian");
    }

    #[test]
    fn test_inverse_gaussian_family_validation() {
        let family = InverseGaussianFamily::mu_squared();

        // Valid mu
        assert!(family.valid_mu(&[1.0, 2.5, 10.0]).is_ok());

        // Invalid mu
        assert!(family.valid_mu(&[0.0, 2.0]).is_err());
        assert!(family.valid_mu(&[-1.0, 2.0]).is_err());

        // Valid y
        assert!(family.valid_y(&[1.0, 2.5, 10.0]).is_ok());

        // Invalid y
        assert!(family.valid_y(&[0.0, 2.0]).is_err());
        assert!(family.valid_y(&[-1.0, 2.0]).is_err());
    }

    #[test]
    fn test_inverse_mu_squared_link() {
        let link = InverseMuSquaredLink;

        assert_eq!(link.link(2.0).unwrap(), 0.25);
        assert_eq!(link.link_inverse(4.0).unwrap(), 0.5);
        assert_eq!(link.mu_eta(4.0).unwrap(), -0.0625);
    }
}
