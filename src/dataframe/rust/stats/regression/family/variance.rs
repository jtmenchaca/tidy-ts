//! Variance functions for GLM families
//!
//! This module provides variance functions for different GLM families,
//! which describe how the variance depends on the mean.

// Unused imports removed

/// Trait for variance functions
pub trait VarianceFunction: Send + Sync {
    /// Compute the variance: V(mu)
    fn variance(&self, mu: f64) -> Result<f64, &'static str>;

    /// Compute the derivative of the variance function: dV(mu)/dmu
    fn variance_prime(&self, mu: f64) -> Result<f64, &'static str>;

    /// Get the name of the variance function
    fn name(&self) -> &'static str;

    /// Clone method for trait objects
    fn clone_box(&self) -> Box<dyn VarianceFunction>;
}

/// Gaussian variance function: V(mu) = 1
#[derive(Debug, Clone)]
pub struct GaussianVariance;

impl VarianceFunction for GaussianVariance {
    fn variance(&self, _mu: f64) -> Result<f64, &'static str> {
        Ok(1.0)
    }

    fn variance_prime(&self, _mu: f64) -> Result<f64, &'static str> {
        Ok(0.0)
    }

    fn name(&self) -> &'static str {
        "gaussian"
    }

    fn clone_box(&self) -> Box<dyn VarianceFunction> {
        Box::new(self.clone())
    }
}

/// Poisson variance function: V(mu) = mu
#[derive(Debug, Clone)]
pub struct PoissonVariance;

impl VarianceFunction for PoissonVariance {
    fn variance(&self, mu: f64) -> Result<f64, &'static str> {
        if mu < 0.0 {
            return Err("mu must be non-negative for poisson variance");
        }
        Ok(mu)
    }

    fn variance_prime(&self, _mu: f64) -> Result<f64, &'static str> {
        Ok(1.0)
    }

    fn name(&self) -> &'static str {
        "poisson"
    }

    fn clone_box(&self) -> Box<dyn VarianceFunction> {
        Box::new(self.clone())
    }
}

/// Gamma variance function: V(mu) = mu^2
#[derive(Debug, Clone)]
pub struct GammaVariance;

impl VarianceFunction for GammaVariance {
    fn variance(&self, mu: f64) -> Result<f64, &'static str> {
        if mu <= 0.0 {
            return Err("mu must be positive for gamma variance");
        }
        Ok(mu * mu)
    }

    fn variance_prime(&self, mu: f64) -> Result<f64, &'static str> {
        if mu <= 0.0 {
            return Err("mu must be positive for gamma variance");
        }
        Ok(2.0 * mu)
    }

    fn name(&self) -> &'static str {
        "gamma"
    }

    fn clone_box(&self) -> Box<dyn VarianceFunction> {
        Box::new(self.clone())
    }
}

/// Inverse Gaussian variance function: V(mu) = mu^3
#[derive(Debug, Clone)]
pub struct InverseGaussianVariance;

impl VarianceFunction for InverseGaussianVariance {
    fn variance(&self, mu: f64) -> Result<f64, &'static str> {
        if mu <= 0.0 {
            return Err("mu must be positive for inverse gaussian variance");
        }
        Ok(mu * mu * mu)
    }

    fn variance_prime(&self, mu: f64) -> Result<f64, &'static str> {
        if mu <= 0.0 {
            return Err("mu must be positive for inverse gaussian variance");
        }
        Ok(3.0 * mu * mu)
    }

    fn name(&self) -> &'static str {
        "inverse_gaussian"
    }

    fn clone_box(&self) -> Box<dyn VarianceFunction> {
        Box::new(self.clone())
    }
}

/// Quasi variance function: V(mu) = mu^power
#[derive(Debug, Clone)]
pub struct QuasiVariance {
    power: f64,
}

impl QuasiVariance {
    /// Create a new quasi variance function with the specified power
    pub fn new(power: f64) -> Self {
        Self { power }
    }

    /// Create a quasi variance function with power 0 (constant variance)
    pub fn constant() -> Self {
        Self::new(0.0)
    }

    /// Create a quasi variance function with power 1 (linear variance)
    pub fn linear() -> Self {
        Self::new(1.0)
    }

    /// Create a quasi variance function with power 2 (quadratic variance)
    pub fn quadratic() -> Self {
        Self::new(2.0)
    }
}

impl VarianceFunction for QuasiVariance {
    fn variance(&self, mu: f64) -> Result<f64, &'static str> {
        if mu <= 0.0 && self.power != 0.0 {
            return Err("mu must be positive for quasi variance with non-zero power");
        }
        Ok(mu.powf(self.power))
    }

    fn variance_prime(&self, mu: f64) -> Result<f64, &'static str> {
        if mu <= 0.0 && self.power != 0.0 {
            return Err("mu must be positive for quasi variance with non-zero power");
        }
        if self.power == 0.0 {
            Ok(0.0)
        } else {
            Ok(self.power * mu.powf(self.power - 1.0))
        }
    }

    fn name(&self) -> &'static str {
        "quasi"
    }

    fn clone_box(&self) -> Box<dyn VarianceFunction> {
        Box::new(self.clone())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_gaussian_variance() {
        let var_fn = GaussianVariance;
        assert_eq!(var_fn.variance(5.0).unwrap(), 1.0);
        assert_eq!(var_fn.variance_prime(5.0).unwrap(), 0.0);
    }

    #[test]
    fn test_poisson_variance() {
        let var_fn = PoissonVariance;
        assert_eq!(var_fn.variance(3.0).unwrap(), 3.0);
        assert_eq!(var_fn.variance_prime(3.0).unwrap(), 1.0);
        assert!(var_fn.variance(-1.0).is_err());
    }

    #[test]
    fn test_gamma_variance() {
        let var_fn = GammaVariance;
        assert_eq!(var_fn.variance(2.0).unwrap(), 4.0);
        assert_eq!(var_fn.variance_prime(2.0).unwrap(), 4.0);
        assert!(var_fn.variance(-1.0).is_err());
    }

    #[test]
    fn test_inverse_gaussian_variance() {
        let var_fn = InverseGaussianVariance;
        assert_eq!(var_fn.variance(2.0).unwrap(), 8.0);
        assert_eq!(var_fn.variance_prime(2.0).unwrap(), 12.0);
        assert!(var_fn.variance(-1.0).is_err());
    }

    #[test]
    fn test_quasi_variance() {
        let var_fn = QuasiVariance::new(1.5);
        assert_eq!(var_fn.variance(4.0).unwrap(), 8.0);
        assert_eq!(var_fn.variance_prime(4.0).unwrap(), 3.0);

        let const_var = QuasiVariance::constant();
        assert_eq!(const_var.variance(5.0).unwrap(), 1.0);
        assert_eq!(const_var.variance_prime(5.0).unwrap(), 0.0);
    }
}
