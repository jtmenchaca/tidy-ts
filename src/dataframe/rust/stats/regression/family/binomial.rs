//! Binomial family for GLM
//!
//! This module provides the binomial family implementation with various link functions
//! including logit, probit, cauchit, log, and cloglog links.

use super::{DevianceFunction, GlmFamily, LinkFunction, VarianceFunction};
use crate::stats::regression::glm::glm_aic::calculate_binomial_aic;

/// Binomial family with specified link function
pub struct BinomialFamily {
    link: Box<dyn LinkFunction>,
}

impl Clone for BinomialFamily {
    fn clone(&self) -> Self {
        Self {
            link: self.link.clone_box(),
        }
    }
}

impl BinomialFamily {
    /// Create a new binomial family with the specified link function
    pub fn new(link: impl LinkFunction + 'static) -> Self {
        Self {
            link: Box::new(link),
        }
    }

    /// Create a binomial family with logit link (default)
    pub fn logit() -> Self {
        Self::new(super::links::LogitLink)
    }

    /// Create a binomial family with probit link
    pub fn probit() -> Self {
        Self::new(super::links::ProbitLink)
    }

    /// Create a binomial family with cauchit link
    pub fn cauchit() -> Self {
        Self::new(super::links::CauchitLink)
    }

    /// Create a binomial family with log link
    pub fn log() -> Self {
        Self::new(super::links::LogLink)
    }

    /// Create a binomial family with cloglog link
    pub fn cloglog() -> Self {
        Self::new(super::links::CloglogLink)
    }
}

impl std::fmt::Debug for BinomialFamily {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.debug_struct("BinomialFamily")
            .field("link", &"<dyn LinkFunction>")
            .finish()
    }
}

impl GlmFamily for BinomialFamily {
    fn name(&self) -> &'static str {
        "binomial"
    }

    fn link(&self) -> &dyn LinkFunction {
        self.link.as_ref()
    }

    fn variance(&self) -> &dyn VarianceFunction {
        &BinomialVariance
    }

    fn deviance(&self) -> &dyn DevianceFunction {
        &BinomialDeviance
    }

    fn valid_mu(&self, mu: &[f64]) -> Result<(), &'static str> {
        for &m in mu {
            if m.is_nan() || m < 0.0 || m > 1.0 {
                return Err("mu must be in [0, 1] for binomial family");
            }
        }
        Ok(())
    }

    fn valid_y(&self, y: &[f64]) -> Result<(), &'static str> {
        for &yi in y {
            if yi.is_nan() || yi < 0.0 || yi > 1.0 {
                return Err("y must be in [0, 1] for binomial family");
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

            // R's initialization: mustart <- (weights * y + 0.5)/(weights + 1)
            let mu_init = (weight * yi + 0.5) / (weight + 1.0);

            mu[i] = mu_init;
        }

        Ok(())
    }

    fn aic(&self) -> Box<dyn Fn(&[f64], &[f64], &[f64], f64) -> f64 + '_> {
        Box::new(|y, mu, weights, dev| self.aic_calc(y, mu, weights, dev))
    }

    fn dispersion(&self) -> Option<f64> {
        None // Binomial family has no dispersion parameter
    }

    fn aic_calc(&self, y: &[f64], mu: &[f64], weights: &[f64], dev: f64) -> f64 {
        calculate_binomial_aic(y, mu, weights, dev)
    }

    fn clone_box(&self) -> Box<dyn GlmFamily> {
        Box::new(BinomialFamily {
            link: self.link.clone_box(),
        })
    }

    // Override validmu and valideta to match R's permissive defaults
    // R: validmu <- family$validmu %||% function(mu) TRUE
    fn validmu(&self) -> Box<dyn Fn(&[f64]) -> Result<(), &'static str> + '_> {
        Box::new(|_mu| Ok(())) // Always valid, like R's default
    }

    fn valideta(&self) -> Box<dyn Fn(&[f64]) -> Result<(), &'static str> + '_> {
        Box::new(|_eta| Ok(())) // Always valid, like R's default
    }
}

/// Binomial variance function: V(mu) = mu * (1 - mu)
#[derive(Debug, Clone)]
pub struct BinomialVariance;

impl VarianceFunction for BinomialVariance {
    fn variance(&self, mu: f64) -> Result<f64, &'static str> {
        if mu < 0.0 || mu > 1.0 {
            return Err("mu must be in [0, 1] for binomial variance");
        }
        Ok(super::binomial_utils::binomial_variance_safe(mu))
    }

    fn variance_prime(&self, mu: f64) -> Result<f64, &'static str> {
        if mu < 0.0 || mu > 1.0 {
            return Err("mu must be in [0, 1] for binomial variance");
        }
        // Use clamped mu for consistency with variance function
        let eps = 2.220446e-16; // R's .Machine$double.eps
        let mu_clamped = mu.max(eps).min(1.0 - eps);
        Ok(1.0 - 2.0 * mu_clamped)
    }

    fn name(&self) -> &'static str {
        "binomial"
    }

    fn clone_box(&self) -> Box<dyn VarianceFunction> {
        Box::new(self.clone())
    }
}

/// Binomial deviance function
#[derive(Debug, Clone)]
pub struct BinomialDeviance;

impl DevianceFunction for BinomialDeviance {
    fn deviance_residual(&self, y: f64, mu: f64, weight: f64) -> Result<f64, &'static str> {
        if y < 0.0 || y > 1.0 || mu < 0.0 || mu > 1.0 {
            return Err("y and mu must be in [0, 1] for binomial deviance");
        }

        if weight <= 0.0 {
            return Ok(0.0);
        }

        // R's implementation: 2 * wt * (y_log_y(y, mu) + y_log_y(1-y, 1-mu))
        // where y_log_y(y, mu) = (y != 0) ? (y * log(y/mu)) : 0
        //
        // Handle edge cases where mu is 0 or 1:
        // - If mu = 0 and y = 0, contribution is 0
        // - If mu = 0 and y > 0, deviance is infinite
        // - If mu = 1 and y = 1, contribution is 0
        // - If mu = 1 and y < 1, deviance is infinite
        let y_log_y = |y: f64, mu: f64| -> f64 {
            if y == 0.0 {
                0.0
            } else {
                // Apply epsilon clamping to prevent mu == 0 or mu == 1 issues
                let eps = 2.220446e-16; // R's .Machine$double.eps
                let mu_clamped = mu.max(eps).min(1.0 - eps);
                y * (y / mu_clamped).ln()
            }
        };

        let dev_resid = 2.0 * weight * (y_log_y(y, mu) + y_log_y(1.0 - y, 1.0 - mu));

        // R returns sqrt of deviance residual squared, handling infinity
        if dev_resid.is_infinite() {
            Ok(f64::INFINITY)
        } else if dev_resid < 0.0 {
            // This shouldn't happen mathematically, but handle numerical issues
            Ok(0.0)
        } else {
            Ok(dev_resid.sqrt())
        }
    }

    fn deviance(&self, y: &[f64], mu: &[f64], weights: &[f64]) -> Result<f64, &'static str> {
        if y.len() != mu.len() {
            return Err("y and mu must have the same length");
        }
        if weights.len() != y.len() && weights.len() != 1 {
            return Err("weights must have length 1 or same as y");
        }

        let mut total_deviance = 0.0;

        for i in 0..y.len() {
            let yi = y[i];
            let mui = mu[i];
            let weight = if weights.len() == 1 {
                weights[0]
            } else {
                weights[i]
            };

            if weight > 0.0 {
                // R's implementation: 2 * wt * (y_log_y(y, mu) + y_log_y(1-y, 1-mu))
                // where y_log_y(y, mu) = (y != 0) ? (y * log(y/mu)) : 0
                // Handle edge cases where mu is 0 or 1
                let y_log_y = |y: f64, mu: f64| -> f64 {
                    if y == 0.0 {
                        0.0
                    } else {
                        // Apply epsilon clamping to prevent mu == 0 or mu == 1 issues
                        let eps = 2.220446e-16; // R's .Machine$double.eps
                        let mu_clamped = mu.max(eps).min(1.0 - eps);
                        y * (y / mu_clamped).ln()
                    }
                };

                let dev_resid = 2.0 * weight * (y_log_y(yi, mui) + y_log_y(1.0 - yi, 1.0 - mui));

                // Handle infinite deviance (occurs when fitted values are at boundaries)
                if dev_resid.is_infinite() {
                    return Ok(f64::INFINITY);
                }
                total_deviance += dev_resid;
            }
        }

        Ok(total_deviance)
    }

    fn name(&self) -> &'static str {
        "binomial"
    }

    fn clone_box(&self) -> Box<dyn DevianceFunction> {
        Box::new(self.clone())
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::stats::regression::family::links::LogitLink;

    #[test]
    fn test_binomial_family_creation() {
        let family = BinomialFamily::logit();
        assert_eq!(family.name(), "binomial");
    }

    #[test]
    fn test_binomial_variance() {
        let var_fn = BinomialVariance;
        assert_eq!(var_fn.variance(0.5).unwrap(), 0.25);
        assert_eq!(var_fn.variance(0.0).unwrap(), 0.0);
        assert_eq!(var_fn.variance(1.0).unwrap(), 0.0);
    }

    #[test]
    fn test_binomial_deviance() {
        let dev_fn = BinomialDeviance;
        let y = vec![0.0, 1.0, 0.5];
        let mu = vec![0.1, 0.9, 0.5];
        let weights = vec![1.0, 1.0, 1.0];

        let deviance = dev_fn.deviance(&y, &mu, &weights).unwrap();
        assert!(deviance >= 0.0);
    }

    #[test]
    fn test_binomial_validation() {
        let family = BinomialFamily::logit();

        // Valid mu
        assert!(family.valid_mu(&[0.1, 0.5, 0.9]).is_ok());

        // Invalid mu
        assert!(family.valid_mu(&[1.1, 0.5]).is_err());
        assert!(family.valid_mu(&[-0.1, 0.5]).is_err());

        // Valid y
        assert!(family.valid_y(&[0.0, 1.0, 0.5]).is_ok());

        // Invalid y
        assert!(family.valid_y(&[1.1, 0.5]).is_err());
        assert!(family.valid_y(&[-0.1, 0.5]).is_err());
    }
}
