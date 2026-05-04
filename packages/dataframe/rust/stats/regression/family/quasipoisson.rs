//! Quasipoisson family for GLM
//!
//! Identical to Poisson during IRLS fitting (same variance, deviance, link functions),
//! but differs in post-fit inference:
//! - Dispersion is estimated from data (not fixed at 1)
//! - AIC is undefined (returns NaN)
//! - Standard errors are scaled by estimated dispersion
//!
//! Reference: R source `src/library/stats/R/family.R`

use super::poisson::PoissonFamily;
use super::{DevianceFunction, GlmFamily, LinkFunction, PoissonDeviance, PoissonVariance, VarianceFunction};

/// Quasipoisson family with specified link function
pub struct QuasiPoissonFamily {
    link: Box<dyn LinkFunction>,
}

impl Clone for QuasiPoissonFamily {
    fn clone(&self) -> Self {
        Self {
            link: self.link.clone_box(),
        }
    }
}

impl QuasiPoissonFamily {
    /// Create a new quasipoisson family with the specified link function
    pub fn new(link: impl LinkFunction + 'static) -> Self {
        Self {
            link: Box::new(link),
        }
    }

    /// Create a quasipoisson family with log link (default)
    pub fn log() -> Self {
        Self::new(super::links::LogLink)
    }

    /// Create a quasipoisson family with identity link
    pub fn identity() -> Self {
        Self::new(super::links::IdentityLink)
    }

    /// Create a quasipoisson family with sqrt link
    pub fn sqrt() -> Self {
        Self::new(super::links::SqrtLink)
    }
}

impl std::fmt::Debug for QuasiPoissonFamily {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.debug_struct("QuasiPoissonFamily")
            .field("link", &"<dyn LinkFunction>")
            .finish()
    }
}

impl GlmFamily for QuasiPoissonFamily {
    fn name(&self) -> &'static str {
        "quasipoisson"
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
                return Err("mu must be non-negative for quasipoisson family");
            }
        }
        Ok(())
    }

    fn valid_y(&self, y: &[f64]) -> Result<(), &'static str> {
        for &yi in y {
            if yi.is_nan() || yi < 0.0 {
                return Err("y must be non-negative for quasipoisson family");
            }
        }
        Ok(())
    }

    fn initialize(&self, y: &[f64], mu: &mut [f64], weights: &mut [f64]) -> Result<(), String> {
        // Same initialization as Poisson: mustart <- y + 0.1
        let poisson = PoissonFamily::log();
        poisson.initialize(y, mu, weights)
    }

    fn aic(&self) -> Box<dyn Fn(&[f64], &[f64], &[f64], f64) -> f64 + '_> {
        Box::new(|_y, _mu, _weights, _dev| f64::NAN)
    }

    fn dispersion(&self) -> Option<f64> {
        None
    }

    fn aic_calc(&self, _y: &[f64], _mu: &[f64], _weights: &[f64], _dev: f64) -> f64 {
        f64::NAN
    }

    fn clone_box(&self) -> Box<dyn GlmFamily> {
        Box::new(QuasiPoissonFamily {
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
    fn test_quasipoisson_family_creation() {
        let family = QuasiPoissonFamily::log();
        assert_eq!(family.name(), "quasipoisson");
    }

    #[test]
    fn test_quasipoisson_aic_is_nan() {
        let family = QuasiPoissonFamily::log();
        let aic = family.aic_calc(&[0.0, 1.0], &[0.3, 0.7], &[1.0, 1.0], 1.5);
        assert!(aic.is_nan());
    }

    #[test]
    fn test_quasipoisson_uses_poisson_variance() {
        let family = QuasiPoissonFamily::log();
        let var = family.variance().variance(2.0).unwrap();
        assert_eq!(var, 2.0); // V(mu) = mu for Poisson
    }
}
