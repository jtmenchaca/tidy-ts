//! Deviance functions for GLM families
//!
//! This module provides deviance functions for different GLM families,
//! which are used to compute deviance residuals and overall deviance.

// Unused imports removed

/// Trait for deviance functions
pub trait DevianceFunction: Send + Sync {
    /// Compute the deviance residual for a single observation
    fn deviance_residual(&self, y: f64, mu: f64, weight: f64) -> Result<f64, &'static str>;

    /// Compute the total deviance for all observations
    fn deviance(&self, y: &[f64], mu: &[f64], weights: &[f64]) -> Result<f64, &'static str>;

    /// Get the name of the deviance function
    fn name(&self) -> &'static str;

    /// Compute deviance residuals for all observations
    fn dev_resids(&self, y: &[f64], mu: &[f64], weights: &[f64]) -> Vec<f64> {
        let mut residuals = Vec::with_capacity(y.len());

        for i in 0..y.len() {
            let weight = if weights.len() == 1 {
                weights[0]
            } else {
                weights[i]
            };
            let residual = self.deviance_residual(y[i], mu[i], weight).unwrap_or(0.0);
            residuals.push(residual);
        }

        residuals
    }

    /// Clone method for trait objects
    fn clone_box(&self) -> Box<dyn DevianceFunction>;
}

/// Gaussian deviance function
#[derive(Debug, Clone)]
pub struct GaussianDeviance;

impl DevianceFunction for GaussianDeviance {
    fn deviance_residual(&self, y: f64, mu: f64, weight: f64) -> Result<f64, &'static str> {
        if weight <= 0.0 {
            return Ok(0.0);
        }

        // For Gaussian: deviance residual = sqrt(weight) * |y - mu|
        let dev_resid = (y - mu).abs();
        Ok(weight.sqrt() * dev_resid)
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
                // For Gaussian: deviance = sum(weight * (y - mu)^2)
                total_deviance += weight * (yi - mui).powi(2);
            }
        }

        Ok(total_deviance)
    }

    fn name(&self) -> &'static str {
        "gaussian"
    }

    fn clone_box(&self) -> Box<dyn DevianceFunction> {
        Box::new(self.clone())
    }
}

/// Poisson deviance function
#[derive(Debug, Clone)]
pub struct PoissonDeviance;

impl DevianceFunction for PoissonDeviance {
    fn deviance_residual(&self, y: f64, mu: f64, weight: f64) -> Result<f64, &'static str> {
        if y < 0.0 || mu <= 0.0 {
            return Err("y must be non-negative and mu must be positive for poisson deviance");
        }

        if weight <= 0.0 {
            return Ok(0.0);
        }

        // Based on R's implementation in family/poisson.c
        let dev_resid = if y == 0.0 {
            2.0 * mu
        } else {
            2.0 * (y * (y / mu).ln() - (y - mu))
        };

        Ok(weight * dev_resid)
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
                // For Poisson: deviance = sum(weight * dev_resid) where dev_resid is already computed correctly
                let dev_resid_component = if yi == 0.0 {
                    2.0 * mui
                } else {
                    2.0 * (yi * (yi / mui).ln() - (yi - mui))
                };
                total_deviance += weight * dev_resid_component;
            }
        }

        Ok(total_deviance)
    }

    fn name(&self) -> &'static str {
        "poisson"
    }

    fn clone_box(&self) -> Box<dyn DevianceFunction> {
        Box::new(self.clone())
    }
}

/// Gamma deviance function
#[derive(Debug, Clone)]
pub struct GammaDeviance;

impl DevianceFunction for GammaDeviance {
    fn deviance_residual(&self, y: f64, mu: f64, weight: f64) -> Result<f64, &'static str> {
        if y <= 0.0 || mu <= 0.0 {
            return Err("y and mu must be positive for gamma deviance");
        }

        if weight <= 0.0 {
            return Ok(0.0);
        }

        let dev_resid = -2.0 * ((y / mu).ln() - (y - mu) / mu);
        Ok(weight.sqrt() * dev_resid.sqrt())
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
                let dev_resid = self.deviance_residual(yi, mui, weight)?;
                total_deviance += dev_resid * dev_resid;
            }
        }

        Ok(total_deviance)
    }

    fn name(&self) -> &'static str {
        "gamma"
    }

    fn clone_box(&self) -> Box<dyn DevianceFunction> {
        Box::new(self.clone())
    }
}

/// Inverse Gaussian deviance function
#[derive(Debug, Clone)]
pub struct InverseGaussianDeviance;

impl DevianceFunction for InverseGaussianDeviance {
    fn deviance_residual(&self, y: f64, mu: f64, weight: f64) -> Result<f64, &'static str> {
        if y <= 0.0 || mu <= 0.0 {
            return Err("y and mu must be positive for inverse gaussian deviance");
        }

        if weight <= 0.0 {
            return Ok(0.0);
        }

        let dev_resid = (y - mu).powi(2) / (y * mu * mu);
        Ok(weight.sqrt() * dev_resid.sqrt())
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
                let dev_resid = self.deviance_residual(yi, mui, weight)?;
                total_deviance += dev_resid * dev_resid;
            }
        }

        Ok(total_deviance)
    }

    fn name(&self) -> &'static str {
        "inverse_gaussian"
    }

    fn clone_box(&self) -> Box<dyn DevianceFunction> {
        Box::new(self.clone())
    }
}

/// Quasi deviance function
#[derive(Debug, Clone)]
pub struct QuasiDeviance {
    variance_power: f64,
}

impl QuasiDeviance {
    /// Create a new quasi deviance function
    pub fn new(variance_power: f64) -> Self {
        Self { variance_power }
    }

    /// Create a quasi deviance function with constant variance
    pub fn constant() -> Self {
        Self::new(0.0)
    }

    /// Create a quasi deviance function with linear variance
    pub fn linear() -> Self {
        Self::new(1.0)
    }

    /// Create a quasi deviance function with quadratic variance
    pub fn quadratic() -> Self {
        Self::new(2.0)
    }
}

impl DevianceFunction for QuasiDeviance {
    fn deviance_residual(&self, y: f64, mu: f64, weight: f64) -> Result<f64, &'static str> {
        if weight <= 0.0 {
            return Ok(0.0);
        }

        let dev_resid = if self.variance_power == 0.0 {
            // Constant variance
            (y - mu).powi(2)
        } else if self.variance_power == 1.0 {
            // Linear variance (Poisson-like)
            if y == 0.0 {
                -2.0 * mu
            } else {
                -2.0 * (y * (y / mu).ln() - (y - mu))
            }
        } else if self.variance_power == 2.0 {
            // Quadratic variance (Gamma-like)
            if y <= 0.0 || mu <= 0.0 {
                return Err("y and mu must be positive for quasi deviance with power 2");
            }
            -2.0 * ((y / mu).ln() - (y - mu) / mu)
        } else {
            // General power
            if mu <= 0.0 {
                return Err("mu must be positive for quasi deviance");
            }
            let variance = mu.powf(self.variance_power);
            (y - mu).powi(2) / variance
        };

        Ok(weight.sqrt() * dev_resid.sqrt())
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
                let dev_resid = self.deviance_residual(yi, mui, weight)?;
                total_deviance += dev_resid * dev_resid;
            }
        }

        Ok(total_deviance)
    }

    fn name(&self) -> &'static str {
        "quasi"
    }

    fn clone_box(&self) -> Box<dyn DevianceFunction> {
        Box::new(self.clone())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_gaussian_deviance() {
        let dev_fn = GaussianDeviance;

        let y = vec![1.0, 2.0, 3.0];
        let mu = vec![1.1, 1.9, 3.1];
        let weights = vec![1.0, 1.0, 1.0];

        let deviance = dev_fn.deviance(&y, &mu, &weights).unwrap();
        assert!(deviance >= 0.0);

        // Test single residual
        let resid = dev_fn.deviance_residual(1.0, 1.1, 1.0).unwrap();
        assert!((resid - 0.1).abs() < 1e-10);
    }

    #[test]
    fn test_poisson_deviance() {
        let dev_fn = PoissonDeviance;

        let y = vec![1.0, 2.0, 0.0];
        let mu = vec![1.1, 1.9, 0.5];
        let weights = vec![1.0, 1.0, 1.0];

        let deviance = dev_fn.deviance(&y, &mu, &weights).unwrap();
        assert!(deviance >= 0.0);
    }

    #[test]
    fn test_gamma_deviance() {
        let dev_fn = GammaDeviance;

        let y = vec![1.0, 2.0, 3.0];
        let mu = vec![1.1, 1.9, 3.1];
        let weights = vec![1.0, 1.0, 1.0];

        let deviance = dev_fn.deviance(&y, &mu, &weights).unwrap();
        assert!(deviance >= 0.0);
    }

    #[test]
    fn test_quasi_deviance() {
        let dev_fn = QuasiDeviance::constant();

        let y = vec![1.0, 2.0, 3.0];
        let mu = vec![1.1, 1.9, 3.1];
        let weights = vec![1.0, 1.0, 1.0];

        let deviance = dev_fn.deviance(&y, &mu, &weights).unwrap();
        assert!(deviance >= 0.0);
    }
}
