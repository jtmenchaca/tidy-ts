//! Quasibinomial family for GLM
//!
//! Identical to binomial during IRLS fitting (same variance, deviance, link functions),
//! but differs in post-fit inference:
//! - Dispersion is estimated from data (not fixed at 1)
//! - AIC is undefined (returns NaN)
//! - Standard errors are scaled by estimated dispersion
//! - P-values use t-distribution instead of normal
//!
//! Reference: R source `src/library/stats/R/family.R` lines 406-442

use super::binomial::{BinomialDeviance, BinomialVariance};
use super::{DevianceFunction, GlmFamily, LinkFunction, VarianceFunction};

/// Quasibinomial family with specified link function
pub struct QuasiBinomialFamily {
    link: Box<dyn LinkFunction>,
}

impl Clone for QuasiBinomialFamily {
    fn clone(&self) -> Self {
        Self {
            link: self.link.clone_box(),
        }
    }
}

impl QuasiBinomialFamily {
    /// Create a new quasibinomial family with the specified link function
    pub fn new(link: impl LinkFunction + 'static) -> Self {
        Self {
            link: Box::new(link),
        }
    }

    /// Create a quasibinomial family with logit link (default)
    pub fn logit() -> Self {
        Self::new(super::links::LogitLink)
    }

    /// Create a quasibinomial family with probit link
    pub fn probit() -> Self {
        Self::new(super::links::ProbitLink)
    }

    /// Create a quasibinomial family with cauchit link
    pub fn cauchit() -> Self {
        Self::new(super::links::CauchitLink)
    }

    /// Create a quasibinomial family with log link
    pub fn log() -> Self {
        Self::new(super::links::LogLink)
    }

    /// Create a quasibinomial family with cloglog link
    pub fn cloglog() -> Self {
        Self::new(super::links::CloglogLink)
    }
}

impl std::fmt::Debug for QuasiBinomialFamily {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.debug_struct("QuasiBinomialFamily")
            .field("link", &"<dyn LinkFunction>")
            .finish()
    }
}

impl GlmFamily for QuasiBinomialFamily {
    fn name(&self) -> &'static str {
        "quasibinomial"
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
                return Err("mu must be in [0, 1] for quasibinomial family");
            }
        }
        Ok(())
    }

    fn valid_y(&self, y: &[f64]) -> Result<(), &'static str> {
        for &yi in y {
            if yi.is_nan() || yi < 0.0 || yi > 1.0 {
                return Err("y must be in [0, 1] for quasibinomial family");
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
        Box::new(|_y, _mu, _weights, _dev| f64::NAN)
    }

    fn dispersion(&self) -> Option<f64> {
        None
    }

    fn aic_calc(&self, _y: &[f64], _mu: &[f64], _weights: &[f64], _dev: f64) -> f64 {
        // AIC is undefined for quasi-likelihood families (R returns NA)
        f64::NAN
    }

    fn clone_box(&self) -> Box<dyn GlmFamily> {
        Box::new(QuasiBinomialFamily {
            link: self.link.clone_box(),
        })
    }

    fn validmu(&self) -> Box<dyn Fn(&[f64]) -> Result<(), &'static str> + '_> {
        Box::new(|_mu| Ok(()))
    }

    fn valideta(&self) -> Box<dyn Fn(&[f64]) -> Result<(), &'static str> + '_> {
        Box::new(|_eta| Ok(()))
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_quasibinomial_family_creation() {
        let family = QuasiBinomialFamily::logit();
        assert_eq!(family.name(), "quasibinomial");
    }

    #[test]
    fn test_quasibinomial_aic_is_nan() {
        let family = QuasiBinomialFamily::logit();
        let aic = family.aic_calc(&[0.0, 1.0], &[0.3, 0.7], &[1.0, 1.0], 1.5);
        assert!(aic.is_nan());
    }

    #[test]
    fn test_quasibinomial_uses_binomial_variance() {
        let family = QuasiBinomialFamily::logit();
        let var = family.variance().variance(0.5).unwrap();
        assert_eq!(var, 0.25); // mu * (1 - mu) = 0.5 * 0.5
    }

    #[test]
    fn test_quasibinomial_uses_binomial_deviance() {
        let family = QuasiBinomialFamily::logit();
        let dev = family
            .deviance()
            .deviance(&[0.0, 1.0, 0.5], &[0.1, 0.9, 0.5], &[1.0, 1.0, 1.0])
            .unwrap();
        assert!(dev >= 0.0);
    }

    #[test]
    fn test_quasibinomial_validation() {
        let family = QuasiBinomialFamily::logit();
        assert!(family.valid_mu(&[0.1, 0.5, 0.9]).is_ok());
        assert!(family.valid_mu(&[1.1, 0.5]).is_err());
        assert!(family.valid_y(&[0.0, 1.0, 0.5]).is_ok());
        assert!(family.valid_y(&[-0.1, 0.5]).is_err());
    }
}
