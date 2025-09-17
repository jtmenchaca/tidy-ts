//! Poisson family for GLM
//!
//! This module provides the poisson family implementation with various link functions
//! including log, identity, and sqrt links.

use super::{
    GlmFamily, LinkFunction, VarianceFunction, DevianceFunction,
    PoissonVariance, PoissonDeviance
};
use serde::{Deserialize, Serialize};

/// Poisson family with specified link function
pub struct PoissonFamily {
    link: Box<dyn LinkFunction>,
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
    fn fmt(&self, f: &mut std::fmt::Formatter<_\>) -> std::fmt::Result {
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
            let weight = if weights.len() == 1 { weights[0] } else { weights[i] };
            
            // Initialize mu based on y and weights
            let mu_init = if weight > 0.0 {
                if yi == 0.0 {
                    0.1
                } else {
                    yi
                }
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
    
    fn aic_calc(&self, y: &[f64], mu: &[f64], weights: &[f64], _dev: f64) -> f64 {
        // AIC = -2 * log-likelihood + 2 * df
        // For poisson: -2 * sum(w * (y * log(mu) - mu - log(y!))) + 2 * df
        let mut log_lik = 0.0;
        
        for i in 0..y.len() {
            let yi = y[i];
            let mui = mu[i];
            let weight = if weights.len() == 1 { weights[0] } else { weights[i] };
            
            if weight > 0.0 && mui > 0.0 {
                let term = if yi == 0.0 {
                    -mui
                } else {
                    yi * mui.ln() - mui - gamma_ln(yi + 1.0)
                };
                log_lik += weight * term;
            }
        }
        
        -2.0 * log_lik + 2.0 * (y.len() as f64)
    }
}

/// Approximate log gamma function using Stirling's approximation
fn gamma_ln(x: f64) -> f64 {
    if x <= 0.0 {
        f64::NAN
    } else if x < 12.0 {
        // Use recurrence relation for small x
        gamma_ln(x + 1.0) - x.ln()
    } else {
        // Stirling's approximation for large x
        let x_minus_1 = x - 1.0;
        0.5 * (2.0 * std::f64::consts::PI * x_minus_1).ln() + x_minus_1 * (x_minus_1.ln() - 1.0)
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
