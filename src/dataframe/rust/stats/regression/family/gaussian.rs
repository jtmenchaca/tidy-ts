//! Gaussian family for GLM
//!
//! This module provides the gaussian family implementation with various link functions
//! including identity, log, and inverse links.

use super::{
    DevianceFunction, GaussianDeviance, GaussianVariance, GlmFamily, LinkFunction, VarianceFunction,
};
use crate::stats::regression::glm::glm_aic::calculate_gaussian_aic;

/// Gaussian family with specified link function
pub struct GaussianFamily {
    link: Box<dyn LinkFunction>,
}

impl Clone for GaussianFamily {
    fn clone(&self) -> Self {
        Self {
            link: self.link.clone_box(),
        }
    }
}

impl GaussianFamily {
    /// Create a new gaussian family with the specified link function
    pub fn new(link: impl LinkFunction + 'static) -> Self {
        Self {
            link: Box::new(link),
        }
    }

    /// Create a gaussian family with identity link (default)
    pub fn identity() -> Self {
        Self::new(super::links::IdentityLink)
    }

    /// Create a gaussian family with log link
    pub fn log() -> Self {
        Self::new(super::links::LogLink)
    }

    /// Create a gaussian family with inverse link
    pub fn inverse() -> Self {
        Self::new(super::links::InverseLink)
    }
}

impl std::fmt::Debug for GaussianFamily {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.debug_struct("GaussianFamily")
            .field("link", &"<dyn LinkFunction>")
            .finish()
    }
}

impl GlmFamily for GaussianFamily {
    fn name(&self) -> &'static str {
        "gaussian"
    }

    fn link(&self) -> &dyn LinkFunction {
        self.link.as_ref()
    }

    fn variance(&self) -> &dyn VarianceFunction {
        &GaussianVariance
    }

    fn deviance(&self) -> &dyn DevianceFunction {
        &GaussianDeviance
    }

    fn valid_mu(&self, _mu: &[f64]) -> Result<(), &'static str> {
        // Gaussian family accepts any real values
        Ok(())
    }

    fn valid_y(&self, _y: &[f64]) -> Result<(), &'static str> {
        // Gaussian family accepts any real values
        Ok(())
    }

    fn initialize(&self, y: &[f64], mu: &mut [f64], weights: &mut [f64]) -> Result<(), String> {
        if y.len() != mu.len() {
            return Err("y and mu must have the same length".to_string());
        }
        if weights.len() != y.len() && weights.len() != 1 {
            return Err("weights must have length 1 or same as y".to_string());
        }

        // For gaussian family, initialize mu = y
        for i in 0..y.len() {
            mu[i] = y[i];
        }

        Ok(())
    }

    fn aic(&self) -> Box<dyn Fn(&[f64], &[f64], &[f64], f64) -> f64 + '_> {
        Box::new(|y, mu, weights, dev| self.aic_calc(y, mu, weights, dev))
    }

    fn dispersion(&self) -> Option<f64> {
        None // Gaussian family has no dispersion parameter
    }

    fn aic_calc(&self, y: &[f64], mu: &[f64], weights: &[f64], dev: f64) -> f64 {
        calculate_gaussian_aic(y, mu, weights, dev)
    }

    fn clone_box(&self) -> Box<dyn GlmFamily> {
        Box::new(GaussianFamily {
            link: self.link.clone_box(),
        })
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::stats::regression::family::links::IdentityLink;

    #[test]
    fn test_gaussian_family_creation() {
        let family = GaussianFamily::identity();
        assert_eq!(family.name(), "gaussian");
    }

    #[test]
    fn test_gaussian_family_validation() {
        let family = GaussianFamily::identity();

        // Gaussian family accepts any values
        assert!(family.valid_mu(&[1.0, -5.0, 100.0]).is_ok());
        assert!(family.valid_y(&[1.0, -5.0, 100.0]).is_ok());
    }

    #[test]
    fn test_gaussian_family_initialization() {
        let family = GaussianFamily::identity();
        let y = vec![1.0, 2.0, 3.0];
        let mut mu = vec![0.0; y.len()];
        let mut weights = vec![1.0, 1.0, 1.0];

        family.initialize(&y, &mut mu, &mut weights).unwrap();
        assert_eq!(mu, y);
    }
}
