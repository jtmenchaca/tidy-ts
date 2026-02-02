//! Negative Binomial families for GLM
//!
//! This module provides two parameterizations of the negative binomial distribution:
//!
//! - **NB1 (Nbinom1)**: Linear mean-variance relationship: Var(Y) = μ(1 + φ)
//!   where φ is the dispersion parameter
//!
//! - **NB2 (Nbinom2)**: Quadratic mean-variance relationship: Var(Y) = μ(1 + μ/θ)
//!   where θ is the overdispersion parameter (often called "size" in R)
//!
//! The NB2 parameterization matches R's MASS::glm.nb() and glmmTMB default.

use super::{DevianceFunction, GlmFamily, LinkFunction, VarianceFunction};

// ============================================================================
// NB2 Family: Var(μ) = μ * (1 + μ/θ)
// This is the default negative binomial in R (MASS::glm.nb, glmmTMB)
// ============================================================================

/// Negative Binomial Type 2 (NB2) family
///
/// Variance function: V(μ) = μ * (1 + μ/θ)
///
/// This is the "classic" negative binomial parameterization used by:
/// - R's MASS::negative.binomial(theta)
/// - glmmTMB's nbinom2
/// - R's stats::dnbinom with size=θ
///
/// The parameter θ (theta) controls overdispersion:
/// - As θ → ∞, NB2 → Poisson
/// - Smaller θ means more overdispersion
pub struct Nbinom2Family {
    link: Box<dyn LinkFunction>,
    /// Overdispersion parameter (θ/size)
    /// For GLMM, this is typically estimated from the data
    theta: f64,
}

impl Clone for Nbinom2Family {
    fn clone(&self) -> Self {
        Self {
            link: self.link.clone_box(),
            theta: self.theta,
        }
    }
}

impl Nbinom2Family {
    /// Create a new NB2 family with specified link and theta
    pub fn new(link: impl LinkFunction + 'static, theta: f64) -> Self {
        Self {
            link: Box::new(link),
            theta,
        }
    }

    /// Create an NB2 family with log link (default)
    pub fn log(theta: f64) -> Self {
        Self::new(super::links::LogLink, theta)
    }

    /// Create an NB2 family with log link and theta=1.0 (default for estimation)
    pub fn default_log() -> Self {
        Self::log(1.0)
    }

    /// Create an NB2 family with identity link
    pub fn identity(theta: f64) -> Self {
        Self::new(super::links::IdentityLink, theta)
    }

    /// Create an NB2 family with sqrt link
    pub fn sqrt(theta: f64) -> Self {
        Self::new(super::links::SqrtLink, theta)
    }

    /// Get the theta (overdispersion) parameter
    pub fn theta(&self) -> f64 {
        self.theta
    }

    /// Create a new family with updated theta
    pub fn with_theta(&self, theta: f64) -> Self {
        Self {
            link: self.link.clone_box(),
            theta,
        }
    }
}

impl std::fmt::Debug for Nbinom2Family {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.debug_struct("Nbinom2Family")
            .field("link", &"<dyn LinkFunction>")
            .field("theta", &self.theta)
            .finish()
    }
}

/// NB2 Variance function: V(μ) = μ * (1 + μ/θ)
#[derive(Debug, Clone)]
pub struct Nbinom2Variance {
    theta: f64,
}

impl Nbinom2Variance {
    pub fn new(theta: f64) -> Self {
        Self { theta }
    }
}

impl VarianceFunction for Nbinom2Variance {
    fn variance(&self, mu: f64) -> Result<f64, &'static str> {
        if mu < 0.0 {
            return Err("mu must be non-negative for NB2 variance");
        }
        if self.theta <= 0.0 {
            return Err("theta must be positive for NB2 variance");
        }
        // V(μ) = μ * (1 + μ/θ) = μ + μ²/θ
        Ok(mu * (1.0 + mu / self.theta))
    }

    fn variance_prime(&self, mu: f64) -> Result<f64, &'static str> {
        if self.theta <= 0.0 {
            return Err("theta must be positive for NB2 variance");
        }
        // dV/dμ = 1 + 2μ/θ
        Ok(1.0 + 2.0 * mu / self.theta)
    }

    fn name(&self) -> &'static str {
        "nbinom2"
    }

    fn clone_box(&self) -> Box<dyn VarianceFunction> {
        Box::new(self.clone())
    }
}

/// NB2 Deviance function
///
/// The deviance residual for NB2 is:
/// 2 * [y*log(y/μ) - (y+θ)*log((y+θ)/(μ+θ))]
///
/// Special case when y=0: 2 * θ * log(θ/(μ+θ))
#[derive(Debug, Clone)]
pub struct Nbinom2Deviance {
    theta: f64,
}

impl Nbinom2Deviance {
    pub fn new(theta: f64) -> Self {
        Self { theta }
    }
}

impl DevianceFunction for Nbinom2Deviance {
    fn deviance_residual(&self, y: f64, mu: f64, weight: f64) -> Result<f64, &'static str> {
        if y < 0.0 {
            return Err("y must be non-negative for NB2 deviance");
        }
        if mu <= 0.0 {
            return Err("mu must be positive for NB2 deviance");
        }
        if self.theta <= 0.0 {
            return Err("theta must be positive for NB2 deviance");
        }

        if weight <= 0.0 {
            return Ok(0.0);
        }

        // Based on R's MASS package formula
        let dev_resid = if y == 0.0 {
            // 2 * θ * log(θ/(μ+θ))
            2.0 * self.theta * (self.theta / (mu + self.theta)).ln()
        } else {
            // 2 * [y*log(y/μ) - (y+θ)*log((y+θ)/(μ+θ))]
            2.0 * (y * (y / mu).ln() - (y + self.theta) * ((y + self.theta) / (mu + self.theta)).ln())
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
                total_deviance += self.deviance_residual(yi, mui, weight)?;
            }
        }

        Ok(total_deviance)
    }

    fn name(&self) -> &'static str {
        "nbinom2"
    }

    fn clone_box(&self) -> Box<dyn DevianceFunction> {
        Box::new(self.clone())
    }
}

impl GlmFamily for Nbinom2Family {
    fn name(&self) -> &'static str {
        "nbinom2"
    }

    fn link(&self) -> &dyn LinkFunction {
        self.link.as_ref()
    }

    fn variance(&self) -> &dyn VarianceFunction {
        // We need to return a reference, so we leak a Box
        // This is a design limitation but matches the trait signature
        Box::leak(Box::new(Nbinom2Variance::new(self.theta)))
    }

    fn deviance(&self) -> &dyn DevianceFunction {
        Box::leak(Box::new(Nbinom2Deviance::new(self.theta)))
    }

    fn valid_mu(&self, mu: &[f64]) -> Result<(), &'static str> {
        for &m in mu {
            if m.is_nan() || m < 0.0 {
                return Err("mu must be non-negative for negative binomial family");
            }
        }
        Ok(())
    }

    fn valid_y(&self, y: &[f64]) -> Result<(), &'static str> {
        for &yi in y {
            if yi.is_nan() || yi < 0.0 {
                return Err("y must be non-negative for negative binomial family");
            }
            // Allow non-integer y for quasi-likelihood
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

            // Initialize mu: if y=0, use small positive value; else use y
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
        // NB2 has a dispersion parameter (theta)
        // Return Some(1.0) to indicate it uses dispersion
        // The actual theta is accessible via theta() method
        Some(1.0 / self.theta)
    }

    fn aic_calc(&self, y: &[f64], mu: &[f64], weights: &[f64], _dev: f64) -> f64 {
        calculate_nbinom2_aic(y, mu, weights, self.theta)
    }

    fn clone_box(&self) -> Box<dyn GlmFamily> {
        Box::new(self.clone())
    }
}

/// Calculate AIC for NB2 family
///
/// Uses the negative binomial log-likelihood:
/// sum(lgamma(y + θ) - lgamma(θ) - lgamma(y+1) + θ*log(θ/(θ+μ)) + y*log(μ/(θ+μ)))
pub fn calculate_nbinom2_aic(y: &[f64], mu: &[f64], weights: &[f64], theta: f64) -> f64 {
    let mut log_lik = 0.0;

    for i in 0..y.len() {
        let yi = y[i];
        let mui = mu[i];
        let weight = if weights.len() == 1 {
            weights[0]
        } else {
            weights[i]
        };

        if weight > 0.0 && mui > 0.0 {
            // Log-likelihood for NB2:
            // lgamma(y+θ) - lgamma(θ) - lgamma(y+1) + θ*log(θ/(θ+μ)) + y*log(μ/(θ+μ))
            let term = lgamma(yi + theta) - lgamma(theta) - lgamma(yi + 1.0)
                + theta * (theta / (theta + mui)).ln()
                + yi * (mui / (theta + mui)).ln();
            log_lik += weight * term;
        }
    }

    -2.0 * log_lik
}

// ============================================================================
// NB1 Family: Var(μ) = μ * (1 + φ)
// Linear mean-variance relationship
// ============================================================================

/// Negative Binomial Type 1 (NB1) family
///
/// Variance function: V(μ) = μ * (1 + φ)
///
/// This is the linear mean-variance negative binomial parameterization.
/// The parameter φ (phi) controls overdispersion:
/// - φ = 0 gives Poisson
/// - φ > 0 gives overdispersion
///
/// Note: This is less commonly used than NB2 but available in glmmTMB
pub struct Nbinom1Family {
    link: Box<dyn LinkFunction>,
    /// Dispersion parameter (φ)
    phi: f64,
}

impl Clone for Nbinom1Family {
    fn clone(&self) -> Self {
        Self {
            link: self.link.clone_box(),
            phi: self.phi,
        }
    }
}

impl Nbinom1Family {
    /// Create a new NB1 family with specified link and phi
    pub fn new(link: impl LinkFunction + 'static, phi: f64) -> Self {
        Self {
            link: Box::new(link),
            phi,
        }
    }

    /// Create an NB1 family with log link (default)
    pub fn log(phi: f64) -> Self {
        Self::new(super::links::LogLink, phi)
    }

    /// Create an NB1 family with log link and phi=1.0 (default for estimation)
    pub fn default_log() -> Self {
        Self::log(1.0)
    }

    /// Create an NB1 family with identity link
    pub fn identity(phi: f64) -> Self {
        Self::new(super::links::IdentityLink, phi)
    }

    /// Get the phi (dispersion) parameter
    pub fn phi(&self) -> f64 {
        self.phi
    }

    /// Create a new family with updated phi
    pub fn with_phi(&self, phi: f64) -> Self {
        Self {
            link: self.link.clone_box(),
            phi,
        }
    }
}

impl std::fmt::Debug for Nbinom1Family {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.debug_struct("Nbinom1Family")
            .field("link", &"<dyn LinkFunction>")
            .field("phi", &self.phi)
            .finish()
    }
}

/// NB1 Variance function: V(μ) = μ * (1 + φ)
#[derive(Debug, Clone)]
pub struct Nbinom1Variance {
    phi: f64,
}

impl Nbinom1Variance {
    pub fn new(phi: f64) -> Self {
        Self { phi }
    }
}

impl VarianceFunction for Nbinom1Variance {
    fn variance(&self, mu: f64) -> Result<f64, &'static str> {
        if mu < 0.0 {
            return Err("mu must be non-negative for NB1 variance");
        }
        if self.phi < 0.0 {
            return Err("phi must be non-negative for NB1 variance");
        }
        // V(μ) = μ * (1 + φ)
        Ok(mu * (1.0 + self.phi))
    }

    fn variance_prime(&self, _mu: f64) -> Result<f64, &'static str> {
        // dV/dμ = 1 + φ (constant)
        Ok(1.0 + self.phi)
    }

    fn name(&self) -> &'static str {
        "nbinom1"
    }

    fn clone_box(&self) -> Box<dyn VarianceFunction> {
        Box::new(self.clone())
    }
}

/// NB1 Deviance function
///
/// For NB1, we use a quasi-likelihood approach since the exact
/// deviance is more complex. The deviance residual is based on
/// the Pearson residual scaled appropriately.
#[derive(Debug, Clone)]
pub struct Nbinom1Deviance {
    phi: f64,
}

impl Nbinom1Deviance {
    pub fn new(phi: f64) -> Self {
        Self { phi }
    }
}

impl DevianceFunction for Nbinom1Deviance {
    fn deviance_residual(&self, y: f64, mu: f64, weight: f64) -> Result<f64, &'static str> {
        if y < 0.0 {
            return Err("y must be non-negative for NB1 deviance");
        }
        if mu <= 0.0 {
            return Err("mu must be positive for NB1 deviance");
        }

        if weight <= 0.0 {
            return Ok(0.0);
        }

        // For NB1, we use the same deviance formula as NB2 but with theta = μ/φ
        // This is because NB1 with V = μ(1+φ) can be written as NB2 with θ = μ/φ
        // Deviance: 2 * [y*log(y/μ) - (y+θ)*log((y+θ)/(μ+θ))] where θ = μ/φ
        let theta = if self.phi > 0.0 { mu / self.phi } else { 1e10 }; // Large theta ≈ Poisson

        let dev_resid = if y == 0.0 {
            2.0 * theta * (theta / (mu + theta)).ln()
        } else {
            2.0 * (y * (y / mu).ln() - (y + theta) * ((y + theta) / (mu + theta)).ln())
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
                total_deviance += self.deviance_residual(yi, mui, weight)?;
            }
        }

        Ok(total_deviance)
    }

    fn name(&self) -> &'static str {
        "nbinom1"
    }

    fn clone_box(&self) -> Box<dyn DevianceFunction> {
        Box::new(self.clone())
    }
}

impl GlmFamily for Nbinom1Family {
    fn name(&self) -> &'static str {
        "nbinom1"
    }

    fn link(&self) -> &dyn LinkFunction {
        self.link.as_ref()
    }

    fn variance(&self) -> &dyn VarianceFunction {
        Box::leak(Box::new(Nbinom1Variance::new(self.phi)))
    }

    fn deviance(&self) -> &dyn DevianceFunction {
        Box::leak(Box::new(Nbinom1Deviance::new(self.phi)))
    }

    fn valid_mu(&self, mu: &[f64]) -> Result<(), &'static str> {
        for &m in mu {
            if m.is_nan() || m < 0.0 {
                return Err("mu must be non-negative for negative binomial family");
            }
        }
        Ok(())
    }

    fn valid_y(&self, y: &[f64]) -> Result<(), &'static str> {
        for &yi in y {
            if yi.is_nan() || yi < 0.0 {
                return Err("y must be non-negative for negative binomial family");
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
        Some(self.phi)
    }

    fn aic_calc(&self, y: &[f64], mu: &[f64], weights: &[f64], _dev: f64) -> f64 {
        calculate_nbinom1_aic(y, mu, weights, self.phi)
    }

    fn clone_box(&self) -> Box<dyn GlmFamily> {
        Box::new(self.clone())
    }
}

/// Calculate AIC for NB1 family
///
/// For NB1, we use the same log-likelihood as NB2 but with θ = μ/φ
pub fn calculate_nbinom1_aic(y: &[f64], mu: &[f64], weights: &[f64], phi: f64) -> f64 {
    let mut log_lik = 0.0;

    for i in 0..y.len() {
        let yi = y[i];
        let mui = mu[i];
        let weight = if weights.len() == 1 {
            weights[0]
        } else {
            weights[i]
        };

        if weight > 0.0 && mui > 0.0 {
            // For NB1, θ = μ/φ
            let theta = if phi > 0.0 { mui / phi } else { 1e10 };

            let term = lgamma(yi + theta) - lgamma(theta) - lgamma(yi + 1.0)
                + theta * (theta / (theta + mui)).ln()
                + yi * (mui / (theta + mui)).ln();
            log_lik += weight * term;
        }
    }

    -2.0 * log_lik
}

/// Log gamma function using Lanczos approximation
///
/// This implementation uses the Lanczos approximation which is accurate
/// and numerically stable for all positive x values.
fn lgamma(x: f64) -> f64 {
    if x <= 0.0 {
        return f64::INFINITY;
    }

    if x < 0.5 {
        // Use reflection formula for x < 0.5
        // lgamma(x) = ln(π/sin(πx)) - lgamma(1-x)
        let pi = std::f64::consts::PI;
        let sin_pi_x = (pi * x).sin();
        if sin_pi_x.abs() < 1e-300 {
            return f64::INFINITY;
        }
        return pi.ln() - sin_pi_x.abs().ln() - lgamma_lanczos(1.0 - x);
    }

    lgamma_lanczos(x)
}

/// Lanczos approximation implementation
fn lgamma_lanczos(x: f64) -> f64 {
    const LANCZOS_G: f64 = 7.0;
    const LANCZOS_COEFFICIENTS: [f64; 9] = [
        0.99999999999980993,
        676.5203681218851,
        -1259.1392167224028,
        771.32342877765313,
        -176.61502916214059,
        12.507343278686905,
        -0.13857109526572012,
        9.9843695780195716e-6,
        1.5056327351493116e-7,
    ];

    let z = x - 1.0;

    // Sum the series
    let mut ag = LANCZOS_COEFFICIENTS[0];
    for i in 1..9 {
        ag += LANCZOS_COEFFICIENTS[i] / (z + i as f64);
    }

    let half_ln_2_pi = 0.5 * (2.0 * std::f64::consts::PI).ln();
    let tmp = z + LANCZOS_G + 0.5;

    half_ln_2_pi + (tmp).ln() * (z + 0.5) - tmp + ag.ln()
}

#[cfg(test)]
mod tests {
    use super::*;

    // =========== NB2 Tests ===========

    #[test]
    fn test_nbinom2_family_creation() {
        let family = Nbinom2Family::log(2.0);
        assert_eq!(family.name(), "nbinom2");
        assert_eq!(family.theta(), 2.0);
    }

    #[test]
    fn test_nbinom2_variance() {
        let var_fn = Nbinom2Variance::new(2.0);

        // V(μ) = μ * (1 + μ/θ) = μ + μ²/θ
        // For μ=4, θ=2: V = 4 + 16/2 = 4 + 8 = 12
        let v = var_fn.variance(4.0).unwrap();
        assert!((v - 12.0).abs() < 1e-10);

        // dV/dμ = 1 + 2μ/θ = 1 + 2*4/2 = 1 + 4 = 5
        let vp = var_fn.variance_prime(4.0).unwrap();
        assert!((vp - 5.0).abs() < 1e-10);

        // Error for negative mu
        assert!(var_fn.variance(-1.0).is_err());
    }

    #[test]
    fn test_nbinom2_variance_approaches_poisson() {
        // As θ → ∞, V(μ) → μ (Poisson variance)
        let var_fn = Nbinom2Variance::new(1e10);
        let v = var_fn.variance(5.0).unwrap();
        // Should be close to 5 (Poisson)
        assert!((v - 5.0).abs() < 1e-5);
    }

    #[test]
    fn test_nbinom2_deviance() {
        let dev_fn = Nbinom2Deviance::new(2.0);

        // Test with y=0
        let d0 = dev_fn.deviance_residual(0.0, 2.0, 1.0).unwrap();
        // Should be 2 * θ * log(θ/(μ+θ)) = 2 * 2 * log(2/4) = 4 * log(0.5)
        let expected = 4.0 * (0.5_f64).ln();
        assert!((d0 - expected).abs() < 1e-10);

        // Test deviance is non-negative when y > 0
        let d1 = dev_fn.deviance_residual(3.0, 2.0, 1.0).unwrap();
        assert!(d1 >= 0.0);
    }

    #[test]
    fn test_nbinom2_family_validation() {
        let family = Nbinom2Family::log(2.0);

        // Valid mu
        assert!(family.valid_mu(&[0.0, 1.0, 5.0]).is_ok());

        // Invalid mu
        assert!(family.valid_mu(&[-1.0, 2.0]).is_err());

        // Valid y
        assert!(family.valid_y(&[0.0, 1.0, 5.0]).is_ok());

        // Invalid y
        assert!(family.valid_y(&[-1.0, 2.0]).is_err());
    }

    #[test]
    fn test_nbinom2_initialization() {
        let family = Nbinom2Family::log(2.0);
        let y = vec![0.0, 1.0, 5.0];
        let mut mu = vec![0.0; 3];
        let mut weights = vec![1.0; 3];

        family.initialize(&y, &mut mu, &mut weights).unwrap();

        // y=0 should initialize to 0.1
        assert!((mu[0] - 0.1).abs() < 1e-10);
        // y>0 should initialize to y
        assert!((mu[1] - 1.0).abs() < 1e-10);
        assert!((mu[2] - 5.0).abs() < 1e-10);
    }

    #[test]
    fn test_nbinom2_aic() {
        let y = vec![1.0, 2.0, 3.0];
        let mu = vec![1.0, 2.0, 3.0];
        let weights = vec![1.0, 1.0, 1.0];
        let theta = 2.0;

        let aic = calculate_nbinom2_aic(&y, &mu, &weights, theta);
        assert!(aic.is_finite());
        assert!(aic > 0.0); // AIC should be positive for count data
    }

    // =========== NB1 Tests ===========

    #[test]
    fn test_nbinom1_family_creation() {
        let family = Nbinom1Family::log(0.5);
        assert_eq!(family.name(), "nbinom1");
        assert_eq!(family.phi(), 0.5);
    }

    #[test]
    fn test_nbinom1_variance() {
        let var_fn = Nbinom1Variance::new(0.5);

        // V(μ) = μ * (1 + φ) = μ * 1.5
        // For μ=4: V = 4 * 1.5 = 6
        let v = var_fn.variance(4.0).unwrap();
        assert!((v - 6.0).abs() < 1e-10);

        // dV/dμ = 1 + φ = 1.5 (constant)
        let vp = var_fn.variance_prime(4.0).unwrap();
        assert!((vp - 1.5).abs() < 1e-10);

        // Error for negative mu
        assert!(var_fn.variance(-1.0).is_err());
    }

    #[test]
    fn test_nbinom1_variance_approaches_poisson() {
        // As φ → 0, V(μ) → μ (Poisson variance)
        let var_fn = Nbinom1Variance::new(0.0);
        let v = var_fn.variance(5.0).unwrap();
        assert!((v - 5.0).abs() < 1e-10);
    }

    #[test]
    fn test_nbinom1_deviance() {
        let dev_fn = Nbinom1Deviance::new(0.5);

        // Deviance should be finite and non-negative for valid inputs
        let d = dev_fn.deviance_residual(3.0, 2.0, 1.0).unwrap();
        assert!(d.is_finite());

        // Test with y=0
        let d0 = dev_fn.deviance_residual(0.0, 2.0, 1.0).unwrap();
        assert!(d0.is_finite());
    }

    #[test]
    fn test_nbinom1_family_validation() {
        let family = Nbinom1Family::log(0.5);

        // Valid mu
        assert!(family.valid_mu(&[0.0, 1.0, 5.0]).is_ok());

        // Invalid mu
        assert!(family.valid_mu(&[-1.0, 2.0]).is_err());

        // Valid y
        assert!(family.valid_y(&[0.0, 1.0, 5.0]).is_ok());

        // Invalid y
        assert!(family.valid_y(&[-1.0, 2.0]).is_err());
    }

    #[test]
    fn test_nbinom1_initialization() {
        let family = Nbinom1Family::log(0.5);
        let y = vec![0.0, 1.0, 5.0];
        let mut mu = vec![0.0; 3];
        let mut weights = vec![1.0; 3];

        family.initialize(&y, &mut mu, &mut weights).unwrap();

        assert!((mu[0] - 0.1).abs() < 1e-10);
        assert!((mu[1] - 1.0).abs() < 1e-10);
        assert!((mu[2] - 5.0).abs() < 1e-10);
    }

    #[test]
    fn test_nbinom1_aic() {
        let y = vec![1.0, 2.0, 3.0];
        let mu = vec![1.0, 2.0, 3.0];
        let weights = vec![1.0, 1.0, 1.0];
        let phi = 0.5;

        let aic = calculate_nbinom1_aic(&y, &mu, &weights, phi);
        assert!(aic.is_finite());
    }

    // =========== lgamma Tests ===========

    #[test]
    fn test_lgamma() {
        // lgamma(1) = 0
        assert!((lgamma(1.0) - 0.0).abs() < 1e-6);

        // lgamma(2) = 0 (since Γ(2) = 1! = 1)
        assert!((lgamma(2.0) - 0.0).abs() < 1e-6);

        // lgamma(3) = ln(2!) = ln(2) ≈ 0.693
        assert!((lgamma(3.0) - 2.0_f64.ln()).abs() < 1e-4);

        // lgamma(4) = ln(3!) = ln(6) ≈ 1.791
        assert!((lgamma(4.0) - 6.0_f64.ln()).abs() < 1e-4);

        // lgamma(5) = ln(4!) = ln(24) ≈ 3.178
        assert!((lgamma(5.0) - 24.0_f64.ln()).abs() < 1e-4);
    }

    #[test]
    fn test_lgamma_half() {
        // lgamma(0.5) = ln(√π) ≈ 0.5723
        let expected = (std::f64::consts::PI).sqrt().ln();
        assert!((lgamma(0.5) - expected).abs() < 1e-3);
    }

    #[test]
    fn test_with_theta_phi() {
        let nb2 = Nbinom2Family::log(1.0);
        let nb2_updated = nb2.with_theta(5.0);
        assert_eq!(nb2_updated.theta(), 5.0);

        let nb1 = Nbinom1Family::log(1.0);
        let nb1_updated = nb1.with_phi(0.3);
        assert_eq!(nb1_updated.phi(), 0.3);
    }
}
