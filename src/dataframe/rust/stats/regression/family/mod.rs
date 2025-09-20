//! Distribution families for generalized linear models
//!
//! This module contains the Rust implementations of R's family functions,
//! originally from family.c and related files. The functions have been modularized
//! for better organization.

pub mod binomial;
pub mod binomial_utils;
pub mod deviance;
pub mod gamma;
pub mod gaussian;
pub mod inverse_gaussian;
pub mod links;
pub mod poisson;
pub mod quasi;
pub mod variance;

// Re-export main types and functions for easy access
pub use binomial::{BinomialDeviance, BinomialFamily, BinomialVariance};
pub use gamma::GammaFamily;
pub use gaussian::GaussianFamily;
pub use inverse_gaussian::InverseGaussianFamily;
pub use poisson::PoissonFamily;
pub use quasi::QuasiFamily;

// Re-export traits
pub use deviance::{
    DevianceFunction, GammaDeviance, GaussianDeviance, InverseGaussianDeviance, PoissonDeviance,
    QuasiDeviance,
};
pub use links::LinkFunction;
pub use variance::{
    GammaVariance, GaussianVariance, InverseGaussianVariance, PoissonVariance, QuasiVariance,
    VarianceFunction,
};

// Main GLM family trait
pub trait GlmFamily: Send + Sync {
    fn name(&self) -> &'static str;
    fn link(&self) -> &dyn LinkFunction;
    fn variance(&self) -> &dyn VarianceFunction;
    fn deviance(&self) -> &dyn DevianceFunction;
    fn valid_mu(&self, mu: &[f64]) -> Result<(), &'static str>;
    fn valid_y(&self, y: &[f64]) -> Result<(), &'static str>;
    fn initialize(&self, y: &[f64], mu: &mut [f64], weights: &mut [f64]) -> Result<(), String>;
    fn dispersion(&self) -> Option<f64>;
    
    /// Clone method for trait objects
    fn clone_box(&self) -> Box<dyn GlmFamily>;

    // Additional methods needed by GLM code
    fn family_name(&self) -> &'static str {
        self.name()
    }

    fn link_name(&self) -> &'static str {
        self.link().name()
    }

    fn linkfun(&self, mu: &[f64]) -> Vec<f64> {
        self.link().linkfun(mu)
    }

    fn linkinv(&self) -> Box<dyn Fn(&[f64]) -> Vec<f64> + '_> {
        Box::new(|eta| self.link().linkinv(eta))
    }

    fn dev_resids(&self) -> Box<dyn Fn(&[f64], &[f64], &[f64]) -> Vec<f64> + '_> {
        Box::new(|y, mu, weights| self.deviance().dev_resids(y, mu, weights))
    }

    fn aic(&self) -> Box<dyn Fn(&[f64], &[f64], &[f64], f64) -> f64 + '_> {
        Box::new(|y, mu, weights, dev| self.aic_calc(y, mu, weights, dev))
    }

    fn mu_eta(&self) -> Box<dyn Fn(&[f64]) -> Vec<f64> + '_> {
        Box::new(|eta| {
            eta.iter()
                .map(|&eta_i| self.link().mu_eta(eta_i).unwrap_or(1.0))
                .collect()
        })
    }

    fn valideta(&self) -> Box<dyn Fn(&[f64]) -> Result<(), &'static str> + '_> {
        Box::new(|eta| self.link().valideta(eta))
    }

    fn validmu(&self) -> Box<dyn Fn(&[f64]) -> Result<(), &'static str> + '_> {
        Box::new(|mu| self.valid_mu(mu))
    }

    // Helper method for AIC calculation
    fn aic_calc(&self, y: &[f64], mu: &[f64], weights: &[f64], dev: f64) -> f64;
}

// Constants used in family calculations
pub const INVEPS: f64 = 1.0 / f64::EPSILON;
pub const MTHRESH: f64 = 30.0;
pub const THRESH: f64 = 1e-10;

// Helper functions for family calculations
pub fn x_d_omx(x: f64) -> f64 {
    binomial_utils::binomial_variance_safe(x)
}

pub fn x_d_opx(x: f64) -> f64 {
    if x <= 0.0 { 0.0 } else { x / (1.0 + x) }
}

pub fn y_log_y(y: f64, mu: f64) -> f64 {
    if y == 0.0 { 0.0 } else { y * (y / mu).ln() }
}
