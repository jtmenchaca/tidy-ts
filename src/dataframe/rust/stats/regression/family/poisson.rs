//! Poisson family for GLM
//!
//! This module provides the poisson family implementation with various link functions
//! including log, identity, and sqrt links.

use super::{
    DevianceFunction, GlmFamily, LinkFunction, PoissonDeviance, PoissonVariance, VarianceFunction,
};
use crate::stats::regression::glm::glm_aic::calculate_poisson_aic;

/// Poisson family with specified link function
pub struct PoissonFamily {
    link: Box<dyn LinkFunction>,
}

impl Clone for PoissonFamily {
    fn clone(&self) -> Self {
        Self {
            link: self.link.clone_box(),
        }
    }
}

impl PoissonFamily {
    /// Create a new poisson family with the specified link function
    pub fn new(link: impl LinkFunction + 'static) -> Self {
        Self {
            link: Box::new(link),
        }
    }

    /// Create a poisson family with log link (default)
    pub fn log() -> Self {
        Self::new(super::links::LogLink)
    }

    /// Create a poisson family with identity link
    pub fn identity() -> Self {
        Self::new(super::links::IdentityLink)
    }

    /// Create a poisson family with sqrt link
    pub fn sqrt() -> Self {
        Self::new(super::links::SqrtLink)
    }
}

impl std::fmt::Debug for PoissonFamily {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.debug_struct("PoissonFamily")
            .field("link", &"<dyn LinkFunction>")
            .finish()
    }
}

impl GlmFamily for PoissonFamily {
    fn name(&self) -> &'static str {
        "poisson"
    }

    fn link(&self) -> &dyn LinkFunction {
        self.link.as_ref()
    }

    fn variance(&self) -> &dyn VarianceFunction {
        &PoissonVariance
    }

    fn deviance(&self) -> &dyn DevianceFunction {
        &PoissonDeviance
    }

    fn valid_mu(&self, mu: &[f64]) -> Result<(), &'static str> {
        for &m in mu {
            if m.is_nan() || m < 0.0 {
                return Err("mu must be non-negative for poisson family");
            }
        }
        Ok(())
    }

    fn valid_y(&self, y: &[f64]) -> Result<(), &'static str> {
        for &yi in y {
            if yi.is_nan() || yi < 0.0 || yi.fract() != 0.0 {
                return Err("y must be non-negative integers for poisson family");
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
            let mu_init = if weight > 0.0 {
                if yi == 0.0 { 0.1 } else { yi }
            } else {
                1.0
            };

            mu[i] = mu_init;
        }

        Ok(())
    }

    fn aic(&self) -> Box<dyn Fn(&[f64], &[f64], &[f64], f64) -> f64 + '_> {
        Box::new(|y, mu, weights, dev| self.aic_calc(y, mu, weights, dev))
    }

    fn dispersion(&self) -> Option<f64> {
        None // Poisson family has no dispersion parameter
    }

    fn aic_calc(&self, y: &[f64], mu: &[f64], weights: &[f64], dev: f64) -> f64 {
        calculate_poisson_aic(y, mu, weights, dev)
    }

    fn clone_box(&self) -> Box<dyn GlmFamily> {
        Box::new(PoissonFamily {
            link: self.link.clone_box(),
        })
    }
}

/// Calculate log factorial for integers using Stirling's approximation or exact calculation
fn log_factorial(n: f64) -> f64 {
    if n < 0.0 || n.fract() != 0.0 {
        return f64::NAN;
    }

    if n <= 1.0 {
        return 0.0;
    }

    if n <= 12.0 {
        // Use exact calculation for small n
        let mut result = 0.0;
        for i in 2..=(n as usize) {
            result += (i as f64).ln();
        }
        result
    } else {
        // Use Stirling's approximation: ln(n!) ≈ n*ln(n) - n + 0.5*ln(2*π*n)
        n * n.ln() - n + 0.5 * (2.0 * std::f64::consts::PI * n).ln()
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::stats::regression::family::links::LogLink;

    #[test]
    fn test_poisson_family_creation() {
        let family = PoissonFamily::log();
        assert_eq!(family.name(), "poisson");
    }

    #[test]
    fn test_poisson_family_validation() {
        let family = PoissonFamily::log();

        // Valid mu
        assert!(family.valid_mu(&[1.0, 2.5, 10.0]).is_ok());

        // Invalid mu
        assert!(family.valid_mu(&[-1.0, 2.0]).is_err());

        // Valid y
        assert!(family.valid_y(&[0.0, 1.0, 5.0]).is_ok());

        // Invalid y
        assert!(family.valid_y(&[-1.0, 2.0]).is_err());
        assert!(family.valid_y(&[1.5, 2.0]).is_err());
    }
}
