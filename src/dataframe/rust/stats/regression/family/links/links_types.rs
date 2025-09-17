//! Link function types and traits

use serde::{Deserialize, Serialize};

/// Trait for link functions
pub trait LinkFunction: Send + Sync {
    /// Apply the link function: eta = g(mu)
    fn link(&self, mu: f64) -> Result<f64, &'static str>;

    /// Apply the inverse link function: mu = g^(-1)(eta)
    fn link_inverse(&self, eta: f64) -> Result<f64, &'static str>;

    /// Compute the derivative of the link function: d eta / d mu
    fn mu_eta(&self, eta: f64) -> Result<f64, &'static str>;

    /// Get the name of the link function
    fn name(&self) -> &'static str;

    /// Check if the link is valid for the given mu
    fn valid_mu(&self, mu: f64) -> bool;

    /// Check if the link is valid for the given eta
    fn valid_eta(&self, eta: f64) -> bool;

    // Additional methods needed by GLM code
    /// Apply the link function to a vector: eta = g(mu)
    fn linkfun(&self, mu: &[f64]) -> Vec<f64> {
        mu.iter().map(|&m| self.link(m).unwrap_or(0.0)).collect()
    }

    /// Apply the inverse link function to a vector: mu = g^(-1)(eta)
    fn linkinv(&self, eta: &[f64]) -> Vec<f64> {
        eta.iter()
            .map(|&e| self.link_inverse(e).unwrap_or(0.0))
            .collect()
    }

    /// Compute the derivative of the link function for a vector: d eta / d mu
    fn mu_eta(&self, eta: &[f64]) -> Vec<f64> {
        eta.iter().map(|&e| self.mu_eta(e).unwrap_or(0.0)).collect()
    }

    /// Check if the link is valid for the given eta vector
    fn valideta(&self, eta: &[f64]) -> Result<(), &'static str> {
        for &e in eta {
            if !self.valid_eta(e) {
                return Err("Invalid eta value");
            }
        }
        Ok(())
    }

    /// Clone method for trait objects
    fn clone_box(&self) -> Box<dyn LinkFunction>;
}

/// Link function type enum
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum LinkFunctionType {
    Logit,
    Probit,
    Cauchit,
    Log,
    Identity,
    Inverse,
    Sqrt,
    Cloglog,
    Power(f64),
}

impl LinkFunctionType {
    /// Create a link function from the type
    pub fn create_link(&self) -> Box<dyn LinkFunction> {
        match self {
            LinkFunctionType::Logit => Box::new(LogitLink),
            LinkFunctionType::Probit => Box::new(ProbitLink),
            LinkFunctionType::Cauchit => Box::new(CauchitLink),
            LinkFunctionType::Log => Box::new(LogLink),
            LinkFunctionType::Identity => Box::new(IdentityLink),
            LinkFunctionType::Inverse => Box::new(InverseLink),
            LinkFunctionType::Sqrt => Box::new(SqrtLink),
            LinkFunctionType::Cloglog => Box::new(CloglogLink),
            LinkFunctionType::Power(power) => Box::new(PowerLink(*power)),
        }
    }
}
