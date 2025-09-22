//! Gamma family for GLM
//!
//! This module provides the gamma family implementation with various link functions
//! including inverse, log, and identity links.

use super::{
    DevianceFunction, GammaDeviance, GammaVariance, GlmFamily, LinkFunction, VarianceFunction,
};
use crate::stats::regression::glm::glm_aic::calculate_gamma_aic;

/// Gamma family with specified link function
pub struct GammaFamily {
    link: Box<dyn LinkFunction>,
}

impl Clone for GammaFamily {
    fn clone(&self) -> Self {
        Self {
            link: self.link.clone_box(),
        }
    }
}

impl GammaFamily {
    /// Create a new gamma family with the specified link function
    pub fn new(link: impl LinkFunction + 'static) -> Self {
        Self {
            link: Box::new(link),
        }
    }

    /// Create a gamma family with inverse link (default)
    pub fn inverse() -> Self {
        Self::new(super::links::InverseLink)
    }

    // /// Create a gamma family with log link
    // pub fn log() -> Self {
    //     Self::new(super::links::LogLink)
    // }

    /// Create a gamma family with identity link
    pub fn identity() -> Self {
        Self::new(super::links::IdentityLink)
    }
}

impl std::fmt::Debug for GammaFamily {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.debug_struct("GammaFamily")
            .field("link", &"<dyn LinkFunction>")
            .finish()
    }
}

impl GlmFamily for GammaFamily {
    fn name(&self) -> &'static str {
        "gamma"
    }

    fn link(&self) -> &dyn LinkFunction {
        self.link.as_ref()
    }

    fn variance(&self) -> &dyn VarianceFunction {
        &GammaVariance
    }

    fn deviance(&self) -> &dyn DevianceFunction {
        &GammaDeviance
    }

    fn valid_mu(&self, mu: &[f64]) -> Result<(), &'static str> {
        for &m in mu {
            if m.is_nan() || m <= 0.0 {
                return Err("mu must be positive for gamma family");
            }
        }
        Ok(())
    }

    fn valid_y(&self, y: &[f64]) -> Result<(), &'static str> {
        for &yi in y {
            if yi.is_nan() || yi <= 0.0 {
                return Err("y must be positive for gamma family");
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
        None // Gamma family has no dispersion parameter
    }

    fn aic_calc(&self, y: &[f64], mu: &[f64], weights: &[f64], dev: f64) -> f64 {
        calculate_gamma_aic(y, mu, weights, dev)
    }

    fn clone_box(&self) -> Box<dyn GlmFamily> {
        Box::new(GammaFamily {
            link: self.link.clone_box(),
        })
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_gamma_family_creation() {
        let family = GammaFamily::inverse();
        assert_eq!(family.name(), "gamma");
    }

    #[test]
    fn test_gamma_family_validation() {
        let family = GammaFamily::inverse();

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
}
